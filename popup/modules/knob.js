// Rotary Knob Component
// Creates interactive knob controls for EQ bands

/**
 * Create a rotary knob element
 * @param {Object} options - Knob configuration
 * @returns {HTMLElement} The knob container element
 */
export function createKnob(options = {}) {
    const {
        id = 'knob',
        label = '',
        min = -12,
        max = 12,
        value = 0,
        size = 50,
        color = '#3b82f6',
        desc = '',
        onChange = () => { }
    } = options;

    const container = document.createElement('div');
    container.className = 'knob-container';
    if (desc) {
        container.setAttribute('title', desc);
    }
    container.innerHTML = `
        <div class="knob-value" id="${id}-value">${formatValue(value)}</div>
        <div class="knob" id="${id}" data-value="${value}" data-min="${min}" data-max="${max}" style="--knob-size: ${size}px; --knob-color: ${color};">
            <div class="knob-track"></div>
            <div class="knob-fill" style="--rotation: ${valueToRotation(value, min, max)}deg"></div>
            <div class="knob-handle" style="--rotation: ${valueToRotation(value, min, max)}deg">
                <div class="knob-indicator"></div>
            </div>
            <div class="knob-center"></div>
        </div>
        <div class="knob-label">${label}</div>
    `;

    // Setup interactions
    const knobEl = container.querySelector('.knob');
    const handleEl = container.querySelector('.knob-handle');
    const fillEl = container.querySelector('.knob-fill');
    const valueEl = container.querySelector('.knob-value');

    let isDragging = false;
    let startY = 0;
    let startValue = value;

    // Mouse/Touch events
    const onStart = (e) => {
        e.preventDefault();
        isDragging = true;
        startY = e.clientY || e.touches[0].clientY;
        startValue = parseFloat(knobEl.dataset.value);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        container.classList.add('active');
    };

    const onMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const currentY = e.clientY || e.touches[0].clientY;
        const deltaY = startY - currentY; // Up = positive
        const sensitivity = 0.3; // Adjust sensitivity
        const range = max - min;
        const deltaValue = (deltaY * sensitivity * range) / 100;

        let newValue = Math.round(startValue + deltaValue);
        newValue = Math.max(min, Math.min(max, newValue));

        if (newValue !== parseFloat(knobEl.dataset.value)) {
            updateKnobValue(container, newValue, min, max);
            onChange(newValue);
        }
    };

    const onEnd = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        container.classList.remove('active');
    };

    // Mouse wheel
    const onWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        let newValue = parseFloat(knobEl.dataset.value) + delta;
        newValue = Math.max(min, Math.min(max, newValue));
        updateKnobValue(container, newValue, min, max);
        onChange(newValue);
    };

    // Double-click to reset
    const onDoubleClick = () => {
        updateKnobValue(container, 0, min, max);
        onChange(0);
    };

    knobEl.addEventListener('mousedown', onStart);
    knobEl.addEventListener('touchstart', onStart, { passive: false });
    knobEl.addEventListener('wheel', onWheel, { passive: false });
    knobEl.addEventListener('dblclick', onDoubleClick);

    return container;
}

/**
 * Convert value to rotation angle
 * Range: -135deg to +135deg (270 degree sweep)
 */
function valueToRotation(value, min, max) {
    const range = max - min;
    const normalized = (value - min) / range; // 0 to 1
    return -135 + (normalized * 270); // -135 to +135
}

/**
 * Format value for display
 */
