/**
 * Zyno Audio Pro - Hybrid Auto-Genre Classifier (Metadata Context + Calibrated Audio DSP)
 * 
 * Combines real-time Web Audio FFT spectral energy distribution (logarithmic octave bands)
 * and true time-domain RMS intensity with tab title metadata context.
 * Accurately detects:
 * - Drill / 808 Trap
 * - EDM / Vinahouse Remix
 * - Super Bass Boosted
 * - K-Pop & V-Pop (Vocal Clarity)
 * - Acoustic & Ballad
 * - Rock & Heavy Metal
 * - Cinema & Podcast
 */

import { AI_GENRE_PROFILES, AI_GENRE_KEYWORDS } from '../constant.js';

export class AutoGenreClassifier {
    constructor(analyserNode, audioContext, onGenreChanged) {
        this.analyser = analyserNode;
        this.audioCtx = audioContext;
        this.onGenreChanged = onGenreChanged;
        
        this.enabled = false;
        this.currentGenre = null;
        this.currentTabTitle = '';
        this.intervalId = null;
        this.evalHistory = [];
        this.lastMetaMatched = false;
        this.silenceTicks = 0;
        
        // Track-Level Genre Lock & Temporal Filtering
        // Solves audio parameter hunting/flapping across song sections (verse vs drop)
        this.isLocked = false;
        this.emaScores = {};
        this.samplingTicks = 0;
        this.hysteresisCounter = 0;
        
        // High-resolution FFT buffer (1024 bins from fftSize=2048)
        if (this.analyser && this.analyser.fftSize < 2048) {
            this.analyser.fftSize = 2048;
        }
        const binCount = this.analyser ? this.analyser.frequencyBinCount : 1024;
        this.fftBuffer = new Uint8Array(binCount);
        this.timeBuffer = new Uint8Array(binCount);
    }

