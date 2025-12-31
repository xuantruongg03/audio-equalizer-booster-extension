// Popup UI Controller v2.1
// Clean UI with slider volume, realtime visualizer, 7D audio

import { EQ_BANDS, PRESETS, getFlatBands, clonePresetBands } from './modules/presets.js';
import { createKnob, updateKnobValue } from './modules/knob.js';
import { DEFAULT_EFFECTS, createEffectsPanel } from './modules/effects.js';
import { createVisualizer } from './modules/visualizer.js';
import { SiteSettingsManager, getDomain, createSavedSitesList } from './modules/siteSettings.js';

// ===================== STATE =====================
let currentSettings = {
    enabled: false,
    volume: 100,
    preset: 'flat',
    bands: getFlatBands(),
    effects: { ...DEFAULT_EFFECTS }
};

let userPresets = {};
let siteManager = new SiteSettingsManager();
let currentDomain = null;
let currentTabId = null;

// ===================== DOM ELEMENTS =====================
let powerToggle, statusIndicator, statusText;
let siteFavicon, siteDomain, saveSiteBtn;
let volumeSlider, volumeDisplay;
let presetSelect, eqKnobsContainer, flatEqBtn;
let visualizerSection, effectsContainer;
let userPresetsList, sitePresetsList;
let savePresetBtn, savePresetModal, presetNameInput;
let saveVolumeCheck, saveEffectsCheck, confirmSaveBtn, cancelSaveBtn;
let exportBtn, importBtn, importFileInput;
let settingsBtn, settingsModal, closeSettingsBtn;

// Components
let eqKnobs = {};
let visualizer = null;
let effectsPanel = null;

// ===================== INITIALIZATION =====================
async function init() {
    getDOMElements();
    await getCurrentTabInfo();
    await loadSettings();
    await loadUserPresets();
    await siteManager.load();
    await applySiteSettings();
    await checkStatus();

    generateEQKnobs();
    generateVisualizer();
    generateEffectsPanel();
    generateUserPresetsList();
    generateSitePresetsList();
    setupEventListeners();
    updateUI();
}

function getDOMElements() {
    powerToggle = document.getElementById('powerToggle');
    statusIndicator = document.getElementById('statusIndicator');
    statusText = document.getElementById('statusText');
    siteFavicon = document.getElementById('siteFavicon');
    siteDomain = document.getElementById('siteDomain');
    saveSiteBtn = document.getElementById('saveSiteBtn');
    volumeSlider = document.getElementById('volumeSlider');
    volumeDisplay = document.getElementById('volumeDisplay');
    presetSelect = document.getElementById('presetSelect');
    eqKnobsContainer = document.getElementById('eqKnobs');
    flatEqBtn = document.getElementById('flatEqBtn');
    visualizerSection = document.getElementById('visualizerSection');
    effectsContainer = document.getElementById('effectsContainer');
    userPresetsList = document.getElementById('userPresetsList');
    sitePresetsList = document.getElementById('sitePresetsList');
    savePresetBtn = document.getElementById('savePresetBtn');
    savePresetModal = document.getElementById('savePresetModal');
    presetNameInput = document.getElementById('presetNameInput');
    saveVolumeCheck = document.getElementById('saveVolumeCheck');
    saveEffectsCheck = document.getElementById('saveEffectsCheck');
    confirmSaveBtn = document.getElementById('confirmSaveBtn');
    cancelSaveBtn = document.getElementById('cancelSaveBtn');
    exportBtn = document.getElementById('exportBtn');
    importBtn = document.getElementById('importBtn');
    importFileInput = document.getElementById('importFileInput');
    settingsBtn = document.getElementById('settingsBtn');
    settingsModal = document.getElementById('settingsModal');
    closeSettingsBtn = document.getElementById('closeSettingsBtn');
}

async function getCurrentTabInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                currentTabId = tabs[0].id;
                currentDomain = getDomain(tabs[0].url);
                if (currentDomain) {
                    siteDomain.textContent = currentDomain;
                    siteFavicon.src = `https://www.google.com/s2/favicons?domain=${currentDomain}&sz=32`;
                    siteFavicon.style.display = 'block';
                    siteFavicon.onerror = () => { siteFavicon.style.display = 'none'; };
                }
            }
            resolve();
        });
    });
}

// ===================== UI GENERATION =====================
function generateEQKnobs() {
    eqKnobsContainer.innerHTML = '';
    EQ_BANDS.forEach(band => {
        const value = currentSettings.bands[band.key] || 0;
        const knob = createKnob({
            id: `eq-${band.key}`,
            label: band.label,
            min: -12,
            max: 12,
            value: value,
            size: 34,
            onChange: (val) => handleEQChange(band.key, val)
        });
        eqKnobs[band.key] = knob;
        eqKnobsContainer.appendChild(knob);
    });
}

