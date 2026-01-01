// Background Service Worker v2.1
// Manages offscreen document, tab tracking, and message coordination
// Fixed: Auto-off issue when opening new tabs

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

async function closeOffscreenDocument() {
    if (await hasOffscreenDocument()) {
        await chrome.offscreen.closeDocument();
        console.log('Offscreen document closed');
    }
    currentCaptureTabId = null;
    isCapturing = false;
}

// Cleanup stale offscreen documents on service worker startup
async function cleanupOnStartup() {
    if (await hasOffscreenDocument()) {
        console.log('Cleaning up stale offscreen document from previous session');
        try {
            await chrome.offscreen.closeDocument();
        } catch (e) {
            console.log('Cleanup error (safe to ignore):', e.message);
        }
    }
    currentCaptureTabId = null;
    isCapturing = false;
}

// Run cleanup on startup
cleanupOnStartup();

// ===================== TAB CAPTURE =====================

async function stopExistingCapture() {
    // Always try to stop if offscreen document exists, regardless of isCapturing state
    if (await hasOffscreenDocument()) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'STOP_AUDIO_PROCESSING',
                target: 'offscreen'
            }, () => {
                // Give time for cleanup
                setTimeout(async () => {
                    // Close the offscreen document to fully release the stream
                    try {
                        await chrome.offscreen.closeDocument();
                        console.log('Offscreen document closed for cleanup');
                    } catch (e) {
                        // Ignore if already closed
                    }
                    isCapturing = false;
                    currentCaptureTabId = null;
                    resolve();
                }, 150);
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
        // Prevent rapid re-captures
        const now = Date.now();
        if (now - lastCaptureTime < 500) {
            console.log('Capture throttled');
            return { success: false, error: 'Please wait before starting again' };
        }
        lastCaptureTime = now;

        // Stop any existing capture first
        await stopExistingCapture();

        // Create offscreen document
        await setupOffscreenDocument();

        // Get stream ID
        const streamId = await getTabCaptureStreamId(tabId);

        // Update state
        isCapturing = true;
        currentCaptureTabId = tabId;

        // Initialize audio context in offscreen
        chrome.runtime.sendMessage({
            type: 'INIT_AUDIO_CONTEXT',
            target: 'offscreen',
            streamId: streamId,
            tabId: tabId
        });

        // Apply saved settings after initialization
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
        }, 150);

        return { success: true, tabId: tabId };

    } catch (error) {
        console.error('Start capture error:', error);
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
        console.error('Stop capture error:', error);
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
                // Get active tab
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab || !tab.id) {
                    sendResponse({ success: false, error: 'No active tab found' });
                    return;
                }

                // Check if already capturing this tab
                if (isCapturing && currentCaptureTabId === tab.id) {
                    sendResponse({ success: true, tabId: tab.id, alreadyCapturing: true });
                    return;
                }

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
                // Forward to offscreen
                chrome.runtime.sendMessage({
                    type: 'UPDATE_AUDIO_SETTINGS',
                    target: 'offscreen',
                    settings: message.settings
                });
                sendResponse({ success: true });
                break;
            }

            case 'UPDATE_EFFECTS': {
                // Forward to offscreen
                chrome.runtime.sendMessage({
                    type: 'UPDATE_EFFECTS',
                    target: 'offscreen',
                    effects: message.effects
                });
                sendResponse({ success: true });
                break;
            }

            case 'GET_ANALYSER_DATA': {
                // Forward to offscreen and relay response
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
                return; // Don't sendResponse here, it's handled in callback
            }

            case 'GET_STATUS': {
                const hasDoc = await hasOffscreenDocument();
                sendResponse({
                    isActive: hasDoc && isCapturing,
                    tabId: currentCaptureTabId
                });
                break;
            }

            case 'AUDIO_STARTED':
                isCapturing = true;
                // Update settings state
                chrome.storage.local.get(['settings'], (result) => {
                    if (result.settings) {
                        result.settings.enabled = true;
                        chrome.storage.local.set({ settings: result.settings });
                    }
                });
                break;

            case 'AUDIO_STOPPED':
                isCapturing = false;
                currentCaptureTabId = null;
                // Update settings state
                chrome.storage.local.get(['settings'], (result) => {
                    if (result.settings) {
                        result.settings.enabled = false;
                        chrome.storage.local.set({ settings: result.settings });
                    }
                });
                break;

            case 'AUDIO_ERROR':
                isCapturing = false;
                currentCaptureTabId = null;
                console.error('Audio error:', message.error);
                break;

            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        console.error('Background script error:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// ===================== TAB EVENTS =====================
// FIX: Handle tab activation to maintain capture state

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    // Don't stop capture when switching tabs - only stop when user explicitly disables
    // This fixes the auto-off issue when opening new tabs

    // If we're capturing and the user switches to a different tab,
    // we keep the capture running for the original tab
    console.log('Tab activated:', activeInfo.tabId, 'Current capture tab:', currentCaptureTabId);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
    // Only stop if the removed tab was the one being captured
    if (tabId === currentCaptureTabId) {
        console.log('Captured tab closed, stopping audio');
        await stopCapture();
        // Update storage to reflect disabled state
        chrome.storage.local.get(['settings'], (result) => {
            if (result.settings) {
                result.settings.enabled = false;
                chrome.storage.local.set({ settings: result.settings });
            }
        });
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Handle page navigation in the captured tab
    if (tabId === currentCaptureTabId && changeInfo.status === 'loading') {
        // Page is navigating - the capture will automatically stop
        // We need to restart it after the page loads
        console.log('Captured tab navigating, audio will restart when page loads');
    }

    // Restart capture when page finishes loading (if it was the captured tab)
    if (tabId === currentCaptureTabId && changeInfo.status === 'complete' && !isCapturing) {
        console.log('Captured tab loaded, restarting capture');
        const settings = await chrome.storage.local.get(['settings']);
        if (settings.settings?.enabled) {
            await startCapture(tabId);
        }
    }
});

// ===================== LIFECYCLE =====================

chrome.runtime.onSuspend.addListener(async () => {
    await closeOffscreenDocument();
});

chrome.runtime.onInstalled.addListener(() => {
    // Set default settings
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
                    }
                }
            };
            chrome.storage.local.set({ settings: defaultSettings });
        }
    });
});

// ===================== KEYBOARD SHORTCUTS =====================
chrome.commands.onCommand.addListener(async (command) => {
    console.log('Keyboard shortcut:', command);
    const result = await chrome.storage.local.get(['settings']);
    let settings = result.settings || {
        enabled: false,
        volume: 100,
        preset: 'flat',
        bands: { '32': 0, '64': 0, '125': 0, '250': 0, '500': 0, '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0 }
    };

    switch (command) {
        case 'toggle-power':
            settings.enabled = !settings.enabled;
            if (settings.enabled) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) await startCapture(tab.id);
            } else {
                await stopCapture();
            }
            break;
    }

    await chrome.storage.local.set({ settings });

    // Show notification badge
    const badgeText = settings.enabled ? 'ON' : 'OFF';
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: settings.enabled ? '#22c55e' : '#6b7280' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1500);
});

// ===================== STARTUP =====================
// Check if we should restore audio capture on extension startup

chrome.runtime.onStartup.addListener(async () => {
    const result = await chrome.storage.local.get(['settings']);
    if (result.settings?.enabled) {
        // Audio was enabled before browser restart
        // We'll need to wait for user to interact with popup to restart
        console.log('Extension started, audio was previously enabled');
    }
});

console.log('Audio Equalizer & Booster v2.3 - Background service worker loaded');
