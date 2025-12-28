// Popup UI Controller
// Manages user interface and sends commands to background script

// EQ band configurations with descriptions
const EQ_BANDS = [
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

// Preset configurations (gain values in dB, -12 to +12)
const PRESETS = {
    'flat': {
        '32': 0, '64': 0, '125': 0, '250': 0, '500': 0,
        '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0
    },
    'bass-boost': {
        '32': 10, '64': 8, '125': 6, '250': 4, '500': 2,
        '1k': 0, '2k': 0, '4k': 0, '8k': 0, '16k': 0
    },
    'vocal-booster': {
        '32': -2, '64': -1, '125': 0, '250': 2, '500': 4,
        '1k': 6, '2k': 6, '4k': 4, '8k': 2, '16k': 0
    },
    'treble-booster': {
        '32': 0, '64': 0, '125': 0, '250': 0, '500': 2,
        '1k': 3, '2k': 5, '4k': 7, '8k': 9, '16k': 10
    }
};

// User saved presets (loaded from storage)
let userPresets = {};

// Current settings state
let currentSettings = {
    enabled: false,
    volume: 100,
    preset: 'flat',
    bands: { ...PRESETS['flat'] }
};

// DOM Elements
let powerToggle;
let statusIndicator;
let statusText;
let presetSelect;
let volumeSlider;
let volumeValue;
let eqBandsContainer;
let resetBtn;
let savePresetBtn;
let deletePresetBtn;
let savePresetModal;
let presetNameInput;
let confirmSaveBtn;
let cancelSaveBtn;
let exportBtn;
let importBtn;
let importFileInput;

/**
 * Initialize the popup
 */
async function init() {
    // Get DOM elements
    powerToggle = document.getElementById('powerToggle');
    statusIndicator = document.getElementById('statusIndicator');
    statusText = document.getElementById('statusText');
    presetSelect = document.getElementById('presetSelect');
    volumeSlider = document.getElementById('volumeSlider');
    volumeValue = document.getElementById('volumeValue');
    eqBandsContainer = document.getElementById('eqBands');
    resetBtn = document.getElementById('resetBtn');
    savePresetBtn = document.getElementById('savePresetBtn');
    deletePresetBtn = document.getElementById('deletePresetBtn');
    savePresetModal = document.getElementById('savePresetModal');
    presetNameInput = document.getElementById('presetNameInput');
    confirmSaveBtn = document.getElementById('confirmSaveBtn');
    cancelSaveBtn = document.getElementById('cancelSaveBtn');
    exportBtn = document.getElementById('exportBtn');
    importBtn = document.getElementById('importBtn');
    importFileInput = document.getElementById('importFileInput');

    // Generate EQ band sliders
    generateEQBands();

    // Load saved settings and user presets
    await loadSettings();
    await loadUserPresets();

    // Check current status
    await checkStatus();

    // Setup event listeners
    setupEventListeners();

    // Update UI to reflect current state
    updateUI();
    updatePresetDropdown();
}

/**
 * Generate the 10 EQ band sliders
 */
function generateEQBands() {
    eqBandsContainer.innerHTML = '';

    EQ_BANDS.forEach(band => {
        const bandDiv = document.createElement('div');
        bandDiv.className = 'eq-band';
        bandDiv.setAttribute('data-tooltip', band.desc);
        bandDiv.innerHTML = `
      <span class="eq-value" id="eq-value-${band.key}">0dB</span>
      <input type="range" 
             class="eq-slider" 
             id="eq-${band.key}" 
             data-band="${band.key}"
             min="-12" 
             max="12" 
             value="0" 
             title="${band.desc}"
             orient="vertical">
      <span class="eq-band-label">${band.label}</span>
    `;
        eqBandsContainer.appendChild(bandDiv);
    });
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Power toggle
    powerToggle.addEventListener('change', handlePowerToggle);

    // Preset selector
    presetSelect.addEventListener('change', handlePresetChange);

    // Volume slider
    volumeSlider.addEventListener('input', handleVolumeChange);

    // EQ band sliders - input and wheel events
    document.querySelectorAll('.eq-slider').forEach(slider => {
        slider.addEventListener('input', handleEQChange);

        // Mouse wheel support
        slider.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1; // Scroll up = increase
            const newValue = Math.max(-12, Math.min(12, parseInt(slider.value) + delta));
            slider.value = newValue;
            handleEQChange({ target: slider });
        });
    });

    // Reset button
    resetBtn.addEventListener('click', handleReset);

    // Save/Delete preset buttons
    savePresetBtn.addEventListener('click', openSavePresetModal);
    deletePresetBtn.addEventListener('click', handleDeletePreset);
    confirmSaveBtn.addEventListener('click', handleSavePreset);
    cancelSaveBtn.addEventListener('click', closeSavePresetModal);

    // Export/Import buttons
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImport);

    // Close modal on overlay click
    savePresetModal.addEventListener('click', (e) => {
        if (e.target === savePresetModal) closeSavePresetModal();
    });

    // Enter key to save preset
    presetNameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSavePreset();
    });

    // Listen for status updates from background
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

