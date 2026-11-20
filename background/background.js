// Background Service Worker v3.0 Pro
// Manages offscreen document, tab tracking, audio lifecycle, and message coordination
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constant.js';

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

// Track active tabs and their settings
let tabSettings = new Map();

// ===================== OFFSCREEN DOCUMENT MANAGEMENT =====================

async function hasOffscreenDocument() {
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
        if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
            return true;
        }
    }
    return false;
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
        reasons: [chrome.offscreen.Reason.USER_MEDIA],
        justification: 'Audio processing requires AudioContext which needs DOM access'
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
    isCapturing = false;
}

// ===================== TAB CAPTURE =====================

async function stopExistingCapture() {
    if (isCapturing && await hasOffscreenDocument()) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'STOP_AUDIO_PROCESSING',
                target: 'offscreen'
            }, () => {
                setTimeout(resolve, 80);
            });
        });
    }
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

        await stopExistingCapture();
        await setupOffscreenDocument();

        const streamId = await getTabCaptureStreamId(tabId);

        isCapturing = true;
        currentCaptureTabId = tabId;
        try {
            const t = await chrome.tabs.get(tabId);
            currentCaptureTabDomain = t?.url ? getDomain(t.url) : null;
        } catch (e) {}

        chrome.runtime.sendMessage({
            type: 'INIT_AUDIO_CONTEXT',
            target: 'offscreen',
            streamId: streamId,
            tabId: tabId
        });

        // Apply saved settings (check site-specific profile first)
        setTimeout(async () => {
            try {
                const tab = await chrome.tabs.get(tabId);
                const domain = tab?.url ? getDomain(tab.url) : null;
                const result = await chrome.storage.local.get(['settings', 'siteSettings', 'siteSettingsConfig']);
                let finalSettings = result.settings || {};

                if (domain && result.siteSettings && result.siteSettings[domain] && result.siteSettingsConfig?.autoApply !== false) {
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
        console.error('[Audio EQ Pro v3.0] Start capture error:', error);
        isCapturing = false;
        currentCaptureTabId = null;
        currentCaptureTabDomain = null;
        return { success: false, error: error.message };
    }
}

async function stopCapture() {
    try {
        chrome.runtime.sendMessage({
            type: 'STOP_AUDIO_PROCESSING',
            target: 'offscreen'
        });

        isCapturing = false;
        currentCaptureTabId = null;
        currentCaptureTabDomain = null;

        await closeOffscreenDocument();
        return { success: true };

    } catch (error) {
        console.error('[Audio EQ Pro v3.0] Stop capture error:', error);
        return { success: false, error: error.message };
    }
}

// ===================== MESSAGE HANDLING =====================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true;
});

