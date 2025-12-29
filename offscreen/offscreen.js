// Offscreen Audio Processing Engine v2.2
// EQ, Gain, Limiter, Spatial Audio, 7D Auto-Pan (Fixed)

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_BAND_KEYS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

// ===================== AUDIO STATE =====================
let audioContext = null;
let sourceNode = null;
let gainNode = null;
let eqFilters = [];
let compressorNode = null;
let limiterNode = null;
let analyserNode = null;
let mediaStream = null;
let currentTabId = null;
let isInitializing = false;

// Spatial audio nodes
let spatialEnabled = false;
let spatialMode = 'wide';
let spatialWidth = 50;
let splitterNode = null;
let mergerNode = null;
let leftDelayNode = null;
let rightDelayNode = null;
let leftGainNode = null;
let rightGainNode = null;
let crossFeedL = null;
let crossFeedR = null;

// 7D Auto-Pan nodes
let autoPanEnabled = false;
let autoPanNode = null;
let autoPanLFO = null;
let autoPanLFOGain = null;
let autoPanSpeed = 'medium';

// Current effects cache
let currentEffects = {
    limiter: { enabled: true, threshold: -6, knee: 20, ratio: 12, attack: 0.003, release: 0.25 },
    spatial: { enabled: false, mode: 'wide', width: 50 },
    autoPan: { enabled: false, speed: 'medium' }
};

// ===================== INITIALIZATION =====================
async function initAudioContext(streamId, tabId) {
    if (isInitializing) return;
    isInitializing = true;

    try {
        await stopAudioProcessing(false);

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

        audioContext = new AudioContext({
            latencyHint: 'playback',
            sampleRate: 48000
        });

        // Source
        sourceNode = audioContext.createMediaStreamSource(mediaStream);

        // Gain (0-800%)
        gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        // 10-band EQ
        eqFilters = EQ_FREQUENCIES.map((freq) => {
            const filter = audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.2;
            filter.gain.value = 0;
            return filter;
        });

        // Compressor (limiter)
        compressorNode = audioContext.createDynamicsCompressor();
        compressorNode.threshold.value = -6;
        compressorNode.knee.value = 20;
        compressorNode.ratio.value = 12;
        compressorNode.attack.value = 0.003;
        compressorNode.release.value = 0.25;

        // Brick wall limiter
        limiterNode = audioContext.createDynamicsCompressor();
        limiterNode.threshold.value = -1;
        limiterNode.knee.value = 0;
        limiterNode.ratio.value = 20;
        limiterNode.attack.value = 0.001;
        limiterNode.release.value = 0.1;

        // Analyser for visualizer
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.8;

        // Create effect nodes
        createSpatialNodes();
        createAutoPanNodes();

        // Build audio chain
        buildAudioChain();

        console.log('Audio context initialized successfully');
        chrome.runtime.sendMessage({ type: 'AUDIO_STARTED', tabId: tabId });

        isInitializing = false;

    } catch (error) {
        isInitializing = false;
        console.error('Failed to init audio:', error);
        chrome.runtime.sendMessage({ type: 'AUDIO_ERROR', error: error.message });
        throw error;
    }
}

// ===================== SPATIAL AUDIO =====================
function createSpatialNodes() {
    if (!audioContext) return;

    // Channel splitter/merger for stereo processing
    splitterNode = audioContext.createChannelSplitter(2);
    mergerNode = audioContext.createChannelMerger(2);

    // Delay nodes for stereo widening
    leftDelayNode = audioContext.createDelay(0.05);
    rightDelayNode = audioContext.createDelay(0.05);
    leftDelayNode.delayTime.value = 0;
    rightDelayNode.delayTime.value = 0;

    // Gain nodes for channel balance
    leftGainNode = audioContext.createGain();
    rightGainNode = audioContext.createGain();
    leftGainNode.gain.value = 1;
    rightGainNode.gain.value = 1;

    // Cross-feed for immersive effect
    crossFeedL = audioContext.createGain();
    crossFeedR = audioContext.createGain();
    crossFeedL.gain.value = 0;
    crossFeedR.gain.value = 0;

    console.log('Spatial nodes created');
}

