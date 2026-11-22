// Background Service Worker v3.0 Pro
// Manages offscreen document, tab tracking, audio lifecycle, and message coordination
import { STORAGE_KEYS, DEFAULT_SETTINGS, AI_GENRE_PROFILES } from '../constant.js';

const OFFSCREEN_DOCUMENT_PATH = '/offscreen/offscreen.html';

function getDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return null;
    }
}

// ===================== STATE =====================
let creatingOffscreenDocument = null;
let currentCaptureTabId = null;
let currentCaptureTabDomain = null;
let isCapturing = false;
let lastCaptureTime = 0;
let lastReloadedCapturedTabId = null;

// Track active tabs and their settings
let tabSettings = new Map();

// ===================== OFFSCREEN DOCUMENT MANAGEMENT =====================

async function hasOffscreenDocument() {
    try {
        if (chrome.runtime.getContexts) {
            const contexts = await chrome.runtime.getContexts({
                contextTypes: ['OFFSCREEN_DOCUMENT']
            }).catch(() => []);
            if (contexts && contexts.length > 0) {
                return true;
            }
        }
        const matchedClients = await clients.matchAll();
        for (const client of matchedClients) {
            if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
                return true;
            }
        }
    } catch (e) {}
    return false;
}

async function syncCaptureState() {
    const hasDoc = await hasOffscreenDocument();
    if (!hasDoc) {
        if (isCapturing || currentCaptureTabId) {
            isCapturing = false;
            currentCaptureTabId = null;
            currentCaptureTabDomain = null;
            await chrome.storage.session.remove(['isCapturing', 'currentCaptureTabId', 'currentCaptureTabDomain']).catch(() => {});
        }
        return false;
    }

    // If service worker just woke up from idle sleep or memory was reset
    if (!isCapturing || !currentCaptureTabId) {
        const stored = await chrome.storage.session.get(['isCapturing', 'currentCaptureTabId', 'currentCaptureTabDomain']).catch(() => ({}));
        if (stored.isCapturing && stored.currentCaptureTabId) {
            isCapturing = true;
            currentCaptureTabId = stored.currentCaptureTabId;
            currentCaptureTabDomain = stored.currentCaptureTabDomain || null;
            return true;
        }

        // Direct query to offscreen engine as definitive fallback
        try {
            const status = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'GET_ENGINE_STATUS', target: 'offscreen' }, (res) => {
                    if (chrome.runtime.lastError) resolve(null);
                    else resolve(res);
                });
            });
            if (status && status.isActive && status.tabId) {
                isCapturing = true;
                currentCaptureTabId = status.tabId;
                const t = await chrome.tabs.get(status.tabId).catch(() => null);
                currentCaptureTabDomain = t?.url ? getDomain(t.url) : null;
                await chrome.storage.session.set({
                    isCapturing: true,
                    currentCaptureTabId: currentCaptureTabId,
                    currentCaptureTabDomain: currentCaptureTabDomain
                }).catch(() => {});
                return true;
            }
        } catch (e) {}
    }
    return isCapturing;
}

async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        return;
    }

    if (creatingOffscreenDocument) {
        await creatingOffscreenDocument;
        return;
    }

    creatingOffscreenDocument = chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: [
            chrome.offscreen.Reason.USER_MEDIA,
            chrome.offscreen.Reason.AUDIO_PLAYBACK
        ],
        justification: 'Audio processing and playback requires AudioContext in DOM environment'
    });

    await creatingOffscreenDocument;
    creatingOffscreenDocument = null;
    console.log('[Audio EQ Pro v3.0] Offscreen document created');
}

async function closeOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        await chrome.offscreen.closeDocument();
        console.log('[Audio EQ Pro v3.0] Offscreen document closed');
    }
    currentCaptureTabId = null;
    currentCaptureTabDomain = null;
    isCapturing = false;
    await chrome.storage.session.remove(['isCapturing', 'currentCaptureTabId', 'currentCaptureTabDomain']).catch(() => {});
}

// ===================== TAB CAPTURE =====================

