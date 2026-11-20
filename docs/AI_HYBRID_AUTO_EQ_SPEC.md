# 🧠 ĐẶC TẢ KỸ THUẬT: ĐỘNG CƠ AI AUTO-GENRE & ADAPTIVE EQ (HYBRID FFT + METADATA)
**Dự án:** Zyno Audio Equalizer & Booster Pro  
**Phiên bản:** v3.1.0  
**Tác giả:** xuantruongg03 / Zyno DSP Audio Research Group  
**Độ chính xác mục tiêu:** > 95% trên các nền tảng YouTube, Spotify, Soundcloud, Zing MP3, TikTok.

---

## 1. TỔNG QUAN KIẾN TRÚC (HYBRID FUSION ARCHITECTURE)

Thuật toán kết hợp **hai nguồn dữ liệu độc lập** để phân loại thể loại âm nhạc thời gian thực mà không gây tốn tài nguyên CPU:
1. **Prior Distribution ($S_{\text{meta}}$)**: Trích xuất siêu dữ liệu ngữ cảnh (Tab Title, Artists, Keywords) qua NLP Text Normalizer từ DOM/Tab API.
2. **Acoustic Likelihood ($S_{\text{fft}}$)**: Trích xuất năng lượng phổ thời gian thực bằng Fast Fourier Transform (FFT $N=512$) qua `AnalyserNode` của Web Audio API.

```
                           ┌──────────────────────────┐
                           │   Active Web Tab Audio   │
                           └────────────┬─────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
      ┌───────────────────────────┐           ┌───────────────────────────┐
      │   Tab Metadata Context    │           │     Web Audio Stream      │
      │   (Title, Artists, Tag)   │           │      (AnalyserNode)       │
      └─────────────┬─────────────┘           └─────────────┬─────────────┘
                    │                                       │
                    ▼                                       ▼
      ┌───────────────────────────┐           ┌───────────────────────────┐
      │   NLP Keyword Extractor   │           │   FFT Spectral Energy     │
      │   (Diacritics Removal)    │           │    (Sub-bass/Mid/Treble)  │
      └─────────────┬─────────────┘           └─────────────┬─────────────┘
                    │ S_meta                                │ S_fft
                    └───────────────────┬───────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │    Hybrid Fusion Scoring Matrix   │
                      │   C = 0.55*S_meta + 0.45*S_fft    │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │    Temporal Stability Filter      │
                      │     (2-Window Gate / 1.5s)        │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │    Smooth Parameter Ramping       │
                      │  (linearRampToValueAtTime 500ms)  │
                      └─────────────────┬─────────────────┘
                                        │
                                        ▼
                      ┌───────────────────────────────────┐
                      │  10-Band Parametric EQ + DSP FX   │
                      │   (Spatial, Bass Enhancer, Rev)   │
                      └───────────────────────────────────┘
```

---

## 2. CÔNG THỨC TOÁN HỌC VÀ TRÍCH XUẤT ĐẶC TRƯNG ÂM HỌC (AUDIO FFT)

Độ phân giải FFT với $N = 512$ bins và tần số lấy mẫu $f_s = 48000\text{ Hz}$:
$$\Delta f = \frac{f_s}{N \times 2} = \frac{48000}{1024} = 46.875\text{ Hz/bin}$$

### 2.1. Phân chia dải tần số năng lượng (Frequency Sub-bands)
1. **Sub-Bass Energy ($E_{\text{sub}}$)**: $20\text{Hz} - 60\text{Hz}$ (Bins 0 - 1).
2. **Bass Energy ($E_{\text{bass}}$)**: $60\text{Hz} - 250\text{Hz}$ (Bins 2 - 5).
3. **Low-Mid Warmth ($E_{\text{lowMid}}$)**: $250\text{Hz} - 500\text{Hz}$ (Bins 6 - 11).
4. **Mid / Vocal Presence ($E_{\text{mid}}$)**: $500\text{Hz} - 3000\text{Hz}$ (Bins 12 - 64).
5. **Treble / Brilliance ($E_{\text{treble}}$)**: $3000\text{Hz} - 16000\text{Hz}$ (Bins 65 - 341).

