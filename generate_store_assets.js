const fs = require('fs');
const path = require('path');
const sharp = require('d:/Github/zyno/node_modules/sharp');

const rootDir = __dirname;
const iconsDir = path.join(rootDir, 'icons');
const logoDir = path.join(rootDir, 'logo');
const outDir = path.join(rootDir, 'store_assets');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

async function regenerateAllStoreAssets() {
    console.log('Generating Chrome Web Store Graphic Assets using the ORIGINAL logo...');

    // 1. Ensure icon256.png exists from the original logo.png
    const logoPath = path.join(logoDir, 'logo.png');
    const icon256Path = path.join(iconsDir, 'icon256.png');
    if (fs.existsSync(logoPath)) {
        await sharp(logoPath).resize(256, 256).png().toFile(icon256Path);
        console.log('  ✓ Verified icons/icon256.png from original logo.png');
    }

    // 2. Load original icon128 as base64
    const icon128Base64 = fs.readFileSync(path.join(iconsDir, 'icon128.png')).toString('base64');
    const iconSrc = `data:image/png;base64,${icon128Base64}`;

    // ==========================================
    // 1. Small Promo Tile (440 x 280)
    // ==========================================
    const smallPromoSvg = `
    <svg width="440" height="280" viewBox="0 0 440 280" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#040817"/>
                <stop offset="50%" stop-color="#081432"/>
                <stop offset="100%" stop-color="#02050E"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        <rect width="440" height="280" fill="url(#bgGrad)"/>

        <!-- Grid Pattern Overlay -->
        <g opacity="0.08" stroke="#00f0dc" stroke-width="1">
            <line x1="0" y1="40" x2="440" y2="40"/><line x1="0" y1="80" x2="440" y2="80"/><line x1="0" y1="120" x2="440" y2="120"/>
            <line x1="0" y1="160" x2="440" y2="160"/><line x1="0" y1="200" x2="440" y2="200"/><line x1="0" y1="240" x2="440" y2="240"/>
            <line x1="60" y1="0" x2="60" y2="280"/><line x1="120" y1="0" x2="120" y2="280"/><line x1="180" y1="0" x2="180" y2="280"/>
            <line x1="240" y1="0" x2="240" y2="280"/><line x1="300" y1="0" x2="300" y2="280"/><line x1="360" y1="0" x2="360" y2="280"/><line x1="420" y1="0" x2="420" y2="280"/>
        </g>

        <!-- Outer Border -->
        <rect x="1" y="1" width="438" height="278" rx="8" fill="none" stroke="rgba(0, 240, 220, 0.4)" stroke-width="2"/>

        <!-- Ambient Glow Circle -->
        <circle cx="220" cy="90" r="70" fill="#00f0dc" opacity="0.18" filter="url(#glow)"/>

        <!-- Original App Icon -->
        <image href="${iconSrc}" x="175" y="42" width="90" height="90"/>

        <!-- App Title -->
        <text x="220" y="162" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">ZYNO AUDIO PRO</text>

        <!-- Subtitle -->
        <text x="220" y="186" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#00f0dc" text-anchor="middle" letter-spacing="0.8">10-BAND EQUALIZER &amp; 800% BOOSTER</text>

        <!-- Feature Pills Row -->
        <g transform="translate(25, 216)">
            <rect x="0" y="0" width="92" height="26" rx="6" fill="rgba(0, 240, 220, 0.15)" stroke="rgba(0, 240, 220, 0.5)" stroke-width="1"/>
            <text x="46" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#00f0dc" text-anchor="middle">🎚️ 10-Band DSP</text>

            <rect x="98" y="0" width="92" height="26" rx="6" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.5)" stroke-width="1"/>
            <text x="144" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#F59E0B" text-anchor="middle">🔊 800% Boost</text>

            <rect x="196" y="0" width="94" height="26" rx="6" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.5)" stroke-width="1"/>
            <text x="243" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#C084FC" text-anchor="middle">✨ AI Auto-EQ</text>

            <rect x="296" y="0" width="94" height="26" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="rgba(56, 189, 248, 0.5)" stroke-width="1"/>
            <text x="343" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#38BDF8" text-anchor="middle">🎧 7D Spatial</text>
        </g>
    </svg>`;

    await sharp(Buffer.from(smallPromoSvg)).png().toFile(path.join(outDir, 'small_promo_440x280.png'));
    console.log('  ✓ Created small_promo_440x280.png');

    // ==========================================
    // 2. Marquee Promo Tile (1400 x 560)
    // ==========================================
    const marqueePromoSvg = `
    <svg width="1400" height="560" viewBox="0 0 1400 560" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="mBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#040817"/>
                <stop offset="45%" stop-color="#081432"/>
                <stop offset="100%" stop-color="#02050E"/>
            </linearGradient>
            <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#FFFFFF"/>
                <stop offset="50%" stop-color="#00f0dc"/>
                <stop offset="100%" stop-color="#38bdf8"/>
            </linearGradient>
            <filter id="mGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="20" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        <rect width="1400" height="560" fill="url(#mBgGrad)"/>

        <!-- Grid Lines -->
        <g opacity="0.06" stroke="#00f0dc" stroke-width="1">
            <line x1="0" y1="80" x2="1400" y2="80"/><line x1="0" y1="160" x2="1400" y2="160"/><line x1="0" y1="240" x2="1400" y2="240"/>
            <line x1="0" y1="320" x2="1400" y2="320"/><line x1="0" y1="400" x2="1400" y2="400"/><line x1="0" y1="480" x2="1400" y2="480"/>
            <line x1="150" y1="0" x2="150" y2="560"/><line x1="300" y1="0" x2="300" y2="560"/><line x1="450" y1="0" x2="450" y2="560"/>
            <line x1="600" y1="0" x2="600" y2="560"/><line x1="750" y1="0" x2="750" y2="560"/><line x1="900" y1="0" x2="900" y2="560"/>
            <line x1="1050" y1="0" x2="1050" y2="560"/><line x1="1200" y1="0" x2="1200" y2="560"/>
        </g>

        <!-- Ambient Glow behind icon -->
        <circle cx="1060" cy="280" r="160" fill="#00f0dc" opacity="0.15" filter="url(#mGlow)"/>

        <!-- Left Content -->
        <g transform="translate(100, 85)">
            <rect x="0" y="0" width="350" height="34" rx="17" fill="rgba(0, 240, 220, 0.12)" stroke="rgba(0, 240, 220, 0.4)" stroke-width="1.5"/>
            <text x="175" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc" text-anchor="middle" letter-spacing="1">⚡ STUDIO GRADE WEB AUDIO DSP ENGINE • PRO v3.0</text>

            <text x="0" y="95" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="900" fill="url(#textGrad)" letter-spacing="-1">ZYNO AUDIO PRO</text>
            <text x="0" y="142" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="#F8FAFC">Bộ Cân Bằng Âm Thanh 10-Band &amp; Khuếch Đại Âm Lượng 800%</text>

            <text x="0" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15.5" font-weight="400" fill="#94A3B8">Nâng tầm âm thanh mọi tab: YouTube, Spotify, Netflix, Zing MP3... Tự động nhận diện thể loại với AI,</text>
            <text x="0" y="206" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15.5" font-weight="400" fill="#94A3B8">hiệu ứng Reverb phòng thu, Sub-bass bùng nổ, âm thanh vòm 7D sống động và chống vỡ tiếng an toàn.</text>

            <g transform="translate(0, 242)">
                <rect x="0" y="0" width="280" height="66" rx="10" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(0, 240, 220, 0.3)" stroke-width="1"/>
                <text x="16" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#00f0dc">🎚️ 10-Band Parametric DSP</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">Lọc tần số 32Hz - 16kHz &amp; đồ thị Curve</text>

                <rect x="300" y="0" width="280" height="66" rx="10" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1"/>
                <text x="316" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#F59E0B">🔊 Volume Booster 800%</text>
                <text x="316" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">Khuếch đại video nhỏ, Limiter chống rè</text>

                <rect x="0" y="80" width="280" height="66" rx="10" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1"/>
                <text x="16" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#C084FC">✨ AI Smart Auto-Genre</text>
                <text x="16" y="128" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">Tự động nhận diện Drill, EDM, V-Pop, Cinema</text>

                <rect x="300" y="80" width="280" height="66" rx="10" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1"/>
                <text x="316" y="108" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="#38BDF8">🏛️ Studio Effects &amp; 7D Audio</text>
                <text x="316" y="128" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">Reverb phòng hòa nhạc &amp; Xoay vòng 7D</text>
            </g>
        </g>

        <!-- Right Side: Big Original Icon + Hologram -->
        <g transform="translate(930, 140)">
            <rect x="0" y="0" width="280" height="280" rx="36" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(0, 240, 220, 0.5)" stroke-width="3" filter="url(#mGlow)"/>
            <image href="${iconSrc}" x="60" y="45" width="160" height="160"/>
            <text x="140" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#00f0dc" text-anchor="middle" letter-spacing="2">STUDIO DSP ACTIVE</text>
            <text x="140" y="258" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94A3B8" text-anchor="middle">ZERO LATENCY • 100% PRIVATE</text>
        </g>
    </svg>`;

    await sharp(Buffer.from(marqueePromoSvg)).png().toFile(path.join(outDir, 'marquee_promo_1400x560.png'));
    console.log('  ✓ Created marquee_promo_1400x560.png');

    // ==========================================
    // 3. Screenshot 1: 10-Band Studio DSP Equalizer (1280 x 800)
    // ==========================================
    const ss1Svg = `
    <svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#040817"/>
                <stop offset="50%" stop-color="#081432"/>
                <stop offset="100%" stop-color="#030612"/>
            </linearGradient>
            <linearGradient id="hudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#0A142D"/>
                <stop offset="100%" stop-color="#040A18"/>
            </linearGradient>
            <linearGradient id="cyanArc" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#00f0dc"/>
                <stop offset="100%" stop-color="#0080ff"/>
            </linearGradient>
            <filter id="glow1" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>
        <rect width="1280" height="800" fill="url(#bgGrad1)"/>
        
        <rect x="0" y="0" width="1280" height="70" fill="#081226" stroke="rgba(0, 240, 220, 0.2)" stroke-width="1"/>
        <image href="${iconSrc}" x="30" y="15" width="40" height="40"/>
        <text x="85" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF">ZYNO AUDIO PRO</text>
        <text x="270" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#00f0dc">| Tính Năng 1: Bộ Lọc Âm Thanh 10-Band Chuyên Nghiệp &amp; Phổ Tần Số Thời Gian Thực</text>

        <!-- Left Column -->
        <g transform="translate(50, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(8, 18, 40, 0.7)" stroke="rgba(0, 240, 220, 0.25)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc" letter-spacing="1">🎛️ STUDIO EQUALIZER</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Kiểm Soát Tần Số</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="95" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🎚️ 10 Dải Tần Độc Lập</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">32Hz, 64Hz, 125Hz, 250Hz, 500Hz,</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">1kHz, 2kHz, 4kHz, 8kHz, 16kHz</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Căn chỉnh cực chuẩn cho mọi thể loại nhạc</text>

                <rect x="0" y="110" width="264" height="95" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">📈 Đồ Thị Curve DSP</text>
                <text x="16" y="158" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">Chuyển đổi giữa núm xoay Knobs</text>
                <text x="16" y="176" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">và đồ thị đáp tuyến tần số Biquad</text>
                <text x="16" y="194" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Kéo thả điểm nút tần số trực quan</text>

                <rect x="0" y="220" width="264" height="95" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="246" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🎛️ Master Channel Strip</text>
                <text x="16" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">Stereo Pan L/R điều chỉnh âm trường,</text>
                <text x="16" y="286" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">Preamp Gain (-12dB đến +12dB),</text>
                <text x="16" y="304" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Mono Summing kiểm tra độ lệch pha</text>

                <rect x="0" y="330" width="264" height="95" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="356" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">⚖️ Thang Đo Biên Độ Linh Hoạt</text>
                <text x="16" y="378" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">Tùy chọn thang đo ±6dB, ±12dB</text>
                <text x="16" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">hoặc ±24dB cho phép boost mạnh mẽ</text>
                <text x="16" y="414" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Nút Flat Reset đưa nhanh về 0dB</text>

                <rect x="0" y="440" width="264" height="95" rx="10" fill="rgba(0, 240, 220, 0.12)" stroke="rgba(0, 240, 220, 0.4)" stroke-width="1"/>
                <text x="16" y="466" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">⚡ Zero Latency DSP</text>
                <text x="16" y="488" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">Độ trễ xử lý dưới 2ms, không gây lệch hình</text>
                <text x="16" y="506" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">khi xem phim hoặc livestream</text>
                <text x="16" y="524" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">100% Hoạt động mượt mà 60 FPS</text>
            </g>
        </g>

        <!-- Main HUD Center Box -->
        <g transform="translate(390, 100)">
            <rect x="0" y="0" width="480" height="660" rx="16" fill="url(#hudGrad)" stroke="rgba(0, 240, 220, 0.4)" stroke-width="2"/>
            
            <rect x="0" y="0" width="480" height="52" rx="16" fill="rgba(0, 240, 220, 0.1)"/>
            <image href="${iconSrc}" x="14" y="12" width="28" height="28"/>
            <text x="50" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">Zyno Audio Pro</text>
            <rect x="175" y="16" width="36" height="18" rx="9" fill="rgba(0, 240, 220, 0.2)"/>
            <text x="193" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#00f0dc" text-anchor="middle">v3.0</text>
            
            <rect x="360" y="14" width="44" height="24" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38BDF8" stroke-width="1"/>
            <text x="382" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#38BDF8" text-anchor="middle">A/B</text>
            
            <circle cx="445" cy="26" r="12" fill="#10B981" filter="url(#glow1)"/>
            <circle cx="445" cy="26" r="5" fill="#FFFFFF"/>

            <!-- Status Bar -->
            <g transform="translate(16, 62)">
                <rect x="0" y="0" width="448" height="34" rx="8" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <circle cx="16" cy="17" r="5" fill="#10B981"/>
                <text x="28" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#10B981">Đang bật</text>
                <text x="85" y="21" font-family="monospace" font-size="11.5" font-weight="600" fill="#38BDF8">youtube.com</text>
                <text x="432" y="21" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#00f0dc" text-anchor="end">Cấu hình riêng ✓</text>
            </g>

            <!-- AI Bar -->
            <g transform="translate(16, 104)">
                <rect x="0" y="0" width="448" height="30" rx="8" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" stroke-width="1"/>
                <text x="14" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="800" fill="#C084FC">✨ AI Auto-EQ: Đang Tối Ưu (Pop / Vocal Clarity)</text>
                <rect x="380" y="6" width="56" height="18" rx="9" fill="#10B981"/>
                <text x="408" y="19" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" text-anchor="middle">BẬT</text>
            </g>

            <!-- Nav Tabs -->
            <g transform="translate(16, 142)">
                <rect x="0" y="0" width="144" height="28" rx="6" fill="#00f0dc"/>
                <text x="72" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="800" fill="#040817" text-anchor="middle">🎛️ Equalizer</text>

                <rect x="152" y="0" width="144" height="28" rx="6" fill="rgba(15, 23, 42, 0.6)"/>
                <text x="224" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#94A3B8" text-anchor="middle">✨ Studio Effects</text>

                <rect x="304" y="0" width="144" height="28" rx="6" fill="rgba(15, 23, 42, 0.6)"/>
                <text x="376" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#94A3B8" text-anchor="middle">📁 Presets</text>
            </g>

            <!-- Master Volume -->
            <g transform="translate(16, 180)">
                <rect x="0" y="0" width="448" height="42" rx="8" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="14" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#FFFFFF">🔊 Master Volume</text>
                <text x="135" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc">100%</text>
                <rect x="180" y="18" width="250" height="7" rx="3.5" fill="rgba(255, 255, 255, 0.1)"/>
                <rect x="180" y="18" width="125" height="7" rx="3.5" fill="url(#cyanArc)"/>
                <circle cx="305" cy="21.5" r="8" fill="#00f0dc" filter="url(#glow1)"/>
            </g>

            <!-- 10 Knobs Equalizer Layout -->
            <g transform="translate(16, 232)">
                <rect x="0" y="0" width="448" height="190" rx="10" fill="rgba(10, 20, 44, 0.7)" stroke="rgba(0, 240, 220, 0.2)" stroke-width="1"/>
                <text x="14" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#FFFFFF">🎚️ 10-Band Studio DSP Equalizer (Knobs Mode)</text>
                <text x="434" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#00f0dc" text-anchor="end">±12dB</text>

                <!-- Row 1 -->
                <g transform="translate(18, 35)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="35"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+4.5</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">32Hz</text>
                </g>
                <g transform="translate(104, 35)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="20"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+6.0</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">64Hz</text>
                </g>
                <g transform="translate(190, 35)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="45"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+3.0</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">125Hz</text>
                </g>
                <g transform="translate(276, 35)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="65"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">-1.5</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">250Hz</text>
                </g>
                <g transform="translate(362, 35)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#38BDF8" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="50"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">0.0</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">500Hz</text>
                </g>

                <!-- Row 2 -->
                <g transform="translate(18, 110)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="42"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+2.5</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">1kHz</text>
                </g>
                <g transform="translate(104, 110)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="35"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+4.0</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">2kHz</text>
                </g>
                <g transform="translate(190, 110)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="30"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+4.5</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">4kHz</text>
                </g>
                <g transform="translate(276, 110)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="25"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+5.5</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">8kHz</text>
                </g>
                <g transform="translate(362, 110)">
                    <circle cx="36" cy="30" r="22" fill="#0B1634" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4"/>
                    <circle cx="36" cy="30" r="22" fill="none" stroke="#00f0dc" stroke-width="4" stroke-dasharray="100" stroke-dashoffset="20"/>
                    <text x="36" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#FFFFFF" text-anchor="middle">+6.0</text>
                    <text x="36" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#94A3B8" text-anchor="middle">16kHz</text>
                </g>
            </g>

            <!-- Channel Strip -->
            <g transform="translate(16, 430)">
                <rect x="0" y="0" width="448" height="50" rx="8" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="14" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#94A3B8">Preamp:</text>
                <text x="65" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#00f0dc">+1.5 dB</text>
                <text x="145" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#94A3B8">Pan:</text>
                <text x="175" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF">Center (0)</text>
                <rect x="260" y="14" width="60" height="22" rx="4" fill="rgba(255, 255, 255, 0.08)"/>
                <text x="290" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" fill="#94A3B8" text-anchor="middle">Stereo</text>
                <rect x="350" y="14" width="85" height="22" rx="6" fill="rgba(0, 240, 220, 0.15)" stroke="#00f0dc" stroke-width="1"/>
                <text x="392" y="29" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#00f0dc" text-anchor="middle">⚖️ Flat Reset</text>
            </g>

            <!-- Spectrum Visualizer -->
            <g transform="translate(16, 488)">
                <rect x="0" y="0" width="448" height="155" rx="10" fill="#050C20" stroke="rgba(0, 240, 220, 0.3)" stroke-width="1"/>
                <text x="14" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#00f0dc" letter-spacing="1">📊 DYNAMIC SPECTRUM ANALYZER</text>
                <text x="434" y="22" font-family="monospace" font-size="11" font-weight="700" fill="#10B981" text-anchor="end">PEAK: -0.3 dB</text>

                <g transform="translate(18, 38)">
                    <rect x="0" y="55" width="14" height="45" rx="3" fill="#0090f0"/><rect x="20" y="35" width="14" height="65" rx="3" fill="#00b4f0"/>
                    <rect x="40" y="15" width="14" height="85" rx="3" fill="#00d8f0"/><rect x="60" y="25" width="14" height="75" rx="3" fill="#00f0dc"/>
                    <rect x="80" y="45" width="14" height="55" rx="3" fill="#00f0dc"/><rect x="100" y="30" width="14" height="70" rx="3" fill="#38bdf8"/>
                    <rect x="120" y="10" width="14" height="90" rx="3" fill="#38bdf8"/><rect x="140" y="5" width="14" height="95" rx="3" fill="#ffffff"/>
                    <rect x="160" y="18" width="14" height="82" rx="3" fill="#00f0dc"/><rect x="180" y="32" width="14" height="68" rx="3" fill="#00f0dc"/>
                    <rect x="200" y="40" width="14" height="60" rx="3" fill="#00b4f0"/><rect x="220" y="25" width="14" height="75" rx="3" fill="#38bdf8"/>
                    <rect x="240" y="15" width="14" height="85" rx="3" fill="#818cf8"/><rect x="260" y="8" width="14" height="92" rx="3" fill="#a78bfa"/>
                    <rect x="280" y="22" width="14" height="78" rx="3" fill="#c084fc"/><rect x="300" y="38" width="14" height="62" rx="3" fill="#818cf8"/>
                    <rect x="320" y="48" width="14" height="52" rx="3" fill="#38bdf8"/><rect x="340" y="60" width="14" height="40" rx="3" fill="#00f0dc"/>
                    <rect x="360" y="70" width="14" height="30" rx="3" fill="#0090f0"/><rect x="380" y="78" width="14" height="22" rx="3" fill="#0050c8"/>
                </g>
            </g>
        </g>

        <!-- Right Column -->
        <g transform="translate(930, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(8, 18, 40, 0.7)" stroke="rgba(0, 240, 220, 0.25)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc" letter-spacing="1">📊 LIVE VISUALIZER</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Kiểm Âm Sống Động</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="110" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🌈 4 Chế Độ Hiển Thị Phổ</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• Bars: Cột phổ tần số neon sắc nét</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• Curve: Đường cong phổ mượt mà</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• Wave: Dao động ký sóng âm thời gian thực</text>
                <text x="16" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• Circle Radar: Vòng sóng 360 độ</text>

                <rect x="0" y="125" width="264" height="105" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="151" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🎯 Peak Level Meter Chuẩn dB</text>
                <text x="16" y="173" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">Đo chính xác mức tín hiệu âm thanh cực đại</text>
                <text x="16" y="191" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">Vạch Peak Hold lưu lại đỉnh tín hiệu giúp</text>
                <text x="16" y="209" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">ngăn chặn méo biên độ hiệu quả</text>

                <rect x="0" y="245" width="264" height="120" rx="10" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="271" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">⌨️ Phím Tắt Nhanh Tiện Lợi</text>
                <text x="16" y="293" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• Space: Bật / Tắt Audio Equalizer</text>
                <text x="16" y="311" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• M: Mute / Bật lại tiếng ngay lập tức</text>
                <text x="16" y="347" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• A: So sánh A/B (Gốc vs Đã xử lý)</text>
                <text x="16" y="347" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#94A3B8">• Ctrl+Z / Ctrl+Y: Hoàn tác &amp; Làm lại EQ</text>

                <rect x="0" y="380" width="264" height="150" rx="10" fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1"/>
                <text x="16" y="406" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="800" fill="#10B981">🔒 Bảo Mật &amp; Hiệu Năng Cao</text>
                <text x="16" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• 100% On-Device Web Audio API</text>
                <text x="16" y="446" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Không ghi âm, không truyền tải âm thanh</text>
                <text x="16" y="464" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Không làm nóng máy, siêu tiết kiệm pin</text>
                <text x="16" y="482" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Chuẩn Google Chrome Manifest V3</text>
                <text x="16" y="504" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#10B981">✓ Đã tối ưu cho cả chip Intel, AMD &amp; Apple Silicon</text>
            </g>
        </g>
    </svg>`;

    await sharp(Buffer.from(ss1Svg)).png().toFile(path.join(outDir, 'screenshot1_equalizer_dsp_1280x800.png'));
    console.log('  ✓ Updated screenshot1_equalizer_dsp_1280x800.png with original icon');

    // ==========================================
    // 4. Screenshot 2: 800% Volume Booster (1280 x 800)
    // ==========================================
    const ss2Svg = `
    <svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#140804"/>
                <stop offset="50%" stop-color="#1F0D06"/>
                <stop offset="100%" stop-color="#070301"/>
            </linearGradient>
            <linearGradient id="boostTrack" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#10B981"/>
                <stop offset="30%" stop-color="#00f0dc"/>
                <stop offset="60%" stop-color="#F59E0B"/>
                <stop offset="100%" stop-color="#EF4444"/>
            </linearGradient>
            <filter id="boostGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="12" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        <rect width="1280" height="800" fill="url(#bgGrad2)"/>
        
        <rect x="0" y="0" width="1280" height="70" fill="#1F0F08" stroke="rgba(245, 158, 11, 0.25)" stroke-width="1"/>
        <image href="${iconSrc}" x="30" y="15" width="40" height="40"/>
        <text x="85" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF">ZYNO AUDIO PRO</text>
        <text x="270" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#F59E0B">| Tính Năng 2: Khuếch Đại Âm Lượng Lên Tới 800% &amp; Chống Vỡ Tiếng Thông Minh</text>

        <!-- Left Column -->
        <g transform="translate(50, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(30, 15, 8, 0.7)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#F59E0B" letter-spacing="1">🔊 MAXIMUM LOUDNESS</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Khuếch Đại Tới 8x</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="95" rx="10" fill="rgba(20, 10, 5, 0.8)" stroke="rgba(100, 50, 20, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">🚀 Boost Âm Lượng Lên 800%</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Cứu cánh tuyệt đối cho những video</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">thu âm quá bé, phim cũ, podcast nhỏ tiếng</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FCA5A5">Âm lượng to vang rực rỡ</text>

                <rect x="0" y="110" width="264" height="95" rx="10" fill="rgba(20, 10, 5, 0.8)" stroke="rgba(100, 50, 20, 0.6)" stroke-width="1"/>
                <text x="16" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#10B981">🛡️ Brickwall Limiter 2 Tầng</text>
                <text x="16" y="158" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Tự động nén và gọt các đỉnh xung âm</text>
                <text x="16" y="176" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">ngăn chặn hiện tượng xé tiếng, rè loa</text>
                <text x="16" y="194" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#34D399">Bảo vệ an toàn màng loa và thính giác</text>

                <rect x="0" y="220" width="264" height="95" rx="10" fill="rgba(20, 10, 5, 0.8)" stroke="rgba(100, 50, 20, 0.6)" stroke-width="1"/>
                <text x="16" y="246" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">⚡ 4 Mốc Boost Nhanh</text>
                <text x="16" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• 100%: Mức chuẩn Studio gốc</text>
                <text x="16" y="286" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• 200%: Boost +6dB cho video nhỏ</text>
                <text x="16" y="304" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• 400%: Boost +12dB khuếch đại mạnh</text>

                <rect x="0" y="330" width="264" height="95" rx="10" fill="rgba(20, 10, 5, 0.8)" stroke="rgba(100, 50, 20, 0.6)" stroke-width="1"/>
                <text x="16" y="356" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">🎯 Tinh Chỉnh Bước 5%</text>
                <text x="16" y="378" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Sử dụng phím mũi tên Lên/Xuống</text>
                <text x="16" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">để tăng giảm âm lượng tỉ mỉ từng bước</text>
                <text x="16" y="414" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#F59E0B">Bấm phím M để Mute tức thì</text>

                <rect x="0" y="440" width="264" height="95" rx="10" fill="rgba(239, 68, 68, 0.12)" stroke="rgba(239, 68, 68, 0.4)" stroke-width="1"/>
                <text x="16" y="466" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#EF4444">🔥 Đẳng Cấp Siêu Âm Lượng</text>
                <text x="16" y="488" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Biến loa laptop khiêm tốn thành dàn loa</text>
                <text x="16" y="506" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">công suất lớn mà không cần mua loa rời</text>
                <text x="16" y="524" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">✓ Tiết kiệm chi phí phần cứng</text>
            </g>
        </g>

        <!-- Center Box: Expanded Volume Booster Interface -->
        <g transform="translate(390, 100)">
            <rect x="0" y="0" width="480" height="660" rx="16" fill="#150A05" stroke="rgba(245, 158, 11, 0.5)" stroke-width="2"/>
            
            <rect x="0" y="0" width="480" height="52" rx="16" fill="rgba(245, 158, 11, 0.1)"/>
            <image href="${iconSrc}" x="14" y="12" width="28" height="28"/>
            <text x="50" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">Zyno Audio Pro — Mega Booster</text>
            <rect x="400" y="14" width="65" height="24" rx="12" fill="#EF4444" filter="url(#boostGlow)"/>
            <text x="432" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">BOOST ON</text>

            <g transform="translate(20, 75)">
                <rect x="0" y="0" width="440" height="150" rx="12" fill="rgba(25, 12, 6, 0.8)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1.5"/>
                <text x="220" y="36" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#F59E0B" text-anchor="middle" letter-spacing="1.5">ÂM LƯỢNG KHUẾCH ĐẠI HIỆN TẠI</text>
                <text x="220" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#EF4444" text-anchor="middle" letter-spacing="-1">450%</text>
                <text x="220" y="130" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#10B981" text-anchor="middle">⚡ +13.0 dB BOOST • LIMITER BẢO VỆ CHỦ ĐỘNG</text>
            </g>

            <g transform="translate(20, 245)">
                <rect x="0" y="0" width="440" height="65" rx="10" fill="rgba(25, 12, 6, 0.8)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1"/>
                <text x="16" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#CBD5E1">Thanh trượt dải màu quang phổ:</text>
                <rect x="16" y="36" width="408" height="12" rx="6" fill="rgba(255, 255, 255, 0.1)"/>
                <rect x="16" y="36" width="245" height="12" rx="6" fill="url(#boostTrack)" filter="url(#boostGlow)"/>
                <circle cx="261" cy="42" r="12" fill="#FFFFFF" stroke="#EF4444" stroke-width="4"/>
            </g>

            <g transform="translate(20, 325)">
                <rect x="0" y="0" width="102" height="36" rx="8" fill="rgba(16, 185, 129, 0.15)" stroke="#10B981" stroke-width="1"/>
                <text x="51" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#10B981" text-anchor="middle">100% Studio</text>
                <rect x="112" y="0" width="102" height="36" rx="8" fill="rgba(0, 240, 220, 0.15)" stroke="#00f0dc" stroke-width="1"/>
                <text x="163" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#00f0dc" text-anchor="middle">200% (+6dB)</text>
                <rect x="224" y="0" width="102" height="36" rx="8" fill="rgba(245, 158, 11, 0.25)" stroke="#F59E0B" stroke-width="1.5"/>
                <text x="275" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#F59E0B" text-anchor="middle">400% (+12dB)</text>
                <rect x="336" y="0" width="104" height="36" rx="8" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" stroke-width="1"/>
                <text x="388" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#EF4444" text-anchor="middle">800% MAX</text>
            </g>

            <g transform="translate(20, 380)">
                <rect x="0" y="0" width="440" height="255" rx="12" fill="rgba(10, 5, 2, 0.9)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1.5"/>
                <text x="16" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#10B981">🛡️ BRICKWALL LIMITER &amp; COMPRESSOR HUD</text>
                <rect x="360" y="14" width="65" height="20" rx="10" fill="rgba(16, 185, 129, 0.2)"/>
                <text x="392" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="800" fill="#10B981" text-anchor="middle">ACTIVE</text>

                <g transform="translate(16, 45)">
                    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94A3B8">Tín hiệu sau khuếch đại (Overdriven Gain):</text>
                    <text x="408" y="16" font-family="monospace" font-size="11" font-weight="700" fill="#EF4444" text-anchor="end">+13.2 dB (Cực lớn)</text>
                    <rect x="0" y="24" width="408" height="14" rx="4" fill="rgba(255, 255, 255, 0.08)"/>
                    <rect x="0" y="24" width="408" height="14" rx="4" fill="#EF4444"/>

                    <text x="0" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#94A3B8">Tín hiệu ra loa sau khi qua Limiter (Clean Output):</text>
                    <text x="408" y="60" font-family="monospace" font-size="11" font-weight="700" fill="#10B981" text-anchor="end">-0.1 dB (An Toàn)</text>
                    <rect x="0" y="68" width="408" height="14" rx="4" fill="rgba(255, 255, 255, 0.08)"/>
                    <rect x="0" y="68" width="375" height="14" rx="4" fill="#10B981"/>
                </g>

                <g transform="translate(16, 150)">
                    <rect x="0" y="0" width="195" height="42" rx="6" fill="rgba(255, 255, 255, 0.05)"/>
                    <text x="12" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8">Knee &amp; Compression Ratio:</text>
                    <text x="12" y="34" font-family="monospace" font-size="11.5" font-weight="700" fill="#FFFFFF">12:1 • Knee 20</text>

                    <rect x="213" y="0" width="195" height="42" rx="6" fill="rgba(255, 255, 255, 0.05)"/>
                    <text x="12" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8">Attack / Release Time:</text>
                    <text x="12" y="34" font-family="monospace" font-size="11.5" font-weight="700" fill="#FFFFFF">3.0 ms / 250 ms</text>
                </g>

                <g transform="translate(16, 204)">
                    <rect x="0" y="0" width="408" height="38" rx="6" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1"/>
                    <circle cx="18" cy="19" r="6" fill="#10B981"/>
                    <text x="34" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#A7F3D0">Đảm bảo âm thanh to rõ, chắc nịch, không xé tiếng, không hại loa</text>
                </g>
            </g>
        </g>

        <!-- Right Column -->
        <g transform="translate(930, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(30, 15, 8, 0.7)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#F59E0B" letter-spacing="1">⚡ SMART SOUND DYNAMICS</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Bảo Vệ Toàn Diện</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="110" rx="10" fill="rgba(20, 10, 5, 0.8)" stroke="rgba(100, 50, 20, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">🎧 Tận Hưởng Trong Mọi Nơi</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Xem phim, nghe nhạc tại quán cafe,</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">văn phòng hay môi trường ồn ào mà</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">không sợ bị lấn át bởi tiếng ồn</text>
                <text x="16" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Nghe rõ từng lời thoại chi tiết</text>

                <rect x="0" y="125" width="264" height="110" rx="10" fill="rgba(20, 10, 5, 0.8)" stroke="rgba(100, 50, 20, 0.6)" stroke-width="1"/>
                <text x="16" y="151" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">🎬 Trải Nghiệm Cinema Rực Rỡ</text>
                <text x="16" y="173" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Khuếch đại những đoạn hội thoại thì thầm</text>
                <text x="16" y="191" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">nhưng vẫn kìm hãm những pha cháy nổ</text>
                <text x="16" y="209" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">quá gắt nhờ thuật toán Dynamic Range</text>
                <text x="16" y="227" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Độ cân bằng hoàn hảo cho phim ảnh</text>

                <rect x="0" y="250" width="264" height="115" rx="10" fill="rgba(20, 10, 5, 0.8)" stroke="rgba(100, 50, 20, 0.6)" stroke-width="1"/>
                <text x="16" y="276" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">💡 An Toàn Thính Giác</text>
                <text x="16" y="298" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Tính năng giới hạn âm lượng tối đa</text>
                <text x="16" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">trong Cài đặt (100%, 200%, 400%)</text>
                <text x="16" y="334" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">giúp người dùng tùy ý khóa ngưỡng an toàn</text>
                <text x="16" y="354" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Phù hợp cho cả trẻ nhỏ sử dụng máy</text>

                <rect x="0" y="380" width="264" height="150" rx="10" fill="rgba(245, 158, 11, 0.12)" stroke="rgba(245, 158, 11, 0.4)" stroke-width="1"/>
                <text x="16" y="406" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="800" fill="#F59E0B">⚡ Thao Tác 1-Chạm Nhanh Gọn</text>
                <text x="16" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Nhấn nút Boost để bật tức thì +6dB</text>
                <text x="16" y="446" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Kéo slider để đạt tới 800% âm lượng</text>
                <text x="16" y="464" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Ghi nhớ độc lập theo từng website</text>
                <text x="16" y="482" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Tương thích 100% với YouTube, Netflix</text>
                <text x="16" y="504" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#10B981">✓ Không bao giờ phải căng tai nghe video nhỏ nữa!</text>
            </g>
        </g>
    </svg>`;

    await sharp(Buffer.from(ss2Svg)).png().toFile(path.join(outDir, 'screenshot2_volume_booster_1280x800.png'));
    console.log('  ✓ Updated screenshot2_volume_booster_1280x800.png with original icon');

    // ==========================================
    // 5. Screenshot 3: Studio Effects (1280 x 800)
    // ==========================================
    const ss3Svg = `
    <svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#080414"/>
                <stop offset="50%" stop-color="#140B2D"/>
                <stop offset="100%" stop-color="#05020A"/>
            </linearGradient>
            <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        <rect width="1280" height="800" fill="url(#bgGrad3)"/>
        
        <rect x="0" y="0" width="1280" height="70" fill="#150B28" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1"/>
        <image href="${iconSrc}" x="30" y="15" width="40" height="40"/>
        <text x="85" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF">ZYNO AUDIO PRO</text>
        <text x="270" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#C084FC">| Tính Năng 3: Hiệu Ứng Phòng Thu Chuyên Nghiệp &amp; Không Gian Vòm 7D Sống Động</text>

        <!-- Left Column -->
        <g transform="translate(50, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(20, 10, 40, 0.7)" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#C084FC" letter-spacing="1">🏛️ STUDIO EFFECTS</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Không Gian Vòm</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="95" rx="10" fill="rgba(15, 8, 30, 0.8)" stroke="rgba(80, 40, 120, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#C084FC">🏛️ Studio Convolution Reverb</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Mô phỏng 4 không gian vang:</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Room, Concert Hall, Plate, Cathedral</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Tùy chỉnh Wet/Dry Mix 0 - 100%</text>

                <rect x="0" y="110" width="264" height="95" rx="10" fill="rgba(15, 8, 30, 0.8)" stroke="rgba(80, 40, 120, 0.6)" stroke-width="1"/>
                <text x="16" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">💣 Sub-Bass Enhancer</text>
                <text x="16" y="158" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Tổng hợp sóng hài tần số siêu trầm</text>
                <text x="16" y="176" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">giúp loa laptop và tai nghe nhỏ</text>
                <text x="16" y="194" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Đánh bass sâu, nảy và cực ấm</text>

                <rect x="0" y="220" width="264" height="95" rx="10" fill="rgba(15, 8, 30, 0.8)" stroke="rgba(80, 40, 120, 0.6)" stroke-width="1"/>
                <text x="16" y="246" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">🎧 7D Auto-Pan Dynamic</text>
                <text x="16" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Hiệu ứng âm thanh xoay vòng 360°</text>
                <text x="16" y="286" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">luân chuyển mượt mà từ tai Trái qua Phải</text>
                <text x="16" y="304" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#C084FC">3 tốc độ: Chậm, Vừa, Nhanh</text>

                <rect x="0" y="330" width="264" height="95" rx="10" fill="rgba(15, 8, 30, 0.8)" stroke="rgba(80, 40, 120, 0.6)" stroke-width="1"/>
                <text x="16" y="356" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">🌐 Spatial Audio 3D Surround</text>
                <text x="16" y="378" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Mở rộng không gian âm trường stereo</text>
                <text x="16" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">thoát khỏi cảm giác gò bó trong tai nghe</text>
                <text x="16" y="414" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Như đang ngồi giữa khán phòng</text>

                <rect x="0" y="440" width="264" height="95" rx="10" fill="rgba(168, 85, 247, 0.12)" stroke="rgba(168, 85, 247, 0.4)" stroke-width="1"/>
                <text x="16" y="466" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#C084FC">✨ Trải Nghiệm Chuẩn Rạp Chiếu</text>
                <text x="16" y="488" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Đem không khí rạp chiếu phim IMAX</text>
                <text x="16" y="506" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">về ngay chiếc laptop hoặc PC của bạn</text>
                <text x="16" y="524" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">✓ Đắm chìm từng giây phút giải trí</text>
            </g>
        </g>

        <!-- Center Box: Studio Effects Tab UI -->
        <g transform="translate(390, 100)">
            <rect x="0" y="0" width="480" height="660" rx="16" fill="#0C061A" stroke="rgba(168, 85, 247, 0.4)" stroke-width="2"/>
            
            <rect x="0" y="0" width="480" height="52" rx="16" fill="rgba(168, 85, 247, 0.12)"/>
            <image href="${iconSrc}" x="14" y="12" width="28" height="28"/>
            <text x="50" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">Zyno Audio Pro — Studio Effects</text>
            <rect x="390" y="14" width="75" height="24" rx="12" fill="rgba(168, 85, 247, 0.25)" stroke="#C084FC" stroke-width="1"/>
            <text x="427" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#C084FC" text-anchor="middle">DSP FX ON</text>

            <g transform="translate(16, 64)">
                <rect x="0" y="0" width="144" height="28" rx="6" fill="rgba(15, 23, 42, 0.6)"/>
                <text x="72" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#94A3B8" text-anchor="middle">🎛️ Equalizer</text>

                <rect x="152" y="0" width="144" height="28" rx="6" fill="#C084FC"/>
                <text x="224" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="800" fill="#040817" text-anchor="middle">✨ Studio Effects</text>

                <rect x="304" y="0" width="144" height="28" rx="6" fill="rgba(15, 23, 42, 0.6)"/>
                <text x="376" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#94A3B8" text-anchor="middle">📁 Presets</text>
            </g>

            <!-- Reverb Card -->
            <g transform="translate(16, 105)">
                <rect x="0" y="0" width="448" height="125" rx="10" fill="rgba(20, 10, 42, 0.8)" stroke="rgba(168, 85, 247, 0.4)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#C084FC">🏛️ Studio Convolution Reverb</text>
                <rect x="380" y="12" width="52" height="18" rx="9" fill="#10B981"/>
                <text x="406" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" text-anchor="middle">BẬT</text>

                <g transform="translate(16, 40)">
                    <rect x="0" y="0" width="95" height="26" rx="6" fill="rgba(255, 255, 255, 0.08)"/>
                    <text x="47" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8" text-anchor="middle">Phòng Room</text>

                    <rect x="105" y="0" width="105" height="26" rx="6" fill="rgba(168, 85, 247, 0.3)" stroke="#C084FC" stroke-width="1"/>
                    <text x="157" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">Khán Phòng Hall ✓</text>

                    <rect x="220" y="0" width="95" height="26" rx="6" fill="rgba(255, 255, 255, 0.08)"/>
                    <text x="267" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8" text-anchor="middle">Plate Reverb</text>

                    <rect x="325" y="0" width="95" height="26" rx="6" fill="rgba(255, 255, 255, 0.08)"/>
                    <text x="372" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8" text-anchor="middle">Cathedral</text>
                </g>

                <g transform="translate(16, 80)">
                    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#CBD5E1">Độ Vang (Wet / Dry Mix):</text>
                    <text x="416" y="16" font-family="monospace" font-size="11" font-weight="800" fill="#C084FC" text-anchor="end">35% Mix</text>
                    <rect x="0" y="24" width="416" height="8" rx="4" fill="rgba(255, 255, 255, 0.1)"/>
                    <rect x="0" y="24" width="145" height="8" rx="4" fill="#C084FC"/>
                    <circle cx="145" cy="28" r="7" fill="#C084FC" filter="url(#purpleGlow)"/>
                </g>
            </g>

            <!-- Sub-Bass Card -->
            <g transform="translate(16, 240)">
                <rect x="0" y="0" width="448" height="120" rx="10" fill="rgba(20, 10, 42, 0.8)" stroke="rgba(0, 240, 220, 0.35)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#00f0dc">💣 Sub-Bass Harmonic Enhancer</text>
                <rect x="380" y="12" width="52" height="18" rx="9" fill="#10B981"/>
                <text x="406" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" text-anchor="middle">BẬT</text>

                <g transform="translate(16, 42)">
                    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#CBD5E1">Lực đấm Bass (Intensity):</text>
                    <text x="416" y="16" font-family="monospace" font-size="11" font-weight="800" fill="#00f0dc" text-anchor="end">65%</text>
                    <rect x="0" y="24" width="416" height="8" rx="4" fill="rgba(255, 255, 255, 0.1)"/>
                    <rect x="0" y="24" width="270" height="8" rx="4" fill="#00f0dc"/>
                    <circle cx="270" cy="28" r="7" fill="#00f0dc"/>
                </g>

                <g transform="translate(16, 82)">
                    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#CBD5E1">Tần số cắt Sub-harmonic (Cutoff Freq):</text>
                    <text x="416" y="16" font-family="monospace" font-size="11" font-weight="800" fill="#38BDF8" text-anchor="end">90 Hz</text>
                </g>
            </g>

            <!-- 7D Auto-Pan Card -->
            <g transform="translate(16, 370)">
                <rect x="0" y="0" width="448" height="120" rx="10" fill="rgba(20, 10, 42, 0.8)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#38BDF8">🎧 7D Auto-Pan Dynamic (Xoay Vòng Âm Thanh)</text>
                <rect x="380" y="12" width="52" height="18" rx="9" fill="#10B981"/>
                <text x="406" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" text-anchor="middle">BẬT</text>

                <g transform="translate(16, 42)">
                    <text x="0" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#CBD5E1">Tốc độ xoay vòng 360°:</text>
                    <rect x="150" y="4" width="80" height="24" rx="6" fill="rgba(255, 255, 255, 0.08)"/>
                    <text x="190" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8" text-anchor="middle">Chậm</text>
                    <rect x="240" y="4" width="90" height="24" rx="6" fill="rgba(56, 189, 248, 0.25)" stroke="#38BDF8" stroke-width="1"/>
                    <text x="285" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="800" fill="#38BDF8" text-anchor="middle">Vừa phải ✓</text>
                    <rect x="340" y="4" width="76" height="24" rx="6" fill="rgba(255, 255, 255, 0.08)"/>
                    <text x="378" y="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8" text-anchor="middle">Nhanh</text>
                </g>

                <g transform="translate(16, 85)">
                    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8">Tai Trái [L]</text>
                    <path d="M 65 12 Q 130 0 208 12 T 350 12" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="4 2"/>
                    <circle cx="208" cy="12" r="6" fill="#38BDF8" filter="url(#purpleGlow)"/>
                    <text x="416" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="#94A3B8" text-anchor="end">Tai Phải [R]</text>
                </g>
            </g>

            <!-- Spatial 3D Card -->
            <g transform="translate(16, 500)">
                <rect x="0" y="0" width="448" height="120" rx="10" fill="rgba(20, 10, 42, 0.8)" stroke="rgba(245, 158, 11, 0.35)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#F59E0B">🌐 Spatial Audio 3D (Âm Trường Đa Chiều)</text>
                <rect x="380" y="12" width="52" height="18" rx="9" fill="#10B981"/>
                <text x="406" y="25" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" text-anchor="middle">BẬT</text>

                <g transform="translate(16, 42)">
                    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#CBD5E1">Chế độ không gian:</text>
                    <text x="130" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#F59E0B">Wide Immersion (Mở rộng toàn cảnh)</text>
                </g>

                <g transform="translate(16, 75)">
                    <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#CBD5E1">Độ rộng không gian (Stereo Width):</text>
                    <text x="416" y="16" font-family="monospace" font-size="11" font-weight="800" fill="#F59E0B" text-anchor="end">75%</text>
                    <rect x="0" y="24" width="416" height="8" rx="4" fill="rgba(255, 255, 255, 0.1)"/>
                    <rect x="0" y="24" width="310" height="8" rx="4" fill="#F59E0B"/>
                    <circle cx="310" cy="28" r="7" fill="#F59E0B"/>
                </g>
            </g>
        </g>

        <!-- Right Column -->
        <g transform="translate(930, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(20, 10, 40, 0.7)" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#C084FC" letter-spacing="1">🎧 3D / 7D SPATIAL</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Trải Nghiệm Mới Lạ</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="110" rx="10" fill="rgba(15, 8, 30, 0.8)" stroke="rgba(80, 40, 120, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#C084FC">🎵 Nghe Nhạc EDM &amp; Remix</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Cảm nhận từng nhịp bass dập rung tai,</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">giai điệu bay bổng quanh đầu với 7D</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">như đang tham gia lễ hội âm nhạc</text>
                <text x="16" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#00f0dc">Thăng hoa cảm xúc đỉnh cao</text>

                <rect x="0" y="125" width="264" height="110" rx="10" fill="rgba(15, 8, 30, 0.8)" stroke="rgba(80, 40, 120, 0.6)" stroke-width="1"/>
                <text x="16" y="151" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#C084FC">🎮 Chiến Game Chuẩn Xác</text>
                <text x="16" y="173" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Spatial Audio 3D phân tách hướng</text>
                <text x="16" y="191" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">tiếng bước chân, tiếng đạn rõ ràng,</text>
                <text x="16" y="209" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">tạo lợi thế phản xạ cho game thủ</text>
                <text x="16" y="227" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Định vị mục tiêu trong tích tắc</text>

                <rect x="0" y="250" width="264" height="115" rx="10" fill="rgba(15, 8, 30, 0.8)" stroke="rgba(80, 40, 120, 0.6)" stroke-width="1"/>
                <text x="16" y="276" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#C084FC">🧘 Thư Giãn ASMR &amp; Podcast</text>
                <text x="16" y="298" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Reverb nhẹ kết hợp âm trường rộng</text>
                <text x="16" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">giúp giọng đọc ấm áp, tự nhiên,</text>
                <text x="16" y="334" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">loại bỏ hoàn toàn cảm giác bí bách</text>
                <text x="16" y="354" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Dễ dàng đi vào giấc ngủ êm dịu</text>

                <rect x="0" y="380" width="264" height="150" rx="10" fill="rgba(168, 85, 247, 0.12)" stroke="rgba(168, 85, 247, 0.4)" stroke-width="1"/>
                <text x="16" y="406" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="800" fill="#C084FC">⚡ Bật / Tắt Từng Hiệu Ứng</text>
                <text x="16" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Công tắc riêng biệt cho từng khối FX</text>
                <text x="16" y="446" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Không can thiệp nếu không bật</text>
                <text x="16" y="464" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Tùy ý phối ghép Reverb + Sub-Bass</text>
                <text x="16" y="482" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Tự động lưu cấu hình ưa thích</text>
                <text x="16" y="504" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#10B981">✓ Thỏa sức sáng tạo gu âm nhạc riêng!</text>
            </g>
        </g>
    </svg>`;

    await sharp(Buffer.from(ss3Svg)).png().toFile(path.join(outDir, 'screenshot3_studio_effects_1280x800.png'));
    console.log('  ✓ Updated screenshot3_studio_effects_1280x800.png with original icon');

    // ==========================================
    // 6. Screenshot 4: AI Smart Auto-Genre Detection (1280 x 800)
    // ==========================================
    const ss4Svg = `
    <svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#04121A"/>
                <stop offset="50%" stop-color="#08222E"/>
                <stop offset="100%" stop-color="#02080D"/>
            </linearGradient>
            <filter id="aiGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        <rect width="1280" height="800" fill="url(#bgGrad4)"/>
        
        <rect x="0" y="0" width="1280" height="70" fill="#08202B" stroke="rgba(0, 240, 220, 0.3)" stroke-width="1"/>
        <image href="${iconSrc}" x="30" y="15" width="40" height="40"/>
        <text x="85" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF">ZYNO AUDIO PRO</text>
        <text x="270" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#00f0dc">| Tính Năng 4: Động Cơ AI Nhận Diện Thể Loại Nhạc &amp; 35+ Preset Chuẩn Phòng Thu</text>

        <!-- Left Column -->
        <g transform="translate(50, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(8, 28, 38, 0.7)" stroke="rgba(0, 240, 220, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc" letter-spacing="1">✨ AI SMART AUTO-EQ</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Tự Động Tối Ưu</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="95" rx="10" fill="rgba(5, 18, 25, 0.8)" stroke="rgba(20, 60, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">✨ Thuật Toán Lai Hybrid</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Đo năng lượng phổ FFT Analyser</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">kết hợp trích xuất siêu dữ liệu NLP</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Độ chính xác nhận diện > 95%</text>

                <rect x="0" y="110" width="264" height="95" rx="10" fill="rgba(5, 18, 25, 0.8)" stroke="rgba(20, 60, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🌊 500ms Audio Ramping</text>
                <text x="16" y="158" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Chuyển tiếp dải tần bằng hàm dốc mượt</text>
                <text x="16" y="176" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Triệt tiêu hoàn toàn tiếng lách cách hay nổ</text>
                <text x="16" y="194" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Âm thanh chuyển bài êm ái</text>

                <rect x="0" y="220" width="264" height="95" rx="10" fill="rgba(5, 18, 25, 0.8)" stroke="rgba(20, 60, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="246" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🎵 Chuyên Biệt Mọi Thể Loại</text>
                <text x="16" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Drill / 808 Trap: Sub-bass 32Hz, 64Hz</text>
                <text x="16" y="286" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• EDM / Vinahouse: Spatial chữ V mở rộng</text>
                <text x="16" y="304" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• K-Pop / V-Pop: Nâng dải mid rõ giọng ca</text>

                <rect x="0" y="330" width="264" height="95" rx="10" fill="rgba(5, 18, 25, 0.8)" stroke="rgba(20, 60, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="356" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">📁 35+ Preset Chuẩn Phòng Thu</text>
                <text x="16" y="378" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Kho preset được tinh chỉnh bởi</text>
                <text x="16" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">các kỹ sư âm thanh hàng đầu</text>
                <text x="16" y="414" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Đầy đủ cho nhạc, phim và game</text>

                <rect x="0" y="440" width="264" height="95" rx="10" fill="rgba(0, 240, 220, 0.12)" stroke="rgba(0, 240, 220, 0.4)" stroke-width="1"/>
                <text x="16" y="466" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">💡 Không Cần Chỉnh Bằng Tay</text>
                <text x="16" y="488" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Dành cho người dùng chỉ muốn bật nhạc</text>
                <text x="16" y="506" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">và thưởng thức âm thanh hay nhất ngay lập tức</text>
                <text x="16" y="524" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">✓ Thông minh &amp; tiện lợi tối đa</text>
            </g>
        </g>

        <!-- Center Box: Presets & AI Detection UI -->
        <g transform="translate(390, 100)">
            <rect x="0" y="0" width="480" height="660" rx="16" fill="#061622" stroke="rgba(0, 240, 220, 0.4)" stroke-width="2"/>
            
            <rect x="0" y="0" width="480" height="52" rx="16" fill="rgba(0, 240, 220, 0.12)"/>
            <image href="${iconSrc}" x="14" y="12" width="28" height="28"/>
            <text x="50" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">Zyno Audio Pro — Presets &amp; AI</text>
            <rect x="385" y="14" width="80" height="24" rx="12" fill="rgba(0, 240, 220, 0.2)" stroke="#00f0dc" stroke-width="1"/>
            <text x="425" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#00f0dc" text-anchor="middle">AI ACTIVE</text>

            <g transform="translate(16, 64)">
                <rect x="0" y="0" width="144" height="28" rx="6" fill="rgba(15, 23, 42, 0.6)"/>
                <text x="72" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#94A3B8" text-anchor="middle">🎛️ Equalizer</text>

                <rect x="152" y="0" width="144" height="28" rx="6" fill="rgba(15, 23, 42, 0.6)"/>
                <text x="224" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="600" fill="#94A3B8" text-anchor="middle">✨ Studio Effects</text>

                <rect x="304" y="0" width="144" height="28" rx="6" fill="#00f0dc"/>
                <text x="376" y="18" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="800" fill="#040817" text-anchor="middle">📁 Presets</text>
            </g>

            <g transform="translate(16, 105)">
                <rect x="0" y="0" width="448" height="115" rx="10" fill="rgba(0, 240, 220, 0.12)" stroke="rgba(0, 240, 220, 0.4)" stroke-width="1.5"/>
                <circle cx="25" cy="26" r="7" fill="#00f0dc" filter="url(#aiGlow)"/>
                <text x="42" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#00f0dc">✨ ĐỘNG CƠ AI AUTO-GENRE: HOẠT ĐỘNG</text>
                <text x="430" y="30" font-family="monospace" font-size="11.5" font-weight="800" fill="#10B981" text-anchor="end">98.4% ĐỘ CHÍNH XÁC</text>

                <g transform="translate(16, 44)">
                    <rect x="0" y="0" width="416" height="55" rx="6" fill="rgba(0, 0, 0, 0.4)"/>
                    <text x="14" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">BÀI HÁT ĐANG PHÁT TRÊN YOUTUBE:</text>
                    <text x="14" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#FFFFFF">K-Pop / Dance Pop • Nổi bật giọng ca ca sĩ (Vocal Clarity)</text>
                </g>
            </g>

            <g transform="translate(16, 232)">
                <rect x="0" y="0" width="448" height="38" rx="8" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                <text x="16" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94A3B8">🔍 Tìm kiếm nhanh trong 35+ preset...</text>
            </g>

            <g transform="translate(16, 282)">
                <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc">⚡ ZYNO SIGNATURE PRESETS</text>
                
                <g transform="translate(0, 24)">
                    <rect x="0" y="0" width="218" height="42" rx="8" fill="rgba(0, 240, 220, 0.2)" stroke="#00f0dc" stroke-width="1.5"/>
                    <text x="14" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#FFFFFF">⚡ Zyno Studio Master ✓</text>

                    <rect x="230" y="0" width="218" height="42" rx="8" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="244" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#CBD5E1">🎧 Zyno Sub-Bass Club</text>
                </g>

                <text x="0" y="92" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#38BDF8">🎵 THỂ LOẠI ÂM NHẠC HÀNG ĐẦU</text>
                <g transform="translate(0, 102)">
                    <rect x="0" y="0" width="105" height="36" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="52" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">EDM / Dance</text>
                    <rect x="114" y="0" width="105" height="36" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="166" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">Hip-Hop / Rap</text>
                    <rect x="228" y="0" width="105" height="36" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="280" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">Lo-Fi Chill</text>
                    <rect x="342" y="0" width="105" height="36" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="394" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">Pop / Vocal</text>
                </g>

                <text x="0" y="166" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#F59E0B">🎬 GIẢI TRÍ &amp; THIẾT BỊ</text>
                <g transform="translate(0, 176)">
                    <rect x="0" y="0" width="144" height="38" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="72" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">Cinema Immersion</text>
                    <rect x="152" y="0" width="144" height="38" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="224" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">Gaming Footsteps</text>
                    <rect x="304" y="0" width="144" height="38" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <text x="376" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#FFFFFF" text-anchor="middle">Loa Laptop Nhỏ</text>
                </g>

                <g transform="translate(0, 240)">
                    <rect x="0" y="0" width="218" height="42" rx="8" fill="rgba(16, 185, 129, 0.15)" stroke="#10B981" stroke-width="1"/>
                    <text x="109" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#10B981" text-anchor="middle">+ Lưu Preset Mới</text>
                    <rect x="230" y="0" width="218" height="42" rx="8" fill="rgba(56, 189, 248, 0.15)" stroke="#38BDF8" stroke-width="1"/>
                    <text x="339" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" fill="#38BDF8" text-anchor="middle">🔄 Sao Lưu / Khôi Phục</text>
                </g>
            </g>
        </g>

        <!-- Right Column -->
        <g transform="translate(930, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(8, 28, 38, 0.7)" stroke="rgba(0, 240, 220, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc" letter-spacing="1">📁 PRESETS LIBRARY</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Kho Cấu Hình Chuẩn</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="110" rx="10" fill="rgba(5, 18, 25, 0.8)" stroke="rgba(20, 60, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">⚡ Tự Động Nhớ Gu Âm Nhạc</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Lưu trữ không giới hạn preset cá nhân,</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">tự đặt tên và lưu kèm mức volume</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">hoặc bộ hiệu ứng phòng thu tương ứng</text>
                <text x="16" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Tự do sáng tạo chất âm riêng</text>

                <rect x="0" y="125" width="264" height="110" rx="10" fill="rgba(5, 18, 25, 0.8)" stroke="rgba(20, 60, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="151" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🔄 Xuất &amp; Nhập File .aeq</text>
                <text x="16" y="173" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Dễ dàng chia sẻ cấu hình EQ tâm đắc</text>
                <text x="16" y="191" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">cho bạn bè hoặc đồng bộ giữa các máy</text>
                <text x="16" y="209" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">tính khác nhau chỉ bằng 1 file nhẹ tênh</text>
                <text x="16" y="227" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Không bao giờ lo mất cấu hình</text>

                <rect x="0" y="250" width="264" height="115" rx="10" fill="rgba(5, 18, 25, 0.8)" stroke="rgba(20, 60, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="276" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🎧 Tối Ưu Cho Mọi Thiết Bị</text>
                <text x="16" y="298" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Preset Loa Laptop: Bù âm trầm, chống rè</text>
                <text x="16" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Preset Over-Ear: Khai mở âm trường rộng</text>
                <text x="16" y="334" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Preset In-Ear / AirPods: Tăng độ chi tiết</text>
                <text x="16" y="354" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Phát huy tối đa năng lực phần cứng</text>

                <rect x="0" y="380" width="264" height="150" rx="10" fill="rgba(0, 240, 220, 0.12)" stroke="rgba(0, 240, 220, 0.4)" stroke-width="1"/>
                <text x="16" y="406" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="800" fill="#00f0dc">⚡ Chuyển Đổi Không Gián Đoạn</text>
                <text x="16" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Nhấp đúp để đổi preset trong 0.01s</text>
                <text x="16" y="446" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Hỗ trợ Undo / Redo nếu muốn quay lại</text>
                <text x="16" y="464" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Phím A so sánh ngay với âm thanh gốc</text>
                <text x="16" y="482" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Không cần cài thêm driver cồng kềnh</text>
                <text x="16" y="504" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#10B981">✓ Sử dụng trực tiếp trong trình duyệt Chrome!</text>
            </g>
        </g>
    </svg>`;

    await sharp(Buffer.from(ss4Svg)).png().toFile(path.join(outDir, 'screenshot4_ai_auto_genre_1280x800.png'));
    console.log('  ✓ Updated screenshot4_ai_auto_genre_1280x800.png with original icon');

    // ==========================================
    // 7. Screenshot 5: Per-Site Memory & A/B Compare (1280 x 800)
    // ==========================================
    const ss5Svg = `
    <svg width="1280" height="800" viewBox="0 0 1280 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#040817"/>
                <stop offset="50%" stop-color="#07122E"/>
                <stop offset="100%" stop-color="#030614"/>
            </linearGradient>
            <filter id="abGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="12" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        <rect width="1280" height="800" fill="url(#bgGrad5)"/>
        
        <rect x="0" y="0" width="1280" height="70" fill="#081432" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1"/>
        <image href="${iconSrc}" x="30" y="15" width="40" height="40"/>
        <text x="85" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF">ZYNO AUDIO PRO</text>
        <text x="270" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#38BDF8">| Tính Năng 5: Tự Động Nhớ Cấu Hình Theo Website &amp; So Sánh A/B Thời Gian Thực</text>

        <!-- Left Column -->
        <g transform="translate(50, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(8, 20, 48, 0.7)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#38BDF8" letter-spacing="1">🌐 PER-SITE PROFILES</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Nhớ Từng Trang Web</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="95" rx="10" fill="rgba(5, 14, 32, 0.8)" stroke="rgba(20, 45, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">🌐 Cấu Hình Độc Lập</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">YouTube nghe nhạc sôi động với Bass Boost,</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Netflix xem phim với Cinema Immersion,</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Spotify du dương với Studio Master</text>

                <rect x="0" y="110" width="264" height="95" rx="10" fill="rgba(5, 14, 32, 0.8)" stroke="rgba(20, 45, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="136" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#00f0dc">🔄 Tự Chuyển Khi Đổi Tab</text>
                <text x="16" y="158" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Không cần mất công chỉnh lại EQ</text>
                <text x="16" y="176" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">khi lướt web hay chuyển đổi tab khác</text>
                <text x="16" y="194" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8">Tiện ích tự nhận diện tên miền tức thì</text>

                <rect x="0" y="220" width="264" height="95" rx="10" fill="rgba(5, 14, 32, 0.8)" stroke="rgba(20, 45, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="246" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#F59E0B">🅰️/🅱️ So Sánh A/B Thời Gian Thực</text>
                <text x="16" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Bấm phím A để bật/tắt Bypass</text>
                <text x="16" y="286" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">So sánh trực tiếp chất âm gốc thô sơ</text>
                <text x="16" y="304" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#F59E0B">và chất âm đẳng cấp sau khi xử lý</text>

                <rect x="0" y="330" width="264" height="95" rx="10" fill="rgba(5, 14, 32, 0.8)" stroke="rgba(20, 45, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="356" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">🔒 Lưu Trữ Cục Bộ (Local Storage)</text>
                <text x="16" y="378" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Mọi thông số lưu trực tiếp trong trình duyệt,</text>
                <text x="16" y="396" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">hoàn toàn riêng tư, không cần tài khoản,</text>
                <text x="16" y="414" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">không tải dữ liệu lên bất kỳ máy chủ nào</text>

                <rect x="0" y="440" width="264" height="95" rx="10" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1"/>
                <text x="16" y="466" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">⚡ Quản Lý Thông Minh</text>
                <text x="16" y="488" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Xóa cấu hình riêng hoặc quay về cấu hình chung</text>
                <text x="16" y="506" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">chỉ bằng một nút bấm đơn giản</text>
                <text x="16" y="524" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">✓ Tự do điều khiển trải nghiệm âm thanh!</text>
            </g>
        </g>

        <!-- Center Box -->
        <g transform="translate(390, 100)">
            <rect x="0" y="0" width="480" height="660" rx="16" fill="#071026" stroke="rgba(56, 189, 248, 0.4)" stroke-width="2"/>
            
            <rect x="0" y="0" width="480" height="52" rx="16" fill="rgba(56, 189, 248, 0.12)"/>
            <image href="${iconSrc}" x="14" y="12" width="28" height="28"/>
            <text x="50" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="800" fill="#FFFFFF">Zyno Audio Pro — Site Profiles</text>
            <rect x="375" y="14" width="90" height="24" rx="12" fill="rgba(56, 189, 248, 0.2)" stroke="#38BDF8" stroke-width="1"/>
            <text x="420" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#38BDF8" text-anchor="middle">PER-SITE ON</text>

            <g transform="translate(16, 70)">
                <rect x="0" y="0" width="448" height="150" rx="12" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(56, 189, 248, 0.35)" stroke-width="1.5"/>
                <text x="20" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="#38BDF8">🅰️/🅱️ SO SÁNH ÂM THANH TRỰC TIẾP (A/B COMPARE)</text>
                <text x="428" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#94A3B8" text-anchor="end">PHÍM TẮT: 'A'</text>

                <g transform="translate(16, 44)">
                    <rect x="0" y="0" width="200" height="85" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
                    <text x="14" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#94A3B8">CHẾ ĐỘ A: ÂM GỐC (BYPASS)</text>
                    <text x="14" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748B">• Âm thanh gốc phẳng (Flat 0dB)</text>
                    <text x="14" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748B">• Âm lượng nhỏ, thiếu lực bass</text>
                    <text x="14" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748B">• Âm trường phẳng, hẹp</text>

                    <rect x="216" y="0" width="200" height="85" rx="8" fill="rgba(0, 240, 220, 0.12)" stroke="#00f0dc" stroke-width="1.5"/>
                    <text x="230" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#00f0dc">CHẾ ĐỘ B: ZYNO DSP PRO ✓</text>
                    <text x="230" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#FFFFFF">• 10-Band EQ bùng nổ (+6dB Bass)</text>
                    <text x="230" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#FFFFFF">• Âm lượng boost to rõ không rè</text>
                    <text x="230" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#FFFFFF">• Không gian vòm Reverb &amp; 7D sống động</text>
                </g>
            </g>

            <g transform="translate(16, 235)">
                <text x="0" y="16" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12.5" font-weight="800" fill="#FFFFFF">DANH SÁCH CẤU HÌNH TỪNG TRANG WEB ĐÃ LƯU:</text>

                <g transform="translate(0, 28)">
                    <rect x="0" y="0" width="448" height="58" rx="8" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(0, 240, 220, 0.4)" stroke-width="1.5"/>
                    <circle cx="28" cy="29" r="14" fill="#FF0000"/>
                    <polygon points="24,23 35,29 24,35" fill="#FFFFFF"/>
                    <text x="52" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">youtube.com</text>
                    <text x="52" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">Preset: Zyno Bass Boost Pro • Vol: 120% • Spatial 3D</text>
                    <rect x="360" y="17" width="75" height="24" rx="12" fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" stroke-width="1"/>
                    <text x="397" y="33" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="800" fill="#10B981" text-anchor="middle">ACTIVE</text>
                </g>

                <g transform="translate(0, 96)">
                    <rect x="0" y="0" width="448" height="58" rx="8" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <circle cx="28" cy="29" r="14" fill="#E50914"/>
                    <text x="28" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">N</text>
                    <text x="52" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">netflix.com</text>
                    <text x="52" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">Preset: Cinema Immersion • Rõ Lời Thoại • Reverb Hall</text>
                    <text x="424" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8" text-anchor="end">Tự Áp Dụng</text>
                </g>

                <g transform="translate(0, 164)">
                    <rect x="0" y="0" width="448" height="58" rx="8" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <circle cx="28" cy="29" r="14" fill="#1DB954"/>
                    <text x="28" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">S</text>
                    <text x="52" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">open.spotify.com</text>
                    <text x="52" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">Preset: Zyno Studio Master • Cân Bằng Dải Tần Chi Tiết</text>
                    <text x="424" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8" text-anchor="end">Tự Áp Dụng</text>
                </g>

                <g transform="translate(0, 232)">
                    <rect x="0" y="0" width="448" height="58" rx="8" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <circle cx="28" cy="29" r="14" fill="#00897B"/>
                    <text x="28" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">M</text>
                    <text x="52" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">meet.google.com</text>
                    <text x="52" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">Preset: Dialogue Clarity • Cắt Dải Ồn Trầm • Boost 200%</text>
                    <text x="424" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8" text-anchor="end">Tự Áp Dụng</text>
                </g>

                <g transform="translate(0, 300)">
                    <rect x="0" y="0" width="448" height="58" rx="8" fill="rgba(15, 23, 42, 0.7)" stroke="rgba(51, 65, 85, 0.6)" stroke-width="1"/>
                    <circle cx="28" cy="29" r="14" fill="#FF5500"/>
                    <text x="28" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="900" fill="#FFFFFF" text-anchor="middle">☁️</text>
                    <text x="52" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">soundcloud.com</text>
                    <text x="52" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94A3B8">Preset: Deep Bass Pro • 7D Auto-Pan Medium</text>
                    <text x="424" y="34" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#38BDF8" text-anchor="end">Tự Áp Dụng</text>
                </g>
            </g>
        </g>

        <!-- Right Column -->
        <g transform="translate(930, 100)">
            <rect x="0" y="0" width="300" height="660" rx="14" fill="rgba(8, 20, 48, 0.7)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.5"/>
            <text x="24" y="38" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="800" fill="#38BDF8" letter-spacing="1">⚡ PRO TOOLS</text>
            <text x="24" y="65" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="900" fill="#FFFFFF">Thông Minh &amp; Tiện Ích</text>

            <g transform="translate(18, 85)">
                <rect x="0" y="0" width="264" height="110" rx="10" fill="rgba(5, 14, 32, 0.8)" stroke="rgba(20, 45, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">🎯 Tiết Kiệm Thời Gian</text>
                <text x="16" y="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Chỉ cần cấu hình một lần duy nhất,</text>
                <text x="16" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Zyno Audio Pro sẽ luôn nhớ và kích hoạt</text>
                <text x="16" y="84" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">chính xác mỗi khi bạn truy cập lại trang</text>
                <text x="16" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Trải nghiệm liền mạch, tự động 100%</text>

                <rect x="0" y="125" width="264" height="110" rx="10" fill="rgba(5, 14, 32, 0.8)" stroke="rgba(20, 45, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="151" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">👂 Cảm Nhận Sự Khác Biệt</text>
                <text x="16" y="173" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">Tính năng A/B Compare giúp bạn</text>
                <text x="16" y="191" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">thấy rõ sự vượt trội về độ dày của bass,</text>
                <text x="16" y="209" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">độ trong trẻo của vocal và độ rộng âm trường</text>
                <text x="16" y="227" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#00f0dc">Âm thanh lột xác hoàn toàn</text>

                <rect x="0" y="250" width="264" height="115" rx="10" fill="rgba(5, 14, 32, 0.8)" stroke="rgba(20, 45, 80, 0.6)" stroke-width="1"/>
                <text x="16" y="276" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#38BDF8">⌨️ Đầy Đủ Phím Tắt</text>
                <text x="16" y="298" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Space: Bật / Tắt Audio Equalizer</text>
                <text x="16" y="316" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Phím Mũi Tên: Tăng / Giảm Volume</text>
                <text x="16" y="334" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Phím A: A/B Bypass Auditioning</text>
                <text x="16" y="354" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#10B981">Thao tác như DJ chuyên nghiệp</text>

                <rect x="0" y="380" width="264" height="150" rx="10" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1"/>
                <text x="16" y="406" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="800" fill="#38BDF8">⚡ Hỗ Trợ 100% Nền Tảng</text>
                <text x="16" y="428" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• YouTube, YouTube Music</text>
                <text x="16" y="446" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Netflix, Disney+, Apple TV+</text>
                <text x="16" y="464" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Spotify, Soundcloud, Zing MP3</text>
                <text x="16" y="482" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#CBD5E1">• Twitch, Bilibili, TikTok, Facebook</text>
                <text x="16" y="504" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#10B981">✓ Cài đặt 1 lần — Tận hưởng mãi mãi!</text>
            </g>
        </g>
    </svg>`;

    await sharp(Buffer.from(ss5Svg)).png().toFile(path.join(outDir, 'screenshot5_site_profiles_ab_1280x800.png'));
    console.log('  ✓ Updated screenshot5_site_profiles_ab_1280x800.png with original icon');

    console.log('\nAll Chrome Web Store Graphic Assets generated with the ORIGINAL logo!');
}

regenerateAllStoreAssets().catch(console.error);
