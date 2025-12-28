// Background Service Worker - Manages offscreen document and message coordination
// Manifest V3 compliant

const OFFSCREEN_DOCUMENT_PATH = '/offscreen/offscreen.html';

// Track state
let creatingOffscreenDocument = null;
let currentCaptureTabId = null;
let isCapturing = false;

/**
 * Check if offscreen document already exists
 */
async function hasOffscreenDocument() {
    const matchedClients = await clients.matchAll();
    for (const client of matchedClients) {
        if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
            return true;
        }
    }
    return false;
}

/**
 * Create the offscreen document for audio processing
 */
async function setupOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        console.log('Offscreen document already exists');
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
    console.log('Offscreen document created');
}

/**
 * Close the offscreen document
 */
async function closeOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        await chrome.offscreen.closeDocument();
        console.log('Offscreen document closed');
    }
    currentCaptureTabId = null;
    isCapturing = false;
}

/**
 * Stop any existing capture before starting a new one
 */
async function stopExistingCapture() {
    if (isCapturing && await hasOffscreenDocument()) {
        // Send stop message and wait for it to complete
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'STOP_AUDIO_PROCESSING',
                target: 'offscreen'
            }, () => {
                // Small delay to ensure stream is fully released
                setTimeout(resolve, 100);
            });
        });
    }
}

/**
 * Get tab capture stream ID for the current active tab
 */
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

/**
 * Handle messages from popup and offscreen document
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender, sendResponse);
    return true; // Keep channel open for async response
});

async function handleMessage(message, sender, sendResponse) {
    try {
        switch (message.type) {
            case 'START_AUDIO_CAPTURE': {
                // Get active tab
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.id) {
                    sendResponse({ success: false, error: 'No active tab found' });
                    return;
                }

                // Check if we're already capturing this tab
                if (isCapturing && currentCaptureTabId === tab.id) {
                    sendResponse({ success: true, tabId: tab.id, alreadyCapturing: true });
                    return;
                }

                // Stop any existing capture first
                await stopExistingCapture();

                // Create offscreen document if needed
                await setupOffscreenDocument();

                // Get stream ID for tab capture
                const streamId = await getTabCaptureStreamId(tab.id);

                // Mark as capturing
                isCapturing = true;
                currentCaptureTabId = tab.id;

                // Send stream ID to offscreen document
                chrome.runtime.sendMessage({
                    type: 'INIT_AUDIO_CONTEXT',
                    target: 'offscreen',
                    streamId: streamId,
                    tabId: tab.id
                });

                // Send saved settings to offscreen document after a short delay
                // to ensure audio context is initialized
                setTimeout(async () => {
                    const result = await chrome.storage.local.get(['settings']);
                    if (result.settings) {
                        chrome.runtime.sendMessage({
                            type: 'UPDATE_AUDIO_SETTINGS',
                            target: 'offscreen',
                            settings: {
                                volume: result.settings.volume,
                                bands: result.settings.bands
                            }
                        });
                    }
                }, 100);

                sendResponse({ success: true, tabId: tab.id });
                break;
            }

            case 'STOP_AUDIO_CAPTURE': {
                // Tell offscreen to stop processing
                chrome.runtime.sendMessage({
                    type: 'STOP_AUDIO_PROCESSING',
                    target: 'offscreen'
                });

                // Reset state
                isCapturing = false;
                currentCaptureTabId = null;

                // Close offscreen document
                await closeOffscreenDocument();
                sendResponse({ success: true });
                break;
            }

            case 'UPDATE_SETTINGS': {
                // Forward settings to offscreen document
                chrome.runtime.sendMessage({
                    type: 'UPDATE_AUDIO_SETTINGS',
                    target: 'offscreen',
                    settings: message.settings
                });
                sendResponse({ success: true });
                break;
            }

            case 'GET_STATUS': {
                const hasDoc = await hasOffscreenDocument();
                sendResponse({ isActive: hasDoc && isCapturing, tabId: currentCaptureTabId });
                break;
            }

            case 'AUDIO_STARTED':
                isCapturing = true;
                break;

            case 'AUDIO_STOPPED':
                isCapturing = false;
                currentCaptureTabId = null;
                break;

            case 'AUDIO_ERROR': {
                // Reset state on error
                isCapturing = false;
                currentCaptureTabId = null;
                // Forward status updates to popup
                break;
            }

            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('Background script error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Clean up when extension is suspended/unloaded
chrome.runtime.onSuspend.addListener(async () => {
    await closeOffscreenDocument();
});

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
    // Set default settings
    chrome.storage.local.get(['settings'], (result) => {
        if (!result.settings) {
            const defaultSettings = {
                enabled: false,
                volume: 100,
                preset: 'flat',
                bands: {
                    '32': 0,
                    '64': 0,
                    '125': 0,
                    '250': 0,
                    '500': 0,
                    '1k': 0,
                    '2k': 0,
                    '4k': 0,
                    '8k': 0,
                    '16k': 0
                }
            };
            chrome.storage.local.set({ settings: defaultSettings });
        }
    });
});

console.log('Audio Equalizer & Booster - Background service worker loaded');
