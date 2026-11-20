// Studio Interactive DSP Frequency Response Graph v3.0 Pro
// Exact Biquad Filter Mathematics & Interactive Node Dragging

const FREQ_POINTS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const BAND_KEYS = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const SAMPLE_RATE = 48000;

/**
 * Convert frequency to logarithmic X coordinate (0 to width)
 */
function freqToX(freq, width) {
    const logMin = Math.log10(MIN_FREQ);
    const logMax = Math.log10(MAX_FREQ);
    const logFreq = Math.log10(Math.max(MIN_FREQ, Math.min(MAX_FREQ, freq)));
    return ((logFreq - logMin) / (logMax - logMin)) * width;
}

/**
 * Convert X coordinate to logarithmic frequency
 */
function xToFreq(x, width) {
    const logMin = Math.log10(MIN_FREQ);
    const logMax = Math.log10(MAX_FREQ);
    const ratio = Math.max(0, Math.min(1, x / width));
    return Math.pow(10, logMin + ratio * (logMax - logMin));
}

/**
 * Convert dB gain to Y coordinate (0 to height)
 */
function dbToY(db, height, maxDb) {
    // db: -maxDb to +maxDb -> 0 to height (inverted: +maxDb is at top)
    const normalized = (db + maxDb) / (2 * maxDb);
    return height - (normalized * height);
}

/**
 * Convert Y coordinate to dB gain
 */
function yToDb(y, height, maxDb) {
    const ratio = 1 - (y / height); // 0 at bottom, 1 at top
    const db = (ratio * 2 * maxDb) - maxDb;
    return Math.max(-maxDb, Math.min(maxDb, Math.round(db * 2) / 2));
}

/**
 * Calculate biquad filter dB magnitude response at frequency f
 */
function getBiquadResponseDb(f, f0, gainDb, Q, type = 'peaking') {
    if (Math.abs(gainDb) < 0.05) return 0;

    const w0 = (2 * Math.PI * f0) / SAMPLE_RATE;
    const w = (2 * Math.PI * f) / SAMPLE_RATE;
    const cos_w0 = Math.cos(w0);
    const sin_w0 = Math.sin(w0);
    const alpha = sin_w0 / (2 * Math.max(0.1, Q));
    const A = Math.pow(10, gainDb / 40);

    let b0, b1, b2, a0, a1, a2;

    if (type === 'lowshelf') {
        const sqrtA = Math.sqrt(A);
        b0 = A * ((A + 1) - (A - 1) * cos_w0 + 2 * sqrtA * alpha);
        b1 = 2 * A * ((A - 1) - (A + 1) * cos_w0);
        b2 = A * ((A + 1) - (A - 1) * cos_w0 - 2 * sqrtA * alpha);
        a0 = (A + 1) + (A - 1) * cos_w0 + 2 * sqrtA * alpha;
        a1 = -2 * ((A - 1) + (A + 1) * cos_w0);
        a2 = (A + 1) + (A - 1) * cos_w0 - 2 * sqrtA * alpha;
    } else if (type === 'highshelf') {
        const sqrtA = Math.sqrt(A);
        b0 = A * ((A + 1) + (A - 1) * cos_w0 + 2 * sqrtA * alpha);
        b1 = -2 * A * ((A - 1) + (A + 1) * cos_w0);
        b2 = A * ((A + 1) + (A - 1) * cos_w0 - 2 * sqrtA * alpha);
        a0 = (A + 1) - (A - 1) * cos_w0 + 2 * sqrtA * alpha;
        a1 = 2 * ((A - 1) - (A + 1) * cos_w0);
        a2 = (A + 1) - (A - 1) * cos_w0 - 2 * sqrtA * alpha;
    } else {
        // Default Peaking Bell Filter
        b0 = 1 + alpha * A;
        b1 = -2 * cos_w0;
        b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        a1 = -2 * cos_w0;
        a2 = 1 - alpha / A;
    }

    const cos_w = Math.cos(w);
    const cos_2w = Math.cos(2 * w);
    const sin_w = Math.sin(w);
    const sin_2w = Math.sin(2 * w);

    // Numerator
    const num_r = b0 + b1 * cos_w + b2 * cos_2w;
    const num_i = -b1 * sin_w - b2 * sin_2w;

    // Denominator
    const den_r = a0 + a1 * cos_w + a2 * cos_2w;
    const den_i = -a1 * sin_w - a2 * sin_2w;

    const magSquared = (num_r * num_r + num_i * num_i) / (den_r * den_r + den_i * den_i);
    return 10 * Math.log10(Math.max(1e-9, magSquared));
}