// Connect internal spatial nodes (called when spatial is enabled)
function connectSpatialInternal() {
    if (!splitterNode || !mergerNode) return;

    // Connect: Splitter -> Delays -> Gains -> Merger
    // Left channel
    splitterNode.connect(leftDelayNode, 0);
    leftDelayNode.connect(leftGainNode);
    leftGainNode.connect(mergerNode, 0, 0);

    // Right channel  
    splitterNode.connect(rightDelayNode, 1);
    rightDelayNode.connect(rightGainNode);
    rightGainNode.connect(mergerNode, 0, 1);

    // Cross-feed (left to right, right to left)
    splitterNode.connect(crossFeedL, 0);
    crossFeedL.connect(mergerNode, 0, 1);
    splitterNode.connect(crossFeedR, 1);
    crossFeedR.connect(mergerNode, 0, 0);

    console.log('Spatial internal connections established');
}

function updateSpatialEffect(mode, width) {
    if (!audioContext || !leftDelayNode || !rightDelayNode) {
        console.log('Cannot update spatial: nodes not ready');
        return;
    }

    const w = width / 100;
    const ct = audioContext.currentTime;

    spatialMode = mode;
    spatialWidth = width;

    console.log('Updating spatial effect:', mode, width);

    switch (mode) {
        case 'wide':
            // Simple stereo widening
            leftDelayNode.delayTime.setValueAtTime(0, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.0005, ct);
            leftGainNode.gain.setValueAtTime(1, ct);
            rightGainNode.gain.setValueAtTime(1, ct);
            crossFeedL.gain.setValueAtTime(-w * 0.1, ct);
            crossFeedR.gain.setValueAtTime(-w * 0.1, ct);
            break;

        case 'surround':
            // Virtual surround with more delay
            leftDelayNode.delayTime.setValueAtTime(w * 0.0002, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.0007, ct);
            leftGainNode.gain.setValueAtTime(1.1, ct);
            rightGainNode.gain.setValueAtTime(1.1, ct);
            crossFeedL.gain.setValueAtTime(w * 0.15, ct);
            crossFeedR.gain.setValueAtTime(w * 0.15, ct);
            break;

        case '3d':
            // 3D effect with phase differences
            leftDelayNode.delayTime.setValueAtTime(w * 0.0003, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.0008, ct);
            leftGainNode.gain.setValueAtTime(1.15, ct);
            rightGainNode.gain.setValueAtTime(0.95, ct);
            crossFeedL.gain.setValueAtTime(w * 0.2, ct);
            crossFeedR.gain.setValueAtTime(w * 0.12, ct);
            break;

        case '7d':
            // Maximum immersion
            leftDelayNode.delayTime.setValueAtTime(w * 0.0004, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.001, ct);
            leftGainNode.gain.setValueAtTime(1.2, ct);
            rightGainNode.gain.setValueAtTime(1.2, ct);
            crossFeedL.gain.setValueAtTime(w * 0.25, ct);
            crossFeedR.gain.setValueAtTime(w * 0.25, ct);
            break;

        default:
            // Off - reset to neutral
            leftDelayNode.delayTime.setValueAtTime(0, ct);
            rightDelayNode.delayTime.setValueAtTime(0, ct);
            leftGainNode.gain.setValueAtTime(1, ct);
            rightGainNode.gain.setValueAtTime(1, ct);
            crossFeedL.gain.setValueAtTime(0, ct);
            crossFeedR.gain.setValueAtTime(0, ct);
    }
}

// ===================== 7D AUTO-PAN =====================
function createAutoPanNodes() {
    if (!audioContext) return;

    // StereoPanner for left-right panning
    autoPanNode = audioContext.createStereoPanner();
    autoPanNode.pan.value = 0;

    // LFO oscillator for automatic panning
    autoPanLFO = audioContext.createOscillator();
    autoPanLFO.type = 'sine';
    autoPanLFO.frequency.value = 0.5; // 2 second cycle

    // Gain to control pan depth
    autoPanLFOGain = audioContext.createGain();
    autoPanLFOGain.gain.value = 0.9; // Pan range -0.9 to +0.9

    // Connect LFO -> Gain -> Pan parameter
    autoPanLFO.connect(autoPanLFOGain);
    autoPanLFOGain.connect(autoPanNode.pan);

    // Start LFO
    autoPanLFO.start();

    console.log('Auto-pan nodes created and LFO started');
}

