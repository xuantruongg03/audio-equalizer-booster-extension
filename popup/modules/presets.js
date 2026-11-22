// Preset configurations v3.0 Pro - 35+ presets for all audio scenarios
// Gain values in dB (-12 to +12)

export const EQ_BANDS = [
    { key: '32', label: '32', freq: 32, desc: 'Sub-bass: Rung sâu, cảm nhận rung chấn' },
    { key: '64', label: '64', freq: 64, desc: 'Bass: Trống kick, độ nặng uy lực' },
    { key: '125', label: '125', freq: 125, desc: 'Low-mid: Độ ấm giọng nam, guitar trầm' },
    { key: '250', label: '250', freq: 250, desc: 'Warmth: Độ dày dặn & mượt mà' },
    { key: '500', label: '500', freq: 500, desc: 'Body: Thân âm thanh cơ bản' },
    { key: '1k', label: '1K', freq: 1000, desc: 'Presence: Giọng ca chính & nhạc cụ' },
    { key: '2k', label: '2K', freq: 2000, desc: 'Clarity: Độ sáng & rõ của lời hát' },
    { key: '4k', label: '4K', freq: 4000, desc: 'Definition: Độ sắc nét các phụ âm' },
    { key: '8k', label: '8K', freq: 8000, desc: 'Brilliance: Hi-hats, tiếng gõ kim loại' },
    { key: '16k', label: '16K', freq: 16000, desc: 'Air: Không gian thoáng đãng, lấp lánh' }
];

// Preset Categories
export const PRESET_CATEGORIES = {
    basic: 'Cơ bản',
    music: 'Thể loại nhạc',
    situation: 'Tình huống',
    device: 'Thiết bị',
    custom: 'Tùy chỉnh'
};