/**
 * Create Studio Interactive DSP Frequency Response Graph
 */
export function createDspGraph(options = {}) {
    const {
        width = 384,
        height = 110,
        bands = {},
        bandParams = {},
        maxDb = 12,
        onBandChange = () => {},
        onSelectBand = () => {}
    } = options;

    const container = document.createElement('div');
    container.className = 'dsp-graph-container';
    container.innerHTML = `
        <div class="dsp-graph-wrap">
            <canvas class="dsp-graph-canvas" width="${width}" height="${height}"></canvas>
            <div class="dsp-graph-tooltip" style="display: none;"></div>
        </div>
    `;

    const canvas = container.querySelector('.dsp-graph-canvas');
    const ctx = canvas.getContext('2d');
    const tooltip = container.querySelector('.dsp-graph-tooltip');

    let currentBands = { ...bands };
    let currentParams = { ...bandParams };
    let currentMaxDb = maxDb;
    let selectedBandKey = '1k';
    let draggingBandKey = null;

    // Render resolution steps
    const NUM_CURVE_POINTS = 160;
    const curveFreqs = [];
    for (let i = 0; i < NUM_CURVE_POINTS; i++) {
        curveFreqs.push(xToFreq((i / (NUM_CURVE_POINTS - 1)) * width, width));
    }

    function calculateTotalDbAt(f) {
        let total = 0;
        BAND_KEYS.forEach((key, idx) => {
            const params = currentParams[key] || {};
            if (params.bypass) return;
            const f0 = params.freq || FREQ_POINTS[idx];
            const gain = currentBands[key] || 0;
            const Q = params.Q || 1.2;
            const type = params.type || (idx === 0 ? 'lowshelf' : idx === 9 ? 'highshelf' : 'peaking');
            total += getBiquadResponseDb(f, f0, gain, Q, type);
        });
        return total;
    }

    function drawGrid() {
        ctx.fillStyle = '#030816';
        ctx.fillRect(0, 0, width, height);

        // Frequency Grid Lines
        const gridFreqs = [30, 60, 120, 250, 500, 1000, 2000, 4000, 8000, 16000];
        ctx.lineWidth = 1;

        gridFreqs.forEach(f => {
            const x = freqToX(f, width);
            ctx.strokeStyle = (f === 1000) ? 'rgba(0, 240, 220, 0.2)' : 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#475569';
            ctx.font = '8px monospace';
            const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
            ctx.fillText(label, x + 2, height - 3);
        });

        // dB Grid Lines
        const gridDbs = [+currentMaxDb, +currentMaxDb / 2, 0, -currentMaxDb / 2, -currentMaxDb];
        gridDbs.forEach(db => {
            const y = dbToY(db, height, currentMaxDb);
            ctx.strokeStyle = (db === 0) ? 'rgba(0, 240, 220, 0.25)' : 'rgba(255, 255, 255, 0.04)';
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();

            // dB labels
            ctx.fillStyle = (db === 0) ? '#00f0dc' : '#475569';
            ctx.font = '8px monospace';
            const label = db > 0 ? `+${db}` : `${db}`;
            ctx.fillText(label, 3, y - 2);
        });
    }

    function drawCurve() {
        ctx.beginPath();
        ctx.moveTo(0, height);

        const points = [];
        for (let i = 0; i < NUM_CURVE_POINTS; i++) {
            const x = (i / (NUM_CURVE_POINTS - 1)) * width;
            const f = curveFreqs[i];
            const totalDb = calculateTotalDbAt(f);
            const y = dbToY(totalDb, height, currentMaxDb);
            points.push({ x, y });
            if (i === 0) {
                ctx.lineTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        // Fill area under curve
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 240, 220, 0.35)');
        grad.addColorStop(0.5, 'rgba(0, 144, 240, 0.15)');
        grad.addColorStop(1, 'rgba(3, 8, 22, 0.02)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke the response curve with intense neon glow
        ctx.beginPath();
        points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        });

        ctx.shadowColor = '#00f0dc';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#00f0dc';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawNodes() {
        BAND_KEYS.forEach((key, idx) => {
            const params = currentParams[key] || {};
            const f0 = params.freq || FREQ_POINTS[idx];
            const gain = currentBands[key] || 0;
            const x = freqToX(f0, width);
            const y = dbToY(gain, height, currentMaxDb);
            const isSelected = key === selectedBandKey;
            const isBypassed = params.bypass;

            // Outer ring
            ctx.beginPath();
            ctx.arc(x, y, isSelected ? 6.5 : 4.5, 0, Math.PI * 2);

            if (isBypassed) {
                ctx.fillStyle = '#334155';
                ctx.strokeStyle = '#64748b';
            } else if (gain > 0) {
                ctx.fillStyle = isSelected ? '#00f0dc' : '#00a0f0';
                ctx.strokeStyle = '#ffffff';
            } else if (gain < 0) {
                ctx.fillStyle = isSelected ? '#f59e0b' : '#d97706';
                ctx.strokeStyle = '#ffffff';
            } else {
                ctx.fillStyle = isSelected ? '#00f0dc' : '#475569';
                ctx.strokeStyle = '#94a3b8';
            }

            ctx.lineWidth = 1.5;
            ctx.shadowColor = isSelected ? '#00f0dc' : 'transparent';
            ctx.shadowBlur = isSelected ? 8 : 0;
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Band index text inside/next to node
            if (isSelected) {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 8px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${gain > 0 ? '+' : ''}${gain}dB`, x, Math.max(12, y - 9));
                ctx.textAlign = 'start';
            }
        });
    }

    function render() {
        drawGrid();
        drawCurve();
        drawNodes();
    }

    // Find node near mouse
    function findNodeAt(mx, my) {
        let found = null;
        BAND_KEYS.forEach((key, idx) => {
            const params = currentParams[key] || {};
            const f0 = params.freq || FREQ_POINTS[idx];
            const gain = currentBands[key] || 0;
            const x = freqToX(f0, width);
            const y = dbToY(gain, height, currentMaxDb);
            const dist = Math.hypot(mx - x, my - y);
            if (dist < 12) {
                found = key;
            }
        });
        return found;
    }

    // Mouse / Touch Event Handlers
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
        const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
        return {
            x: ((clientX - rect.left) / rect.width) * width,
            y: ((clientY - rect.top) / rect.height) * height
        };
    }

    canvas.addEventListener('mousedown', (e) => {
        const { x, y } = getCanvasCoords(e);
        const key = findNodeAt(x, y);
        if (key) {
            draggingBandKey = key;
            selectedBandKey = key;
            onSelectBand(key);
            render();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!draggingBandKey) {
            // Hover tooltip
            const rect = canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const { x, y } = getCanvasCoords(e);
                const hovered = findNodeAt(x, y);
                if (hovered) {
                    canvas.style.cursor = 'ns-resize';
                } else {
                    canvas.style.cursor = 'crosshair';
                }
            }
            return;
        }

        const { y } = getCanvasCoords(e);
        const newDb = yToDb(y, height, currentMaxDb);

        if (currentBands[draggingBandKey] !== newDb) {
            currentBands[draggingBandKey] = newDb;
            render();
            onBandChange(draggingBandKey, newDb);
        }
    });

    window.addEventListener('mouseup', () => {
        draggingBandKey = null;
    });

    // Double click to reset node to 0dB
    canvas.addEventListener('dblclick', (e) => {
        const { x, y } = getCanvasCoords(e);
        const key = findNodeAt(x, y);
        if (key) {
            currentBands[key] = 0;
            render();
            onBandChange(key, 0);
        }
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
        const { x, y } = getCanvasCoords(e);
        const key = findNodeAt(x, y);
        if (key) {
            draggingBandKey = key;
            selectedBandKey = key;
            onSelectBand(key);
            render();
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (!draggingBandKey) return;
        e.preventDefault();
        const { y } = getCanvasCoords(e);
        const newDb = yToDb(y, height, currentMaxDb);
        if (currentBands[draggingBandKey] !== newDb) {
            currentBands[draggingBandKey] = newDb;
            render();
            onBandChange(draggingBandKey, newDb);
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        draggingBandKey = null;
    });

    // Public methods
    container.updateBands = (newBands) => {
        currentBands = { ...newBands };
        render();
    };

    container.updateParams = (newParams) => {
        currentParams = { ...newParams };
        render();
    };

    container.setMaxDb = (newMaxDb) => {
        currentMaxDb = newMaxDb;
        render();
    };

    container.setSelectedBand = (key) => {
        selectedBandKey = key;
        render();
    };

    // Initial draw
    render();

    return container;
}