function updateAutoPanSpeed(speed) {
    if (!autoPanLFO || !audioContext) {
        console.log('Cannot update auto-pan speed: LFO not ready');
        return;
    }

    const frequencies = {
        'slow': 0.25,    // 4 second cycle
        'medium': 0.5,   // 2 second cycle
        'fast': 1.0      // 1 second cycle
    };

    const freq = frequencies[speed] || 0.5;
    autoPanLFO.frequency.setValueAtTime(freq, audioContext.currentTime);
    autoPanSpeed = speed;

    console.log('Auto-pan speed updated:', speed, freq, 'Hz');
}

// ===================== AUDIO CHAIN =====================
function buildAudioChain() {
    if (!audioContext || !sourceNode) {
        console.log('Cannot build chain: context or source not ready');
        return;
    }

    // Disconnect all main chain nodes
    try { sourceNode.disconnect(); } catch (e) { }
    try { gainNode.disconnect(); } catch (e) { }
    eqFilters.forEach(f => { try { f.disconnect(); } catch (e) { } });
    try { autoPanNode?.disconnect(); } catch (e) { }
    // Disconnect spatial nodes completely (will reconnect internal if needed)
    try { splitterNode?.disconnect(); } catch (e) { }
    try { leftDelayNode?.disconnect(); } catch (e) { }
    try { rightDelayNode?.disconnect(); } catch (e) { }
    try { leftGainNode?.disconnect(); } catch (e) { }
    try { rightGainNode?.disconnect(); } catch (e) { }
    try { crossFeedL?.disconnect(); } catch (e) { }
    try { crossFeedR?.disconnect(); } catch (e) { }
    try { mergerNode?.disconnect(); } catch (e) { }
    try { compressorNode?.disconnect(); } catch (e) { }
    try { limiterNode?.disconnect(); } catch (e) { }
    try { analyserNode?.disconnect(); } catch (e) { }

    // Build chain: Source -> Gain -> EQ -> [AutoPan] -> [Spatial] -> Compressor -> Limiter -> Destination
    let currentNode = sourceNode;

    // Gain
    currentNode.connect(gainNode);
    currentNode = gainNode;

    // EQ filters
    for (const filter of eqFilters) {
        currentNode.connect(filter);
        currentNode = filter;
    }

    // Auto-Pan (7D) - if enabled
    if (autoPanEnabled && autoPanNode) {
        currentNode.connect(autoPanNode);
        currentNode = autoPanNode;
        console.log('Auto-pan inserted into chain');
    }

    // Spatial Audio - if enabled
    if (spatialEnabled && splitterNode && mergerNode) {
        connectSpatialInternal(); // Re-establish internal connections
        currentNode.connect(splitterNode);
        currentNode = mergerNode;
        // Apply current spatial settings
        updateSpatialEffect(spatialMode, spatialWidth);
        console.log('Spatial audio inserted into chain');
    }

    // Compressor (if limiter enabled)
    if (currentEffects.limiter.enabled && compressorNode) {
        currentNode.connect(compressorNode);
        currentNode = compressorNode;
    }

    // Brick wall limiter (always on)
    currentNode.connect(limiterNode);
    currentNode = limiterNode;

    // Analyser (parallel connection for visualization)
    limiterNode.connect(analyserNode);

    // Final output
    currentNode.connect(audioContext.destination);

    console.log('Audio chain built:', {
        autoPan: autoPanEnabled,
        spatial: spatialEnabled,
        limiter: currentEffects.limiter.enabled
    });
}

// ===================== STOP PROCESSING =====================
async function stopAudioProcessing(sendMessage = true) {
    try {
        // Stop LFO
        if (autoPanLFO) {
            try { autoPanLFO.stop(); } catch (e) { }
        }

        // Disconnect all nodes
        const allNodes = [
            sourceNode, gainNode, compressorNode, limiterNode, analyserNode,
            splitterNode, mergerNode, leftDelayNode, rightDelayNode,
            leftGainNode, rightGainNode, crossFeedL, crossFeedR,
            autoPanNode, autoPanLFO, autoPanLFOGain
        ];

        allNodes.forEach(node => {
            if (node) try { node.disconnect(); } catch (e) { }
        });

        eqFilters.forEach(f => { try { f.disconnect(); } catch (e) { } });
        eqFilters = [];

        // Reset references
        sourceNode = gainNode = compressorNode = limiterNode = analyserNode = null;
        splitterNode = mergerNode = leftDelayNode = rightDelayNode = null;
        leftGainNode = rightGainNode = crossFeedL = crossFeedR = null;
        autoPanNode = autoPanLFO = autoPanLFOGain = null;

        // Stop media stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
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
        console.error('Error stopping audio:', error);
    }
}