async function stopExistingCapture() {
    if (await hasOffscreenDocument()) {
        await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'STOP_AUDIO_PROCESSING',
                target: 'offscreen'
            }, () => {
                if (chrome.runtime.lastError) {}
                resolve();
            });
        });
        // Wait 100ms for browser audio engine to release the tab media stream completely
        await new Promise(r => setTimeout(r, 100));
    }
    isCapturing = false;
    currentCaptureTabId = null;
    currentCaptureTabDomain = null;
    await chrome.storage.session.remove(['isCapturing', 'currentCaptureTabId', 'currentCaptureTabDomain']).catch(() => {});
    await chrome.storage.local.remove([STORAGE_KEYS.AI_CURRENT_GENRE]).catch(() => {});
}

async function getTabCaptureStreamId(tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(streamId);
            }
        });
    });
}

async function startCapture(tabId) {
    try {
        const now = Date.now();
        if (now - lastCaptureTime < 400) {
            return { success: false, error: 'Please wait before starting again' };
        }
        lastCaptureTime = now;

        // Verify target tab is valid and capturable before initializing
        const tab = await chrome.tabs.get(tabId).catch(() => null);
        if (!tab || !tab.url) {
            return { success: false, error: 'Tab not found or inaccessible' };
        }

        const urlLower = tab.url.toLowerCase();
        if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://')) {
            console.log('[Audio EQ Pro v3.0] Cannot capture internal/restricted page:', tab.url);
            return { success: false, error: 'Chrome system pages cannot be captured' };
        }
        if (urlLower.includes('chrome.google.com/webstore') || urlLower.includes('chromewebstore.google.com')) {
            return { success: false, error: 'Chrome Web Store cannot be captured' };
        }

        // If this tab is already capturing and running, no need to recreate
        await syncCaptureState();
        if (isCapturing && currentCaptureTabId === tabId && await hasOffscreenDocument()) {
            console.log('[Audio EQ Pro v3.0] Tab', tabId, 'is already actively captured');
            return { success: true, tabId: tabId };
        }

        await stopExistingCapture();
        await setupOffscreenDocument();

        const streamId = await getTabCaptureStreamId(tabId);

        isCapturing = true;
        currentCaptureTabId = tabId;
        let tabTitle = tab.title || '';
        currentCaptureTabDomain = tab.url ? getDomain(tab.url) : null;
        await chrome.storage.session.set({
            isCapturing: true,
            currentCaptureTabId: tabId,
            currentCaptureTabDomain: currentCaptureTabDomain
        }).catch(() => {});

        // Initialize audio engine in offscreen document and await response cleanly
        await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'INIT_AUDIO_CONTEXT',
                target: 'offscreen',
                streamId: streamId,
                tabId: tabId,
                title: tabTitle
            }, (res) => {
                if (chrome.runtime.lastError) {
                    console.warn('[Audio EQ Pro v3.0] INIT_AUDIO_CONTEXT message warning:', chrome.runtime.lastError.message);
                }
                resolve(res);
            });
        });

        // Apply saved settings (check site-specific profile first)
        setTimeout(async () => {
            try {
                const t = await chrome.tabs.get(tabId).catch(() => null);
                const domain = t?.url ? getDomain(t.url) : null;
                const result = await chrome.storage.local.get([
                    'settings', 'siteSettings', 'siteSettingsConfig',
                    STORAGE_KEYS.AI_AUTO_EQ, STORAGE_KEYS.AI_CURRENT_GENRE
                ]);
                let finalSettings = result.settings || {};

                // If user has AI Auto-EQ active and a genre was already detected, preserve the AI acoustic curve!
                const isAiActive = !!result[STORAGE_KEYS.AI_AUTO_EQ];
                const aiGenre = result[STORAGE_KEYS.AI_CURRENT_GENRE];
                if (isAiActive && aiGenre && AI_GENRE_PROFILES[aiGenre]) {
                    finalSettings.bands = { ...AI_GENRE_PROFILES[aiGenre].bands };
                    if (AI_GENRE_PROFILES[aiGenre].effects) {
                        finalSettings.effects = { ...finalSettings.effects, ...AI_GENRE_PROFILES[aiGenre].effects };
                    }
                } else if (!isAiActive && domain && result.siteSettings && result.siteSettings[domain] && result.siteSettingsConfig?.autoApply !== false) {
                    finalSettings = { ...finalSettings, ...result.siteSettings[domain] };
                }

                chrome.runtime.sendMessage({
                    type: 'UPDATE_AUDIO_SETTINGS',
                    target: 'offscreen',
                    settings: {
                        volume: finalSettings.volume,
                        bands: finalSettings.bands,
                        effects: finalSettings.effects,
                        preamp: finalSettings.preamp || 0,
                        pan: finalSettings.pan || 0,
                        mono: !!finalSettings.mono,
                        bandParams: finalSettings.bandParams || {}
                    }
                });
            } catch (e) {}
        }, 120);

        return { success: true, tabId: tabId };

    } catch (error) {
        if (error.message && (error.message.includes('invoked') || error.message.includes('cannot be captured'))) {
            console.warn('[Audio EQ Pro v3.0] Capture skipped for tab:', tabId, error.message);
        } else {
            console.error('[Audio EQ Pro v3.0] Start capture error:', error);
        }
        isCapturing = false;
        currentCaptureTabId = null;
        currentCaptureTabDomain = null;
        return { success: false, error: error.message };
    }
}

