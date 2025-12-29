// Audio Visualizer Module v2.2
// Realtime waveform visualization - Only shows when receiving audio

/**
 * Visualizer modes
 */
export const VISUALIZER_MODES = {
    'off': { name: 'Tắt', icon: '❌' },
    'bars': { name: 'Bars', icon: '📊' },
    'wave': { name: 'Wave', icon: '🌊' },
    'circle': { name: 'Circle', icon: '⭕' }
};

/**
 * Create visualizer canvas with realtime data support
 */
export function createVisualizer(options = {}) {
    const {
        width = 376,
        height = 50,
        mode = 'bars',
        barCount = 40,
        color = '#3b82f6'
    } = options;

    const container = document.createElement('div');
    container.className = 'visualizer-container';
    container.innerHTML = `
        <div class="visualizer-header">
            <span class="visualizer-title">🎵 Visualizer</span>
            <div class="visualizer-modes">
                ${Object.entries(VISUALIZER_MODES).map(([key, m]) => `
                    <button class="viz-mode-btn ${key === mode ? 'active' : ''}" 
                            data-mode="${key}" title="${m.name}">
                        ${m.icon}
                    </button>
                `).join('')}
            </div>
        </div>
        <canvas class="visualizer-canvas" width="${width}" height="${height}"></canvas>
        <div class="visualizer-idle">
            <span>🔇 Chưa có âm thanh</span>
        </div>
    `;

    const canvas = container.querySelector('.visualizer-canvas');
    const ctx = canvas.getContext('2d');
    const idleOverlay = container.querySelector('.visualizer-idle');

    let currentMode = mode;
    let animationId = null;
    let dataArray = new Uint8Array(128);
    let isRunning = false;
    let hasAudioData = false;
    let silenceCount = 0;
    const SILENCE_THRESHOLD = 10; // frames with no audio before showing idle

    // Mode buttons
    container.querySelectorAll('.viz-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.viz-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            if (currentMode === 'off') {
                clearCanvas();
                showIdle();
            }
        });
    });

    function showIdle() {
        idleOverlay.style.display = 'flex';
        canvas.style.opacity = '0.3';
    }

    function hideIdle() {
        idleOverlay.style.display = 'none';
        canvas.style.opacity = '1';
    }

    function clearCanvas() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, width, height);
    }

    function hasSignificantAudio() {
        // Check if there's actual audio data (not all zeros or near-zero)
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        return average > 3; // Threshold to detect actual audio
    }

    function drawBars() {
        // Clear with fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor(i * (dataArray.length / barCount));
            const value = dataArray[dataIndex] || 0;
            const barHeight = (value / 255) * height * 0.9;

            const x = i * (barWidth + gap);
            const y = height - barHeight;

            // Gradient color based on height
            const hue = 200 + (value / 255) * 80; // Blue to purple
            const lightness = 50 + (value / 255) * 20;

            ctx.fillStyle = `hsl(${hue}, 75%, ${lightness}%)`;

            // Draw rounded bar
            ctx.beginPath();
            if (barHeight > 2) {
                ctx.roundRect(x, y, barWidth, barHeight, 2);
            } else {
                ctx.rect(x, height - 2, barWidth, 2);
            }
            ctx.fill();
        }
    }

    function drawWave() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.beginPath();

        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            // Convert frequency data to wave-like appearance
            const v = (dataArray[i] / 255);
            const y = height / 2 + (v - 0.5) * height * 0.8;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        ctx.stroke();

        // Glow effect
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawCircle() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 8;
        const segments = 32;

        for (let i = 0; i < segments; i++) {
            const dataIndex = Math.floor(i * (dataArray.length / segments));
            const value = dataArray[dataIndex] || 0;
            const amplitude = (value / 255) * 15;

            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
            const innerRadius = radius - 3;
            const outerRadius = radius + amplitude;

            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * outerRadius;
            const y2 = centerY + Math.sin(angle) * outerRadius;

            const hue = 200 + (value / 255) * 80;
            ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
            ctx.lineWidth = 3;

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
            case 'wave':
                drawWave();
                break;
            case 'circle':
                drawCircle();
                break;
        }
    }

    function start() {
        if (isRunning) return;
        isRunning = true;
        silenceCount = 0;
        // Don't start animation loop - we render on data update
    }

    function stop() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        // Clear and show idle
        clearCanvas();
        showIdle();
        hasAudioData = false;
        silenceCount = 0;
    }

    // Update with realtime data from offscreen
    function updateData(data) {
        if (!data || data.length === 0) {
            silenceCount++;
            if (silenceCount > SILENCE_THRESHOLD && hasAudioData) {
                hasAudioData = false;
                showIdle();
            }
            return;
        }

        // Ensure we have a properly sized array
        if (dataArray.length !== data.length) {
            dataArray = new Uint8Array(data.length);
        }
        dataArray.set(data);

        // Check if there's actual audio
        if (hasSignificantAudio()) {
            silenceCount = 0;
            if (!hasAudioData) {
                hasAudioData = true;
                hideIdle();
            }
            // Render the current frame
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

    // Expose methods
    container.start = start;
    container.stop = stop;
    container.updateData = updateData;
    container.setMode = (m) => {
        currentMode = m;
        container.querySelectorAll('.viz-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === m);
        });
        if (m === 'off') {
            clearCanvas();
            showIdle();
        }
    };
    container.reset = () => {
        hasAudioData = false;
        silenceCount = 0;
        clearCanvas();
        showIdle();
    };

    // Initialize with idle state
    clearCanvas();
    showIdle();

    return container;
}