/**
 * Load settings from storage
 */
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
            if (result.settings) {
                currentSettings = { ...currentSettings, ...result.settings };
            }
            resolve();
        });
    });
}

/**
 * Load user presets from storage
 */
async function loadUserPresets() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['userPresets'], (result) => {
            if (result.userPresets) {
                userPresets = result.userPresets;
            }
            resolve();
        });
    });
}

/**
 * Save user presets to storage
 */
async function saveUserPresets() {
    return new Promise((resolve) => {
        chrome.storage.local.set({ userPresets }, resolve);
    });
}

/**
 * Update preset dropdown with user presets
 */
function updatePresetDropdown() {
    // Remove old user presets from dropdown
    const existingUserOptions = presetSelect.querySelectorAll('option[data-user="true"]');
    existingUserOptions.forEach(opt => opt.remove());

    // Add user presets before "Custom" option
    const customOption = presetSelect.querySelector('option[value="custom"]');

    Object.keys(userPresets).forEach(key => {
        const option = document.createElement('option');
        option.value = `user_${key}`;
        option.textContent = `⭐ ${userPresets[key].name}`;
        option.setAttribute('data-user', 'true');
        presetSelect.insertBefore(option, customOption);
    });

    // Update delete button visibility
    updateDeleteButtonVisibility();
}

/**
 * Update delete button visibility based on selected preset
 */
function updateDeleteButtonVisibility() {
    const isUserPreset = presetSelect.value.startsWith('user_');
    deletePresetBtn.style.display = isUserPreset ? 'flex' : 'none';
}

/**
 * Open save preset modal
 */
function openSavePresetModal() {
    presetNameInput.value = '';
    savePresetModal.style.display = 'flex';
    presetNameInput.focus();
}

/**
 * Close save preset modal
 */
function closeSavePresetModal() {
    savePresetModal.style.display = 'none';
}

/**
 * Handle save preset
 */
async function handleSavePreset() {
    const name = presetNameInput.value.trim();
    if (!name) {
        presetNameInput.focus();
        return;
    }

    // Generate unique key
    const key = Date.now().toString();

    // Save preset
    userPresets[key] = {
        name: name,
        bands: { ...currentSettings.bands },
        volume: currentSettings.volume
    };

    await saveUserPresets();
    updatePresetDropdown();

    // Select the new preset
    currentSettings.preset = `user_${key}`;
    presetSelect.value = `user_${key}`;
    await saveSettings();

    closeSavePresetModal();
    updateDeleteButtonVisibility();
}

/**
 * Handle delete preset
 */
async function handleDeletePreset() {
    const selectedValue = presetSelect.value;
    if (!selectedValue.startsWith('user_')) return;

    const key = selectedValue.replace('user_', '');
    const presetName = userPresets[key]?.name || 'preset';

    if (confirm(`Xóa preset "${presetName}"?`)) {
        delete userPresets[key];
        await saveUserPresets();
        updatePresetDropdown();

        // Reset to flat
        currentSettings.preset = 'flat';
        currentSettings.bands = { ...PRESETS['flat'] };
        presetSelect.value = 'flat';
        updateUI();
        await saveSettings();
        await sendSettingsUpdate();
    }
}

/**
 * Save settings to storage
 */
async function saveSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.set({ settings: currentSettings }, resolve);
    });
}

/**
 * Check if audio processing is currently active
 */
async function checkStatus() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
            if (response && response.isActive) {
                currentSettings.enabled = true;
            }
            resolve();
        });
    });
}

/**
 * Update UI to reflect current settings
 */
function updateUI() {
    // Power toggle
    powerToggle.checked = currentSettings.enabled;

    // Status indicator
    updateStatus(currentSettings.enabled);

    // Preset
    presetSelect.value = currentSettings.preset;

    // Volume
    volumeSlider.value = currentSettings.volume;
    volumeValue.textContent = `${currentSettings.volume}%`;
    updateVolumeSliderBackground();

    // EQ bands
    EQ_BANDS.forEach(band => {
        const slider = document.getElementById(`eq-${band.key}`);
        if (slider) {
            const value = currentSettings.bands[band.key] || 0;
            slider.value = value;
            updateEQSliderBackground(slider);
            updateEQValueDisplay(band.key, value);
        }
    });

    // Update preset dropdown (check if current matches any preset)
    checkPresetMatch();
}