async function stopCapture() {
    try {
        await stopExistingCapture();
        await closeOffscreenDocument();
        return { success: true };

    } catch (error) {
        console.error('[Audio EQ Pro v3.0] Stop capture error:', error);
        return { success: false, error: error.message };
    }
}

// ===================== MESSAGE HANDLING =====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. Never intercept or process messages targeted exclusively to offscreen document
    if (!message || message.target === 'offscreen') {
        return false;
    }

    // 2. Only return true for message types that actually send an asynchronous response
    const asyncTypes = ['START_AUDIO_CAPTURE', 'STOP_AUDIO_CAPTURE', 'GET_STATUS', 'TOGGLE_AB_COMPARE', 'GET_ANALYSER_DATA', 'GET_AI_STATUS'];
    if (asyncTypes.includes(message.type)) {
        handleMessage(message, sender, sendResponse);
        return true;
    }

    handleMessage(message, sender, sendResponse);
    return false;
});

async function handleMessage(message, sender, sendResponse) {
    try {
        await syncCaptureState();

        switch (message.type) {
            case 'START_AUDIO_CAPTURE': {
                const targetTabId = message.tabId;
                let tab = null;
                if (targetTabId) {
                    tab = await chrome.tabs.get(targetTabId).catch(() => null);
                }
                if (!tab) {
                    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
                    tab = activeTab;
                }
                if (!tab || !tab.id) {
                    sendResponse({ success: false, error: 'No active tab found' });
                    return;
                }

                // Persist master ON state
                await chrome.storage.local.set({ masterEnabled: true });

                const result = await startCapture(tab.id);
                sendResponse(result);
                break;
            }

            case 'STOP_AUDIO_CAPTURE': {
                await chrome.storage.local.set({ masterEnabled: false });
                await chrome.storage.local.remove([STORAGE_KEYS.AI_CURRENT_GENRE]).catch(() => {});
                const result = await stopCapture();
                sendResponse(result);
                break;
            }

            case 'UPDATE_SETTINGS': {
                chrome.runtime.sendMessage({
                    type: 'UPDATE_AUDIO_SETTINGS',
                    target: 'offscreen',
                    settings: message.settings
                });
                sendResponse({ success: true });
                break;
            }

            case 'UPDATE_EFFECTS': {
                chrome.runtime.sendMessage({
                    type: 'UPDATE_EFFECTS',
                    target: 'offscreen',
                    effects: message.effects
                });
                sendResponse({ success: true });
                break;
            }

            case 'TOGGLE_AB_COMPARE': {
                if (!isCapturing || !await hasOffscreenDocument()) {
                    sendResponse({ success: false, error: 'Not capturing' });
                    return;
                }
                chrome.runtime.sendMessage({
                    type: 'TOGGLE_AB_COMPARE',
                    target: 'offscreen'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse(response || { success: false });
                    }
                });
                return;
            }

            case 'GET_ANALYSER_DATA': {
                if (!isCapturing || !await hasOffscreenDocument()) {
                    sendResponse({ success: false, error: 'Not capturing' });
                    return;
                }
                chrome.runtime.sendMessage({
                    type: 'GET_ANALYSER_DATA',
                    target: 'offscreen'
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse(response || { success: false });
                    }
                });
                return;
            }

            case 'GET_AI_STATUS': {
                if (isCapturing && await hasOffscreenDocument()) {
                    chrome.runtime.sendMessage({
                        type: 'GET_AI_STATUS',
                        target: 'offscreen'
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            sendResponse({ success: false, enabled: false, profile: null });
                        } else {
                            sendResponse(response || { success: false, enabled: false, profile: null });
                        }
                    });
                } else {
                    sendResponse({
                        success: true,
                        enabled: false,
                        audioRunning: false,
                        currentGenre: null,
                        profile: null,
                        bands: null,
                        metaMatched: false
                    });
                }
                break;
            }

            case 'GET_STATUS': {
                await syncCaptureState();
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
                const hasDoc = await hasOffscreenDocument();
                const { masterEnabled } = await chrome.storage.local.get(['masterEnabled']);
                // Audio engine is active if an offscreen document is capturing an active audio stream
                const isActuallyActive = Boolean(
                    hasDoc &&
                    isCapturing &&
                    currentCaptureTabId
                );

                sendResponse({
                    isActive: isActuallyActive,
                    masterEnabled: !!masterEnabled,
                    tabId: currentCaptureTabId,
                    activeTabId: activeTab ? activeTab.id : null,
                    isCurrentTabCaptured: Boolean(activeTab && activeTab.id && currentCaptureTabId === activeTab.id)
                });
                break;
            }

            case 'AUDIO_STARTED':
                isCapturing = true;
                if (message.tabId) currentCaptureTabId = message.tabId;
                await chrome.storage.session.set({
                    isCapturing: true,
                    currentCaptureTabId: currentCaptureTabId,
                    currentCaptureTabDomain: currentCaptureTabDomain
                }).catch(() => {});
                if (typeof sendResponse === 'function') sendResponse({ received: true });
                break;

            case 'AUDIO_STOPPED':
                if (message.tabId && message.tabId === currentCaptureTabId) {
                    lastReloadedCapturedTabId = message.tabId;
                }
                isCapturing = false;
                currentCaptureTabId = null;
                currentCaptureTabDomain = null;
                await chrome.storage.session.remove(['isCapturing', 'currentCaptureTabId', 'currentCaptureTabDomain']).catch(() => {});
                if (typeof sendResponse === 'function') sendResponse({ received: true });
                break;

            case 'AUDIO_ERROR':
                isCapturing = false;
                currentCaptureTabId = null;
                currentCaptureTabDomain = null;
                await chrome.storage.session.remove(['isCapturing', 'currentCaptureTabId', 'currentCaptureTabDomain']).catch(() => {});
                console.error('[Audio EQ Pro v3.0] Audio error:', message.error);
                if (typeof sendResponse === 'function') sendResponse({ received: true });
                break;

            default:
                if (typeof sendResponse === 'function') {
                    sendResponse({ success: false, error: 'Unknown message type: ' + message.type });
                }
        }
    } catch (error) {
        console.error('[Audio EQ Pro v3.0] Background error:', error);
        if (typeof sendResponse === 'function') {
            sendResponse({ success: false, error: error.message });
        }
    }
}

