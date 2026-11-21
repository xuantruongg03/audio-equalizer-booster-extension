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
        desc: 'Sub-bass 808 siêu sâu (+9dB), dải treble hi-hat sắc bén (+7dB), gọt sạch dải low-mid chống đục',
        bands: { '32': 9, '64': 8, '125': 3, '250': -3, '500': -1, '1k': 1, '2k': 3, '4k': 4, '8k': 6, '16k': 7 },
        effects: {
            limiter: { enabled: true, threshold: -4 },
            spatial: { enabled: false },
            bassEnhancer: { enabled: true, amount: 40, freq: 65 }
        }
    },
    'edm_remix': {
        id: 'edm_remix',
        name: 'EDM & Vinahouse Remix',
        icon: '🎛️',
        desc: 'Kick nảy tức thì (+9dB), V-shape scoop mở rộng âm trường, treble sáng bừng (+8dB)',
        bands: { '32': 7, '64': 9, '125': 6, '250': 0, '500': -4, '1k': -1, '2k': 3, '4k': 6, '8k': 8, '16k': 8 },
        effects: {
            spatial: { enabled: true, mode: 'wide', width: 65 },
            bassEnhancer: { enabled: true, amount: 45, freq: 85 },
            limiter: { enabled: true, threshold: -5 }
        }
    },
    'bass_boost': {
        id: 'bass_boost',
        name: 'Super Bass Boosted',
        icon: '🔊',
        desc: 'Tăng cường cực đại dải trầm (+12dB), rung chuyển màng loa, dày dặn và uy lực',
        bands: { '32': 12, '64': 10, '125': 7, '250': 3, '500': 0, '1k': 0, '2k': 1, '4k': 2, '8k': 3, '16k': 3 },
        effects: {
            bassEnhancer: { enabled: true, amount: 65, freq: 75 },
            limiter: { enabled: true, threshold: -6 }
        }
    },
    'kpop_vpop': {
        id: 'kpop_vpop',
        name: 'K-Pop & V-Pop Vocal',
        icon: '🎤',
        desc: 'Nâng giọng ca sĩ rõ nét (+7dB Presence), bass đập dứt khoát (+5dB), âm sắc trong suốt',
        bands: { '32': 3, '64': 5, '125': 3, '250': -2, '500': 1, '1k': 5, '2k': 7, '4k': 6, '8k': 5, '16k': 4 },
        effects: {
            reverb: { enabled: true, type: 'room', mix: 10 },
            spatial: { enabled: false },
            bassEnhancer: { enabled: false },
            limiter: { enabled: true, threshold: -3 }
        }
    },
    'acoustic_ballad': {
        id: 'acoustic_ballad',
        name: 'Acoustic & Ballad Chill',
        icon: '🎸',
        desc: 'Mộc mạc ấm áp (+5dB dải mid-trầm), hòa âm phòng hòa nhạc mượt mà, thư thái',
        bands: { '32': -2, '64': 2, '125': 5, '250': 5, '500': 4, '1k': 3, '2k': 4, '4k': 3, '8k': 2, '16k': 1 },
        effects: {
            reverb: { enabled: true, type: 'hall', mix: 20 },
            spatial: { enabled: false },
            bassEnhancer: { enabled: false }
        }
    },
    'rock_metal': {
        id: 'rock_metal',
        name: 'Rock & Heavy Metal',
        icon: '🤘',
        desc: 'Guitar điện distortion uy lực (+7dB), snare đanh chắc, kick xuyên phá',
        bands: { '32': 6, '64': 7, '125': 4, '250': 1, '500': -3, '1k': 3, '2k': 6, '4k': 7, '8k': 8, '16k': 7 },
        effects: {
            limiter: { enabled: true, threshold: -4 }
        }
    },
    'cinema_podcast': {
        id: 'cinema_podcast',
        name: 'Cinema & Podcast',
        icon: '🎬',
        desc: 'Tăng cường hội thoại siêu rõ nét (+8dB Dialogue), lọc sạch tạp âm ù nền',
        bands: { '32': -6, '64': -4, '125': 0, '250': 2, '500': 6, '1k': 8, '2k': 8, '4k': 6, '8k': 3, '16k': 0 },
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
    drill: ['drill', 'uk drill', 'ny drill', 'chiraq', 'central cee', 'pop smoke', '808 drill', 'fivio', 'digga d', 'russ millions', 'drill viet', 'vn drill', 'viet drill', 'drill remix', 'drill hot', 'trap drill', '808 trap', 'vietnamese drill'],
    edm_remix: ['edm', 'remix', 'vinahouse', 'vina house', 'club mix', 'dj', 'electro', 'festival', 'extended mix', 'dance music', 'bounce', 'house music', 'nonstop', 'non stop', 'lk nhac tre', 'mashup', 'trap', 'dubstep', 'hardstyle', 'rave', 'electronic', 'future bass', 'bass house', 'alan walker', 'marshmello', 'martin garrix', 'avicii', 'tiesto', 'skrillex', 'dj snake', 'chainsmokers', 'calvin harris', 'illenium', 'dai meo', 'dj minh tri'],
    bass_boost: ['bass boosted', 'bass boost', 'extreme bass', 'mega bass', 'sub bass test', 'deep bass', 'bass test', 'sieu tram', 'siêu trầm', 'bass cuc manh', 'bass cực mạnh', 'tang bass', 'tăng bass', 'cuc cang', 'cực căng', 'dap rung', 'đập rung', 'super bass'],
    kpop_vpop: ['kpop', 'k-pop', 'vpop', 'v-pop', 'blackpink', 'bts', 'newjeans', 'aespa', 'ive', 'son tung', 'sơn tùng', 'soobin', 'hieuthuhai', 'jack', 'mono', 'chung ta cua', 'chúng ta của', 'nhac tre', 'nhạc trẻ', 'twice', 'stray kids', 'itzy', 'le sserafim', 'seventeen', 'gidle', 'g-idle', 'exo', 'red velvet', 'iu', 'taeyeon', 'jungkook', 'jimin', 'lisa', 'jennie', 'rose', 'jisoo', 'ca si vu', 'ca sĩ vũ', 'hoang dung', 'hoàng dũng', 'den vau', 'đen vâu', 'tlinh', 'mck', 'wren evans', 'phuong ly', 'phương ly', 'bich phuong', 'bích phương', 'min', 'erik', 'duc phuc', 'đức phúc', 'hoa minzy', 'hòa minzy', 'truc nhan', 'trúc nhân', 'van mai huong', 'văn mai hương', 'bui anh tuan', 'bùi anh tuấn', 'ha anh tuan', 'hà anh tuấn', 'phan manh quynh', 'phan mạnh quỳnh', 'karik', 'justatee', 'rhymastic', 'low g', 'tage', '24k.right'],
    acoustic_ballad: ['acoustic', 'ballad', 'lofi', 'lo-fi', 'chillhop', 'piano cover', 'guitar cover', 'unplugged', 'nhac nhe', 'nhạc nhẹ', 'thu gian', 'thư giãn', 'ngu ngon', 'ngủ ngon', 'sleep music', 'nhac chill', 'lofi chill', 'nhac cafe', 'nhac buon', 'nhạc buồn', 'tam trang', 'tâm trạng', 'guitar', 'piano', 'sad song'],
    rock_metal: ['rock', 'metal', 'heavy metal', 'hard rock', 'guitar solo', 'punk', 'linkin park', 'metallica', 'slipknot', 'alt rock', 'indie rock', 'rock band', 'metal band', 'greenday', 'green day', 'guns n roses', 'acdc', 'ac/dc'],
    cinema_podcast: ['podcast', 'talkshow', 'talk show', 'audiobook', 'sach noi', 'sách nói', 'phong van', 'phỏng vấn', 'review phim', 'trailer', 'documentary', 'tin tuc', 'tin tức', 'thoi su', 'thời sự', 'vlog', 'reaction', 'chia se', 'chia sẻ', 'phim hay', 'phim moi', 'movie', 'film']
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