/**
 * Update status indicator
 */
function updateStatus(isActive) {
    statusIndicator.className = 'status-indicator ' + (isActive ? 'active' : '');
    statusText.textContent = isActive ? 'Active' : 'Off';
}

/**
 * Handle power toggle
 */
async function handlePowerToggle() {
    const enabled = powerToggle.checked;
    currentSettings.enabled = enabled;

    if (enabled) {
        // Start audio capture
        updateStatus(false);
        statusText.textContent = 'Starting...';

        chrome.runtime.sendMessage({ type: 'START_AUDIO_CAPTURE' }, async (response) => {
            if (response && response.success) {
                updateStatus(true);
                // Send current settings to audio processor
                await sendSettingsUpdate();
            } else {
                powerToggle.checked = false;
                currentSettings.enabled = false;
                updateStatus(false);
                statusText.textContent = 'Error: ' + (response?.error || 'Unknown error');
            }
        });
    } else {
        // Stop audio capture
        chrome.runtime.sendMessage({ type: 'STOP_AUDIO_CAPTURE' }, () => {
            updateStatus(false);
        });
    }

    await saveSettings();
}

/**
 * Handle preset change
 */
async function handlePresetChange() {
    const preset = presetSelect.value;

    // Handle built-in presets
    if (preset !== 'custom' && PRESETS[preset]) {
        currentSettings.preset = preset;
        currentSettings.bands = { ...PRESETS[preset] };
        updateUI();
        await saveSettings();
        await sendSettingsUpdate();
    }
    // Handle user presets
    else if (preset.startsWith('user_')) {
        const key = preset.replace('user_', '');
        if (userPresets[key]) {
            currentSettings.preset = preset;
            currentSettings.bands = { ...userPresets[key].bands };
            if (userPresets[key].volume !== undefined) {
                currentSettings.volume = userPresets[key].volume;
            }
            updateUI();
            await saveSettings();
            await sendSettingsUpdate();
        }
    }

    updateDeleteButtonVisibility();
}

/**
 * Handle volume slider change
 */
async function handleVolumeChange() {
    const volume = parseInt(volumeSlider.value);
    currentSettings.volume = volume;
    volumeValue.textContent = `${volume}%`;
    updateVolumeSliderBackground();

    await saveSettings();
    await sendSettingsUpdate();
}

/**
 * Handle EQ band slider change
 */
async function handleEQChange(event) {
    const slider = event.target;
    const band = slider.dataset.band;
    const value = parseInt(slider.value);

    currentSettings.bands[band] = value;
    updateEQSliderBackground(slider);
    updateEQValueDisplay(band, value);

    // Switch to custom preset when user manually adjusts
    currentSettings.preset = 'custom';
    presetSelect.value = 'custom';

    await saveSettings();
    await sendSettingsUpdate();
}

/**
 * Update EQ value display
 */
function updateEQValueDisplay(band, value) {
    const valueEl = document.getElementById(`eq-value-${band}`);
    if (valueEl) {
        const sign = value > 0 ? '+' : '';
        valueEl.textContent = `${sign}${value}dB`;
        valueEl.className = 'eq-value' + (value > 0 ? ' boost' : value < 0 ? ' cut' : '');
    }
}

/**
 * Handle reset button
 */
async function handleReset() {
    currentSettings.preset = 'flat';
    currentSettings.bands = { ...PRESETS['flat'] };
    currentSettings.volume = 100;

    updateUI();
    await saveSettings();
    await sendSettingsUpdate();
}

/**
 * Send settings update to background/offscreen
 */
async function sendSettingsUpdate() {
    if (!currentSettings.enabled) return;

    chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
            volume: currentSettings.volume,
            bands: currentSettings.bands
        }
    });
}

/**
 * Handle messages from background script
 */
function handleBackgroundMessage(message) {
    switch (message.type) {
        case 'AUDIO_STARTED':
            updateStatus(true);
            break;
        case 'AUDIO_STOPPED':
            updateStatus(false);
            currentSettings.enabled = false;
            powerToggle.checked = false;
            break;
        case 'AUDIO_ERROR':
            updateStatus(false);
            statusText.textContent = 'Error: ' + message.error;
            currentSettings.enabled = false;
            powerToggle.checked = false;
            break;
    }
}

