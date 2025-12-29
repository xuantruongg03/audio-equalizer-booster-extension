// Preset configurations - 30+ presets for different use cases
// Gain values in dB (-12 to +12)

export const EQ_BANDS = [
    { key: '32', label: '32', freq: 32, desc: 'Sub-bass: Rung sâu, cảm nhận bằng cơ thể' },
    { key: '64', label: '64', freq: 64, desc: 'Bass: Trống bass, độ nặng của nhạc' },
    { key: '125', label: '125', freq: 125, desc: 'Low-mid: Độ dày giọng nam, guitar' },
    { key: '250', label: '250', freq: 250, desc: 'Warmth: Độ ấm áp, đầy đặn' },
    { key: '500', label: '500', freq: 500, desc: 'Body: Thân âm thanh chính' },
    { key: '1k', label: '1K', freq: 1000, desc: 'Presence: Giọng hát, độ hiện diện' },
    { key: '2k', label: '2K', freq: 2000, desc: 'Clarity: Độ rõ ràng giọng nói' },
    { key: '4k', label: '4K', freq: 4000, desc: 'Definition: Độ sắc nét, phụ âm s/t' },
    { key: '8k', label: '8K', freq: 8000, desc: 'Brilliance: Cymbal, hi-hat, độ sáng' },
    { key: '16k', label: '16K', freq: 16000, desc: 'Air: Không khí, độ thoáng' }
];

// Preset Categories
export const PRESET_CATEGORIES = {
    basic: 'Cơ bản',
    music: 'Thể loại nhạc',
    situation: 'Tình huống',
    device: 'Thiết bị',
    custom: 'Tùy chỉnh'
};

