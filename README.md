# Audio Equalizer & Booster

A comprehensive Chrome Extension (Manifest V3) that enhances audio output from any active tab using the Web Audio API.

## Features

- **10-Band Graphic Equalizer**: Fine-tune audio with 10 frequency bands (32Hz - 16kHz)
- **Volume Booster**: Increase volume up to 400% (4x amplification)
- **Dynamic Compressor**: Prevents audio clipping and distortion at high volumes
- **Preset System**: Quick access to popular EQ configurations
  - Flat (Default)
  - Bass Boost
  - Vocal Booster
  - Treble Booster
- **Persistent Settings**: Your preferences are saved and restored automatically
- **Modern Dark UI**: Clean, intuitive interface with visual feedback

## Technical Architecture

### Manifest V3 Compliance
This extension is built using Chrome's Manifest V3 specification, utilizing:

- **Service Worker**: Background script for coordinating messages
- **Offscreen Document**: Required for AudioContext since service workers can't access DOM
- **Tab Capture API**: Captures audio from the active tab
- **Storage API**: Persists user settings locally

### Audio Processing Chain
```
Source → GainNode (Volume) → [10 BiquadFilters (EQ)] → DynamicsCompressor → Destination
```

## Installation

1. Clone or download this repository
2. Generate the icons (see `icons/README.md`)
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extension directory

## File Structure

```
audio-equalizer-booster/
├── manifest.json           # Extension configuration
├── background/
│   └── background.js       # Service worker
├── offscreen/
│   ├── offscreen.html      # Offscreen document
│   └── offscreen.js        # Audio processing engine
├── popup/
│   ├── popup.html          # Popup UI
│   ├── popup.js            # UI logic
│   └── style.css           # Dark theme styles
└── icons/
    ├── generate-icons.html # Icon generator
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Permissions

- `tabCapture`: Capture audio from browser tabs
- `offscreen`: Create offscreen document for audio processing
- `storage`: Save user preferences
- `activeTab`: Access the current active tab

## Usage

1. Click the extension icon in your toolbar
2. Toggle the power switch to enable audio processing
3. Adjust the master volume slider (0-400%)
4. Use preset dropdown for quick EQ configurations
5. Fine-tune individual frequency bands with the EQ sliders
6. Settings are automatically saved

## EQ Frequencies

| Band | Frequency | Typical Use |
|------|-----------|-------------|
| 1 | 32 Hz | Sub-bass |
| 2 | 64 Hz | Bass |
| 3 | 125 Hz | Low-mid bass |
| 4 | 250 Hz | Warmth |
| 5 | 500 Hz | Body |
| 6 | 1 kHz | Presence |
| 7 | 2 kHz | Clarity |
| 8 | 4 kHz | Definition |
| 9 | 8 kHz | Brilliance |
| 10 | 16 kHz | Air |

## Technical Notes

- The compressor is essential for preventing distortion when using volume boost or heavy bass EQ
- Compressor settings: threshold -6dB, ratio 12:1, fast attack (3ms), medium release (250ms)
- Each EQ band uses a peaking filter with Q=1.4 for smooth transitions between bands

## Browser Support

- Chrome 116+ (required for Offscreen API)
- Edge 116+ (Chromium-based)

## License

MIT License