Năng lượng của từng dải tần $E_k$:
$$E_k = \sum_{i \in \text{Range}_k} M_i$$
Trong đó $M_i$ là biên độ magnitude ($0 - 255$) tại bin thứ $i$.

Tỷ lệ năng lượng chuẩn hóa:
$$R_k = \frac{E_k}{\sum_{i=0}^{N-1} M_i}$$

### 2.2. Trọng tâm phổ (Spectral Centroid)
Đo lường "độ sáng" (Brightness) của âm sắc:
$$\text{Centroid} = \frac{\sum_{i=0}^{N-1} f_i \cdot M_i}{\sum_{i=0}^{N-1} M_i}$$
* $\text{Centroid} > 2500\text{ Hz}$: Nhạc điện tử (EDM, Hi-hat giòn, Synth).
* $1500\text{ Hz} \le \text{Centroid} \le 2500\text{ Hz}$: Giọng hát (Vocal Pop, Ballad).
* $\text{Centroid} < 1500\text{ Hz}$: Nhạc trầm, ấm, mộc mạc (Acoustic, Jazz).

---

## 3. BẢNG QUY TẮC NHẬN DIỆN THỂ LOẠI (HEURISTIC CLASSIFICATION MATRIX)

| Thể loại | Đặc trưng FFT | Từ khóa Metadata tiêu biểu | Cấu hình EQ 10 dải (dB) | Hiệu ứng DSP kèm theo |
| :--- | :--- | :--- | :--- | :--- |
| **Drill & 808 Trap** | $R_{\text{sub}} > 0.18$, $R_{\text{treble}} > 0.15$, $R_{\text{lowMid}} < 0.12$ | `drill`, `uk drill`, `ny drill`, `central cee`, `pop smoke`, `808` | `32: +6`, `64: +5`, `125: +2`, `250: -2`, `500: 0`, `1k: +1`, `2k: +2`, `4k: +3`, `8k: +4`, `16k: +4` | Limiter: -4dB *(chống rè sub-bass)* |
| **EDM & Vinahouse Remix** | $R_{\text{bass}} > 0.32$, $R_{\text{treble}} > 0.20$, $\text{Centroid} > 2400\text{Hz}$ | `edm`, `remix`, `vinahouse`, `club mix`, `dj`, `electro`, `bounce` | `32: +5`, `64: +6`, `125: +4`, `250: 0`, `500: -2`, `1k: 0`, `2k: +2`, `4k: +4`, `8k: +5`, `16k: +5` | **Spatial Audio:** Wide 60%<br>**Bass Enhancer:** 35% (90Hz) |
| **Super Bass Boosted** | $(R_{\text{sub}} + R_{\text{bass}}) > 0.48$ | `bass boosted`, `mega bass`, `sub bass test`, `deep bass` | `32: +9`, `64: +8`, `125: +5`, `250: +2`, `500: 0`, `1k: 0`, `2k: +1`, `4k: +2`, `8k: +2`, `16k: +2` | **Bass Enhancer:** 55% (80Hz)<br>**Limiter:** -5dB |
| **K-Pop & V-Pop (Vocal)** | $R_{\text{mid}} > 0.35$, $1800 \le \text{Centroid} \le 3500$ | `kpop`, `k-pop`, `vpop`, `blackpink`, `bts`, `sơn tùng`, `mv` | `32: +2`, `64: +3`, `125: +2`, `250: 0`, `500: +1`, `1k: +3`, `2k: +4`, `4k: +4`, `8k: +3`, `16k: +2` | **Reverb:** Room 12% *(làm ấm vocal)* |
| **Acoustic & Ballad** | $R_{\text{lowMid}} > 0.22$, $R_{\text{sub}} < 0.10$, $\text{Centroid} < 2000$ | `acoustic`, `ballad`, `lofi`, `chill`, `piano`, `guitar cover` | `32: 0`, `64: +2`, `125: +3`, `250: +3`, `500: +2`, `1k: +2`, `2k: +3`, `4k: +2`, `8k: +1`, `16k: +1` | **Reverb:** Hall 25% *(khán phòng hòa nhạc)* |
| **Rock & Heavy Metal** | $R_{\text{presence}} > 0.20$, $R_{\text{bass}} > 0.22$ | `rock`, `metal`, `guitar solo`, `heavy metal`, `punk`, `hard rock` | `32: +5`, `64: +5`, `125: +3`, `250: +1`, `500: -2`, `1k: +2`, `2k: +4`, `4k: +5`, `8k: +6`, `16k: +5` | Limiter: -4dB |
| **Cinema & Podcast** | $R_{\text{mid}} > 0.50$, $(R_{\text{sub}} + R_{\text{bass}}) < 0.18$ | `podcast`, `talkshow`, `audiobook`, `sách nói`, `trailer` | `32: -3`, `64: -2`, `125: 0`, `250: +2`, `500: +4`, `1k: +6`, `2k: +6`, `4k: +4`, `8k: +2`, `16k: 0` | Limiter: -6dB |

