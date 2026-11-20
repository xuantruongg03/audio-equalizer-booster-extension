// Offscreen Audio Processing Engine v3.0 Pro
// Professional 10-Band EQ, 800% Gain, Studio Reverb, Bass Enhancer, Limiter, Spatial Audio, 7D Auto-Pan, A/B Compare
// AI Hybrid Auto-Genre Detection & Adaptive Dynamic EQ

import { AutoGenreClassifier } from './autoGenreClassifier.js';
import { STORAGE_KEYS, AI_GENRE_PROFILES } from '../constant.js';

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const EQ_BAND_KEYS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

// ===================== AUDIO STATE =====================
let audioContext = null;
let sourceNode = null;
let preampGainNode = null;
let gainNode = null;
let eqFilters = [];
let stereoPannerNode = null;
let compressorNode = null;
let limiterNode = null;
let analyserNode = null;
let mediaStream = null;
let currentTabId = null;
let isInitializing = false;
let abCompareActive = false;
let autoClassifier = null;

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

// Reverb (Convolution) nodes
let reverbEnabled = false;
let reverbType = 'hall';
let reverbMix = 25; // 0-100%
let convolverNode = null;
let reverbDryGain = null;
let reverbWetGain = null;
let reverbInputSplit = null;
let reverbOutputMerge = null;

// Bass Enhancer nodes
let bassEnhancerEnabled = false;
let bassEnhancerAmount = 40; // 0-100%
let bassEnhancerFreq = 90; // Hz
let bassFilterNode = null;
let bassShaperNode = null;
let bassGainNode = null;
let bassInputSplit = null;
let bassOutputMerge = null;

// Current effects cache
let currentEffects = {
    limiter: { enabled: true, threshold: -6, knee: 20, ratio: 12, attack: 0.003, release: 0.25 },
    spatial: { enabled: false, mode: 'wide', width: 50 },
    autoPan: { enabled: false, speed: 'medium' },
    reverb: { enabled: false, type: 'hall', mix: 25 },
    bassEnhancer: { enabled: false, amount: 40, freq: 90 }
};

// ===================== INITIALIZATION =====================
async function initAudioContext(streamId, tabId, title = '') {
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

        // Listen for track termination (triggered when tab is reloaded or navigated by browser)
        mediaStream.getAudioTracks().forEach(track => {
            track.onended = () => {
                console.log('[Audio EQ Pro v3.0] Tab audio stream ended by browser');
                stopAudioProcessing(true);
            };
        });

        currentTabId = tabId;

        audioContext = new AudioContext({
            latencyHint: 'playback',
            sampleRate: 48000
        });

        // Ensure AudioContext automatically wakes up if temporarily suspended during video transitions
        audioContext.onstatechange = () => {
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume().catch(() => {});
            }
        };

        // Source
        sourceNode = audioContext.createMediaStreamSource(mediaStream);

        // Preamp Headroom Gain (-12dB to +12dB)
        preampGainNode = audioContext.createGain();
        preampGainNode.gain.value = 1.0;

        // Master Gain (0-800%)
        gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        // 10-band EQ
        eqFilters = EQ_FREQUENCIES.map((freq, index) => {
            const filter = audioContext.createBiquadFilter();
            filter.type = index === 0 ? 'lowshelf' : index === 9 ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.2;
            filter.gain.value = 0;
            return filter;
        });

        // Master Stereo Balance (Pan)
        stereoPannerNode = audioContext.createStereoPanner();
        stereoPannerNode.pan.value = 0;

        // Dynamics Compressor
        compressorNode = audioContext.createDynamicsCompressor();
        compressorNode.threshold.value = -6;
        compressorNode.knee.value = 20;
        compressorNode.ratio.value = 12;
        compressorNode.attack.value = 0.003;
        compressorNode.release.value = 0.25;

        // Brick wall limiter (protection)
        limiterNode = audioContext.createDynamicsCompressor();
        limiterNode.threshold.value = -1;
        limiterNode.knee.value = 0;
        limiterNode.ratio.value = 20;
        limiterNode.attack.value = 0.001;
        limiterNode.release.value = 0.1;

        // Analyser for visualizer & AI Auto-Genre classification (FFT size 512 for rich spectral resolution)
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 512;
        analyserNode.smoothingTimeConstant = 0.8;

        // Initialize AI Hybrid Auto-Genre Classifier
        autoClassifier = new AutoGenreClassifier(analyserNode, audioContext, (result) => {
            handleAiGenreDetected(result);
        });

        // Check if user has AI Auto-EQ enabled
        try {
            chrome.storage.local.get([STORAGE_KEYS.AI_AUTO_EQ], (res) => {
                if (res && res[STORAGE_KEYS.AI_AUTO_EQ] && autoClassifier) {
                    autoClassifier.start();
                }
            });
            if (title && autoClassifier) {
                autoClassifier.setTabTitle(title);
            }
        } catch (e) {}

        // Create Effect modules
        createSpatialNodes();
        createAutoPanNodes();
        createReverbNodes();
        createBassEnhancerNodes();

        // Build main processing graph
        buildAudioChain();

        console.log('[Audio EQ Pro v3.0] Audio engine initialized');
        chrome.runtime.sendMessage({ type: 'AUDIO_STARTED', tabId: tabId });

        isInitializing = false;

    } catch (error) {
        isInitializing = false;
        console.error('[Audio EQ Pro v3.0] Failed to init audio:', error);
        chrome.runtime.sendMessage({ type: 'AUDIO_ERROR', error: error.message });
        throw error;
    }
}

