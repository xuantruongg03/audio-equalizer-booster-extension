// Background Service Worker v3.0 Pro
// Manages offscreen document, tab tracking, audio lifecycle, and message coordination

const OFFSCREEN_DOCUMENT_PATH = '/offscreen/offscreen.html';

// ===================== STATE =====================
let creatingOffscreenDocument = null;
let currentCaptureTabId = null;
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

        chrome.runtime.sendMessage({
            type: 'INIT_AUDIO_CONTEXT',
            target: 'offscreen',
            streamId: streamId,
            tabId: tabId
        });

        // Apply saved settings
        setTimeout(async () => {
            const result = await chrome.storage.local.get(['settings']);
            if (result.settings) {
                chrome.runtime.sendMessage({
                    type: 'UPDATE_AUDIO_SETTINGS',
                    target: 'offscreen',
                    settings: {
                        volume: result.settings.volume,
                        bands: result.settings.bands,
                        effects: result.settings.effects
                    }
                });
            }
        }, 120);

        return { success: true, tabId: tabId };

    } catch (error) {
        console.error('[Audio EQ Pro v3.0] Start capture error:', error);
        isCapturing = false;
        currentCaptureTabId = null;
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

                // Always perform clean start to avoid getting stuck on reloaded tabs
                const result = await startCapture(tab.id);
                sendResponse(result);
                break;
            }

            case 'STOP_AUDIO_CAPTURE': {
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
    // Keep capture running for original tab when user switches tabs
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    if (tabId === currentCaptureTabId) {
        console.log('[Audio EQ Pro v3.0] Captured tab closed, stopping audio');
        await stopCapture();
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // If the captured tab reloads or navigates to a new URL, cleanly stop capture immediately
    if (tabId === currentCaptureTabId && (changeInfo.status === 'loading' || changeInfo.url)) {
        console.log('[Audio EQ Pro v3.0] Captured tab reloaded/navigated, stopping capture cleanly');
        await stopCapture();
    }
});

// ===================== LIFECYCLE =====================

chrome.runtime.onSuspend.addListener(async () => {
    await closeOffscreenDocument();
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['settings'], (result) => {
        if (!result.settings) {
            const defaultSettings = {
                enabled: false,
                volume: 100,
                preset: 'flat',
                bands: {
                    '32': 0, '64': 0, '125': 0, '250': 0, '500': 0,
                    '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0
                },
                effects: {
                    limiter: {
                        enabled: true,
                        threshold: -6,
                        knee: 20,
                        ratio: 12,
                        attack: 0.003,
                        release: 0.25
                    },
                    spatial: {
                        enabled: false,
                        mode: 'wide',
                        width: 50
                    },
                    autoPan: {
                        enabled: false,
                        speed: 'medium'
                    },
                    reverb: {
                        enabled: false,
                        type: 'hall',
                        mix: 25
                    },
                    bassEnhancer: {
                        enabled: false,
                        amount: 40,
                        freq: 90
                    }
                }
            };
            chrome.storage.local.set({ settings: defaultSettings });
        }
    });
});

console.log('Audio Equalizer & Booster Pro v3.0 - Background service worker ready');