function formatValue(value) {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value}`;
}

/**
 * Update knob visual and data
 */
export function updateKnobValue(container, value, min, max) {
    const knobEl = container.querySelector('.knob');
    const handleEl = container.querySelector('.knob-handle');
    const fillEl = container.querySelector('.knob-fill');
    const valueEl = container.querySelector('.knob-value');

    const rotation = valueToRotation(value, min, max);

    knobEl.dataset.value = value;
    handleEl.style.setProperty('--rotation', `${rotation}deg`);
    fillEl.style.setProperty('--rotation', `${rotation}deg`);

    valueEl.textContent = formatValue(value);
    valueEl.className = 'knob-value' + (value > 0 ? ' boost' : value < 0 ? ' cut' : '');
}

/**
 * Create a large volume knob
 */
export function createVolumeKnob(options = {}) {
    const {
        id = 'volume-knob',
        value = 100,
        min = 0,
        max = 800,
        onChange = () => { }
    } = options;

    const container = document.createElement('div');
    container.className = 'volume-knob-container';
    container.innerHTML = `
        <div class="volume-knob" id="${id}" data-value="${value}" data-min="${min}" data-max="${max}">
            <svg class="volume-knob-track" viewBox="0 0 120 120">
                <circle class="track-bg" cx="60" cy="60" r="50" fill="none" stroke="#374151" stroke-width="8"/>
                <circle class="track-fill" cx="60" cy="60" r="50" fill="none" stroke="url(#volumeGradient)" stroke-width="8"
                    stroke-dasharray="314" stroke-dashoffset="${314 - (value / max) * 314}" stroke-linecap="round"
                    transform="rotate(-90 60 60)"/>
                <defs>
                    <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#4ade80"/>
                        <stop offset="50%" style="stop-color:#fbbf24"/>
                        <stop offset="100%" style="stop-color:#ef4444"/>
                    </linearGradient>
                </defs>
            </svg>
            <div class="volume-knob-handle" style="--rotation: ${volumeToRotation(value, min, max)}deg">
                <div class="volume-indicator"></div>
            </div>
            <div class="volume-knob-center">
                <span class="volume-value" id="${id}-value">${value}%</span>
                <span class="volume-label">VOLUME</span>
            </div>
        </div>
        <div class="volume-marks">
            <span data-value="0">0</span>
            <span data-value="100">100</span>
            <span data-value="200">200</span>
            <span data-value="400">400</span>
            <span data-value="800">800</span>
        </div>
    `;

    const knobEl = container.querySelector('.volume-knob');
    const handleEl = container.querySelector('.volume-knob-handle');
    const trackFill = container.querySelector('.track-fill');
    const valueEl = container.querySelector('.volume-value');

    let isDragging = false;
    let startY = 0;
    let startValue = value;

    const updateVisual = (val) => {
        const rotation = volumeToRotation(val, min, max);
        handleEl.style.setProperty('--rotation', `${rotation}deg`);
        trackFill.style.strokeDashoffset = 314 - (val / max) * 314;
        valueEl.textContent = `${val}%`;

        // Color based on value
        if (val <= 100) {
            valueEl.style.color = '#4ade80';
        } else if (val <= 200) {
            valueEl.style.color = '#fbbf24';
        } else {
            valueEl.style.color = '#ef4444';
        }
    };

    const onStart = (e) => {
        e.preventDefault();
        isDragging = true;
        startY = e.clientY || e.touches[0].clientY;
        startValue = parseFloat(knobEl.dataset.value);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
        container.classList.add('active');
    };

    const onMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const currentY = e.clientY || e.touches[0].clientY;
        const deltaY = startY - currentY;
        const sensitivity = 2;
        const deltaValue = Math.round(deltaY * sensitivity);

        let newValue = startValue + deltaValue;
        newValue = Math.max(min, Math.min(max, newValue));

        if (newValue !== parseFloat(knobEl.dataset.value)) {
            knobEl.dataset.value = newValue;
            updateVisual(newValue);
            onChange(newValue);
        }
    };

    const onEnd = () => {
        isDragging = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        container.classList.remove('active');
    };

    const onWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        let newValue = parseFloat(knobEl.dataset.value) + delta;
        newValue = Math.max(min, Math.min(max, newValue));
        knobEl.dataset.value = newValue;
        updateVisual(newValue);
        onChange(newValue);
    };

    // Click on marks to set value
    container.querySelectorAll('.volume-marks span').forEach(mark => {
        mark.addEventListener('click', () => {
            const val = parseInt(mark.dataset.value);
            knobEl.dataset.value = val;
            updateVisual(val);
            onChange(val);
        });
    });

    knobEl.addEventListener('mousedown', onStart);
    knobEl.addEventListener('touchstart', onStart, { passive: false });
    knobEl.addEventListener('wheel', onWheel, { passive: false });

    // Expose update method
    container.setValue = (val) => {
        knobEl.dataset.value = val;
        updateVisual(val);
    };

    return container;
}

function volumeToRotation(value, min, max) {
    const normalized = (value - min) / (max - min);
    return -135 + (normalized * 270);
}

/**
 * Create quick boost buttons
 */
export function createBoostButtons(onChange) {
    const container = document.createElement('div');
    container.className = 'boost-buttons';

    const boosts = [
        { value: 100, label: '100%', desc: 'Normal' },
        { value: 200, label: '200%', desc: '2x Boost' },
        { value: 400, label: '400%', desc: '4x Boost' },
        { value: 800, label: '800%', desc: 'Max Boost' }
    ];

    boosts.forEach(boost => {
        const btn = document.createElement('button');
        btn.className = 'boost-btn';
        btn.dataset.value = boost.value;
        btn.innerHTML = `<span>${boost.label}</span>`;
        btn.title = boost.desc;
        btn.addEventListener('click', () => onChange(boost.value));
        container.appendChild(btn);
    });

    return container;
}