// ===================== REVERB SYNTHESIS =====================
function generateImpulseResponse(type) {
    if (!audioContext) return null;
    const sampleRate = audioContext.sampleRate;
    const durations = {
        'room': 1.0,
        'hall': 2.6,
        'plate': 1.8,
        'cathedral': 4.5
    };
    const decays = {
        'room': 1.2,
        'hall': 2.4,
        'plate': 1.6,
        'cathedral': 3.8
    };

    const duration = durations[type] || 2.5;
    const decay = decays[type] || 2.0;
    const length = Math.floor(sampleRate * duration);
    const impulse = audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            // Exponentially decaying white noise with early reflections
            const noise = (Math.random() * 2 - 1);
            const env = Math.exp(-i / (sampleRate * decay * 0.3));
            channelData[i] = noise * env;
        }
    }
    return impulse;
}

function createReverbNodes() {
    if (!audioContext) return;
    reverbInputSplit = audioContext.createGain();
    reverbOutputMerge = audioContext.createGain();
    reverbDryGain = audioContext.createGain();
    reverbWetGain = audioContext.createGain();

    convolverNode = audioContext.createConvolver();
    convolverNode.buffer = generateImpulseResponse(reverbType);

    updateReverbMix(reverbMix);

    // Dry path
    reverbInputSplit.connect(reverbDryGain);
    reverbDryGain.connect(reverbOutputMerge);

    // Wet path
    reverbInputSplit.connect(convolverNode);
    convolverNode.connect(reverbWetGain);
    reverbWetGain.connect(reverbOutputMerge);
}

function updateReverbType(type) {
    reverbType = type;
    if (convolverNode && audioContext) {
        convolverNode.buffer = generateImpulseResponse(type);
    }
}

function updateReverbMix(mix) {
    reverbMix = Math.max(0, Math.min(100, mix));
    if (!audioContext || !reverbDryGain || !reverbWetGain) return;
    const wet = (reverbMix / 100);
    const dry = 1 - (wet * 0.5); // Keep dry signal punchy
    const ct = audioContext.currentTime;
    reverbDryGain.gain.setValueAtTime(dry, ct);
    reverbWetGain.gain.setValueAtTime(wet, ct);
}