function generateVisualizer() {
    visualizer = createVisualizer({
        width: 376,
        height: 50,
        mode: 'bars',
        barCount: 40
    });
    visualizerSection.appendChild(visualizer);

    // Start realtime updates if active
    if (currentSettings.enabled) {
        startVisualizerUpdates();
    }
}

function generateEffectsPanel() {
    effectsPanel = createEffectsPanel(currentSettings.effects, handleEffectsChange);
    effectsContainer.appendChild(effectsPanel);
}

function generateUserPresetsList() {
    userPresetsList.innerHTML = '';
    const presets = Object.entries(userPresets);

    if (presets.length === 0) {
        userPresetsList.innerHTML = `
            <div class="no-presets">
                <span>📭</span>
                <p>Chưa có preset. Nhấn + để lưu.</p>
            </div>
        `;
        return;
    }

    presets.forEach(([key, preset]) => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.innerHTML = `
            <div class="preset-item-info">
                <span class="preset-item-name">${preset.name}</span>
            </div>
            <button class="preset-item-delete" data-key="${key}">×</button>
        `;
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('preset-item-delete')) {
                applyUserPreset(key);
            }
        });
        item.querySelector('.preset-item-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteUserPreset(key);
        });
        userPresetsList.appendChild(item);
    });
}

function generateSitePresetsList() {
    const list = createSavedSitesList(
        siteManager,
        (domain) => {
            const settings = siteManager.getForSite(domain);
            if (settings) applySettings(settings);
        },
        async (domain) => {
            await siteManager.removeForSite(domain);
            generateSitePresetsList();
        }
    );
    sitePresetsList.innerHTML = '';
    sitePresetsList.appendChild(list);
}

// ===================== EVENT LISTENERS =====================
function setupEventListeners() {
    // Power toggle
    powerToggle.addEventListener('change', handlePowerToggle);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });

    // Volume slider
    volumeSlider.addEventListener('input', handleVolumeSlider);

    // Volume marks (quick jump)
    document.querySelectorAll('.volume-mark').forEach(mark => {
        mark.addEventListener('click', () => {
            const value = parseInt(mark.dataset.value);
            volumeSlider.value = value;
            handleVolumeSlider();
        });
    });

    // Preset select
    presetSelect.addEventListener('change', handlePresetChange);

    // Flat EQ
    flatEqBtn.addEventListener('click', handleFlatEQ);

    // Save site
    saveSiteBtn.addEventListener('click', handleSaveSite);

    // Preset management
    savePresetBtn.addEventListener('click', () => {
        presetNameInput.value = '';
        savePresetModal.style.display = 'flex';
        presetNameInput.focus();
    });
    confirmSaveBtn.addEventListener('click', handleSavePreset);
    cancelSaveBtn.addEventListener('click', () => savePresetModal.style.display = 'none');
    savePresetModal.addEventListener('click', (e) => {
        if (e.target === savePresetModal) savePresetModal.style.display = 'none';
    });
    presetNameInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSavePreset();
    });

    // Export/Import
    exportBtn.addEventListener('click', handleExport);
    importBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleImport);

    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });

    // Background messages
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

// ===================== HANDLERS =====================
async function handlePowerToggle() {
    const enabled = powerToggle.checked;
    currentSettings.enabled = enabled;

    if (enabled) {
        updateStatus(false);
        statusText.textContent = 'Starting...';

        chrome.runtime.sendMessage({ type: 'START_AUDIO_CAPTURE' }, async (response) => {
            if (response && response.success) {
                updateStatus(true);
                await sendSettingsUpdate();
                startVisualizerUpdates();
            } else {
                powerToggle.checked = false;
                currentSettings.enabled = false;
                updateStatus(false);
                statusText.textContent = 'Error';
            }
        });
    } else {
        chrome.runtime.sendMessage({ type: 'STOP_AUDIO_CAPTURE' }, () => {
            updateStatus(false);
            stopVisualizerUpdates();
        });
    }

    await saveSettings();
}

function handleVolumeSlider() {
    const value = parseInt(volumeSlider.value);
    currentSettings.volume = value;

    // Update display
    volumeDisplay.textContent = `${value}%`;

    // Update slider track color
    const percent = (value / 800) * 100;
    volumeSlider.style.setProperty('--volume-percent', `${percent}%`);

    // Update marks
    document.querySelectorAll('.volume-mark').forEach(mark => {
        const markValue = parseInt(mark.dataset.value);
        mark.classList.toggle('active', markValue === value);
    });

    saveSettings();
    sendSettingsUpdate();
}

async function handleEQChange(band, value) {
    currentSettings.bands[band] = value;
    currentSettings.preset = 'custom';
    presetSelect.value = 'custom';
    await saveSettings();
    await sendSettingsUpdate();
}

