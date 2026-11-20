// Audio Visualizer Module v3.0 Pro
// Realtime Spectrum Analyzer, Peak Level Meter, Oscilloscope & Circular visualizer

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
 * Create visualizer canvas with realtime data and peak meter support
 */
export function createVisualizer(options = {}) {
    const {
        width = 376,
        height = 64,
        mode = 'bars',
        barCount = 38,
        color = '#3b82f6'
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
        <!-- Peak Level Meter -->
        <div class="peak-meter-wrap" id="peakMeterWrap">
            <div class="peak-meter-labels">
                <span>-60dB</span>
                <span>-24dB</span>
                <span>-12dB</span>
                <span>-6dB</span>
                <span>0dB</span>
            </div>
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
    let dataArray = new Uint8Array(128);
    let hasAudioData = false;
    let silenceCount = 0;
    const SILENCE_THRESHOLD = 12;

    // Peak meter state
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
        ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
        ctx.fillRect(0, 0, width, height);
    }

    function updatePeakMeter(currentMax) {
        // Smooth peak response
        peakValue = peakValue * 0.7 + currentMax * 0.3;

        if (peakValue > peakHoldValue) {
            peakHoldValue = peakValue;
            peakHoldDecay = 0;
        } else {
            peakHoldDecay++;
            if (peakHoldDecay > 15) {
                peakHoldValue = Math.max(0, peakHoldValue - 2.5);
            }
        }

        const pct = Math.min(100, (peakValue / 255) * 100);
        const holdPct = Math.min(100, (peakHoldValue / 255) * 100);

        if (peakFill) peakFill.style.width = `${pct}%`;
        if (peakHold) peakHold.style.left = `${holdPct}%`;
    }

    function hasSignificantAudio() {
        let sum = 0;
        let maxVal = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
            if (dataArray[i] > maxVal) maxVal = dataArray[i];
        }
        updatePeakMeter(maxVal);
        const average = sum / dataArray.length;
        return average > 2.5;
    }

    function drawBars() {
        ctx.fillStyle = 'rgba(8, 12, 22, 0.35)';
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / barCount) * 0.76;
        const gap = (width / barCount) * 0.24;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * (dataArray.length / barCount));
            const value = dataArray[dataIndex] || 0;
            const barHeight = (value / 255) * (height - 8);

            const x = i * (barWidth + gap);
            const y = height - barHeight - 2;

            // Vibrant Zyno gradient: Deep Cobalt -> Azure -> Electric Cyan -> White-Hot
            const grad = ctx.createLinearGradient(0, height, 0, y);
            grad.addColorStop(0, '#0048f0');
            grad.addColorStop(0.35, '#0090f0');
            grad.addColorStop(0.75, '#00f0dc');
            grad.addColorStop(1, '#e0faff');

            ctx.fillStyle = grad;

            if (barHeight > 2) {
                ctx.beginPath();
                ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
                ctx.fill();

                // Peak cap dot
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x, y - 2, barWidth, 1.5);
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.fillRect(x, height - 3, barWidth, 2);
            }
        }
    }

    function drawSpectrum() {
        ctx.fillStyle = 'rgba(8, 12, 22, 0.4)';
        ctx.fillRect(0, 0, width, height);

        // Smooth curve spectrum
        ctx.beginPath();
        ctx.moveTo(0, height);

        const sliceWidth = width / (dataArray.length - 1);
        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 255;
            const y = height - (v * (height - 6));
            const x = i * sliceWidth;

            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                // Smooth bezier curve through points
                const prevX = (i - 1) * sliceWidth;
                const prevY = height - ((dataArray[i - 1] / 255) * (height - 6));
                const cpX = (prevX + x) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
            }
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 240, 220, 0.65)');
        grad.addColorStop(0.45, 'rgba(0, 120, 240, 0.35)');
        grad.addColorStop(1, 'rgba(4, 15, 38, 0.05)');

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#00f0dc';
        ctx.shadowColor = '#00f0dc';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawWave() {
        ctx.fillStyle = 'rgba(8, 12, 22, 0.3)';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#00f0dc';
        ctx.shadowColor = '#00f0dc';
        ctx.shadowBlur = 10;
        ctx.beginPath();

        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] / 255);
            const y = height / 2 + (v - 0.5) * height * 0.85;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0284c7';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawCircle() {
        ctx.fillStyle = 'rgba(8, 12, 22, 0.25)';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 8;
        const segments = 36;

        for (let i = 0; i < segments; i++) {
            const dataIndex = Math.floor(i * (dataArray.length / segments));
            const value = dataArray[dataIndex] || 0;
            const amplitude = (value / 255) * 16;

            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
            const innerRadius = radius - 2;
            const outerRadius = radius + amplitude;

            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;

            const hue = 190 + (value / 255) * 90;
            ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
            ctx.lineWidth = 2.5;

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

    function updateData(data) {
        if (!data || data.length === 0) {
            silenceCount++;
            if (silenceCount > SILENCE_THRESHOLD && hasAudioData) {
                hasAudioData = false;
                showIdle();
            }
            return;
        }

        if (dataArray.length !== data.length) {
            dataArray = new Uint8Array(data.length);
        }
        dataArray.set(data);

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
        clearCanvas();
        showIdle();
    };

    return container;
}