async function handleMessage(message, sender, sendResponse) {
    try {
        switch (message.type) {
            case 'START_AUDIO_CAPTURE': {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.id) {
                    sendResponse({ success: false, error: 'No active tab found' });
                    return;
                }

                // Persist master ON state
                await chrome.storage.local.set({ masterEnabled: true });

                // Always perform clean start to avoid getting stuck on reloaded tabs
                const result = await startCapture(tab.id);
                sendResponse(result);
                break;
            }

            case 'STOP_AUDIO_CAPTURE': {
                await chrome.storage.local.set({ masterEnabled: false });
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
                    sendResponse(response || { success: false });
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
                    sendResponse(response || { success: false });
                });
                return;
            }

            case 'GET_STATUS': {
                const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const hasDoc = await hasOffscreenDocument();
                const { masterEnabled } = await chrome.storage.local.get(['masterEnabled']);
                const isActuallyActive = Boolean(
                    hasDoc &&
                    isCapturing &&
                    activeTab &&
                    activeTab.id &&
                    currentCaptureTabId === activeTab.id
                );

                // Auto-heal any stale state if offscreen document is gone
                if (isCapturing && !hasDoc) {
                    isCapturing = false;
                    currentCaptureTabId = null;
                }

                sendResponse({
                    isActive: isActuallyActive,
                    masterEnabled: !!masterEnabled,
                    tabId: currentCaptureTabId,
                    activeTabId: activeTab ? activeTab.id : null
                });
                break;
            }

            case 'AUDIO_STARTED':
                isCapturing = true;
                break;

            case 'AUDIO_STOPPED':
                isCapturing = false;
                currentCaptureTabId = null;
                break;

            case 'AUDIO_ERROR':
                isCapturing = false;
                currentCaptureTabId = null;
                console.error('[Audio EQ Pro v3.0] Audio error:', message.error);
                break;

            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('[Audio EQ Pro v3.0] Background error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// ===================== TAB EVENTS =====================

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const { masterEnabled } = await chrome.storage.local.get(['masterEnabled']);
        if (!masterEnabled) return;

        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (!tab || !tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
            return;
        }

        // If capture is not currently active, auto-start on this activated web tab
        if (!isCapturing) {
            await startCapture(activeInfo.tabId);
        } else if (currentCaptureTabId === activeInfo.tabId) {
            // Tab already captured: re-verify and apply site-specific profile
            const domain = getDomain(tab.url);
            const { siteSettings, siteSettingsConfig, settings } = await chrome.storage.local.get(['siteSettings', 'siteSettingsConfig', 'settings']);
            if (domain && siteSettings && siteSettings[domain] && siteSettingsConfig?.autoApply !== false) {
                const siteConf = siteSettings[domain];
                chrome.runtime.sendMessage({
                    type: 'UPDATE_AUDIO_SETTINGS',
                    target: 'offscreen',
                    settings: {
                        volume: siteConf.volume ?? settings?.volume ?? 100,
                        bands: siteConf.bands ?? settings?.bands,
                        effects: siteConf.effects ?? settings?.effects,
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
    if (tabId === currentCaptureTabId) {
        console.log('[Audio EQ Pro v3.0] Captured tab closed, stopping audio');
        await stopCapture();
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // 1. Forward title changes to offscreen AI classifier (for dynamic SPAs like YouTube/Spotify)
    if (tabId === currentCaptureTabId && changeInfo.title) {
        chrome.runtime.sendMessage({
            type: 'UPDATE_TAB_TITLE',
            target: 'offscreen',
            title: changeInfo.title
        }).catch(() => {});
    }

    // 2. Handle navigation on the captured tab
    if (tabId === currentCaptureTabId) {
        const newDomain = tab?.url ? getDomain(tab.url) : null;

        // If tab navigated away to another website/domain (e.g. YouTube -> Google)
        if (newDomain && currentCaptureTabDomain && newDomain !== currentCaptureTabDomain) {
            console.log('[Audio EQ Pro v3.0] Tab domain changed from', currentCaptureTabDomain, 'to', newDomain, '- stopping capture');
            await stopCapture();
            return;
        }

        // If it's an in-page SPA navigation (URL changed within the same domain, e.g. YouTube next video in playlist)
        if (changeInfo.url) {
            console.log('[Audio EQ Pro v3.0] SPA In-page navigation on same domain:', newDomain, '- maintaining active audio capture stream');
            // Do NOT stop capture! Stream remains continuously active on YouTube
            return;
        }

        // If a real hard page reload begins (status: loading without SPA url change):
        if (changeInfo.status === 'loading' && !changeInfo.url) {
            console.log('[Audio EQ Pro v3.0] Hard page reload started on captured tab');
            await stopCapture();
            return;
        }
    }

    // 3. Auto-resume capture on completed reload if user left audio ON
    if (changeInfo.status === 'complete' && tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        const { masterEnabled } = await chrome.storage.local.get(['masterEnabled']);
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (masterEnabled && activeTab && activeTab.id === tabId && !isCapturing) {
            console.log('[Audio EQ Pro v3.0] Auto-resuming capture for completed tab reload:', tabId);
            await startCapture(tabId);
        }
    }
});

// ===================== LIFECYCLE =====================

chrome.runtime.onSuspend.addListener(async () => {
    await closeOffscreenDocument();
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get([STORAGE_KEYS.SETTINGS], (result) => {
        if (!result[STORAGE_KEYS.SETTINGS]) {
            chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
        }
    });
});

console.log('Audio Equalizer & Booster Pro v3.0 - Background service worker ready');