// ===================== APPLY SETTINGS =====================
function applySettings(settings) {
    if (!audioContext || audioContext.state === 'closed') return;

    const ct = audioContext.currentTime;
    const ramp = 0.05;

    // Volume (0-800%)
    if (gainNode && settings.volume !== undefined) {
        const gainValue = settings.volume / 100;
        gainNode.gain.cancelScheduledValues(ct);
        gainNode.gain.setValueAtTime(gainNode.gain.value, ct);
        gainNode.gain.linearRampToValueAtTime(gainValue, ct + ramp);
    }

    // EQ bands
    if (settings.bands) {
        EQ_BAND_KEYS.forEach((key, index) => {
            if (eqFilters[index] && settings.bands[key] !== undefined) {
                const filter = eqFilters[index];
                filter.gain.cancelScheduledValues(ct);
                filter.gain.setValueAtTime(filter.gain.value, ct);
                filter.gain.linearRampToValueAtTime(settings.bands[key], ct + ramp);
            }
        });
    }

    // Effects
    if (settings.effects) {
        applyEffects(settings.effects);
    }

    console.log('Settings applied');
}

function applyEffects(effects) {
    if (!audioContext) return;

    let needsRebuild = false;

    // Limiter
    if (effects.limiter) {
        const limiter = effects.limiter;
        const ct = audioContext.currentTime;

        if (compressorNode) {
            if (limiter.threshold !== undefined)
                compressorNode.threshold.setValueAtTime(limiter.threshold, ct);
            if (limiter.knee !== undefined)
                compressorNode.knee.setValueAtTime(limiter.knee, ct);
            if (limiter.ratio !== undefined)
                compressorNode.ratio.setValueAtTime(limiter.ratio, ct);
            if (limiter.attack !== undefined)
                compressorNode.attack.setValueAtTime(limiter.attack, ct);
            if (limiter.release !== undefined)
                compressorNode.release.setValueAtTime(limiter.release, ct);
        }

        if (limiter.enabled !== undefined && limiter.enabled !== currentEffects.limiter.enabled) {
            currentEffects.limiter.enabled = limiter.enabled;
            needsRebuild = true;
        }
    }

    // Spatial Audio
    if (effects.spatial) {
        const wasEnabled = spatialEnabled;

        if (effects.spatial.enabled !== undefined) {
            spatialEnabled = effects.spatial.enabled;
        }

        // Update spatial parameters
        if (effects.spatial.mode !== undefined || effects.spatial.width !== undefined) {
            updateSpatialEffect(
                effects.spatial.mode ?? spatialMode,
                effects.spatial.width ?? spatialWidth
            );
        }

        if (spatialEnabled !== wasEnabled) {
            needsRebuild = true;
            console.log('Spatial enabled changed:', spatialEnabled);
        }
    }

    // Auto-Pan (7D)
    if (effects.autoPan) {
        const wasEnabled = autoPanEnabled;

        if (effects.autoPan.enabled !== undefined) {
            autoPanEnabled = effects.autoPan.enabled;
        }

        if (effects.autoPan.speed) {
            updateAutoPanSpeed(effects.autoPan.speed);
        }

        if (autoPanEnabled !== wasEnabled) {
            needsRebuild = true;
            console.log('AutoPan enabled changed:', autoPanEnabled);
        }
    }

    // Update cache
    currentEffects = {
        ...currentEffects,
        ...effects,
        spatial: { ...currentEffects.spatial, ...effects.spatial },
        autoPan: { ...currentEffects.autoPan, ...effects.autoPan }
    };

    if (needsRebuild) {
        buildAudioChain();
    }

    console.log('Effects applied:', effects);
}

// ===================== MESSAGE HANDLING =====================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

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

        case 'UPDATE_EFFECTS':
            applyEffects(message.effects);
            sendResponse({ success: true });
            break;

        case 'GET_ANALYSER_DATA':
            if (analyserNode && audioContext && audioContext.state === 'running') {
                const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
                analyserNode.getByteFrequencyData(dataArray);
                sendResponse({ success: true, data: Array.from(dataArray) });
            } else {
                sendResponse({ success: false, error: 'No analyser or context not running' });
            }
            break;

        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }

    return false;
});

window.addEventListener('beforeunload', () => {
    stopAudioProcessing();
});

console.log('Offscreen audio processor v2.2 loaded');