/**
 * Check if current EQ matches any preset
 */
function checkPresetMatch() {
    for (const [presetName, presetBands] of Object.entries(PRESETS)) {
        const matches = EQ_BANDS.every(band =>
            currentSettings.bands[band.key] === presetBands[band.key]
        );
        if (matches) {
            currentSettings.preset = presetName;
            presetSelect.value = presetName;
            return;
        }
    }
    currentSettings.preset = 'custom';
    presetSelect.value = 'custom';
}

/**
 * Update volume slider background gradient
 */
function updateVolumeSliderBackground() {
    const value = volumeSlider.value;
    const max = volumeSlider.max;
    const percentage = (value / max) * 100;

    let color = '#4ade80'; // Green
    if (value > 200) color = '#f59e0b'; // Orange
    if (value > 300) color = '#ef4444'; // Red

    volumeSlider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #374151 ${percentage}%, #374151 100%)`;
}

/**
 * Update EQ slider background gradient
 * Slider now uses fixed gradient, thumb position shows value
 */
function updateEQSliderBackground(slider) {
    // Fixed gradient: green (top/boost) -> gray (middle/0dB) -> orange (bottom/cut)
    // No need to change background dynamically - thumb position is sufficient
}

/**
 * Encode config to obfuscated string
 * Uses Base64 + simple character shift for obfuscation
 */
function encodeConfig(config) {
    const json = JSON.stringify(config);
    // Base64 encode
    const base64 = btoa(unescape(encodeURIComponent(json)));
    // Simple character shift (Caesar cipher +3)
    const shifted = base64.split('').map(char => {
        const code = char.charCodeAt(0);
        return String.fromCharCode(code + 3);
    }).join('');
    // Add header
    return 'AEQ1:' + shifted;
}

/**
 * Decode obfuscated config string
 */
function decodeConfig(encoded) {
    try {
        // Check header
        if (!encoded.startsWith('AEQ1:')) {
            throw new Error('Invalid format');
        }
        // Remove header
        const shifted = encoded.substring(5);
        // Reverse character shift
        const base64 = shifted.split('').map(char => {
            const code = char.charCodeAt(0);
            return String.fromCharCode(code - 3);
        }).join('');
        // Base64 decode
        const json = decodeURIComponent(escape(atob(base64)));
        return JSON.parse(json);
    } catch (e) {
        throw new Error('Không thể đọc file cấu hình. File có thể bị hỏng.');
    }
}

/**
 * Handle export configuration
 */
function handleExport() {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        settings: {
            volume: currentSettings.volume,
            preset: currentSettings.preset,
            bands: { ...currentSettings.bands }
        },
        userPresets: { ...userPresets }
    };

    const encoded = encodeConfig(exportData);

    // Create download
    const blob = new Blob([encoded], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-eq-config-${Date.now()}.aeq`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Handle import configuration
 */
async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input so same file can be selected again
    event.target.value = '';

    try {
        const text = await file.text();
        const data = decodeConfig(text);

        // Validate data
        if (!data.settings || !data.settings.bands) {
            throw new Error('Dữ liệu không hợp lệ');
        }

        // Confirm import
        const hasUserPresets = data.userPresets && Object.keys(data.userPresets).length > 0;
        const message = hasUserPresets
            ? `Import cấu hình và ${Object.keys(data.userPresets).length} preset tùy chỉnh?`
            : 'Import cấu hình EQ?';

        if (!confirm(message)) return;

        // Apply settings
        if (data.settings.volume !== undefined) {
            currentSettings.volume = Math.max(0, Math.min(400, data.settings.volume));
        }
        if (data.settings.bands) {
            EQ_BANDS.forEach(band => {
                if (data.settings.bands[band.key] !== undefined) {
                    currentSettings.bands[band.key] = Math.max(-12, Math.min(12, data.settings.bands[band.key]));
                }
            });
        }
        currentSettings.preset = 'custom';

        // Merge user presets (new presets from file)
        if (hasUserPresets) {
            Object.entries(data.userPresets).forEach(([key, preset]) => {
                // Generate new key to avoid conflicts
                const newKey = `imported_${Date.now()}_${key}`;
                userPresets[newKey] = {
                    name: preset.name || 'Imported',
                    bands: { ...preset.bands },
                    volume: preset.volume
                };
            });
            await saveUserPresets();
        }

        // Update UI and save
        updatePresetDropdown();
        updateUI();
        await saveSettings();
        await sendSettingsUpdate();

        alert('✅ Import thành công!');

    } catch (error) {
        alert('❌ ' + error.message);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