---

## 4. CHIẾN LƯỢC KẾT HỢP HYBRID (HYBRID FUSION SCORING)

Độ tin cậy tổng hợp $C(g)$ cho thể loại $g$:
$$C(g) = 
\begin{cases} 
0.55 \cdot S_{\text{meta}}(g) + 0.45 \cdot S_{\text{fft}}(g), & \text{khi } S_{\text{meta}}(g) > 0 \\ 
S_{\text{fft}}(g), & \text{khi không có khớp siêu dữ liệu} 
\end{cases}$$

Ngưỡng kích hoạt thể loại: $C_{\text{threshold}} = 0.35$.

### Cổng ổn định thời gian (Temporal Stability Gate)
Để triệt tiêu hiện tượng nhảy thể loại liên tục (flickering) khi bản nhạc có đoạn nghỉ (intro trống trải hoặc đoạn hội thoại mở đầu):
* Cửa sổ quan sát: $W = 3$ chu kỳ lấy mẫu ($3 \times 1.5\text{s} = 4.5\text{s}$).
* Yêu cầu tối thiểu $2$ lần đánh giá liên tiếp đồng thuận trước khi ra quyết định thay đổi thể loại âm thanh.

---

## 5. CHUYỂN ĐỔI MƯỢT MÀ KHÔNG GÂY RÈ TIẾNG (AUDIO CROSSFADE RAMPING)

Khi chuyển đổi EQ giữa hai thể loại nhạc khác nhau, Web Audio API sử dụng phương thức toán học:
```javascript
filter.gain.cancelScheduledValues(currentTime);
filter.gain.setValueAtTime(filter.gain.value, currentTime);
filter.gain.linearRampToValueAtTime(targetGain, currentTime + 0.50);
```
* **Thời gian chuyển đổi ($t_{\text{ramp}}$):** $500\text{ ms}$.
* Triệt tiêu $100\%$ tiếng nổ đanh (audio pop/click/zipper noise) thường thấy ở các phần mềm equalizer kém chất lượng khi thay đổi gain đột ngột.

---

## 6. ĐẢM BẢO QUYỀN RIÊNG TƯ (LOCAL-FIRST PRIVACY GUARANTEE)

* Toàn bộ phép tính FFT và đối soát từ khóa chạy hoàn toàn trong bộ nhớ RAM trình duyệt của người dùng (`Offscreen Document`).
* Không ghi âm, không truyền tải dữ liệu âm thanh hoặc lịch sử nghe nhạc về bất kỳ máy chủ nào.
