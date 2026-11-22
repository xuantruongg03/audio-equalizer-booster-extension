// Audio Effects Module v3.0 Pro
// Limiter, Spatial Audio, 7D Auto-Pan, Studio Reverb, Bass Enhancer
import { icon } from './icons.js';

/**
 * Default effect settings v3.0
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
    },
    reverb: {
        enabled: false,
        type: 'hall', // 'room', 'hall', 'plate', 'cathedral'
        mix: 25
    },
    bassEnhancer: {
        enabled: false,
        amount: 40,
        freq: 90
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
        name: 'Nhẹ (Gentle)',
        settings: { enabled: true, threshold: -3, knee: 30, ratio: 4, attack: 0.01, release: 0.25 }
    },
    'moderate': {
        name: 'Vừa (Broadcast)',
        settings: { enabled: true, threshold: -6, knee: 20, ratio: 8, attack: 0.005, release: 0.2 }
    },
    'aggressive': {
        name: 'Mạnh (Punchy)',
        settings: { enabled: true, threshold: -10, knee: 10, ratio: 12, attack: 0.003, release: 0.15 }
    },
    'brick-wall': {
        name: 'Brick Wall Safe',
        settings: { enabled: true, threshold: -1, knee: 0, ratio: 20, attack: 0.001, release: 0.1 }
    }
};

/**
 * Spatial audio modes
 */
export const SPATIAL_MODES = {
    'off': { name: 'Tắt', iconName: 'volume-x' },
    'wide': { name: 'Wide', iconName: 'move-horizontal' },
    'surround': { name: 'Surround', iconName: 'speaker' },
    '3d': { name: '3D', iconName: 'globe' },
    '7d': { name: '7D', iconName: 'headphones' }
};

/**
 * Auto-pan speeds
 */
export const PAN_SPEEDS = {
    'slow': { name: 'Chậm', duration: 4000 },
    'medium': { name: 'Vừa', duration: 2000 },
    'fast': { name: 'Nhanh', duration: 1000 }
};

/**
 * Reverb types
 */
export const REVERB_TYPES = {
    'room': { name: 'Phòng nhỏ (Room)', iconName: 'box' },
    'hall': { name: 'Khán phòng (Concert Hall)', iconName: 'landmark' },
    'plate': { name: 'Plate Reverb', iconName: 'disc' },
    'cathedral': { name: 'Đại giáo đường (Cathedral)', iconName: 'castle' }
};

/**
 * Create effects control panel
 */