// ===================== TAB EVENTS =====================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        await syncCaptureState();
        const { masterEnabled } = await chrome.storage.local.get(['masterEnabled']);
        if (!masterEnabled) return;

        const tab = await chrome.tabs.get(activeInfo.tabId).catch(() => null);
        if (!tab || !tab.url) return;
        const urlLower = tab.url.toLowerCase();
        if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://')) return;
        if (urlLower.includes('chrome.google.com/webstore') || urlLower.includes('chromewebstore.google.com')) return;

        // Only sync settings if this activated tab is the one currently being captured
        if (isCapturing && currentCaptureTabId === activeInfo.tabId) {
            if (tab.title) {
                chrome.runtime.sendMessage({
                    type: 'UPDATE_TAB_TITLE',
                    target: 'offscreen',
                    title: tab.title
                }).catch(() => {});
            }
            // Tab already captured: re-verify and apply site-specific profile
            const domain = getDomain(tab.url);
            const { siteSettings, siteSettingsConfig, settings, aiAutoEqEnabled, aiCurrentGenre } = await chrome.storage.local.get([
                'siteSettings', 'siteSettingsConfig', 'settings',
                STORAGE_KEYS.AI_AUTO_EQ, STORAGE_KEYS.AI_CURRENT_GENRE
            ]);
            const isAiActive = !!aiAutoEqEnabled;
            if (domain && siteSettings && siteSettings[domain] && siteSettingsConfig?.autoApply !== false) {
                const siteConf = siteSettings[domain];
                let bandsToApply = siteConf.bands ?? settings?.bands;
                let effectsToApply = siteConf.effects ?? settings?.effects;

                if (isAiActive && aiCurrentGenre && AI_GENRE_PROFILES[aiCurrentGenre]) {
                    bandsToApply = { ...AI_GENRE_PROFILES[aiCurrentGenre].bands };
                    if (AI_GENRE_PROFILES[aiCurrentGenre].effects) {
                        effectsToApply = { ...effectsToApply, ...AI_GENRE_PROFILES[aiCurrentGenre].effects };
                    }
                }

                chrome.runtime.sendMessage({
                    type: 'UPDATE_AUDIO_SETTINGS',
                    target: 'offscreen',
                    settings: {
                        volume: siteConf.volume ?? settings?.volume ?? 100,
                        bands: bandsToApply,
                        effects: effectsToApply,
                        preamp: siteConf.preamp ?? settings?.preamp ?? 0,
                        pan: siteConf.pan ?? settings?.pan ?? 0,
                        mono: !!siteConf.mono,
                        bandParams: siteConf.bandParams || {}
                    }
                });
            }
        }
    } catch (e) {}
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    await syncCaptureState();
    if (tabId === currentCaptureTabId) {
        console.log('[Audio EQ Pro v3.0] Captured tab closed, stopping audio');
        await stopCapture();
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    await syncCaptureState();

    // 1. Forward title changes to offscreen AI classifier (for dynamic SPAs like YouTube/Spotify)
    if (tabId === currentCaptureTabId) {
        const titleToSend = changeInfo.title || (changeInfo.status === 'complete' && tab?.title ? tab.title : null);
        if (titleToSend) {
            chrome.runtime.sendMessage({
                type: 'UPDATE_TAB_TITLE',
                target: 'offscreen',
                title: titleToSend
            }).catch(() => {});
        }
    }

    // 2. Handle navigation on the captured tab
    if (tabId === currentCaptureTabId) {
        // Only if URL actually changed to a completely different domain
        if (changeInfo.url) {
            const newDomain = getDomain(changeInfo.url);
            if (newDomain && currentCaptureTabDomain && newDomain !== currentCaptureTabDomain) {
                console.log('[Audio EQ Pro v3.0] Tab domain changed from', currentCaptureTabDomain, 'to', newDomain, '- stopping capture');
                await stopCapture();
                return;
            }

            console.log('[Audio EQ Pro v3.0] SPA In-page navigation on same domain:', newDomain, '- maintaining active audio capture stream');
            // Re-fetch tab title after DOM title updates and notify offscreen classifier
            const notifyTitleChange = async () => {
                try {
                    const updatedTab = await chrome.tabs.get(tabId).catch(() => null);
                    if (updatedTab && updatedTab.title) {
                        chrome.runtime.sendMessage({
                            type: 'UPDATE_TAB_TITLE',
                            target: 'offscreen',
                            title: updatedTab.title
                        }).catch(() => {});
                    }
                } catch (e) {}
            };
            setTimeout(notifyTitleChange, 400);
            setTimeout(notifyTitleChange, 1200);
            return;
        }
    }

    // 3. Auto-resume capture on completed reload if user left audio ON and it was the reloaded captured tab
    if (changeInfo.status === 'complete' && tab && tab.url) {
        const urlLower = tab.url.toLowerCase();
        if (!urlLower.startsWith('http://') && !urlLower.startsWith('https://')) return;
        if (urlLower.includes('chrome.google.com/webstore') || urlLower.includes('chromewebstore.google.com')) return;

        const { masterEnabled } = await chrome.storage.local.get(['masterEnabled']);
        if (masterEnabled && !isCapturing && lastReloadedCapturedTabId && tabId === lastReloadedCapturedTabId) {
            console.log('[Audio EQ Pro v3.0] Auto-resuming capture for reloaded tab:', tabId);
            lastReloadedCapturedTabId = null;
            await startCapture(tabId);
        }
    }
});

// ===================== LIFECYCLE =====================

chrome.runtime.onSuspend.addListener(() => {
    // In Manifest V3, the service worker goes to sleep after 30 seconds of inactivity to save RAM.
    // The offscreen document MUST remain open to continue processing audio uninterrupted!
    console.log('[Audio EQ Pro v3.0] Background service worker suspended (offscreen audio continues)');
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
        if (!result[STORAGE_KEYS.SETTINGS]) {
            chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
        }
    });
});

console.log('Audio Equalizer & Booster Pro v3.0 - Background service worker ready');