// Built-in presets organized by category
export const PRESETS = {
    // === BASIC ===
    'flat': {
        name: 'Flat',
        category: 'basic',
        icon: '⚖️',
        desc: 'Âm thanh nguyên bản, không chỉnh sửa',
        bands: { '32': 0, '64': 0, '125': 0, '250': 0, '500': 0, '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0 }
    },
    'bass-boost': {
        name: 'Bass Boost',
        category: 'basic',
        icon: '🔊',
        desc: 'Tăng cường âm trầm mạnh mẽ',
        bands: { '32': 10, '64': 8, '125': 6, '250': 4, '500': 2, '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0 }
    },
    'bass-boost-extreme': {
        name: 'Bass Extreme',
        category: 'basic',
        icon: '💥',
        desc: 'Bass cực mạnh cho EDM, Trap',
        bands: { '32': 12, '64': 11, '125': 9, '250': 6, '500': 3, '1k': 0, '2k': -1, '4k': -1, '8k': 0, '16k': 1 }
    },
    'vocal-booster': {
        name: 'Vocal Booster',
        category: 'basic',
        icon: '🎤',
        desc: 'Làm rõ giọng hát, thoại',
        bands: { '32': -2, '64': -1, '125': 0, '250': 2, '500': 4, '1k': 6, '2k': 6, '4k': 4, '8k': 2, '16k': 0 }
    },
    'treble-booster': {
        name: 'Treble Boost',
        category: 'basic',
        icon: '✨',
        desc: 'Tăng âm cao, sáng và trong',
        bands: { '32': 0, '64': 0, '125': 0, '250': 0, '500': 2, '1k': 3, '2k': 5, '4k': 7, '8k': 9, '16k': 10 }
    },
    'loudness': {
        name: 'Loudness',
        category: 'basic',
        icon: '📢',
        desc: 'Tăng bass và treble, cân bằng âm lượng thấp',
        bands: { '32': 8, '64': 6, '125': 3, '250': 0, '500': -2, '1k': 0, '2k': 2, '4k': 5, '8k': 7, '16k': 8 }
    },

    // === MUSIC GENRES ===
    'pop': {
        name: 'Pop',
        category: 'music',
        icon: '🎵',
        desc: 'Nhạc Pop, vocal rõ, bass vừa',
        bands: { '32': 2, '64': 3, '125': 3, '250': 1, '500': 0, '1k': 2, '2k': 3, '4k': 4, '8k': 4, '16k': 2 }
    },
    'rock': {
        name: 'Rock',
        category: 'music',
        icon: '🎸',
        desc: 'Nhạc Rock, guitar nổi bật',
        bands: { '32': 4, '64': 5, '125': 3, '250': 2, '500': -1, '1k': 2, '2k': 4, '4k': 5, '8k': 6, '16k': 5 }
    },
    'hip-hop': {
        name: 'Hip-Hop',
        category: 'music',
        icon: '🎧',
        desc: 'Hip-hop, Rap - bass nặng, vocal rõ',
        bands: { '32': 8, '64': 7, '125': 5, '250': 3, '500': 0, '1k': 2, '2k': 3, '4k': 2, '8k': 3, '16k': 2 }
    },
    'edm': {
        name: 'EDM',
        category: 'music',
        icon: '🎛️',
        desc: 'Electronic Dance Music',
        bands: { '32': 10, '64': 8, '125': 5, '250': 2, '500': 0, '1k': -1, '2k': 1, '4k': 3, '8k': 5, '16k': 6 }
    },
    'jazz': {
        name: 'Jazz',
        category: 'music',
        icon: '🎷',
        desc: 'Jazz, nhạc cụ hơi, piano',
        bands: { '32': 2, '64': 3, '125': 2, '250': 1, '500': -1, '1k': 0, '2k': 2, '4k': 4, '8k': 5, '16k': 4 }
    },
    'classical': {
        name: 'Classical',
        category: 'music',
        icon: '🎻',
        desc: 'Nhạc cổ điển, dàn nhạc',
        bands: { '32': 1, '64': 2, '125': 1, '250': 0, '500': -1, '1k': 0, '2k': 1, '4k': 3, '8k': 4, '16k': 5 }
    },
    'rnb': {
        name: 'R&B / Soul',
        category: 'music',
        icon: '💜',
        desc: 'R&B, Soul - bass ấm, vocal ngọt',
        bands: { '32': 5, '64': 5, '125': 4, '250': 2, '500': 0, '1k': 2, '2k': 4, '4k': 3, '8k': 2, '16k': 1 }
    },
    'acoustic': {
        name: 'Acoustic',
        category: 'music',
        icon: '🪕',
        desc: 'Nhạc acoustic, guitar, vocal',
        bands: { '32': 1, '64': 2, '125': 3, '250': 2, '500': 1, '1k': 3, '2k': 4, '4k': 4, '8k': 3, '16k': 2 }
    },
    'metal': {
        name: 'Metal',
        category: 'music',
        icon: '🤘',
        desc: 'Heavy Metal, guitar nặng',
        bands: { '32': 6, '64': 5, '125': 3, '250': 0, '500': -3, '1k': 2, '2k': 4, '4k': 6, '8k': 7, '16k': 5 }
    },
    'reggae': {
        name: 'Reggae',
        category: 'music',
        icon: '🏝️',
        desc: 'Reggae, Dub - bass nổi bật',
        bands: { '32': 7, '64': 6, '125': 4, '250': 2, '500': -2, '1k': 0, '2k': -1, '4k': 2, '8k': 4, '16k': 3 }
    },
    'country': {
        name: 'Country',
        category: 'music',
        icon: '🤠',
        desc: 'Country, Folk - guitar, vocal',
        bands: { '32': 2, '64': 3, '125': 4, '250': 3, '500': 1, '1k': 2, '2k': 4, '4k': 5, '8k': 4, '16k': 3 }
    },
    'latin': {
        name: 'Latin',
        category: 'music',
        icon: '💃',
        desc: 'Latin, Salsa, Reggaeton',
        bands: { '32': 6, '64': 5, '125': 3, '250': 1, '500': -1, '1k': 2, '2k': 3, '4k': 4, '8k': 5, '16k': 4 }
    },
    'kpop': {
        name: 'K-Pop',
        category: 'music',
        icon: '🇰🇷',
        desc: 'K-Pop - vocal sáng, bass punch',
        bands: { '32': 4, '64': 5, '125': 3, '250': 1, '500': 0, '1k': 3, '2k': 5, '4k': 5, '8k': 5, '16k': 4 }
    },
    'lofi': {
        name: 'Lo-Fi',
        category: 'music',
        icon: '📻',
        desc: 'Lo-Fi, Chill - ấm áp, mềm mại',
        bands: { '32': 4, '64': 5, '125': 4, '250': 2, '500': 1, '1k': 0, '2k': -1, '4k': -2, '8k': -3, '16k': -2 }
    },

    // === SITUATIONS ===
    'dialogue': {
        name: 'Dialogue Clarity',
        category: 'situation',
        icon: '💬',
        desc: 'Xem phim - làm rõ lời thoại',
        bands: { '32': -4, '64': -3, '125': -1, '250': 2, '500': 4, '1k': 6, '2k': 7, '4k': 5, '8k': 2, '16k': 0 }
    },
    'movie': {
        name: 'Movie / Cinema',
        category: 'situation',
        icon: '🎬',
        desc: 'Xem phim - cân bằng action và thoại',
        bands: { '32': 5, '64': 4, '125': 2, '250': 0, '500': 1, '1k': 3, '2k': 4, '4k': 3, '8k': 4, '16k': 3 }
    },
    'gaming': {
        name: 'Gaming',
        category: 'situation',
        icon: '🎮',
        desc: 'Chơi game - bass impact, footsteps rõ',
        bands: { '32': 5, '64': 6, '125': 3, '250': 0, '500': -2, '1k': 0, '2k': 3, '4k': 5, '8k': 6, '16k': 5 }
    },
    'podcast': {
        name: 'Podcast',
        category: 'situation',
        icon: '🎙️',
        desc: 'Nghe podcast, audiobook',
        bands: { '32': -5, '64': -3, '125': -1, '250': 2, '500': 4, '1k': 5, '2k': 5, '4k': 4, '8k': 2, '16k': 0 }
    },
    'night': {
        name: 'Night Mode',
        category: 'situation',
        icon: '🌙',
        desc: 'Nghe đêm - giảm bass, âm nhẹ nhàng',
        bands: { '32': -3, '64': -2, '125': -1, '250': 0, '500': 1, '1k': 2, '2k': 2, '4k': 1, '8k': 0, '16k': -1 }
    },
    'meeting': {
        name: 'Video Meeting',
        category: 'situation',
        icon: '💼',
        desc: 'Họp online - giọng nói rõ ràng',
        bands: { '32': -6, '64': -4, '125': -2, '250': 1, '500': 3, '1k': 5, '2k': 6, '4k': 5, '8k': 3, '16k': 1 }
    },
    'study': {
        name: 'Study / Focus',
        category: 'situation',
        icon: '📚',
        desc: 'Học tập, tập trung - âm thanh êm dịu',
        bands: { '32': -2, '64': -1, '125': 0, '250': 1, '500': 2, '1k': 2, '2k': 1, '4k': 0, '8k': -1, '16k': -2 }
    },

    // === DEVICE OPTIMIZATION ===
    'laptop': {
        name: 'Laptop Speakers',
        category: 'device',
        icon: '💻',
        desc: 'Tối ưu cho loa laptop nhỏ',
        bands: { '32': 8, '64': 7, '125': 5, '250': 3, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 2, '16k': 1 }
    },
    'headphone': {
        name: 'Headphones',
        category: 'device',
        icon: '🎧',
        desc: 'Tối ưu cho tai nghe',
        bands: { '32': 3, '64': 4, '125': 3, '250': 1, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 3, '16k': 2 }
    },
    'earbuds': {
        name: 'Earbuds',
        category: 'device',
        icon: '👂',
        desc: 'Tối ưu cho earbuds, airpods',
        bands: { '32': 5, '64': 5, '125': 4, '250': 2, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 2, '16k': 1 }
    },
    'bluetooth': {
        name: 'Bluetooth Speaker',
        category: 'device',
        icon: '📱',
        desc: 'Tối ưu cho loa bluetooth',
        bands: { '32': 6, '64': 5, '125': 4, '250': 2, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 4, '16k': 3 }
    }
};

// Get presets grouped by category
export function getPresetsByCategory() {
    const grouped = {};

    for (const [key, preset] of Object.entries(PRESETS)) {
        const category = preset.category || 'basic';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push({ key, ...preset });
    }

    return grouped;
}

// Get flat bands (all zeros)
export function getFlatBands() {
    return { '32': 0, '64': 0, '125': 0, '250': 0, '500': 0, '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0 };
}

// Clone preset bands
export function clonePresetBands(presetKey) {
    if (PRESETS[presetKey]) {
        return { ...PRESETS[presetKey].bands };
    }
    return getFlatBands();
}