async function handlePresetChange() {
    const preset = presetSelect.value;
    if (preset === 'custom') return;

    if (PRESETS[preset]) {
        currentSettings.preset = preset;
        currentSettings.bands = clonePresetBands(preset);
        updateEQKnobs();
        await saveSettings();
        await sendSettingsUpdate();
    }
}

async function handleFlatEQ() {
    currentSettings.preset = 'flat';
    currentSettings.bands = getFlatBands();
    presetSelect.value = 'flat';
    updateEQKnobs();
    await saveSettings();
    await sendSettingsUpdate();
}

async function handleEffectsChange(effects) {
    currentSettings.effects = { ...effects };
    await saveSettings();
    await sendEffectsUpdate();
}

async function handleSaveSite() {
    if (!currentDomain) return;
    await siteManager.saveForSite(currentDomain, currentSettings);
    generateSitePresetsList();
    saveSiteBtn.textContent = '✅';
    setTimeout(() => { saveSiteBtn.textContent = '💾'; }, 1500);
}

async function handleSavePreset() {
    const name = presetNameInput.value.trim();
    if (!name) return;

    const key = Date.now().toString();
    userPresets[key] = {
        name: name,
        bands: { ...currentSettings.bands },
        volume: saveVolumeCheck.checked ? currentSettings.volume : undefined,
        effects: saveEffectsCheck.checked ? { ...currentSettings.effects } : undefined,
        savedAt: Date.now()
    };

    await saveUserPresets();
    generateUserPresetsList();
    savePresetModal.style.display = 'none';
}

async function applyUserPreset(key) {
    const preset = userPresets[key];
    if (!preset) return;

    currentSettings.bands = { ...preset.bands };
    if (preset.volume !== undefined) {
        currentSettings.volume = preset.volume;
        volumeSlider.value = preset.volume;
        handleVolumeSlider();
    }
    if (preset.effects) {
        currentSettings.effects = { ...preset.effects };
        effectsPanel.setEffects(preset.effects);
    }

    currentSettings.preset = `user_${key}`;
    updateEQKnobs();
    await saveSettings();
    await sendSettingsUpdate();
}

async function deleteUserPreset(key) {
    if (!confirm(`Xóa preset "${userPresets[key]?.name}"?`)) return;
    delete userPresets[key];
    await saveUserPresets();
    generateUserPresetsList();
}

async function applySiteSettings() {
    if (!currentDomain || !siteManager.autoApply) return;
    const siteSettings = siteManager.getForSite(currentDomain);
    if (siteSettings) applySettings(siteSettings);
}

function applySettings(settings) {
    if (settings.bands) {
        currentSettings.bands = { ...settings.bands };
        updateEQKnobs();
    }
    if (settings.volume !== undefined) {
        currentSettings.volume = settings.volume;
        volumeSlider.value = settings.volume;
        handleVolumeSlider();
    }
    if (settings.effects) {
        currentSettings.effects = { ...settings.effects };
        effectsPanel?.setEffects(settings.effects);
    }
    if (settings.preset) {
        currentSettings.preset = settings.preset;
        presetSelect.value = PRESETS[settings.preset] ? settings.preset : 'custom';
    }
    saveSettings();
    sendSettingsUpdate();
}

function handleBackgroundMessage(message) {
    switch (message.type) {
        case 'AUDIO_STARTED':
            updateStatus(true);
            startVisualizerUpdates();
            break;
        case 'AUDIO_STOPPED':
            updateStatus(false);
            currentSettings.enabled = false;
            powerToggle.checked = false;
            stopVisualizerUpdates();
            break;
        case 'AUDIO_ERROR':
            updateStatus(false);
            statusText.textContent = 'Error';
            currentSettings.enabled = false;
            powerToggle.checked = false;
            break;
        case 'PRESET_CHANGED':
            // Handle preset change from keyboard shortcut
            if (message.preset && PRESETS[message.preset]) {
                currentSettings.preset = message.preset;
                currentSettings.bands = clonePresetBands(message.preset);
                presetSelect.value = message.preset;
                updateEQKnobs();
                saveSettings();
                sendSettingsUpdate();
            }
            break;
        case 'SETTINGS_UPDATED':
            // Reload settings from storage (for keyboard shortcut changes)
            loadSettings().then(() => updateUI());
            break;
    }
}

// ===================== VISUALIZER =====================
let visualizerInterval = null;

function startVisualizerUpdates() {
    if (visualizerInterval) return;

    visualizerInterval = setInterval(() => {
        chrome.runtime.sendMessage({ type: 'GET_ANALYSER_DATA' }, (response) => {
            if (response && response.success && response.data) {
                visualizer?.updateData(response.data);
            }
        });
    }, 50); // 20fps
}