// ===================== BASS ENHANCER =====================
function makeBassEnhancerCurve(amount) {
    const n = 256;
    const curve = new Float32Array(n);
    const k = (amount / 100) * 8 + 1;
    for (let i = 0; i < n; i++) {
        const x = (i * 2) / n - 1;
        // Soft clipping wave shaper for warm sub-harmonics
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    return curve;
}

function createBassEnhancerNodes() {
    if (!audioContext) return;
    bassInputSplit = audioContext.createGain();
    bassOutputMerge = audioContext.createGain();

    bassFilterNode = audioContext.createBiquadFilter();
    bassFilterNode.type = 'lowpass';
    bassFilterNode.frequency.value = bassEnhancerFreq;
    bassFilterNode.Q.value = 1.0;

    bassShaperNode = audioContext.createWaveShaper();
    bassShaperNode.curve = makeBassEnhancerCurve(bassEnhancerAmount);
    bassShaperNode.oversample = '2x';

    bassGainNode = audioContext.createGain();
    bassGainNode.gain.value = (bassEnhancerAmount / 100) * 0.7;

    // Passthrough direct audio
    bassInputSplit.connect(bassOutputMerge);

    // Bass enhancement harmonic branch
    bassInputSplit.connect(bassFilterNode);
    bassFilterNode.connect(bassShaperNode);
    bassShaperNode.connect(bassGainNode);
    bassGainNode.connect(bassOutputMerge);
}

function updateBassEnhancer(amount, freq) {
    if (amount !== undefined) {
        bassEnhancerAmount = amount;
        if (bassShaperNode) {
            bassShaperNode.curve = makeBassEnhancerCurve(amount);
        }
        if (bassGainNode && audioContext) {
            bassGainNode.gain.setValueAtTime((amount / 100) * 0.75, audioContext.currentTime);
        }
    }
    if (freq !== undefined) {
        bassEnhancerFreq = freq;
        if (bassFilterNode && audioContext) {
            bassFilterNode.frequency.setValueAtTime(freq, audioContext.currentTime);
        }
    }
}

// ===================== SPATIAL AUDIO =====================
function createSpatialNodes() {
    if (!audioContext) return;

    splitterNode = audioContext.createChannelSplitter(2);
    mergerNode = audioContext.createChannelMerger(2);

    leftDelayNode = audioContext.createDelay(0.05);
    rightDelayNode = audioContext.createDelay(0.05);
    leftDelayNode.delayTime.value = 0;
    rightDelayNode.delayTime.value = 0;

    leftGainNode = audioContext.createGain();
    rightGainNode = audioContext.createGain();
    leftGainNode.gain.value = 1;
    rightGainNode.gain.value = 1;

    crossFeedL = audioContext.createGain();
    crossFeedR = audioContext.createGain();
    crossFeedL.gain.value = 0;
    crossFeedR.gain.value = 0;
}

function connectSpatialInternal() {
    if (!splitterNode || !mergerNode) return;

    splitterNode.connect(leftDelayNode, 0);
    leftDelayNode.connect(leftGainNode);
    leftGainNode.connect(mergerNode, 0, 0);

    splitterNode.connect(rightDelayNode, 1);
    rightDelayNode.connect(rightGainNode);
    rightGainNode.connect(mergerNode, 0, 1);

    splitterNode.connect(crossFeedL, 0);
    crossFeedL.connect(mergerNode, 0, 1);
    splitterNode.connect(crossFeedR, 1);
    crossFeedR.connect(mergerNode, 0, 0);
}

function updateSpatialEffect(mode, width) {
    if (!audioContext || !leftDelayNode || !rightDelayNode) return;

    const w = width / 100;
    const ct = audioContext.currentTime;

    spatialMode = mode;
    spatialWidth = width;

    switch (mode) {
        case 'wide':
            leftDelayNode.delayTime.setValueAtTime(0, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.0006, ct);
            leftGainNode.gain.setValueAtTime(1, ct);
            rightGainNode.gain.setValueAtTime(1, ct);
            crossFeedL.gain.setValueAtTime(-w * 0.12, ct);
            crossFeedR.gain.setValueAtTime(-w * 0.12, ct);
            break;

        case 'surround':
            leftDelayNode.delayTime.setValueAtTime(w * 0.0003, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.0008, ct);
            leftGainNode.gain.setValueAtTime(1.1, ct);
            rightGainNode.gain.setValueAtTime(1.1, ct);
            crossFeedL.gain.setValueAtTime(w * 0.18, ct);
            crossFeedR.gain.setValueAtTime(w * 0.18, ct);
            break;

        case '3d':
            leftDelayNode.delayTime.setValueAtTime(w * 0.0004, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.001, ct);
            leftGainNode.gain.setValueAtTime(1.15, ct);
            rightGainNode.gain.setValueAtTime(0.95, ct);
            crossFeedL.gain.setValueAtTime(w * 0.22, ct);
            crossFeedR.gain.setValueAtTime(w * 0.14, ct);
            break;

        case '7d':
            leftDelayNode.delayTime.setValueAtTime(w * 0.0005, ct);
            rightDelayNode.delayTime.setValueAtTime(w * 0.0012, ct);
            leftGainNode.gain.setValueAtTime(1.2, ct);
            rightGainNode.gain.setValueAtTime(1.2, ct);
            crossFeedL.gain.setValueAtTime(w * 0.28, ct);
            crossFeedR.gain.setValueAtTime(w * 0.28, ct);
            break;

        default:
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

    autoPanNode = audioContext.createStereoPanner();
    autoPanNode.pan.value = 0;

    autoPanLFO = audioContext.createOscillator();
    autoPanLFO.type = 'sine';
    autoPanLFO.frequency.value = 0.5;

    autoPanLFOGain = audioContext.createGain();
    autoPanLFOGain.gain.value = 0.9;

    autoPanLFO.connect(autoPanLFOGain);
    autoPanLFOGain.connect(autoPanNode.pan);
    autoPanLFO.start();
}

function updateAutoPanSpeed(speed) {
    if (!autoPanLFO || !audioContext) return;

    const frequencies = {
        'slow': 0.25,
        'medium': 0.5,
        'fast': 1.0
    };

    const freq = frequencies[speed] || 0.5;
    autoPanLFO.frequency.setValueAtTime(freq, audioContext.currentTime);
    autoPanSpeed = speed;
}

// ===================== AUDIO CHAIN =====================
function buildAudioChain() {
    if (!audioContext || !sourceNode) return;

    // Disconnect all
    try { sourceNode.disconnect(); } catch (e) { }
    try { preampGainNode?.disconnect(); } catch (e) { }
    try { gainNode.disconnect(); } catch (e) { }
    eqFilters.forEach(f => { try { f.disconnect(); } catch (e) { } });
    try { autoPanNode?.disconnect(); } catch (e) { }
    try { splitterNode?.disconnect(); } catch (e) { }
    try { leftDelayNode?.disconnect(); } catch (e) { }
    try { rightDelayNode?.disconnect(); } catch (e) { }
    try { leftGainNode?.disconnect(); } catch (e) { }
    try { rightGainNode?.disconnect(); } catch (e) { }
    try { crossFeedL?.disconnect(); } catch (e) { }
    try { crossFeedR?.disconnect(); } catch (e) { }
    try { mergerNode?.disconnect(); } catch (e) { }
    try { reverbOutputMerge?.disconnect(); } catch (e) { }
    try { bassOutputMerge?.disconnect(); } catch (e) { }
    try { stereoPannerNode?.disconnect(); } catch (e) { }
    try { compressorNode?.disconnect(); } catch (e) { }
    try { limiterNode?.disconnect(); } catch (e) { }
    try { analyserNode?.disconnect(); } catch (e) { }

    if (abCompareActive) {
        // Direct Bypass Mode for A/B comparison
        sourceNode.connect(limiterNode);
        limiterNode.connect(analyserNode);
        limiterNode.connect(audioContext.destination);
        console.log('[Audio EQ Pro v3.0] A/B Compare BYPASS active');
        return;
    }

    // Normal Chain:
    // Source -> Preamp -> Gain -> EQ -> [BassEnhancer] -> [AutoPan] -> [Spatial] -> [Reverb] -> [Panner] -> [Compressor] -> Limiter -> Analyser + Output
    let currentNode = sourceNode;

    // 1. Preamp Headroom Gain
    if (preampGainNode) {
        currentNode.connect(preampGainNode);
        currentNode = preampGainNode;
    }

    // 2. Master Gain
    currentNode.connect(gainNode);
    currentNode = gainNode;

    // 3. 10-Band Graphic & Parametric EQ
    for (const filter of eqFilters) {
        currentNode.connect(filter);
        currentNode = filter;
    }

    // 4. Bass Enhancer
    if (bassEnhancerEnabled && bassInputSplit && bassOutputMerge) {
        currentNode.connect(bassInputSplit);
        currentNode = bassOutputMerge;
    }

    // 5. Auto-Pan (7D)
    if (autoPanEnabled && autoPanNode) {
        currentNode.connect(autoPanNode);
        currentNode = autoPanNode;
    }

    // 6. Spatial Audio
    if (spatialEnabled && splitterNode && mergerNode) {
        connectSpatialInternal();
        currentNode.connect(splitterNode);
        currentNode = mergerNode;
        updateSpatialEffect(spatialMode, spatialWidth);
    }

    // 7. Studio Reverb
    if (reverbEnabled && reverbInputSplit && reverbOutputMerge) {
        currentNode.connect(reverbInputSplit);
        currentNode = reverbOutputMerge;
    }

    // 8. Master Stereo Panner
    if (stereoPannerNode) {
        currentNode.connect(stereoPannerNode);
        currentNode = stereoPannerNode;
    }

    // 9. Compressor (if limiter enabled)
    if (currentEffects.limiter.enabled && compressorNode) {
        currentNode.connect(compressorNode);
        currentNode = compressorNode;
    }

    // 10. Brick wall safety limiter
    currentNode.connect(limiterNode);
    currentNode = limiterNode;

    // 11. Analyser & Output
    limiterNode.connect(analyserNode);
    currentNode.connect(audioContext.destination);

    console.log('[Audio EQ Pro v3.0] Audio graph constructed');
}

// ===================== STOP PROCESSING =====================
async function stopAudioProcessing(sendMessage = true) {
    try {
        if (autoPanLFO) {
            try { autoPanLFO.stop(); } catch (e) { }
        }

        const allNodes = [
            sourceNode, preampGainNode, gainNode, compressorNode, limiterNode, analyserNode,
            splitterNode, mergerNode, leftDelayNode, rightDelayNode,
            leftGainNode, rightGainNode, crossFeedL, crossFeedR,
            autoPanNode, autoPanLFO, autoPanLFOGain,
            convolverNode, reverbDryGain, reverbWetGain, reverbInputSplit, reverbOutputMerge,
            bassFilterNode, bassShaperNode, bassGainNode, bassInputSplit, bassOutputMerge,
            stereoPannerNode
        ];

        allNodes.forEach(node => {
            if (node) try { node.disconnect(); } catch (e) { }
        });

        eqFilters.forEach(f => { try { f.disconnect(); } catch (e) { } });
        eqFilters = [];
        preampGainNode = stereoPannerNode = null;

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        if (audioContext && audioContext.state !== 'closed') {
            await audioContext.close();
            audioContext = null;
        }

        if (autoClassifier) {
            autoClassifier.stop();
            autoClassifier = null;
        }

        const tabId = currentTabId;
        currentTabId = null;

        if (sendMessage) {
            chrome.runtime.sendMessage({ type: 'AUDIO_STOPPED', tabId: tabId });
        }

    } catch (error) {
        console.error('[Audio EQ Pro v3.0] Error stopping audio:', error);
    }
}

// ===================== APPLY SETTINGS =====================
function applySettings(settings) {
    if (!audioContext || audioContext.state === 'closed') return;
    if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
    }

    const ct = audioContext.currentTime;
    const ramp = 0.04;

    // Preamp Headroom Gain (-12dB to +12dB)
    if (preampGainNode && settings.preamp !== undefined) {
        const linearPreamp = Math.pow(10, settings.preamp / 20);
        preampGainNode.gain.cancelScheduledValues(ct);
        preampGainNode.gain.setValueAtTime(preampGainNode.gain.value, ct);
        preampGainNode.gain.linearRampToValueAtTime(linearPreamp, ct + ramp);
    }

    // Master Stereo Balance (Pan: -1.0 to +1.0)
    if (stereoPannerNode && settings.pan !== undefined) {
        stereoPannerNode.pan.cancelScheduledValues(ct);
        stereoPannerNode.pan.setValueAtTime(stereoPannerNode.pan.value, ct);
        stereoPannerNode.pan.linearRampToValueAtTime(settings.pan, ct + ramp);
    }

    // Volume (0-100%, with optional Boost multiplier)
    if (gainNode && settings.volume !== undefined) {
        let gainValue = Math.min(100, Math.max(0, settings.volume)) / 100;
        if (settings.boostEnabled) {
            const multiplier = settings.boostMultiplier || 2.0;
            gainValue *= multiplier;
        }
        gainNode.gain.cancelScheduledValues(ct);
        gainNode.gain.setValueAtTime(gainNode.gain.value, ct);
        gainNode.gain.linearRampToValueAtTime(gainValue, ct + ramp);
    }

    // Master Mono Summing (true mono downmix via Web Audio standard channelCountMode)
    if (gainNode && settings.mono !== undefined) {
        try {
            gainNode.channelCount = settings.mono ? 1 : 2;
            gainNode.channelCountMode = 'explicit';
        } catch (e) {
            console.warn('[Audio EQ Pro v3.0] Error toggling mono mode:', e);
        }
    }

    // 10 EQ bands with parametric params (Q, filter type, bypass)
    if (settings.bands) {
        EQ_BAND_KEYS.forEach((key, index) => {
            if (eqFilters[index]) {
                const filter = eqFilters[index];
                const params = settings.bandParams?.[key] || {};

                // Custom Q / Bandwidth
                if (params.Q !== undefined) {
                    filter.Q.setValueAtTime(params.Q, ct);
                }

                // Custom filter type
                if (params.type && filter.type !== params.type) {
                    try { filter.type = params.type; } catch (e) { }
                }

                // Custom freq if fine-tuned
                if (params.freq !== undefined) {
                    filter.frequency.setValueAtTime(params.freq, ct);
                }

                // Target gain (0 if bypassed)
                const targetGain = params.bypass ? 0 : (settings.bands[key] ?? 0);
                filter.gain.cancelScheduledValues(ct);
                filter.gain.setValueAtTime(filter.gain.value, ct);
                filter.gain.linearRampToValueAtTime(targetGain, ct + ramp);
            }
        });
    }

    // Effects
    if (settings.effects) {
        applyEffects(settings.effects);
    }
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

        if (effects.spatial.mode !== undefined || effects.spatial.width !== undefined) {
            updateSpatialEffect(
                effects.spatial.mode ?? spatialMode,
                effects.spatial.width ?? spatialWidth
            );
        }

        if (spatialEnabled !== wasEnabled) {
            needsRebuild = true;
        }
    }

    // Auto-Pan
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
        }
    }

    // Studio Reverb
    if (effects.reverb) {
        const wasEnabled = reverbEnabled;

        if (effects.reverb.enabled !== undefined) {
            reverbEnabled = effects.reverb.enabled;
        }

        if (effects.reverb.type && effects.reverb.type !== reverbType) {
            updateReverbType(effects.reverb.type);
        }

        if (effects.reverb.mix !== undefined) {
            updateReverbMix(effects.reverb.mix);
        }

        if (reverbEnabled !== wasEnabled) {
            needsRebuild = true;
        }
    }

    // Bass Enhancer
    if (effects.bassEnhancer) {
        const wasEnabled = bassEnhancerEnabled;

        if (effects.bassEnhancer.enabled !== undefined) {
            bassEnhancerEnabled = effects.bassEnhancer.enabled;
        }

        updateBassEnhancer(effects.bassEnhancer.amount, effects.bassEnhancer.freq);

        if (bassEnhancerEnabled !== wasEnabled) {
            needsRebuild = true;
        }
    }

    // Cache
    currentEffects = {
        ...currentEffects,
        ...effects,
        spatial: { ...currentEffects.spatial, ...effects.spatial },
        autoPan: { ...currentEffects.autoPan, ...effects.autoPan },
        reverb: { ...currentEffects.reverb, ...effects.reverb },
        bassEnhancer: { ...currentEffects.bassEnhancer, ...effects.bassEnhancer }
    };

    if (needsRebuild) {
        buildAudioChain();
    }
}