    start() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.enabled = true;
        this.currentGenre = null;
        this.isLocked = false;
        this.samplingTicks = 0;
        this.hysteresisCounter = 0;
        this.silenceTicks = 0;
        this.emaScores = {};
        this.evalHistory = [];
        // Reactive evaluation every 250ms
        this.intervalId = setInterval(() => this.evaluate(), 250);
        setTimeout(() => this.evaluate(true), 40);
        console.log('[AI Auto-EQ] Hybrid Genre Classifier started (250ms interval with Track-Lock)');
    }

    stop() {
        this.enabled = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.evalHistory = [];
        this.currentGenre = null;
        this.isLocked = false;
        this.emaScores = {};
        this.samplingTicks = 0;
        this.hysteresisCounter = 0;
        this.silenceTicks = 0;
        console.log('[AI Auto-EQ] Hybrid Genre Classifier stopped');
    }

    setTabTitle(title) {
        if (typeof title === 'string' && title.trim()) {
            const cleaned = this.cleanTitle(title);
            if (cleaned && cleaned !== this.currentTabTitle) {
                this.currentTabTitle = cleaned;
                // Track changed: Unlock to analyze and lock into the new track's primary genre!
                this.isLocked = false;
                this.samplingTicks = 0;
                this.hysteresisCounter = 0;
                this.emaScores = {};
                this.evalHistory = [];
                console.log('[AI Auto-EQ] New track detected, unlocking for fresh evaluation:', cleaned);
                if (this.enabled) {
                    setTimeout(() => this.evaluate(true), 40);
                }
            }
        }
    }

    cleanTitle(title) {
        if (!title) return '';
        return title
            .replace(/^[\s\u25B6\u25B8\u25BA\u25C0\u25C4\u25A0\u23F5\u23F8\u23F9\u275A\u275B\u2502\u2503|►▶▷❚⏸🔊🔈♬🎵\-\s]+/g, '')
            .replace(/^\s*[\(\[]\d+\+?[\)\]]\s*/g, '')
            .replace(/^[\s\u25B6\u25B8\u25BA\u25C0\u25C4\u25A0\u23F5\u23F8\u23F9\u275A\u275B\u2502\u2503|►▶▷❚⏸🔊🔈♬🎵\-\s]+/g, '')
            .replace(/\s*[-|–—]\s*(YouTube(?:\s*Music)?|Spotify|SoundCloud|Zing\s*MP3|Nhaccuatui|Apple\s*Music|Tidal)\s*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    evaluate(force = false) {
        if (!this.enabled || !this.analyser || !this.audioCtx) {
            return;
        }

        // Auto-resume suspended audio context so classifier never gets stuck
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }
        if (this.audioCtx.state !== 'running') {
            return;
        }

        // 1. Extract physical time-domain & frequency spectral features
        this.analyser.getByteTimeDomainData(this.timeBuffer);
        this.analyser.getByteFrequencyData(this.fftBuffer);
        const f = this.extractAcousticFeatures(this.fftBuffer, this.timeBuffer);

        // Accurate Silence & Low-Level Paused Detection
        // If RMS volume is below threshold or total spectral energy is near zero:
        if (f.rms < 0.008 || f.totalBandEnergy < 0.005) {
            this.silenceTicks++;
            // When silence occurs for ~1.5s between tracks, unlock so next track is evaluated fresh!
            if (this.silenceTicks >= 6) {
                this.isLocked = false;
                this.samplingTicks = 0;
                this.emaScores = {};
            }
            return;
        }
        this.silenceTicks = 0;

        // 2. Score based on Audio FFT Acoustic Dynamics
        const fftScores = this.scoreFft(f);

        // 3. Score based on Tab Title Metadata Context (with strict word boundaries)
        const metaScores = this.scoreMetadata(this.currentTabTitle);

        // 4. Hybrid Fusion with Exponential Moving Average (EMA)
        // Integrates spectral energy over time to eliminate momentary verse vs drop flapping!
        const allGenres = Object.keys(AI_GENRE_PROFILES);
        const hasMetaMatch = Object.values(metaScores).some(s => s > 0);

        for (const genre of allGenres) {
            const metaS = metaScores[genre] || 0;
            const fftS = fftScores[genre] || 0;

            let combined;
            if (hasMetaMatch) {
                if (metaS > 0) {
                    // Title matched strong keywords, verified by audio acoustics
                    combined = (0.76 * metaS) + (0.24 * fftS);
                } else {
                    // Penalty when another genre matched the metadata context
                    combined = fftS * 0.25;
                }
            } else {
                // Fallback purely to FFT acoustic profile when metadata has no keyword
                combined = Math.min(0.85, fftS);
            }

            // Exponential Moving Average integration (smoothing out momentary verse/drop fluctuations)
            if (this.emaScores[genre] === undefined) {
                this.emaScores[genre] = combined;
            } else {
                this.emaScores[genre] = this.emaScores[genre] * 0.82 + combined * 0.18;
            }
        }

        // Find winning candidate genre from smoothed EMA
        let bestGenre = 'kpop_vpop';
        let highestConfidence = -1;
        for (const genre of allGenres) {
            const s = this.emaScores[genre];
            if (s > highestConfidence) {
                highestConfidence = s;
                bestGenre = genre;
            }
        }

        const metaMatched = Boolean(metaScores[bestGenre] > 0);

        // =========================================================================
        // CASE A: TRACK NOT YET LOCKED (Acquisition phase: first 0.8 - 1.2s of song)
        // =========================================================================
        if (!this.isLocked) {
            this.samplingTicks++;

            // Lock condition: Fast acquisition (<750ms) or immediate on force
            const canLock = force || (hasMetaMatch ? (metaMatched || this.samplingTicks >= 2) : (this.samplingTicks >= 3));

            if (canLock && highestConfidence >= 0.20) {
                this.currentGenre = bestGenre;
                this.isLocked = true; // LOCK THIS TRACK! Prevents flapping across verses/drops!
                this.lastMetaMatched = metaMatched;
                const profile = AI_GENRE_PROFILES[bestGenre];

                console.log(`[AI Auto-EQ] Track Locked on: ${profile.name} (Confidence: ${(highestConfidence * 100).toFixed(0)}%, Meta: ${metaMatched})`);

                if (this.enabled && typeof this.onGenreChanged === 'function') {
                    this.onGenreChanged({
                        genre: bestGenre,
                        profile,
                        confidence: highestConfidence,
                        metaMatched
                    });
                }
            }
            return;
        }

        // =========================================================================
        // CASE B: TRACK IS ALREADY LOCKED (Stable listening mode)
        // =========================================================================
        // The EQ is rock-solid and NEVER changes during normal song progression.
        // For long continuous DJ sets / nonstop mixes, require a massive persistent shift (5 seconds straight):
        const currentScore = this.emaScores[this.currentGenre] || 0;
        const scoreDifference = highestConfidence - currentScore;

        if (bestGenre !== this.currentGenre && scoreDifference >= 0.38) {
            this.hysteresisCounter++;
            if (this.hysteresisCounter >= 20) { // ~5.0 seconds of sustained dominance
                console.log(`[AI Auto-EQ] Long mix transition detected: switching from ${this.currentGenre} to ${bestGenre}`);
                this.currentGenre = bestGenre;
                this.hysteresisCounter = 0;
                this.lastMetaMatched = metaMatched;
                const profile = AI_GENRE_PROFILES[bestGenre];

                if (this.enabled && typeof this.onGenreChanged === 'function') {
                    this.onGenreChanged({
                        genre: bestGenre,
                        profile,
                        confidence: highestConfidence,
                        metaMatched
                    });
                }
            }
        } else {
            this.hysteresisCounter = Math.max(0, this.hysteresisCounter - 1);
        }
    }

    /**
     * Acoustic Feature Extraction with True RMS & Calibrated Octave Band Energy
     * 6 Psychoacoustic Bands:
     * - Sub-Bass: 20 - 65 Hz (808 sub-bass, rumble)
     * - Bass: 65 - 250 Hz (Kick drum punch, bass guitar)
     * - Low-Mid: 250 - 600 Hz (Warmth, acoustic guitar body, piano fundamentals)
     * - Mid: 600 - 2500 Hz (Lead vocals core, dialogue intelligibility)
     * - Presence: 2500 - 6500 Hz (Vocal breath/air, snare attack, guitar bite)
     * - Treble: 6500 - 16000 Hz (Hi-hats, cymbals, air, sizzle)
     */
    extractAcousticFeatures(byteBuffer, timeBuffer) {
        const binCount = byteBuffer.length;
        const sampleRate = (this.audioCtx && this.audioCtx.sampleRate) ? this.audioCtx.sampleRate : 48000;
        const binWidth = sampleRate / (binCount * 2);

        // 1. Time-Domain RMS Audio Intensity & Crest Factor (Peak-to-RMS)
        let sumSq = 0;
        let peakAmp = 0;
        const tLen = timeBuffer.length;
        for (let i = 0; i < tLen; i++) {
            const s = (timeBuffer[i] - 128) / 128.0;
            sumSq += s * s;
            const abs = Math.abs(s);
            if (abs > peakAmp) peakAmp = abs;
        }
        const rms = Math.sqrt(sumSq / tLen);
        const crestFactor = rms > 0.002 ? (peakAmp / rms) : 1.0;

        // 2. Frequency Bands with Psychoacoustic Equal-Loudness Weighting
        const bands = [
            { name: 'subBass', min: 20, max: 65, center: 45, tilt: 1.0 },
            { name: 'bass', min: 65, max: 250, center: 150, tilt: 1.0 },
            { name: 'lowMid', min: 250, max: 600, center: 400, tilt: 1.05 },
            { name: 'mid', min: 600, max: 2500, center: 1400, tilt: 1.15 },
            { name: 'presence', min: 2500, max: 6500, center: 4000, tilt: 1.30 },
            { name: 'treble', min: 6500, max: 16000, center: 10000, tilt: 1.50 }
        ];

        const bandEnergies = {};
        let totalBandEnergy = 0;
        let weightedFreq = 0;

        for (const b of bands) {
            let maxVal = 0;
            let sumVal = 0;
            let count = 0;

            for (let i = 0; i < binCount; i++) {
                const freq = i * binWidth;
                if (freq >= b.min && freq < b.max) {
                    const val = byteBuffer[i];
                    if (val > maxVal) maxVal = val;
                    sumVal += val;
                    count++;
                }
            }

            const avg = count > 0 ? (sumVal / count) : 0;
            // Blended peak & average metric: preserves transient punch while measuring sustained energy
            const blend = avg * 0.40 + maxVal * 0.60;
            // Subtract noise floor (~10), clamp and apply logarithmic tilt
            const norm = Math.max(0, (blend - 10) / 245);
            const energy = Math.pow(norm * b.tilt, 1.4);
            bandEnergies[b.name] = energy;
            totalBandEnergy += energy;
            weightedFreq += b.center * energy;
        }

        const safeTotal = Math.max(1e-6, totalBandEnergy);
        const ratios = {};
        for (const b of bands) {
            ratios[b.name] = bandEnergies[b.name] / safeTotal;
        }

        return {
            rms,
            crest: crestFactor,
            totalBandEnergy,
            centroid: totalBandEnergy > 1e-6 ? (weightedFreq / totalBandEnergy) : 1000,
            ...ratios
        };
    }

    /**
     * Acoustic Heuristic Classifier based on Balanced Spectral Dynamics
     */
    scoreFft(f) {
        const scores = {
            drill: 0.15,
            edm_remix: 0.15,
            bass_boost: 0.10,
            kpop_vpop: 0.20,
            acoustic_ballad: 0.15,
            rock_metal: 0.15,
            cinema_podcast: 0.10
        };

        const lowEnd = f.subBass + f.bass;
        const vocalMid = f.lowMid + f.mid;
        const highEnd = f.presence + f.treble;

        // 1. Cinema / Podcast: Pure speech vocal band dominance, minimal sub-bass (< 6%)
        if (f.subBass < 0.06 && f.mid > 0.30 && f.treble < 0.10) {
            scores.cinema_podcast += 0.65;
            if (f.vocalMid > 0.65) scores.cinema_podcast += 0.15;
        }

        // 2. Super Bass Boosted: Heavy low-end > 52% of total energy, sub-bass high
        if (lowEnd > 0.52 && highEnd < 0.20) {
            scores.bass_boost += 0.60;
            if (f.subBass > 0.25) scores.bass_boost += 0.20;
        }

        // 3. Drill / 808 Trap: Distinct Sub-Bass dominance (> 25%) exceeding regular bass + scooped low-mids
        if (f.subBass > 0.24 && f.subBass >= f.bass * 1.10) {
            scores.drill += 0.50;
            if (f.lowMid < 0.14) scores.drill += 0.20;
            if (highEnd > 0.14) scores.drill += 0.15;
        }

        // 4. EDM / Vinahouse: Huge bass punch (70-250Hz > 20%) + bright presence/treble + high crest factor
        if (f.bass >= 0.20 && highEnd > 0.24) {
            scores.edm_remix += 0.45;
            if (f.crest > 3.0) scores.edm_remix += 0.20;
            if (lowEnd > 0.38) scores.edm_remix += 0.15;
        }

        // 5. Acoustic / Ballad: Warm low-mids + vocals, low sub-bass (< 12%), smooth dynamics
        if (f.lowMid > 0.20 && vocalMid > 0.45 && f.subBass < 0.12) {
            scores.acoustic_ballad += 0.55;
            if (f.crest < 3.0) scores.acoustic_ballad += 0.20;
        }

        // 6. Rock & Heavy Metal: Aggressive distorted mids & presence, solid rhythm section
        if (f.presence >= 0.20 && (f.mid + f.presence) >= 0.40 && f.bass > 0.12) {
            scores.rock_metal += 0.50;
            if (f.centroid > 1200) scores.rock_metal += 0.15;
        }

        // 7. K-Pop / V-Pop: Vocal dominance (600-2500Hz) + crisp presence + modern balance
        if (f.mid >= 0.20 && f.presence >= 0.18 && lowEnd > 0.20) {
            scores.kpop_vpop += 0.45;
            if (f.centroid >= 1000 && f.centroid <= 3500) scores.kpop_vpop += 0.15;
        }

        return scores;
    }

    /**
     * NLP Metadata Context Extraction from Title using Strict Word Boundaries
     */
    scoreMetadata(title) {
        const scores = {};
        if (!title) return scores;

        const normalized = ' ' + this.normalizeText(title) + ' ';

        for (const [genre, keywords] of Object.entries(AI_GENRE_KEYWORDS)) {
            for (const kw of keywords) {
                const normKw = this.normalizeText(kw);
                if (!normKw) continue;
                // Strict regex word boundaries: matches standalone word/phrase only!
                const regex = new RegExp(`(?:^|\\s)${this.escapeRegex(normKw)}(?:\\s|$)`, 'i');
                if (regex.test(normalized)) {
                    scores[genre] = (scores[genre] || 0) + 0.90;
                    break; // Strong match found for this genre
                }
            }
            if (scores[genre]) {
                scores[genre] = Math.min(1.0, scores[genre]);
            }
        }

        return scores;
    }

    normalizeText(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese diacritics
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    escapeRegex(str) {
        return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }
}