// Built-in presets
export const PRESETS = {
    // === ZYNO SIGNATURE & BASIC ===
    'zyno-signature': {
        name: 'Zyno Studio Signature',
        category: 'basic',
        iconName: 'zap',
        desc: 'Chất âm độc quyền Zyno - bass sâu, mid ấm, treble lấp lánh',
        bands: { '32': 7, '64': 5, '125': 2, '250': 1, '500': 0, '1k': 2, '2k': 4, '4k': 5, '8k': 6, '16k': 7 }
    },
    'zyno-sub-bass': {
        name: 'Zyno Sub-Bass Club',
        category: 'basic',
        iconName: 'headphones',
        desc: 'Tăng cường dải siêu trầm Zyno đánh căng tràn uy lực',
        bands: { '32': 11, '64': 9, '125': 5, '250': 2, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 4, '16k': 3 }
    },
    'flat': {
        name: 'Flat',
        category: 'basic',
        iconName: 'equal',
        desc: 'Âm thanh nguyên bản studio cân bằng',
        bands: { '32': 0, '64': 0, '125': 0, '250': 0, '500': 0, '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0 }
    },
    'bass-boost': {
        name: 'Bass Boost',
        category: 'basic',
        iconName: 'speaker',
        desc: 'Tăng cường âm trầm uy lực',
        bands: { '32': 10, '64': 8, '125': 6, '250': 4, '500': 2, '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0 }
    },
    'bass-boost-extreme': {
        name: 'Bass Extreme',
        category: 'basic',
        iconName: 'zap',
        desc: 'Bass rung chấn cực mạnh cho EDM, Trap',
        bands: { '32': 12, '64': 11, '125': 9, '250': 6, '500': 3, '1k': 0, '2k': -1, '4k': -1, '8k': 0, '16k': 1 }
    },
    'deep-bass-pro': {
        name: 'Deep Sub-Bass Pro',
        category: 'basic',
        iconName: 'disc',
        desc: 'Tập trung sub-bass tần số siêu thấp',
        bands: { '32': 12, '64': 9, '125': 4, '250': 1, '500': 0, '1k': 0, '2k': 1, '4k': 2, '8k': 2, '16k': 2 }
    },
    'vocal-booster': {
        name: 'Vocal Booster',
        category: 'basic',
        iconName: 'mic',
        desc: 'Làm nổi bật giọng hát và ca sĩ',
        bands: { '32': -2, '64': -1, '125': 0, '250': 2, '500': 4, '1k': 6, '2k': 6, '4k': 4, '8k': 2, '16k': 0 }
    },
    'treble-booster': {
        name: 'Treble Boost',
        category: 'basic',
        iconName: 'sparkles',
        desc: 'Tăng âm cao, tiếng gõ kim loại trong trẻo',
        bands: { '32': 0, '64': 0, '125': 0, '250': 0, '500': 2, '1k': 3, '2k': 5, '4k': 7, '8k': 9, '16k': 10 }
    },
    'loudness': {
        name: 'Loudness Contour',
        category: 'basic',
        iconName: 'speaker',
        desc: 'Tăng bass và treble khi nghe volume nhỏ',
        bands: { '32': 8, '64': 6, '125': 3, '250': 0, '500': -2, '1k': 0, '2k': 2, '4k': 5, '8k': 7, '16k': 8 }
    },
    'crystal-clarity': {
        name: 'Crystal Clarity',
        category: 'basic',
        iconName: 'sparkles',
        desc: 'Trong trẻo, giảm đục, nâng chi tiết',
        bands: { '32': -2, '64': 0, '125': -2, '250': -1, '500': 1, '1k': 3, '2k': 5, '4k': 6, '8k': 7, '16k': 8 }
    },

    // === MUSIC GENRES ===
    'pop': {
        name: 'Pop',
        category: 'music',
        iconName: 'music',
        desc: 'Nhạc Pop hiện đại, vocal trong, bass nảy',
        bands: { '32': 2, '64': 3, '125': 3, '250': 1, '500': 0, '1k': 2, '2k': 3, '4k': 4, '8k': 4, '16k': 2 }
    },
    'rock': {
        name: 'Rock',
        category: 'music',
        iconName: 'flame',
        desc: 'Nhạc Rock, guitar điện và dàn trống rực lửa',
        bands: { '32': 4, '64': 5, '125': 3, '250': 2, '500': -1, '1k': 2, '2k': 4, '4k': 5, '8k': 6, '16k': 5 }
    },
    'hip-hop': {
        name: 'Hip-Hop / Rap',
        category: 'music',
        iconName: 'headphones',
        desc: '808 Bass căng tràn, lời rap sắc sảo',
        bands: { '32': 8, '64': 7, '125': 5, '250': 3, '500': 0, '1k': 2, '2k': 3, '4k': 2, '8k': 3, '16k': 2 }
    },
    'edm': {
        name: 'EDM / Dance',
        category: 'music',
        iconName: 'disc',
        desc: 'Electronic Dance - Drop bass bùng nổ',
        bands: { '32': 10, '64': 8, '125': 5, '250': 2, '500': 0, '1k': -1, '2k': 1, '4k': 3, '8k': 5, '16k': 6 }
    },
    'jazz': {
        name: 'Jazz',
        category: 'music',
        iconName: 'music',
        desc: 'Jazz, kèn saxophone mượt mà & piano ấm',
        bands: { '32': 2, '64': 3, '125': 2, '250': 1, '500': -1, '1k': 0, '2k': 2, '4k': 4, '8k': 5, '16k': 4 }
    },
    'classical': {
        name: 'Classical',
        category: 'music',
        iconName: 'music',
        desc: 'Dàn nhạc giao hưởng thính phòng sống động',
        bands: { '32': 1, '64': 2, '125': 1, '250': 0, '500': -1, '1k': 0, '2k': 1, '4k': 3, '8k': 4, '16k': 5 }
    },
    'rnb': {
        name: 'R&B / Soul',
        category: 'music',
        iconName: 'music',
        desc: 'Âm thanh trầm ấm, giọng ca ngọt ngào',
        bands: { '32': 5, '64': 5, '125': 4, '250': 2, '500': 0, '1k': 2, '2k': 4, '4k': 3, '8k': 2, '16k': 1 }
    },
    'acoustic': {
        name: 'Acoustic / Unplugged',
        category: 'music',
        iconName: 'music',
        desc: 'Guitar mộc, bộ gõ nhẹ và vocal chân thực',
        bands: { '32': 1, '64': 2, '125': 3, '250': 2, '500': 1, '1k': 3, '2k': 4, '4k': 4, '8k': 3, '16k': 2 }
    },
    'metal': {
        name: 'Heavy Metal',
        category: 'music',
        iconName: 'flame',
        desc: 'Riff distortion dày dặn, double pedal uy lực',
        bands: { '32': 6, '64': 5, '125': 3, '250': 0, '500': -3, '1k': 2, '2k': 4, '4k': 6, '8k': 7, '16k': 5 }
    },
    'kpop': {
        name: 'K-Pop',
        category: 'music',
        iconName: 'mic',
        desc: 'Vocal sáng rõ nét, beat sôi động catchy',
        bands: { '32': 4, '64': 5, '125': 3, '250': 1, '500': 0, '1k': 3, '2k': 5, '4k': 5, '8k': 5, '16k': 4 }
    },
    'lofi': {
        name: 'Lo-Fi Chill',
        category: 'music',
        iconName: 'radio',
        desc: 'Vintage ấm áp, êm dịu thư giãn',
        bands: { '32': 4, '64': 5, '125': 4, '250': 2, '500': 1, '1k': 0, '2k': -1, '4k': -2, '8k': -3, '16k': -2 }
    },
    'live-concert': {
        name: 'Live Concert',
        category: 'music',
        iconName: 'landmark',
        desc: 'Cảm giác như đang đứng trước sân khấu lớn',
        bands: { '32': 5, '64': 6, '125': 4, '250': 1, '500': 0, '1k': 2, '2k': 4, '4k': 5, '8k': 6, '16k': 7 }
    },

    // === SITUATIONS ===
    'dialogue': {
        name: 'Dialogue Clarity',
        category: 'situation',
        iconName: 'mic',
        desc: 'Làm nổi bật lời thoại trong phim tài liệu & video',
        bands: { '32': -4, '64': -3, '125': -1, '250': 2, '500': 4, '1k': 6, '2k': 7, '4k': 5, '8k': 2, '16k': 0 }
    },
    'movie': {
        name: 'Movie / Cinema',
        category: 'situation',
        iconName: 'film',
        desc: 'Xem phim bom tấn - hiệu ứng cháy nổ & lời thoại rõ',
        bands: { '32': 6, '64': 5, '125': 3, '250': 0, '500': 1, '1k': 3, '2k': 4, '4k': 4, '8k': 5, '16k': 4 }
    },
    'cinema-immersion': {
        name: 'Cinema Immersion 3D',
        category: 'situation',
        iconName: 'film',
        desc: 'Trải nghiệm rạp chiếu phim vòm đỉnh cao',
        bands: { '32': 7, '64': 6, '125': 3, '250': 1, '500': 0, '1k': 2, '2k': 4, '4k': 6, '8k': 6, '16k': 5 }
    },
    'gaming': {
        name: 'Gaming Pro',
        category: 'situation',
        iconName: 'activity',
        desc: 'Nghe rõ tiếng bước chân (footsteps) và tiếng súng',
        bands: { '32': 5, '64': 6, '125': 3, '250': 0, '500': -2, '1k': 1, '2k': 4, '4k': 6, '8k': 6, '16k': 5 }
    },
    'podcast': {
        name: 'Podcast & Audiobooks',
        category: 'situation',
        iconName: 'mic',
        desc: 'Tối ưu độ trong trẻo cho giọng dẫn chương trình',
        bands: { '32': -5, '64': -3, '125': -1, '250': 2, '500': 4, '1k': 5, '2k': 5, '4k': 4, '8k': 2, '16k': 0 }
    },
    'meeting': {
        name: 'Video Meeting',
        category: 'situation',
        iconName: 'box',
        desc: 'Khử ồn trầm & tăng âm rõ cho Google Meet, Zoom',
        bands: { '32': -6, '64': -4, '125': -2, '250': 1, '500': 3, '1k': 5, '2k': 6, '4k': 5, '8k': 3, '16k': 1 }
    },
    'night': {
        name: 'Night Mode',
        category: 'situation',
        iconName: 'activity',
        desc: 'Nghe đêm khuya - cắt bass mạnh, âm dịu không chói tai',
        bands: { '32': -4, '64': -3, '125': -1, '250': 0, '500': 1, '1k': 2, '2k': 2, '4k': 1, '8k': 0, '16k': -1 }
    },
    'study': {
        name: 'Study / Focus',
        category: 'situation',
        iconName: 'box',
        desc: 'Âm thanh êm dịu, không gây mệt mỏi tai khi học tập',
        bands: { '32': -2, '64': -1, '125': 0, '250': 1, '500': 2, '1k': 2, '2k': 1, '4k': 0, '8k': -1, '16k': -2 }
    },
    'asmr-relax': {
        name: 'ASMR & Relax',
        category: 'situation',
        iconName: 'waves',
        desc: 'Tăng chi tiết thì thầm & âm thanh vi mô tinh tế',
        bands: { '32': -4, '64': -2, '125': 0, '250': 1, '500': 2, '1k': 4, '2k': 6, '4k': 7, '8k': 8, '16k': 8 }
    },

    // === DEVICE OPTIMIZATION ===
    'laptop': {
        name: 'Laptop Small Speakers',
        category: 'device',
        iconName: 'box',
        desc: 'Bù âm trầm & hạn chế rè loa cho laptop',
        bands: { '32': 7, '64': 6, '125': 4, '250': 2, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 2, '16k': 1 }
    },
    'headphone': {
        name: 'Over-Ear Headphones',
        category: 'device',
        iconName: 'headphones',
        desc: 'Âm thanh chuẩn audiophile cho tai nghe trùm đầu',
        bands: { '32': 3, '64': 4, '125': 3, '250': 1, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 3, '16k': 2 }
    },
    'earbuds': {
        name: 'In-Ear / AirPods',
        category: 'device',
        iconName: 'headphones',
        desc: 'Tối ưu độ cân bằng cho tai nghe nhét tai nhỏ',
        bands: { '32': 5, '64': 5, '125': 4, '250': 2, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 2, '16k': 1 }
    },
    'bluetooth': {
        name: 'Bluetooth Speaker',
        category: 'device',
        iconName: 'speaker',
        desc: 'Tăng cường chất âm cho loa bluetooth di động',
        bands: { '32': 6, '64': 5, '125': 4, '250': 2, '500': 0, '1k': 1, '2k': 2, '4k': 3, '8k': 4, '16k': 3 }
    }
};

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

export function getFlatBands() {
    return { '32': 0, '64': 0, '125': 0, '250': 0, '500': 0, '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0 };
}

export function clonePresetBands(presetKey) {
    if (PRESETS[presetKey]) {
        return { ...PRESETS[presetKey].bands };
    }
    return getFlatBands();
}
