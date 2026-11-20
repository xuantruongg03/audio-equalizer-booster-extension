# 🎛️ Zyno Audio Equalizer & Booster Pro v3.0

<p align="center">
  <img src="icons/icon.png" alt="Zyno Audio Pro Logo" width="128" height="128">
</p>

A professional, studio-grade Chrome Extension that transforms and enhances audio output from any active tab using the Web Audio API.

---

## 🌟 Tính năng Nổi bật (v3.1 Pro)

### ✨ AI Smart Auto-EQ & Adaptive Genre Adaptation (Hybrid FFT + Metadata) - *Mới*
- **Động cơ nhận diện thể loại âm nhạc thông minh (>95% độ chính xác)**: Tự động phân tích và tối ưu hóa 10 cần gạt EQ cùng hiệu ứng phòng thu theo từng bài hát mà không cần can thiệp thủ công.
- **Thuật toán lai Hybrid Fusion**:
  - **FFT Spectral Energy Analysis**: Đo lường tỷ lệ năng lượng Sub-bass ($20-60\text{Hz}$), Bass, Mid vocal, Treble và trọng tâm phổ Spectral Centroid theo thời gian thực từ `AnalyserNode`.
  - **NLP Metadata Context**: Đối soát siêu dữ liệu tiêu đề bài hát, nghệ sĩ từ YouTube, Spotify, Soundcloud, Zing MP3, TikTok.
- **Tối ưu chuyên sâu cho các dòng nhạc**:
  - 💣 **Drill / 808 Trap**: Đẩy mạnh Sub-bass $32\text{Hz}, 64\text{Hz}$ (+5dB đến +6dB), dìm dải $250\text{Hz}$ chống đục, tăng $8\text{kHz}, 16\text{kHz}$ cho tiếng hi-hat giòn tan.
  - 🎛️ **EDM / Vinahouse Remix**: Cấu hình âm trường chữ V mở rộng (Spatial Wide 60%), kích hoạt Sub-harmonic Bass Enhancer (+6dB $64\text{Hz}$).
  - 🔊 **Super Bass Boosted**: Tối đa hóa lực đấm của dải siêu trầm kết hợp Limiter chống vỡ tiếng.
  - 🎤 **K-Pop & V-Pop**: Nâng dải mid $1\text{kHz} - 4\text{kHz}$ (+3dB đến +4dB) làm nổi bật giọng ca sĩ (Vocal Clarity), bass nảy mượt mà.
  - 🎸 **Acoustic & Ballad**: Tăng độ ấm áp, không gian Reverb phòng hòa nhạc êm dịu.
  - 🎬 **Cinema & Podcast**: Tối ưu độ rõ nét của lời thoại (Dialogue Clarity).
- **Chuyển đổi âm thanh mượt mà (500ms Audio Ramping)**: Sử dụng phương thức toán học `linearRampToValueAtTime` triệt tiêu hoàn toàn tiếng nổ hay rè khi đổi thể loại.
- Xem tài liệu đặc tả chi tiết tại: [AI_HYBRID_AUTO_EQ_SPEC.md](docs/AI_HYBRID_AUTO_EQ_SPEC.md).

### 🎚️ 10-Band Studio Graphic & Parametric DSP Equalizer
- **Dual View Mode**: Chuyển đổi linh hoạt giữa giao diện **Rotary Knobs** truyền thống và **Interactive Curve DSP** (đồ thị đường cong phản hồi tần số thời gian thực).
- **Interactive Frequency Response Graph**: Vẽ chính xác đường cong đáp tuyến tần số (Biquad filter transfer function magnitude) chuẩn phòng thu, kéo thả trực tiếp 10 điểm nút tần số (nodes) trên đồ thị logarithmic 20Hz - 20kHz.
- **Parametric Band Inspector**: Cho phép chọn từng dải tần để tinh chỉnh chi tiết:
  - **Bandwidth (Q factor)**: Điều chỉnh độ rộng/hẹp của dải tần từ 0.4 đến 6.0.
  - **Filter Type**: Chọn kiểu lọc phù hợp (Peaking/Bell, Low Shelf, High Shelf).
  - **Band Mute/Bypass**: Bật/tắt riêng biệt từng dải tần để kiểm âm.
- **DSP Channel Strip Master**:
  - **Stereo Pan**: Điều chỉnh cân bằng kênh trái - phải (-1.0 đến +1.0) với tính năng double-click về giữa (Center).
  - **Preamp Gain**: Headroom gain -12dB đến +12dB kiểm soát mức gain đầu vào trước khi vào chuỗi EQ.
  - **Mono Summing**: Nút gộp tín hiệu Mono kiểm tra độ lệch pha (Phase cancellation test) theo chuẩn Web Audio.
  - **EQ Amplitude Range Selector**: Tùy chọn thang đo biên độ ±6dB, ±12dB hoặc ±24dB linh hoạt.
- Nút **Flat Reset** đưa nhanh tất cả dải tần về 0dB.

