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
    DARK_MODE: 'darkMode',
    AI_AUTO_EQ: 'aiAutoEqEnabled',
    AI_CURRENT_GENRE: 'aiCurrentGenre',
    BOOST_ENABLED: 'boostEnabled',
    BOOST_MULTIPLIER: 'boostMultiplier',
    MAX_VOLUME_LIMIT: 'maxVolumeLimit'
};

export const AUDIO_CONFIG = {
    MIN_VOLUME: 0,
    MAX_VOLUME: 100,
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
    bandParams: {},
    boostEnabled: false,
    boostMultiplier: 2.0
};

export const SITE_SETTINGS_DEFAULT_CONFIG = {
    globalEnabled: true,
    autoApply: true
};

/**
 * AI Hybrid Auto-Genre Profiles & Tuned Acoustic Curves
 * Optimized for maximum listener impact based on genre-specific dynamics
 */
export const AI_GENRE_PROFILES = {
    'drill': {
        id: 'drill',
        name: 'Drill & 808 Trap',
        icon: '💣',
        desc: 'Sub-bass 808 sâu thẳm, dải treble hi-hat sắc nhọn, dìm lower-mid chống đục',
        bands: { '32': 6, '64': 5, '125': 2, '250': -2, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 4, '16k': 4 },
        effects: {
            limiter: { enabled: true, threshold: -4 },
            spatial: { enabled: false },
            bassEnhancer: { enabled: false }
        }
    },
    'edm_remix': {
        id: 'edm_remix',
        name: 'EDM & Vinahouse Remix',
        icon: '🎛️',
        desc: 'Kick nảy dứt khoát, âm trường chữ V mở rộng, synth bay bổng',
        bands: { '32': 5, '64': 6, '125': 4, '250': 0, '500': -2, '1k': 0, '2k': 2, '4k': 4, '8k': 5, '16k': 5 },
        effects: {
            spatial: { enabled: true, mode: 'wide', width: 60 },
            bassEnhancer: { enabled: true, amount: 35, freq: 90 },
            limiter: { enabled: true, threshold: -5 }
        }
    },
    'bass_boost': {
        id: 'bass_boost',
        name: 'Super Bass Boosted',
        icon: '🔊',
        desc: 'Tăng cường tối đa dải trầm, tổng hợp sóng hài sub-harmonic rung màng loa',
        bands: { '32': 9, '64': 8, '125': 5, '250': 2, '500': 0, '1k': 0, '2k': 1, '4k': 2, '8k': 2, '16k': 2 },
        effects: {
            bassEnhancer: { enabled: true, amount: 55, freq: 80 },
            limiter: { enabled: true, threshold: -5 }
        }
    },
    'kpop_vpop': {
        id: 'kpop_vpop',
        name: 'K-Pop & V-Pop Vocal',
        icon: '🎤',
        desc: 'Tập trung làm nổi bật giọng ca sĩ (Presence), bass nảy gọn gàng, âm sắc trong trẻo',
        bands: { '32': 2, '64': 3, '125': 2, '250': 0, '500': 1, '1k': 3, '2k': 4, '4k': 4, '8k': 3, '16k': 2 },
        effects: {
            reverb: { enabled: true, type: 'room', mix: 12 },
            spatial: { enabled: false },
            bassEnhancer: { enabled: false }
        }
    },
    'acoustic_ballad': {
        id: 'acoustic_ballad',
        name: 'Acoustic & Ballad Chill',
        icon: '🎸',
        desc: 'Âm thanh mộc mạc, dải trung trầm ấm áp, không gian phòng hòa nhạc sâu lắng',
        bands: { '32': 0, '64': 2, '125': 3, '250': 3, '500': 2, '1k': 2, '2k': 3, '4k': 2, '8k': 1, '16k': 1 },
        effects: {
            reverb: { enabled: true, type: 'hall', mix: 25 },
            spatial: { enabled: false },
            bassEnhancer: { enabled: false }
        }
    },
    'rock_metal': {
        id: 'rock_metal',
        name: 'Rock & Heavy Metal',
        icon: '🤘',
        desc: 'Tái tạo dàn guitar điện distortion và trống kích bùng nổ',
        bands: { '32': 5, '64': 5, '125': 3, '250': 1, '500': -2, '1k': 2, '2k': 4, '4k': 5, '8k': 6, '16k': 5 },
        effects: {
            limiter: { enabled: true, threshold: -4 }
        }
    },
    'cinema_podcast': {
        id: 'cinema_podcast',
        name: 'Cinema & Podcast',
        icon: '🎬',
        desc: 'Tối ưu độ rõ lời thoại (Dialogue Clarity) và hiệu ứng môi trường sống động',
        bands: { '32': -3, '64': -2, '125': 0, '250': 2, '500': 4, '1k': 6, '2k': 6, '4k': 4, '8k': 2, '16k': 0 },
        effects: {
            reverb: { enabled: false },
            limiter: { enabled: true, threshold: -6 }
        }
    }
};

/**
 * Metadata Keyword Dictionary for High-Speed Prior Estimation
 */
export const AI_GENRE_KEYWORDS = {
    drill: ['drill', 'uk drill', 'ny drill', 'chiraq', 'central cee', 'pop smoke', '808 drill'],
    edm_remix: ['edm', 'remix', 'vinahouse', 'vina house', 'club mix', 'dj', 'electro', 'festival', 'extended mix', 'dance music', 'bounce', 'house music'],
    bass_boost: ['bass boosted', 'bass boost', 'extreme bass', 'mega bass', 'sub bass test', 'deep bass', 'bass test'],
    kpop_vpop: ['kpop', 'k-pop', 'vpop', 'v-pop', 'blackpink', 'bts', 'newjeans', 'aespa', 'ive', 'sơn tùng', 'soobin', 'hieuthuhai', 'jack', 'mono', 'chúng ta của', 'official mv', 'mv', 'nhạc trẻ'],
    acoustic_ballad: ['acoustic', 'ballad', 'lofi', 'lo-fi', 'chillhop', 'piano cover', 'guitar cover', 'unplugged', 'nhạc nhẹ', 'thư giãn', 'ngủ ngon', 'sleep music'],
    rock_metal: ['rock', 'metal', 'heavy metal', 'hard rock', 'guitar solo', 'punk', 'linkin park', 'metallica', 'slipknot'],
    cinema_podcast: ['podcast', 'talkshow', 'talk show', 'audiobook', 'sách nói', 'phỏng vấn', 'review phim', 'trailer', 'documentary']
};

// Also attach to globalThis for scripts not using ES modules
if (typeof globalThis !== 'undefined') {
    globalThis.ZynoAudioConstants = {
        STORAGE_KEYS,
        AUDIO_CONFIG,
        DEFAULT_BANDS,
        DEFAULT_EFFECTS,
        DEFAULT_SETTINGS,
        SITE_SETTINGS_DEFAULT_CONFIG,
        AI_GENRE_PROFILES,
        AI_GENRE_KEYWORDS
    };
}
