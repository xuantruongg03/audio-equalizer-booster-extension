// Audio Visualizer Module v3.0 Pro
// Realtime Logarithmic Spectrum Analyzer, Peak Level Meter, Liquid Oscilloscope & Circular Visualizer

/**
 * Visualizer modes
 */
export const VISUALIZER_MODES = {
    'off': { name: 'Tắt', icon: '❌' },
    'bars': { name: 'Bars', icon: '📊' },
    'spectrum': { name: 'Spectrum', icon: '📈' },
    'wave': { name: 'Wave', icon: '🌊' },
    'circle': { name: 'Circle', icon: '⭕' }
};

/**
 * Create visualizer canvas with logarithmic auditory scaling and physics-based peak hold
 */
export function createVisualizer(options = {}) {
    const {
        width = 446,
        height = 52,
        mode = 'bars',
        barCount = 30
    } = options;

    const container = document.createElement('div');
    container.className = 'visualizer-container';
    container.innerHTML = `
        <div class="visualizer-header">
            <span class="visualizer-title">🎵 Studio Visualizer</span>
            <div class="visualizer-modes">
                ${Object.entries(VISUALIZER_MODES).map(([key, m]) => `
                    <button class="viz-mode-btn ${key === mode ? 'active' : ''}" 
                            data-mode="${key}" title="${m.name}">
                        ${m.icon}
                    </button>
                `).join('')}
            </div>
        </div>
        <div class="visualizer-canvas-wrap">
            <canvas class="visualizer-canvas" width="${width}" height="${height}"></canvas>
            <div class="visualizer-idle">
                <span>🔇 Đang chờ tín hiệu âm thanh...</span>
            </div>
        </div>
        <!-- Frequency Scale Markers (Matched to 10-Band EQ) -->
        <div class="visualizer-freq-labels">
            <span>32Hz</span>
            <span>64</span>
            <span>125</span>
            <span>250</span>
            <span>500</span>
            <span>1k</span>
            <span>2k</span>
            <span>4k</span>
            <span>8k</span>
            <span>16k</span>
        </div>
        <!-- Master Peak Level Meter -->
        <div class="peak-meter-wrap" id="peakMeterWrap">
            <div class="peak-meter-bar">
                <div class="peak-level-fill" id="peakLevelFill"></div>
                <div class="peak-hold-line" id="peakHoldLine"></div>
            </div>
        </div>
    `;

    const canvas = container.querySelector('.visualizer-canvas');
    const ctx = canvas.getContext('2d');
    const idleOverlay = container.querySelector('.visualizer-idle');
    const peakFill = container.querySelector('#peakLevelFill');
    const peakHold = container.querySelector('#peakHoldLine');

    let currentMode = mode;
    let dataArray = new Uint8Array(1024);
    let timeDomainArray = null;
    let hasAudioData = false;
    let silenceCount = 0;
    const SILENCE_THRESHOLD = 15;

    // Physics state for bars & peak caps
    const barHeights = new Float32Array(barCount);
    const peakHeights = new Float32Array(barCount);
    const peakHolds = new Uint8Array(barCount);
    const peakVelocities = new Float32Array(barCount);

    // Master Peak Meter state
    let peakValue = 0;
    let peakHoldValue = 0;
    let peakHoldDecay = 0;

    // Mode buttons
    container.querySelectorAll('.viz-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            if (currentMode === 'off') {
                clearCanvas();
                showIdle();
                updatePeakMeter(0);
            }
        });
    });

    function showIdle() {
        idleOverlay.style.display = 'flex';
        canvas.style.opacity = '0.25';
        updatePeakMeter(0);
    }

    function hideIdle() {
        idleOverlay.style.display = 'none';
        canvas.style.opacity = '1';
    }

    function clearCanvas() {
        ctx.fillStyle = 'rgba(4, 9, 22, 0.95)';
        ctx.fillRect(0, 0, width, height);
    }

    function updatePeakMeter(currentMax) {
        // Natural logarithmic perceptual compression for the master peak meter
        const norm = Math.max(0, (currentMax - 20) / 225);
        const target = Math.min(100, Math.pow(norm, 1.25) * 100);
        peakValue = peakValue * 0.45 + target * 0.55;

        if (peakValue > peakHoldValue) {
            peakHoldValue = peakValue;
            peakHoldDecay = 0;
        } else {
            peakHoldDecay++;
            if (peakHoldDecay > 12) {
                peakHoldValue = Math.max(0, peakHoldValue - 2.2);
            }
        }

        const pct = Math.min(100, peakValue);
        const holdPct = Math.min(100, peakHoldValue);

        if (peakFill) peakFill.style.width = `${pct.toFixed(1)}%`;
        if (peakHold) peakHold.style.left = `${holdPct.toFixed(1)}%`;
    }

    function hasSignificantAudio() {
        let sum = 0;
        let maxVal = 0;
        const len = dataArray.length;
        for (let i = 0; i < len; i++) {
            const v = dataArray[i];
            sum += v;
            if (v > maxVal) maxVal = v;
        }
        updatePeakMeter(maxVal);
        return (sum / len) > 1.8;
    }

    /**
     * Map bar index logarithmically across human auditory range (28 Hz to 14,500 Hz)
     * avoiding linear dead zones where web audio encoders have steep rolloff.
     */
    function getLogBins(index, totalBars, binCount, sampleRate = 48000) {
        const minFreq = 28;
        const maxFreq = 14500;
        const binWidth = sampleRate / (binCount * 2);
        const f1 = minFreq * Math.pow(maxFreq / minFreq, index / totalBars);
        const f2 = minFreq * Math.pow(maxFreq / minFreq, (index + 1) / totalBars);
        const startBin = Math.max(1, Math.floor(f1 / binWidth));
        const endBin = Math.max(startBin + 1, Math.min(binCount - 1, Math.ceil(f2 / binWidth)));
        return { startBin, endBin };
    }

    // ===================== 1. LOGARITHMIC SPECTRUM BARS =====================
    function drawBars() {
        ctx.fillStyle = 'rgba(4, 9, 22, 0.55)';
        ctx.fillRect(0, 0, width, height);

        // Faint horizontal reference lines (-12dB, -24dB)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.36);
        ctx.lineTo(width, height * 0.36);
        ctx.moveTo(0, height * 0.68);
        ctx.lineTo(width, height * 0.68);
        ctx.stroke();

        const totalWidth = width;
        const step = totalWidth / barCount;
        const barWidth = Math.max(3, step - 3.6);
        const binCount = dataArray.length;

        for (let i = 0; i < barCount; i++) {
            const { startBin, endBin } = getLogBins(i, barCount, binCount);

            let sum = 0;
            let maxInBand = 0;
            for (let b = startBin; b < endBin && b < binCount; b++) {
                const val = dataArray[b];
                sum += val;
                if (val > maxInBand) maxInBand = val;
            }
            const count = Math.max(1, endBin - startBin);
            const avg = sum / count;

            const highFactor = i / (barCount - 1);
            // Blend: stable body from avg, transient attack from max (giving lively punch to hi-hats/cymbals)
            const blend = avg * (0.60 - highFactor * 0.15) + maxInBand * (0.40 + highFactor * 0.35);

            // Perceptual dynamic scaling with headroom (prevents ceiling clipping & avoids dead treble)
            const norm = Math.max(0, (blend - 8) / 236);
            const tilt = 1.0 + Math.pow(highFactor, 0.8) * 0.60; // progressive treble compensation
            const tilted = Math.min(1.0, norm * tilt);
            const curved = Math.pow(tilted, 1.15);
            const targetHeight = curved * (height - 8) * 0.84; // max 84% height to leave breathing room

            // Snappy attack, smooth organic decay
            if (targetHeight > barHeights[i]) {
                barHeights[i] = barHeights[i] * 0.35 + targetHeight * 0.65;
            } else {
                barHeights[i] = Math.max(0, barHeights[i] * 0.86 - 0.7);
            }

            // Real Peak Cap Gravity & Hold Physics
            if (barHeights[i] >= peakHeights[i]) {
                peakHeights[i] = barHeights[i];
                peakHolds[i] = 8; // Hold at apex for ~200ms
                peakVelocities[i] = 0;
            } else {
                if (peakHolds[i] > 0) {
                    peakHolds[i]--;
                } else {
                    peakVelocities[i] += 0.3; // natural downward acceleration
                    peakHeights[i] = Math.max(barHeights[i], peakHeights[i] - peakVelocities[i]);
                }
            }

            const x = i * step + (step - barWidth) / 2;
            const currentH = barHeights[i];
            const y = height - currentH - 3;

            // 1. Subtle background track slot (Hardware rack look)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.roundRect(x, 4, barWidth, height - 7, [2, 2, 0, 0]);
            ctx.fill();

            // 2. Active dynamic bar with radiant cyan/cobalt gradient
            if (currentH > 1.2) {
                const grad = ctx.createLinearGradient(0, height, 0, Math.max(0, y));
                grad.addColorStop(0, '#0048f0');       // Deep Electric Cobalt
                grad.addColorStop(0.35, '#0090f0');    // Vibrant Azure
                grad.addColorStop(0.75, '#00f0dc');    // Neon Cyan
                grad.addColorStop(1.0, '#e0faff');     // Ice White Crest

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, currentH, [2.5, 2.5, 0, 0]);
                ctx.fill();
            }

            // 3. Floating glowing peak hold cap
            if (peakHeights[i] > 2) {
                const peakY = height - peakHeights[i] - 4;
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00f0dc';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.roundRect(x, Math.max(2, peakY), barWidth, 1.8, [1, 1, 1, 1]);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    // ===================== 2. LOGARITHMIC CURVE SPECTRUM =====================
    function drawSpectrum() {
        ctx.fillStyle = 'rgba(4, 9, 22, 0.55)';
        ctx.fillRect(0, 0, width, height);

        const points = 44;
        const binCount = dataArray.length;
        const spectrumValues = new Float32Array(points);

        for (let i = 0; i < points; i++) {
            const { startBin, endBin } = getLogBins(i, points, binCount);
            let sum = 0, count = 0, maxInBand = 0;
            for (let b = startBin; b < endBin && b < binCount; b++) {
                const val = dataArray[b];
                sum += val;
                if (val > maxInBand) maxInBand = val;
                count++;
            }
            const highFactor = i / (points - 1);
            const avg = count > 0 ? (sum / count) : 0;
            const blend = avg * (0.60 - highFactor * 0.15) + maxInBand * (0.40 + highFactor * 0.35);
            const norm = Math.max(0, (blend - 8) / 236);
            const tilt = 1.0 + Math.pow(highFactor, 0.8) * 0.60;
            const curved = Math.pow(Math.min(1.0, norm * tilt), 1.15);
            spectrumValues[i] = curved * (height - 8) * 0.85;
        }

        ctx.beginPath();
        ctx.moveTo(0, height);

        const sliceWidth = width / (points - 1);
        for (let i = 0; i < points; i++) {
            const hVal = spectrumValues[i];
            const y = height - hVal - 2;
            const x = i * sliceWidth;

            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                const prevX = (i - 1) * sliceWidth;
                const prevY = height - spectrumValues[i - 1] - 2;
                const cpX = (prevX + x) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
            }
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 240, 220, 0.5)');
        grad.addColorStop(0.5, 'rgba(0, 120, 240, 0.2)');
        grad.addColorStop(1, 'rgba(4, 15, 38, 0.02)');

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#00f0dc';
        ctx.shadowColor = '#00f0dc';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // ===================== 3. LIQUID OSCILLOSCOPE WAVE =====================
    function drawWave() {
        ctx.fillStyle = 'rgba(4, 9, 22, 0.55)';
        ctx.fillRect(0, 0, width, height);

        const arr = (timeDomainArray && timeDomainArray.length > 0) ? timeDomainArray : null;
        const len = arr ? arr.length : dataArray.length;
        const sliceWidth = width / (len - 1);

        ctx.beginPath();
        for (let i = 0; i < len; i++) {
            let v;
            if (arr) {
                // Real audio time-domain waveform (-1.0 to +1.0)
                v = (arr[i] - 128) / 128;
            } else {
                v = ((dataArray[i] || 0) / 255 - 0.5) * Math.sin((i / len) * Math.PI * 4);
            }

            const y = (height / 2) + (v * (height * 0.40));
            const x = i * sliceWidth;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#00f0dc';
        ctx.shadowColor = '#00f0dc';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // ===================== 4. CIRCULAR RADIAL PULSE =====================
    function drawCircle() {
        ctx.fillStyle = 'rgba(6, 12, 24, 0.3)';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 6;
        const segments = 36;
        const binCount = dataArray.length;

        for (let i = 0; i < segments; i++) {
            const { startBin, endBin } = getLogBins(i, segments, binCount);
            let sum = 0, count = 0;
            for (let b = startBin; b < endBin && b < binCount; b++) {
                sum += dataArray[b];
                count++;
            }
            const val = count > 0 ? (sum / count) : 0;
            const tilt = 1.0 + Math.pow(i / (segments - 1), 1.1) * 1.3;
            const amplitude = (Math.min(255, val * tilt) / 255) * 14;

            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
            const innerRadius = radius - 2;
            const outerRadius = radius + amplitude;

            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;

            const hue = 185 + (val / 255) * 65;
            ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`;
            ctx.lineWidth = 2.4;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    function render() {
        if (currentMode === 'off') return;
        switch (currentMode) {
            case 'bars':
                drawBars();
                break;
            case 'spectrum':
                drawSpectrum();
                break;
            case 'wave':
                drawWave();
                break;
            case 'circle':
                drawCircle();
                break;
        }
    }

    function updateData(freqData, timeData) {
        if (!freqData || freqData.length === 0) {
            silenceCount++;
            if (silenceCount > SILENCE_THRESHOLD && hasAudioData) {
                hasAudioData = false;
                showIdle();
            }
            return;
        }

        if (dataArray.length !== freqData.length) {
            dataArray = new Uint8Array(freqData.length);
        }
        dataArray.set(freqData);

        if (timeData && timeData.length > 0) {
            if (!timeDomainArray || timeDomainArray.length !== timeData.length) {
                timeDomainArray = new Uint8Array(timeData.length);
            }
            timeDomainArray.set(timeData);
        }

        if (hasSignificantAudio()) {
            silenceCount = 0;
            if (!hasAudioData) {
                hasAudioData = true;
                hideIdle();
            }
            if (currentMode !== 'off') {
                render();
            }
        } else {
            silenceCount++;
            if (silenceCount > SILENCE_THRESHOLD && hasAudioData) {
                hasAudioData = false;
                showIdle();
            }
        }
    }

    // Initialize
    clearCanvas();
    showIdle();

    container.updateData = updateData;
    container.reset = () => {
        hasAudioData = false;
        silenceCount = 0;
        barHeights.fill(0);
        peakHeights.fill(0);
        peakHolds.fill(0);
        clearCanvas();
        showIdle();
    };

    return container;
}