### 🔊 Volume Booster lên tới 800%
- Khuếch đại âm lượng lên đến **8x (800%)** cho các video nhỏ tiếng.
- Thanh trượt động với dải màu quang phổ thay đổi theo mức độ boost: Xanh lá (0-100%) → Xanh lam (200%) → Cam (400%) → Đỏ (800%).
- Hỗ trợ phím tắt **Mute nhanh (M)** và điều chỉnh từng bước 5% bằng phím mũi tên.

### 🏛️ Hiệu ứng Phòng thu Chuyên nghiệp (Studio Effects)
- **Studio Reverb (Độ vang không gian)**: Mô phỏng không gian phòng thu với thuật toán Convolution Reverb:
  - *Room* (Phòng nhỏ)
  - *Concert Hall* (Khán phòng hòa nhạc)
  - *Plate Reverb* (Phòng thu đĩa kim loại)
  - *Cathedral* (Đại giáo đường vang vọng)
  - Tùy chỉnh mức độ vang (Wet/Dry Mix) từ 0-100%.
- **Sub-Bass Enhancer**: Bộ tổng hợp sóng hài tần số thấp giúp loa laptop và tai nghe nhỏ tái tạo tiếng bass dày và chắc mà không bị vỡ.
- **Spatial Audio (Âm thanh vòm 3D / 7D)**: Mở rộng không gian stereo đa chiều (Wide, Surround, 3D, 7D).
- **7D Auto-Pan**: Hiệu ứng xoay vòng âm thanh trái ↔ phải tự động với 3 tốc độ (Chậm, Vừa, Nhanh).
- **Dual-Stage Limiter & Compressor**: Ngăn chặn méo tiếng và bảo vệ thính giác khi boost âm lượng lớn.

### 📊 Studio Visualizer & Peak Meter
- Chế độ hiển thị đa dạng: **Bars**, **Spectrum Curve**, **Oscilloscope Wave**, **Circle Radar**.
- Tích hợp **Peak Level Meter** chuẩn dB với vạch **Peak Hold** phát hiện đỉnh tín hiệu.

### ⚡ Tính năng Thông minh (Pro Tools)
- **A/B Compare (Phím A)**: Bật/tắt nhanh chế độ Bypass để so sánh chất âm gốc và sau khi xử lý.
- **Undo / Redo (Ctrl+Z / Ctrl+Y)**: Hoàn tác hoặc làm lại thao tác chỉnh EQ mà không sợ mất thông số.
- **35+ Presets chuyên sâu**: Phân loại theo Cơ bản, Thể loại nhạc (Pop, Rock, EDM, Hip-Hop, Lo-Fi, Live Concert...), Tình huống (Phim ảnh, Gaming, Podcast, Night Mode, ASMR...) và Thiết bị.
- **Cài đặt riêng theo từng trang web (Per-site Profiles)**: Tự động ghi nhớ cấu hình cho YouTube, Netflix, Spotify, Google Meet...
- **Sao lưu & Phục hồi (Export/Import)**: Xuất file `.aeq` chia sẻ cấu hình với bạn bè.

---

## ⌨️ Phím tắt Nhanh (Keyboard Shortcuts)

| Phím | Chức năng |
|------|-----------|
| `Space` | Bật / Tắt Audio Equalizer |
| `↑` / `↓` | Tăng / Giảm âm lượng 5% |
| `M` | Mute / Bật lại tiếng |
| `A` | So sánh A/B (Bypass gốc vs Hiệu ứng) |
| `R` | Đưa 10 dải tần về Flat (0dB) |
| `Ctrl + Z` | Hoàn tác EQ (Undo) |
| `Ctrl + Y` | Làm lại EQ (Redo) |

---

## 🏗️ Kiến trúc Kỹ thuật

Extension tuân thủ tiêu chuẩn **Manifest V3**:
- **Service Worker (`background.js`)**: Điều phối message và vòng đời tab.
- **Offscreen Document (`offscreen.js`)**: Xử lý `AudioContext`, chuỗi node âm thanh không bị ngắt quãng.
- **Chuỗi xử lý âm thanh (Audio Processing Graph)**:
```
Tab Audio Stream → Preamp Gain → Gain (Volume & Mono Downmix) → 10 Parametric BiquadFilters (EQ) → [Bass Enhancer] → [Auto-Pan] → [Spatial Audio] → [Convolver Reverb] → Master Stereo Pan → Dynamics Compressor → Brickwall Limiter → Analyser → Destination Output
```

---

## 🚀 Cài đặt

1. Tải về hoặc clone repository:
   ```bash
   git clone https://github.com/xuantruongg03/audio-equalizer-booster.git
   ```
2. Mở trình duyệt Chrome/Edge và truy cập `chrome://extensions/`.
3. Bật **Developer mode** (Chế độ dành cho nhà phát triển).
4. Nhấn **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục `audio-equalizer-booster`.

---

## 📄 License

Phát hành dưới giấy phép [MIT License](LICENSE).

Made with ❤️ by **xuantruongg03**
