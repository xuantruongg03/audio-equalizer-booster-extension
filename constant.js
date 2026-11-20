/**
 * Zyno Audio Equalizer & Booster Pro v3.0
 * Centralized Settings, Constants & Configurations
 */

export const STORAGE_KEYS = {
    SETTINGS: 'settings',
    MASTER_ENABLED: 'masterEnabled',
    SITE_SETTINGS: 'siteSettings',
    SITE_SETTINGS_CONFIG: 'siteSettingsConfig',
    USER_PRESETS: 'userPresets',
    HISTORY: 'eqHistory',
    DARK_MODE: 'darkMode'
};

export const AUDIO_CONFIG = {
    MIN_VOLUME: 0,
    MAX_VOLUME: 800,
    DEFAULT_VOLUME: 100,
    MIN_GAIN_DB: -24,
    MAX_GAIN_DB: 24,
    DEFAULT_RANGE_DB: 12,
    MAX_UNDO_DEPTH: 30,
    VISUALIZER_INTERVAL_MS: 45, // ~22 FPS
    DEBOUNCE_DELAY_MS: 120,
    DEFAULT_PRESET: 'flat',
    VERSION: '3.0.0'
};

export const DEFAULT_BANDS = {
    '32': 0,
    '64': 0,
    '125': 0,
    '250': 0,
    '500': 0,
    '1k': 0,
    '2k': 0,
    '4k': 0,
    '8k': 0,
    '16k': 0
};

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
        mode: 'wide',
        width: 50
    },
    autoPan: {
        enabled: false,
        speed: 'medium'
    },
    reverb: {
        enabled: false,
        type: 'hall',
        mix: 25
    },
    bassEnhancer: {
        enabled: false,
        amount: 40,
        freq: 90
    }
};

export const DEFAULT_SETTINGS = {
    enabled: false,
    volume: AUDIO_CONFIG.DEFAULT_VOLUME,
    preset: AUDIO_CONFIG.DEFAULT_PRESET,
    preamp: 0,
    pan: 0,
    mono: false,
    range: AUDIO_CONFIG.DEFAULT_RANGE_DB,
    bands: { ...DEFAULT_BANDS },
    effects: { ...DEFAULT_EFFECTS },
    bandParams: {}
};

export const SITE_SETTINGS_DEFAULT_CONFIG = {
    globalEnabled: true,
    autoApply: true
};

// Also attach to globalThis for scripts not using ES modules
if (typeof globalThis !== 'undefined') {
    globalThis.ZynoAudioConstants = {
        STORAGE_KEYS,
        AUDIO_CONFIG,
        DEFAULT_BANDS,
        DEFAULT_EFFECTS,
        DEFAULT_SETTINGS,
        SITE_SETTINGS_DEFAULT_CONFIG
    };
}