export function createEffectsPanel(currentEffects, onChange) {
    const effects = {
        ...DEFAULT_EFFECTS,
        ...currentEffects,
        reverb: { ...DEFAULT_EFFECTS.reverb, ...(currentEffects?.reverb || {}) },
        bassEnhancer: { ...DEFAULT_EFFECTS.bassEnhancer, ...(currentEffects?.bassEnhancer || {}) }
    };

    const panel = document.createElement('div');
    panel.className = 'effects-panel';
    panel.innerHTML = `
        <!-- Studio Reverb Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">${icon('landmark', 15)}</span>
                    <span class="effect-name">Studio Reverb</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="reverbToggle" ${effects.reverb.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Tạo độ vang & không gian phòng thu chuyên nghiệp</p>
            <div class="effect-controls">
                <div class="reverb-types">
                    ${Object.entries(REVERB_TYPES).map(([key, item]) => `
                        <button class="reverb-type-btn ${key === effects.reverb.type ? 'active' : ''}" 
                                data-reverb="${key}">
                            <span>${icon(item.iconName, 13)}</span>
                            <span>${item.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="slider-control">
                    <label>Mức vang (Wet Mix): <span id="reverbMixValue">${effects.reverb.mix}%</span></label>
                    <input type="range" class="effect-slider" id="reverbMix" min="0" max="100" value="${effects.reverb.mix}">
                </div>
            </div>
        </div>

        <!-- Bass Enhancer Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">${icon('flame', 15)}</span>
                    <span class="effect-name">Sub Bass Enhancer</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="bassEnhancerToggle" ${effects.bassEnhancer.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Tổng hợp sóng hài sub-bass ấm sâu cho tai nghe & loa nhỏ</p>
            <div class="effect-controls">
                <div class="slider-control">
                    <label>Cường độ Bass: <span id="bassAmountValue">${effects.bassEnhancer.amount}%</span></label>
                    <input type="range" class="effect-slider" id="bassAmount" min="0" max="100" value="${effects.bassEnhancer.amount}">
                </div>
                <div class="slider-control">
                    <label>Tần số cắt: <span id="bassFreqValue">${effects.bassEnhancer.freq} Hz</span></label>
                    <input type="range" class="effect-slider" id="bassFreq" min="60" max="150" step="5" value="${effects.bassEnhancer.freq}">
                </div>
            </div>
        </div>

        <!-- Spatial Audio Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">${icon('headphones', 15)}</span>
                    <span class="effect-name">Spatial Audio</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="spatialToggle" ${effects.spatial.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Mở rộng không gian âm thanh vòm Stereo 3D / 7D</p>
            <div class="effect-controls">
                <div class="spatial-modes">
                    ${Object.entries(SPATIAL_MODES).slice(1).map(([key, mode]) => `
                        <button class="spatial-mode-btn ${key === effects.spatial.mode ? 'active' : ''}" 
                                data-mode="${key}" title="${mode.name}">
                            <span>${icon(mode.iconName, 13)}</span>
                            <span>${mode.name}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="slider-control">
                    <label>Độ mở rộng: <span id="spatialWidthValue">${effects.spatial.width}%</span></label>
                    <input type="range" class="effect-slider" id="spatialWidth" min="0" max="100" value="${effects.spatial.width}">
                </div>
            </div>
        </div>

        <!-- 7D Auto-Pan Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">${icon('refresh-cw', 15)}</span>
                    <span class="effect-name">7D Auto-Pan</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="autoPanToggle" ${effects.autoPan.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Hiệu ứng âm thanh đảo vòng mượt mà trái ↔ phải</p>
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

        <!-- Limiter Section -->
        <div class="effect-section">
            <div class="effect-header">
                <div class="effect-info">
                    <span class="effect-icon">${icon('shield-check', 15)}</span>
                    <span class="effect-name">Audio Limiter / Compressor</span>
                </div>
                <label class="switch-small">
                    <input type="checkbox" id="limiterToggle" ${effects.limiter.enabled ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </div>
            <p class="effect-desc">Chống méo vỡ âm thanh khi boost volume lên cao</p>
            <div class="effect-controls">
                <select id="limiterPreset" class="effect-select">
                    ${Object.entries(LIMITER_PRESETS).map(([key, preset]) =>
                        `<option value="${key}" ${key === 'moderate' ? 'selected' : ''}>${preset.name}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
    `;

    // Elements
    const limiterToggle = panel.querySelector('#limiterToggle');
    const limiterPreset = panel.querySelector('#limiterPreset');
    const spatialToggle = panel.querySelector('#spatialToggle');
    const spatialWidth = panel.querySelector('#spatialWidth');
    const autoPanToggle = panel.querySelector('#autoPanToggle');
    const autoPanVisual = panel.querySelector('#autoPanVisual');
    const reverbToggle = panel.querySelector('#reverbToggle');
    const reverbMix = panel.querySelector('#reverbMix');
    const bassEnhancerToggle = panel.querySelector('#bassEnhancerToggle');
    const bassAmount = panel.querySelector('#bassAmount');
    const bassFreq = panel.querySelector('#bassFreq');

    const initialDuration = PAN_SPEEDS[effects.autoPan.speed]?.duration || 2000;
    autoPanVisual.style.setProperty('--pan-duration', `${initialDuration}ms`);

    // Limiter listeners
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

    // Reverb listeners
    reverbToggle.addEventListener('change', () => {
        effects.reverb.enabled = reverbToggle.checked;
        onChange(effects);
    });

    panel.querySelectorAll('.reverb-type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('.reverb-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            effects.reverb.type = btn.dataset.reverb;
            effects.reverb.enabled = true;
            reverbToggle.checked = true;
            onChange(effects);
        });
    });

    reverbMix.addEventListener('input', () => {
        effects.reverb.mix = parseInt(reverbMix.value);
        panel.querySelector('#reverbMixValue').textContent = `${effects.reverb.mix}%`;
        onChange(effects);
    });

    // Bass Enhancer listeners
    bassEnhancerToggle.addEventListener('change', () => {
        effects.bassEnhancer.enabled = bassEnhancerToggle.checked;
        onChange(effects);
    });

    bassAmount.addEventListener('input', () => {
        effects.bassEnhancer.amount = parseInt(bassAmount.value);
        panel.querySelector('#bassAmountValue').textContent = `${effects.bassEnhancer.amount}%`;
        onChange(effects);
    });

    bassFreq.addEventListener('input', () => {
        effects.bassEnhancer.freq = parseInt(bassFreq.value);
        panel.querySelector('#bassFreqValue').textContent = `${effects.bassEnhancer.freq} Hz`;
        onChange(effects);
    });

    // Spatial listeners
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

    // Auto-Pan listeners
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

            const duration = PAN_SPEEDS[effects.autoPan.speed].duration;
            autoPanVisual.style.setProperty('--pan-duration', `${duration}ms`);

            onChange(effects);
        });
    });

    // Methods
    panel.getEffects = () => effects;
    panel.setEffects = (newEffects) => {
        Object.assign(effects, newEffects);
        limiterToggle.checked = effects.limiter?.enabled || false;
        spatialToggle.checked = effects.spatial?.enabled || false;
        autoPanToggle.checked = effects.autoPan?.enabled || false;
        spatialWidth.value = effects.spatial?.width || 50;
        autoPanVisual.classList.toggle('animating', effects.autoPan?.enabled || false);

        if (effects.reverb) {
            reverbToggle.checked = effects.reverb.enabled || false;
            reverbMix.value = effects.reverb.mix || 25;
            panel.querySelector('#reverbMixValue').textContent = `${effects.reverb.mix || 25}%`;
            panel.querySelectorAll('.reverb-type-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.reverb === effects.reverb.type);
            });
        }

        if (effects.bassEnhancer) {
            bassEnhancerToggle.checked = effects.bassEnhancer.enabled || false;
            bassAmount.value = effects.bassEnhancer.amount || 40;
            bassFreq.value = effects.bassEnhancer.freq || 90;
            panel.querySelector('#bassAmountValue').textContent = `${effects.bassEnhancer.amount || 40}%`;
            panel.querySelector('#bassFreqValue').textContent = `${effects.bassEnhancer.freq || 90} Hz`;
        }
    };

    return panel;
}