// ===================== AI HYBRID AUTO-EQ DISPATCHER =====================
function handleAiGenreDetected({ genre, profile, confidence, metaMatched }) {
    if (!audioContext || audioContext.state === 'closed') return;
    const ct = audioContext.currentTime;
    const ramp = 0.50; // Smooth 500ms musical crossfade transition

    // 1. Smoothly ramp 10 parametric EQ filters to target acoustic curve
    if (profile && profile.bands) {
        EQ_BAND_KEYS.forEach((key, index) => {
            if (eqFilters[index]) {
                const targetGain = profile.bands[key] ?? 0;
                eqFilters[index].gain.cancelScheduledValues(ct);
                eqFilters[index].gain.setValueAtTime(eqFilters[index].gain.value, ct);
                eqFilters[index].gain.linearRampToValueAtTime(targetGain, ct + ramp);
            }
        });
    }

    // 2. Apply genre DSP effects if specified
    if (profile && profile.effects) {
        applyEffects(profile.effects);
    }

    // 3. Broadcast real-time event to open popup & background
    try {
        chrome.runtime.sendMessage({
            type: 'AI_GENRE_DETECTED',
            genre,
            profile,
            confidence,
            metaMatched
        }).catch(() => {});
    } catch (e) {}

    // 4. Persist current detected genre in storage
    try {
        chrome.storage.local.set({ [STORAGE_KEYS.AI_CURRENT_GENRE]: genre });
    } catch (e) {}
}

