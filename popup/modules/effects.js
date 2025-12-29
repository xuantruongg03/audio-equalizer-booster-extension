// Audio Effects Module v2.1
// Limiter, Spatial Audio, 7D Auto-Pan, Pitch (no Tempo)

/**
 * Default effect settings
 */
export const DEFAULT_EFFECTS = {
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
        mode: 'wide', // 'wide', 'surround', '3d', '7d'
        width: 50
    },
    autoPan: {
        enabled: false,
        speed: 'medium' // 'slow', 'medium', 'fast'
    }
};

/**
 * Limiter presets
 */
export const LIMITER_PRESETS = {
    'off': {
        name: 'Tắt',
        settings: { enabled: false, threshold: 0, knee: 40, ratio: 1, attack: 0.003, release: 0.25 }
    },
    'gentle': {
        name: 'Nhẹ',
        settings: { enabled: true, threshold: -3, knee: 30, ratio: 4, attack: 0.01, release: 0.25 }
    },
    'moderate': {
        name: 'Vừa',
        settings: { enabled: true, threshold: -6, knee: 20, ratio: 8, attack: 0.005, release: 0.2 }
    },
    'aggressive': {
        name: 'Mạnh',
        settings: { enabled: true, threshold: -10, knee: 10, ratio: 12, attack: 0.003, release: 0.15 }
    },
    'brick-wall': {
        name: 'Brick Wall',
        settings: { enabled: true, threshold: -1, knee: 0, ratio: 20, attack: 0.001, release: 0.1 }
    }
};

/**
 * Spatial audio modes
 */
export const SPATIAL_MODES = {
    'off': { name: 'Tắt', icon: '🔇' },
    'wide': { name: 'Wide', icon: '↔️' },
    'surround': { name: 'Surround', icon: '🔊' },
    '3d': { name: '3D', icon: '🌐' },
    '7d': { name: '7D', icon: '🎧' }
};

/**
 * Auto-pan speeds (for 7D effect)
 */
export const PAN_SPEEDS = {
    'slow': { name: 'Chậm', duration: 4000 },
    'medium': { name: 'Vừa', duration: 2000 },
    'fast': { name: 'Nhanh', duration: 1000 }
};

/**
 * Create effects control panel
 */
export function createEffectsPanel(currentEffects, onChange) {
    const effects = { ...DEFAULT_EFFECTS, ...currentEffects };

    const panel = document.createElement('div');
    panel.className = 'effects-panel';
    panel.innerHTML = `
        <!-- Limiter Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">🎚️</span>
                    <span class="effect-name">Limiter</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="limiterToggle" ${effects.limiter.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Ngăn âm thanh bị vỡ khi volume cao</p>
            <div class="effect-controls">
                <select id="limiterPreset" class="effect-select">
                    ${Object.entries(LIMITER_PRESETS).map(([key, preset]) =>
        `<option value="${key}" ${key === 'moderate' ? 'selected' : ''}>${preset.name}</option>`
    ).join('')}
                </select>
            </div>
        </div>

        <!-- Spatial Audio Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">🎧</span>
                    <span class="effect-name">Spatial Audio</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="spatialToggle" ${effects.spatial.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Âm thanh không gian cho tai nghe</p>
            <div class="effect-controls">
                <div class="spatial-modes">
                    ${Object.entries(SPATIAL_MODES).slice(1).map(([key, mode]) => `
                        <button class="spatial-mode-btn ${key === effects.spatial.mode ? 'active' : ''}" 
                                data-mode="${key}" title="${mode.name}">
                            <span>${mode.icon}</span>
                            <span>${mode.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="slider-control">
                    <label>Độ rộng: <span id="spatialWidthValue">${effects.spatial.width}%</span></label>
                    <input type="range" class="effect-slider" id="spatialWidth" min="0" max="100" value="${effects.spatial.width}">
                </div>
            </div>
        </div>

        <!-- 7D Auto-Pan Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">🔄</span>
                    <span class="effect-name">7D Auto-Pan</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="autoPanToggle" ${effects.autoPan.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Âm thanh di chuyển trái ↔ phải tự động</p>
            <div class="effect-controls autopan-section">
                <div class="autopan-control">
                    <div class="autopan-visual ${effects.autoPan.enabled ? 'animating' : ''}" id="autoPanVisual">
                        <div class="autopan-dot" id="autoPanDot"></div>
                    </div>
                </div>
                <div class="autopan-speed">
                    ${Object.entries(PAN_SPEEDS).map(([key, speed]) => `
                        <button class="speed-btn ${key === effects.autoPan.speed ? 'active' : ''}" 
                                data-speed="${key}">${speed.name}</button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // Get elements
    const limiterToggle = panel.querySelector('#limiterToggle');
    const limiterPreset = panel.querySelector('#limiterPreset');
    const spatialToggle = panel.querySelector('#spatialToggle');
    const spatialWidth = panel.querySelector('#spatialWidth');
    const autoPanToggle = panel.querySelector('#autoPanToggle');
    const autoPanVisual = panel.querySelector('#autoPanVisual');

    // Set initial animation duration based on current speed
    const initialDuration = PAN_SPEEDS[effects.autoPan.speed]?.duration || 2000;
    autoPanVisual.style.setProperty('--pan-duration', `${initialDuration}ms`);

    // Limiter events
    limiterToggle.addEventListener('change', () => {
        effects.limiter.enabled = limiterToggle.checked;
        onChange(effects);
    });

    limiterPreset.addEventListener('change', () => {
        const preset = LIMITER_PRESETS[limiterPreset.value];
        if (preset) {
            effects.limiter = { ...preset.settings };
            limiterToggle.checked = effects.limiter.enabled;
            onChange(effects);
        }
    });

    // Spatial events
    spatialToggle.addEventListener('change', () => {
        effects.spatial.enabled = spatialToggle.checked;
        onChange(effects);
    });

    panel.querySelectorAll('.spatial-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('.spatial-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            effects.spatial.mode = btn.dataset.mode;
            effects.spatial.enabled = true;
            spatialToggle.checked = true;
            onChange(effects);
        });
    });

    spatialWidth.addEventListener('input', () => {
        effects.spatial.width = parseInt(spatialWidth.value);
        panel.querySelector('#spatialWidthValue').textContent = `${effects.spatial.width}%`;
        onChange(effects);
    });

    // Auto-Pan events
    autoPanToggle.addEventListener('change', () => {
        effects.autoPan.enabled = autoPanToggle.checked;
        autoPanVisual.classList.toggle('animating', effects.autoPan.enabled);
        onChange(effects);
    });

    panel.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            effects.autoPan.speed = btn.dataset.speed;
            effects.autoPan.enabled = true;
            autoPanToggle.checked = true;
            autoPanVisual.classList.add('animating');

            // Update animation speed
            const duration = PAN_SPEEDS[effects.autoPan.speed].duration;
            autoPanVisual.style.setProperty('--pan-duration', `${duration}ms`);

            onChange(effects);
        });
    });

    // Expose methods
    panel.getEffects = () => effects;
    panel.setEffects = (newEffects) => {
        Object.assign(effects, newEffects);
        limiterToggle.checked = effects.limiter?.enabled || false;
        spatialToggle.checked = effects.spatial?.enabled || false;
        autoPanToggle.checked = effects.autoPan?.enabled || false;
        spatialWidth.value = effects.spatial?.width || 50;
        autoPanVisual.classList.toggle('animating', effects.autoPan?.enabled || false);
    };

    return panel;
}