function stopVisualizerUpdates() {
    if (visualizerInterval) {
        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }
}

// ===================== IMPORT/EXPORT =====================
function encodeConfig(config) {
    const json = JSON.stringify(config);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return 'AEQ2:' + base64.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join('');
}

function decodeConfig(encoded) {
    try {
        if (encoded.startsWith('AEQ2:') || encoded.startsWith('AEQ1:')) {
            const base64 = encoded.substring(5).split('').map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join('');
            return JSON.parse(decodeURIComponent(escape(atob(base64))));
        }
        return JSON.parse(encoded);
    } catch (e) {
        throw new Error('Không thể đọc file');
    }
}

function handleExport() {
    const exportData = {
        version: '2.1',
        exportDate: new Date().toISOString(),
        settings: {
            volume: currentSettings.volume,
            preset: currentSettings.preset,
            bands: { ...currentSettings.bands },
            effects: { ...currentSettings.effects }
        },
        userPresets: { ...userPresets },
        siteSettings: siteManager.siteSettings
    };

    const blob = new Blob([encodeConfig(exportData)], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audio-eq-${Date.now()}.aeq`;
    a.click();
    URL.revokeObjectURL(a.href);
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    try {
        const text = await file.text();
        const data = decodeConfig(text);

        if (!data.settings?.bands) throw new Error('Dữ liệu không hợp lệ');
        if (!confirm('Import cấu hình?')) return;

        applySettings(data.settings);

        if (data.userPresets) {
            Object.entries(data.userPresets).forEach(([key, preset]) => {
                userPresets[`imp_${Date.now()}_${key}`] = preset;
            });
            await saveUserPresets();
            generateUserPresetsList();
        }

        if (data.siteSettings) {
            Object.assign(siteManager.siteSettings, data.siteSettings);
            await siteManager.save();
            generateSitePresetsList();
        }

        alert('✅ Import thành công!');
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

// ===================== STORAGE =====================
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['settings'], (result) => {
            if (result.settings) {
                currentSettings = {
                    ...currentSettings,
                    ...result.settings,
                    effects: { ...DEFAULT_EFFECTS, ...(result.settings.effects || {}) }
                };
            }
            resolve();
        });
    });
}

async function saveSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.set({ settings: currentSettings }, resolve);
    });
}

async function loadUserPresets() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['userPresets'], (result) => {
            if (result.userPresets) userPresets = result.userPresets;
            resolve();
        });
    });
}

async function saveUserPresets() {
    return new Promise((resolve) => {
        chrome.storage.local.set({ userPresets }, resolve);
    });
}

// ===================== STATUS & COMMUNICATION =====================
async function checkStatus() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, async (response) => {
            if (response?.isActive) {
                currentSettings.enabled = true;
            } else {
                // Not active - ensure state is synced
                currentSettings.enabled = false;
                // Update storage to match actual state
                chrome.storage.local.get(['settings'], (result) => {
                    if (result.settings && result.settings.enabled) {
                        result.settings.enabled = false;
                        chrome.storage.local.set({ settings: result.settings });
                    }
                });
            }
            resolve();
        });
    });
}

function updateStatus(isActive) {
    statusIndicator.className = 'status-indicator ' + (isActive ? 'active' : '');
    statusText.textContent = isActive ? 'Active' : 'Off';
}

async function sendSettingsUpdate() {
    if (!currentSettings.enabled) return;
    chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: {
            volume: currentSettings.volume,
            bands: currentSettings.bands,
            effects: currentSettings.effects
        }
    });
}

async function sendEffectsUpdate() {
    if (!currentSettings.enabled) return;
    chrome.runtime.sendMessage({
        type: 'UPDATE_EFFECTS',
        effects: currentSettings.effects
    });
}

// ===================== UI UPDATES =====================
function updateUI() {
    powerToggle.checked = currentSettings.enabled;
    updateStatus(currentSettings.enabled);

    // Volume
    volumeSlider.value = currentSettings.volume;
    volumeDisplay.textContent = `${currentSettings.volume}%`;
    const percent = (currentSettings.volume / 800) * 100;
    volumeSlider.style.setProperty('--volume-percent', `${percent}%`);

    // Preset
    presetSelect.value = PRESETS[currentSettings.preset] ? currentSettings.preset : 'custom';

    // EQ
    updateEQKnobs();

    // Visualizer
    if (currentSettings.enabled) {
        startVisualizerUpdates();
    }
}

function updateEQKnobs() {
    EQ_BANDS.forEach(band => {
        const knobContainer = eqKnobs[band.key];
        if (knobContainer) {
            const value = currentSettings.bands[band.key] || 0;
            updateKnobValue(knobContainer, value, -12, 12);
        }
    });
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', init);