// ===================== MESSAGE HANDLING =====================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    switch (message.type) {
        case 'INIT_AUDIO_CONTEXT':
            initAudioContext(message.streamId, message.tabId, message.title || '')
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

        case 'TOGGLE_AB_COMPARE':
            abCompareActive = !abCompareActive;
            buildAudioChain();
            sendResponse({ success: true, abActive: abCompareActive });
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

        case 'SET_AI_AUTO_EQ': {
            const enabled = !!message.enabled;
            try {
                chrome.storage.local.set({ [STORAGE_KEYS.AI_AUTO_EQ]: enabled });
            } catch (e) {}
            if (autoClassifier) {
                if (enabled) autoClassifier.start();
                else autoClassifier.stop();
            }
            sendResponse({ success: true, enabled });
            break;
        }

        case 'UPDATE_TAB_TITLE': {
            if (autoClassifier && message.title) {
                autoClassifier.setTabTitle(message.title);
            }
            sendResponse({ success: true });
            break;
        }

        case 'GET_AI_STATUS': {
            sendResponse({
                success: true,
                enabled: autoClassifier ? autoClassifier.enabled : false,
                currentGenre: autoClassifier ? autoClassifier.currentGenre : null,
                profile: (autoClassifier && autoClassifier.currentGenre) ? AI_GENRE_PROFILES[autoClassifier.currentGenre] : null
            });
            break;
        }

        default:
            sendResponse({ success: false, error: 'Unknown message type' });
    }

    return false;
});

window.addEventListener('beforeunload', () => {
    stopAudioProcessing();
});

console.log('Offscreen audio processor v3.0 loaded');
