// Offscreen Audio Processing Engine
// Handles AudioContext, EQ filters, gain, and compression

// EQ Band frequencies in Hz
const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_BAND_KEYS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

// Audio processing state
let audioContext = null;
let sourceNode = null;
let gainNode = null;
let eqFilters = [];
let compressorNode = null;
let mediaStream = null;
let currentTabId = null;
let isInitializing = false;

/**
 * Initialize the audio processing pipeline
 */
async function initAudioContext(streamId, tabId) {
    // Prevent duplicate initialization
    if (isInitializing) {
        console.log('Already initializing, skipping...');
        return;
    }

    isInitializing = true;

    try {
        // Clean up any existing audio context first
        await stopAudioProcessing(false); // Don't send AUDIO_STOPPED message

        // Get the media stream using the stream ID
        mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            },
            video: false
        });

        currentTabId = tabId;

        // Create AudioContext with playback latency hint for smoother audio
        audioContext = new AudioContext({
            latencyHint: 'playback',  // Optimize for smooth playback over low latency
            sampleRate: 48000         // Standard sample rate
        });

        // Create source from the captured stream
        sourceNode = audioContext.createMediaStreamSource(mediaStream);

        // Create gain node (volume control) - up to 400%
        gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        // Create 10-band EQ using BiquadFilterNodes
        eqFilters = EQ_FREQUENCIES.map((freq, index) => {
            const filter = audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.0; // Slightly lower Q for less CPU usage
            filter.gain.value = 0; // Default flat (no boost/cut)
            return filter;
        });

        // Create compressor/limiter to prevent clipping (optimized for bass)
        compressorNode = audioContext.createDynamicsCompressor();
        compressorNode.threshold.value = -10;   // Lower threshold to catch more peaks
        compressorNode.knee.value = 20;         // Very soft knee for transparent compression
        compressorNode.ratio.value = 3;         // Gentle ratio, natural sound
        compressorNode.attack.value = 0.05;     // Slower attack (50ms) - lets bass transients through
        compressorNode.release.value = 0.25;    // Longer release (250ms) - prevents pumping

        // Wire up the audio processing chain:
        // Source -> Gain -> EQ Filters (chained) -> Compressor -> Destination
        let currentNode = sourceNode;

        // Connect to gain node
        currentNode.connect(gainNode);
        currentNode = gainNode;

        // Connect through all EQ filters in series
        for (const filter of eqFilters) {
            currentNode.connect(filter);
            currentNode = filter;
        }

        // Connect to compressor
        currentNode.connect(compressorNode);

        // Connect compressor directly to audioContext.destination
        // This outputs the processed audio to the system speakers
        compressorNode.connect(audioContext.destination);

        // Note: Settings will be applied via UPDATE_AUDIO_SETTINGS message from popup/background
        // Offscreen documents have limited API access

        console.log('Audio context initialized successfully');

        // Notify that audio processing has started
        chrome.runtime.sendMessage({ type: 'AUDIO_STARTED', tabId: tabId });

        isInitializing = false;

    } catch (error) {
        isInitializing = false;
        console.error('Failed to initialize audio context:', error);
        chrome.runtime.sendMessage({
            type: 'AUDIO_ERROR',
            error: error.message
        });
        throw error;
    }
}

/**
 * Stop audio processing and clean up resources
 * @param {boolean} sendMessage - Whether to send AUDIO_STOPPED message (default: true)
 */
async function stopAudioProcessing(sendMessage = true) {
    try {
        // Disconnect all nodes safely
        if (sourceNode) {
            try { sourceNode.disconnect(); } catch (e) { }
            sourceNode = null;
        }

        if (gainNode) {
            try { gainNode.disconnect(); } catch (e) { }
            gainNode = null;
        }

        for (const filter of eqFilters) {
            try { filter.disconnect(); } catch (e) { }
        }
        eqFilters = [];

        if (compressorNode) {
            try { compressorNode.disconnect(); } catch (e) { }
            compressorNode = null;
        }

        // Stop all tracks in the media stream - THIS IS CRITICAL
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => {
                track.stop();
                console.log(`Track ${track.kind} stopped`);
            });
            mediaStream = null;
        }

        // Close audio context
        if (audioContext && audioContext.state !== 'closed') {
            await audioContext.close();
            audioContext = null;
        }

        const tabId = currentTabId;
        currentTabId = null;

        console.log('Audio processing stopped');

        if (sendMessage) {
            chrome.runtime.sendMessage({ type: 'AUDIO_STOPPED', tabId: tabId });
        }

    } catch (error) {
        console.error('Error stopping audio processing:', error);
    }
}

/**
 * Apply settings to audio nodes
 */
function applySettings(settings) {
    if (!audioContext || audioContext.state === 'closed') {
        return;
    }

    // Apply volume (0-400%, so 0-4 as gain value) with smooth transition
    if (gainNode && settings.volume !== undefined) {
        const gainValue = settings.volume / 100;
        const currentTime = audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
        gainNode.gain.linearRampToValueAtTime(gainValue, currentTime + 0.05); // 50ms ramp
    }

    // Apply EQ band gains with smooth transitions
    if (settings.bands) {
        EQ_BAND_KEYS.forEach((key, index) => {
            if (eqFilters[index] && settings.bands[key] !== undefined) {
                const currentTime = audioContext.currentTime;
                const filter = eqFilters[index];
                filter.gain.cancelScheduledValues(currentTime);
                filter.gain.setValueAtTime(filter.gain.value, currentTime);
                filter.gain.linearRampToValueAtTime(
                    settings.bands[key],
                    currentTime + 0.05  // 50ms ramp to prevent clicks
                );
            }
        });
    }

    console.log('Settings applied:', settings);
}

/**
 * Update compressor settings dynamically
 */
function updateCompressor(settings) {
    if (!compressorNode || !audioContext) return;

    if (settings.threshold !== undefined) {
        compressorNode.threshold.setValueAtTime(settings.threshold, audioContext.currentTime);
    }
    if (settings.ratio !== undefined) {
        compressorNode.ratio.setValueAtTime(settings.ratio, audioContext.currentTime);
    }
    if (settings.attack !== undefined) {
        compressorNode.attack.setValueAtTime(settings.attack, audioContext.currentTime);
    }
    if (settings.release !== undefined) {
        compressorNode.release.setValueAtTime(settings.release, audioContext.currentTime);
    }
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only handle messages targeted at offscreen
    if (message.target !== 'offscreen') {
        return;
    }

    switch (message.type) {
        case 'INIT_AUDIO_CONTEXT':
            initAudioContext(message.streamId, message.tabId)
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
            return true;

        case 'STOP_AUDIO_PROCESSING':
            stopAudioProcessing()
                .then(() => sendResponse({ success: true }))
                .catch((error) => sendResponse({ success: false, error: error.message }));
            return true;

        case 'UPDATE_AUDIO_SETTINGS':
            applySettings(message.settings);
            sendResponse({ success: true });
            break;

        case 'UPDATE_COMPRESSOR':
            updateCompressor(message.settings);
            sendResponse({ success: true });
            break;

        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }

    return false;
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    stopAudioProcessing();
});

console.log('Offscreen audio processor loaded');
