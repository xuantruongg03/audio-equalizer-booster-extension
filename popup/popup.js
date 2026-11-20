// Popup UI Controller v3.0 Pro
// Glassmorphism UI, Studio Reverb, Bass Enhancer, A/B Compare, Undo/Redo, Realtime Visualizer & Keyboard Shortcuts

import { STORAGE_KEYS, DEFAULT_SETTINGS, DEFAULT_EFFECTS, AUDIO_CONFIG } from '../constant.js';
import { EQ_BANDS, PRESETS, getFlatBands, clonePresetBands } from './modules/presets.js';
import { createKnob, updateKnobValue } from './modules/knob.js';
import { createEffectsPanel } from './modules/effects.js';
import { createVisualizer } from './modules/visualizer.js';
import { SiteSettingsManager, getDomain, createSavedSitesList } from './modules/siteSettings.js';
import { createDspGraph } from './modules/dspGraph.js';
import { createDspStrip } from './modules/dspStrip.js';

// ===================== STATE =====================
let currentSettings = { ...DEFAULT_SETTINGS, bands: getFlatBands() };

let userPresets = {};
let siteManager = new SiteSettingsManager();
let currentDomain = null;
let currentTabId = null;

// Pro Features State
let isMuted = false;
let preMuteVolume = AUDIO_CONFIG.DEFAULT_VOLUME;
let abCompareActive = false;
let viewMode = 'knobs';
let selectedDspBand = '1k';
const undoStack = [];
const redoStack = [];
const MAX_UNDO_DEPTH = AUDIO_CONFIG.MAX_UNDO_DEPTH;

// ===================== DOM ELEMENTS =====================
let powerToggle, statusIndicator, statusText;
let siteFavicon, siteDomain, saveSiteBtn;
let siteProfileBtn, siteProfileIcon, siteProfileLabel, siteProfileDelBtn;
let volumeSlider, volumeDisplay, volumeIcon, muteToggleBtn;
let presetSelect, eqKnobsContainer, flatEqBtn;
let visualizerSection, effectsContainer;
let userPresetsList, sitePresetsList;
let savePresetBtn, savePresetModal, presetNameInput;
let saveVolumeCheck, saveEffectsCheck, confirmSaveBtn, cancelSaveBtn;
let exportBtn, importBtn, importFileInput;
let settingsBtn, settingsModal, closeSettingsBtn;
let abCompareBtn, undoBtn, redoBtn, toastContainer, presetSearchInput;
let dspGraphSection, dspStripSection, viewModeKnobsBtn, viewModeGraphBtn;

// Components
let eqKnobs = {};
let visualizer = null;
let effectsPanel = null;
let dspGraph = null;
let dspStrip = null;
let visualizerInterval = null;

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
    generateDspComponents();
    generateVisualizer();
    generateEffectsPanel();
    generateUserPresetsList();
    generateSitePresetsList();
    updateSiteProfileUI();
    setupEventListeners();
    setupKeyboardShortcuts();
    updateUI();
}

function getDOMElements() {
    powerToggle = document.getElementById('powerToggle');
    statusIndicator = document.getElementById('statusIndicator');
    statusText = document.getElementById('statusText');
    siteFavicon = document.getElementById('siteFavicon');
    siteDomain = document.getElementById('siteDomain');
    saveSiteBtn = document.getElementById('saveSiteBtn');
    siteProfileBtn = document.getElementById('siteProfileBtn');
    siteProfileIcon = document.getElementById('siteProfileIcon');
    siteProfileLabel = document.getElementById('siteProfileLabel');
    siteProfileDelBtn = document.getElementById('siteProfileDelBtn');
    volumeSlider = document.getElementById('volumeSlider');
    volumeDisplay = document.getElementById('volumeDisplay');
    volumeIcon = document.getElementById('volumeIcon');
    muteToggleBtn = document.getElementById('muteToggleBtn');
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
    abCompareBtn = document.getElementById('abCompareBtn');
    undoBtn = document.getElementById('undoBtn');
    redoBtn = document.getElementById('redoBtn');
    toastContainer = document.getElementById('toastContainer');
    presetSearchInput = document.getElementById('presetSearchInput');
    dspGraphSection = document.getElementById('dspGraphSection');
    dspStripSection = document.getElementById('dspStripSection');
    viewModeKnobsBtn = document.getElementById('viewModeKnobsBtn');
    viewModeGraphBtn = document.getElementById('viewModeGraphBtn');
}

async function getCurrentTabInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
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

// ===================== TOAST NOTIFICATIONS =====================
function showToast(message, type = 'info', duration = 2200) {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        'info': 'ℹ️',
        'success': '✅',
        'warning': '⚠️',
        'error': '❌'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// ===================== UNDO / REDO HISTORY =====================
function pushHistory() {
    undoStack.push({
        bands: { ...currentSettings.bands },
        preset: currentSettings.preset
    });
    if (undoStack.length > MAX_UNDO_DEPTH) {
        undoStack.shift();
    }
    // Clear redo when a new action is performed
    redoStack.length = 0;
    updateUndoRedoButtons();
}

function handleUndo() {
    if (undoStack.length === 0) return;
    const currentState = {
        bands: { ...currentSettings.bands },
        preset: currentSettings.preset
    };
    redoStack.push(currentState);

    const prev = undoStack.pop();
    currentSettings.bands = { ...prev.bands };
    currentSettings.preset = prev.preset;
    presetSelect.value = PRESETS[prev.preset] ? prev.preset : 'custom';

    updateEQKnobs();
    dspGraph?.updateBands(currentSettings.bands);
    saveSettings();
    sendSettingsUpdate();
    updateUndoRedoButtons();
}

function handleRedo() {
    if (redoStack.length === 0) return;
    const currentState = {
        bands: { ...currentSettings.bands },
        preset: currentSettings.preset
    };
    undoStack.push(currentState);

    const next = redoStack.pop();
    currentSettings.bands = { ...next.bands };
    currentSettings.preset = next.preset;
    presetSelect.value = PRESETS[next.preset] ? next.preset : 'custom';

    updateEQKnobs();
    dspGraph?.updateBands(currentSettings.bands);
    saveSettings();
    sendSettingsUpdate();
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    if (undoBtn) undoBtn.disabled = undoStack.length === 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

// ===================== UI GENERATION =====================
function generateEQKnobs() {
    eqKnobsContainer.innerHTML = '';
    const range = currentSettings.range || 12;
    EQ_BANDS.forEach(band => {
        const value = currentSettings.bands[band.key] || 0;
        const knob = createKnob({
            id: `eq-${band.key}`,
            label: band.label,
            min: -range,
            max: range,
            value: value,
            size: 34,
            desc: band.desc,
            onChange: (val) => handleEQChange(band.key, val)
        });
        eqKnobs[band.key] = knob;
        eqKnobsContainer.appendChild(knob);
    });
}

function generateDspComponents() {
    if (!dspGraphSection || !dspStripSection) return;

    // Create DSP Graph
    dspGraph = createDspGraph({
        width: 446,
        bands: currentSettings.bands,
        bandParams: currentSettings.bandParams || {},
        maxDb: currentSettings.range || 12,
        selectedBand: selectedDspBand,
        onBandChange: (key, db) => {
            pushHistory();
            currentSettings.bands[key] = db;
            currentSettings.preset = 'custom';
            presetSelect.value = 'custom';
            // Sync rotary knob
            const knob = eqKnobs[key];
            if (knob) {
                const range = currentSettings.range || 12;
                updateKnobValue(knob, db, -range, range);
            }
            saveSettings();
            sendSettingsUpdate();
        },
        onSelectBand: (key) => {
            selectedDspBand = key;
            const bandObj = EQ_BANDS.find(b => b.key === key);
            const label = bandObj ? bandObj.label : key;
            const params = (currentSettings.bandParams && currentSettings.bandParams[key]) || {};
            dspStrip?.selectBand(key, label, params);
        }
    });
    dspGraphSection.innerHTML = '';
    dspGraphSection.appendChild(dspGraph);

    // Create DSP Channel Strip & Parametric Inspector
    dspStrip = createDspStrip({
        pan: currentSettings.pan || 0,
        mono: currentSettings.mono || false,
        preamp: currentSettings.preamp || 0,
        range: currentSettings.range || 12,
        selectedBand: selectedDspBand,
        bandInfo: EQ_BANDS.find(b => b.key === selectedDspBand) || {},
        onPanChange: (newPan) => {
            currentSettings.pan = newPan;
            saveSettings();
            sendSettingsUpdate();
        },
        onMonoToggle: (isMono) => {
            currentSettings.mono = isMono;
            saveSettings();
            sendSettingsUpdate();
        },
        onPreampChange: (newPreamp) => {
            currentSettings.preamp = newPreamp;
            saveSettings();
            sendSettingsUpdate();
        },
        onRangeChange: (newRange) => {
            currentSettings.range = newRange;
            dspGraph?.setMaxDb(newRange);
            updateEQKnobs();
            saveSettings();
        },
        onBandParamChange: (key, updatedParam) => {
            if (!currentSettings.bandParams) currentSettings.bandParams = {};
            currentSettings.bandParams[key] = {
                ...(currentSettings.bandParams[key] || {}),
                ...updatedParam
            };
            dspGraph?.updateParams(currentSettings.bandParams);
            saveSettings();
            sendSettingsUpdate();
        }
    });
    dspStripSection.innerHTML = '';
    dspStripSection.appendChild(dspStrip);
}

function generateVisualizer() {
    visualizer = createVisualizer({
        width: 446,
        height: 60,
        mode: 'bars',
        barCount: 38
    });
    visualizerSection.appendChild(visualizer);

    if (currentSettings.enabled) {
        startVisualizerUpdates();
    }
}

function generateEffectsPanel() {
    effectsPanel = createEffectsPanel(currentSettings.effects, handleEffectsChange);
    effectsContainer.appendChild(effectsPanel);
}

function generateUserPresetsList(filterText = '') {
    userPresetsList.innerHTML = '';
    let presets = Object.entries(userPresets);

    if (filterText) {
        const query = filterText.toLowerCase();
        presets = presets.filter(([_, p]) => p.name.toLowerCase().includes(query));
    }

    if (presets.length === 0) {
        userPresetsList.innerHTML = `
            <div class="no-presets">
                <span>📭</span>
                <p>${filterText ? 'Không tìm thấy preset phù hợp.' : 'Chưa có preset. Nhấn + để lưu profile của bạn.'}</p>
            </div>
        `;
        return;
    }

    presets.forEach(([key, preset]) => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.innerHTML = `
            <div class="preset-item-info">
                <span class="preset-item-star">⭐</span>
                <span class="preset-item-name">${preset.name}</span>
            </div>
            <button class="preset-item-delete" data-key="${key}" title="Xóa preset này">×</button>
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
            if (settings) {
                applySettings(settings);
            }
        },
        async (domain) => {
            await siteManager.removeForSite(domain);
            generateSitePresetsList();
            showToast(`Đã xóa cài đặt cho ${domain}`, 'info');
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
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
                c.classList.remove('tab-entering');
            });
            btn.classList.add('active');
            const target = document.getElementById(`tab-${btn.dataset.tab}`);
            target.classList.add('active');
            target.classList.add('tab-entering');
        });
    });

    // Volume slider & Mute
    volumeSlider.addEventListener('input', handleVolumeSlider);
    if (muteToggleBtn) {
        muteToggleBtn.addEventListener('click', toggleMute);
    }

    // Volume quick marks
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

    // Save site profile & Toggle site custom profile
    if (saveSiteBtn) saveSiteBtn.addEventListener('click', handleSaveSite);

    if (siteProfileBtn) {
        siteProfileBtn.addEventListener('click', async () => {
            if (!currentDomain) return;
            const hasCustom = siteManager.hasSiteSettings(currentDomain);
            if (!hasCustom) {
                await siteManager.saveForSite(currentDomain, currentSettings);
                updateSiteProfileUI();
                generateSitePresetsList();
                showToast(`Đã tạo cấu hình riêng cho ${currentDomain}`, 'success');
            } else {
                await siteManager.saveForSite(currentDomain, currentSettings);
                generateSitePresetsList();
                showToast(`Đã cập nhật cấu hình cho ${currentDomain}`, 'success');
            }
        });
    }

    if (siteProfileDelBtn) {
        siteProfileDelBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!currentDomain) return;
            await siteManager.removeForSite(currentDomain);
            await loadSettings();
            updateEQKnobs();
            dspGraph?.updateBands(currentSettings.bands);
            if (effectsPanel) effectsPanel.setEffects(currentSettings.effects);
            volumeSlider.value = currentSettings.volume;
            handleVolumeSlider();
            updateSiteProfileUI();
            generateSitePresetsList();
            sendSettingsUpdate();
            showToast(`Đã xóa cấu hình riêng của ${currentDomain}, dùng cấu hình chung`, 'info');
        });
    }

    // A/B Compare Toggle
    if (abCompareBtn) {
        abCompareBtn.addEventListener('click', toggleABCompare);
    }

    // Undo / Redo
    if (undoBtn) undoBtn.addEventListener('click', handleUndo);
    if (redoBtn) redoBtn.addEventListener('click', handleRedo);

    // Preset Search
    if (presetSearchInput) {
        presetSearchInput.addEventListener('input', (e) => {
            generateUserPresetsList(e.target.value.trim());
        });
    }

    // Preset Modal
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

    // Settings Modal
    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'flex');
    closeSettingsBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });

    // View mode toggle (Knobs vs Curve DSP)
    if (viewModeKnobsBtn && viewModeGraphBtn) {
        viewModeKnobsBtn.addEventListener('click', () => setViewMode('knobs'));
        viewModeGraphBtn.addEventListener('click', () => setViewMode('graph'));
    }

    // Background messages
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

function setViewMode(mode) {
    viewMode = mode;
    if (mode === 'knobs') {
        viewModeKnobsBtn?.classList.add('active');
        viewModeGraphBtn?.classList.remove('active');
        if (eqKnobsContainer) eqKnobsContainer.style.display = 'flex';
        if (dspGraphSection) dspGraphSection.style.display = 'none';
    } else {
        viewModeKnobsBtn?.classList.remove('active');
        viewModeGraphBtn?.classList.add('active');
        if (eqKnobsContainer) eqKnobsContainer.style.display = 'none';
        if (dspGraphSection) dspGraphSection.style.display = 'block';
        dspGraph?.updateBands(currentSettings.bands);
    }
}

// ===================== KEYBOARD SHORTCUTS =====================
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        // Ignore typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        // Ctrl+Z = Undo
        if (e.ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
            return;
        }

        // Ctrl+Y or Ctrl+Shift+Z = Redo
        if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
            e.preventDefault();
            handleRedo();
            return;
        }

        switch (e.key) {
            case ' ':
                e.preventDefault();
                powerToggle.checked = !powerToggle.checked;
                handlePowerToggle();
                break;

            case 'ArrowUp':
                e.preventDefault();
                changeVolumeBy(5);
                break;

            case 'ArrowDown':
                e.preventDefault();
                changeVolumeBy(-5);
                break;

            case 'm':
            case 'M':
                e.preventDefault();
                toggleMute();
                break;

            case 'a':
            case 'A':
                e.preventDefault();
                toggleABCompare();
                break;

            case 'r':
            case 'R':
                e.preventDefault();
                handleFlatEQ();
                break;
        }
    });
}

function changeVolumeBy(delta) {
    let newVal = currentSettings.volume + delta;
    newVal = Math.max(0, Math.min(800, newVal));
    volumeSlider.value = newVal;
    handleVolumeSlider();
}

function toggleMute() {
    if (!isMuted) {
        preMuteVolume = currentSettings.volume || 100;
        volumeSlider.value = 0;
        isMuted = true;
    } else {
        volumeSlider.value = preMuteVolume || 100;
        isMuted = false;
    }
    handleVolumeSlider();
}

// ===================== A/B COMPARE =====================
function toggleABCompare() {
    if (!currentSettings.enabled) {
        showToast('Vui lòng bật Audio trước khi so sánh A/B', 'warning');
        return;
    }

    chrome.runtime.sendMessage({ type: 'TOGGLE_AB_COMPARE' }, (response) => {
        if (response && response.success) {
            abCompareActive = response.abActive;
            if (abCompareBtn) {
                abCompareBtn.classList.toggle('active', abCompareActive);
                const txt = abCompareBtn.querySelector('.ab-text');
                if (txt) txt.textContent = abCompareActive ? 'Bypass' : 'Normal';
            }
        }
    });
}

// ===================== HANDLERS =====================
async function handlePowerToggle() {
    const wantEnabled = powerToggle.checked;
    powerToggle.disabled = true;

    if (wantEnabled) {
        updateStatus(false);
        statusText.textContent = 'Khởi động...';

        chrome.runtime.sendMessage({ type: 'START_AUDIO_CAPTURE' }, async (response) => {
            powerToggle.disabled = false;
            if (response && response.success) {
                currentSettings.enabled = true;
                powerToggle.checked = true;
                updateStatus(true);
                await saveSettings();
                await sendSettingsUpdate();
                startVisualizerUpdates();
            } else {
                powerToggle.checked = false;
                currentSettings.enabled = false;
                updateStatus(false);
                statusText.textContent = 'Off';
                await saveSettings();
                showToast('Không thể kích hoạt tab capture: ' + (response?.error || 'Vui lòng thử lại'), 'error');
            }
        });
    } else {
        chrome.runtime.sendMessage({ type: 'STOP_AUDIO_CAPTURE' }, async () => {
            powerToggle.disabled = false;
            currentSettings.enabled = false;
            powerToggle.checked = false;
            updateStatus(false);
            stopVisualizerUpdates();
            await saveSettings();
        });
    }
}

function handleVolumeSlider() {
    const value = parseInt(volumeSlider.value);
    currentSettings.volume = value;

    // Update display & Mute state
    volumeDisplay.textContent = `${value}%`;
    isMuted = value === 0;
    if (volumeIcon) {
        volumeIcon.textContent = value === 0 ? '🔇' : value < 100 ? '🔉' : '🔊';
    }

    // Update dynamic track gradient
    const percent = (value / 800) * 100;
    volumeSlider.style.setProperty('--volume-percent', `${percent}%`);

    // Dynamic color shift
    if (value <= 100) {
        volumeDisplay.style.background = 'linear-gradient(135deg, #22c55e, #10b981)';
    } else if (value <= 250) {
        volumeDisplay.style.background = 'linear-gradient(135deg, #38bdf8, #3b82f6)';
    } else if (value <= 500) {
        volumeDisplay.style.background = 'linear-gradient(135deg, #f59e0b, #f97316)';
    } else {
        volumeDisplay.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    }
    volumeDisplay.style.webkitBackgroundClip = 'text';

    // Update marks
    document.querySelectorAll('.volume-mark').forEach(mark => {
        const markValue = parseInt(mark.dataset.value);
        mark.classList.toggle('active', markValue === value);
    });

    saveSettings();
    sendSettingsUpdate();
}

async function handleEQChange(band, value) {
    pushHistory();
    currentSettings.bands[band] = value;
    currentSettings.preset = 'custom';
    presetSelect.value = 'custom';
    dspGraph?.updateBands(currentSettings.bands);
    await saveSettings();
    await sendSettingsUpdate();
}

async function handlePresetChange() {
    const preset = presetSelect.value;
    if (preset === 'custom') return;

    if (PRESETS[preset]) {
        pushHistory();
        currentSettings.preset = preset;
        currentSettings.bands = clonePresetBands(preset);
        updateEQKnobs();
        dspGraph?.updateBands(currentSettings.bands);
        await saveSettings();
        await sendSettingsUpdate();
    }
}

async function handleFlatEQ() {
    pushHistory();
    currentSettings.preset = 'flat';
    currentSettings.bands = getFlatBands();
    presetSelect.value = 'flat';
    updateEQKnobs();
    dspGraph?.updateBands(currentSettings.bands);
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
    showToast(`Đã lưu cấu hình cho ${currentDomain}`, 'success');
    setTimeout(() => { saveSiteBtn.textContent = '💾'; }, 1800);
}

async function handleSavePreset() {
    const name = presetNameInput.value.trim();
    if (!name) {
        showToast('Vui lòng nhập tên preset', 'warning');
        return;
    }

    const key = Date.now().toString();
    userPresets[key] = {
        name: name,
        bands: { ...currentSettings.bands },
        volume: saveVolumeCheck.checked ? currentSettings.volume : undefined,
        effects: saveEffectsCheck.checked ? { ...currentSettings.effects } : undefined,
        preamp: currentSettings.preamp,
        pan: currentSettings.pan,
        mono: currentSettings.mono,
        range: currentSettings.range,
        bandParams: currentSettings.bandParams ? { ...currentSettings.bandParams } : undefined,
        savedAt: Date.now()
    };

    await saveUserPresets();
    generateUserPresetsList();
    savePresetModal.style.display = 'none';
    showToast(`Đã lưu preset "${name}" thành công!`, 'success');
}

async function applyUserPreset(key) {
    const preset = userPresets[key];
    if (!preset) return;

    pushHistory();
    currentSettings.bands = { ...preset.bands };
    if (preset.volume !== undefined) {
        currentSettings.volume = preset.volume;
        volumeSlider.value = preset.volume;
        handleVolumeSlider();
    }
    if (preset.preamp !== undefined) currentSettings.preamp = preset.preamp;
    if (preset.pan !== undefined) currentSettings.pan = preset.pan;
    if (preset.mono !== undefined) currentSettings.mono = preset.mono;
    if (preset.range !== undefined) {
        currentSettings.range = preset.range;
        dspGraph?.setMaxDb(preset.range);
    }
    if (preset.bandParams) {
        currentSettings.bandParams = { ...preset.bandParams };
        dspGraph?.updateParams(preset.bandParams);
    }
    dspStrip?.setMasterValues({
        pan: currentSettings.pan,
        preamp: currentSettings.preamp,
        mono: currentSettings.mono
    });
    if (preset.effects) {
        currentSettings.effects = { ...preset.effects };
        effectsPanel.setEffects(preset.effects);
    }

    currentSettings.preset = `user_${key}`;
    updateEQKnobs();
    dspGraph?.updateBands(currentSettings.bands);
    await saveSettings();
    await sendSettingsUpdate();
}

async function deleteUserPreset(key) {
    const name = userPresets[key]?.name;
    if (!confirm(`Bạn có chắc muốn xóa preset "${name}"?`)) return;
    delete userPresets[key];
    await saveUserPresets();
    generateUserPresetsList(presetSearchInput ? presetSearchInput.value.trim() : '');
    showToast(`Đã xóa preset "${name}"`, 'info');
}

async function applySiteSettings() {
    if (!currentDomain || !siteManager.autoApply) return;
    const siteSettings = siteManager.getForSite(currentDomain);
    if (siteSettings) {
        applySettings(siteSettings);
    }
    updateSiteProfileUI();
}

function updateSiteProfileUI() {
    if (!siteProfileBtn || !currentDomain) return;
    const hasCustom = siteManager.hasSiteSettings(currentDomain);
    if (hasCustom) {
        siteProfileBtn.classList.add('active');
        if (siteProfileIcon) siteProfileIcon.textContent = '⭐';
        if (siteProfileLabel) siteProfileLabel.textContent = `Riêng: ${currentDomain}`;
        siteProfileBtn.title = `Đang áp dụng cấu hình riêng cho ${currentDomain}. Click để cập nhật lại.`;
        if (siteProfileDelBtn) siteProfileDelBtn.style.display = 'inline-flex';
    } else {
        siteProfileBtn.classList.remove('active');
        if (siteProfileIcon) siteProfileIcon.textContent = '🌐';
        if (siteProfileLabel) siteProfileLabel.textContent = 'Chung (Mặc định)';
        siteProfileBtn.title = `Click để tạo cấu hình âm thanh riêng cho ${currentDomain}`;
        if (siteProfileDelBtn) siteProfileDelBtn.style.display = 'none';
    }
}

function applySettings(settings) {
    if (settings.bands) {
        currentSettings.bands = { ...settings.bands };
        updateEQKnobs();
        dspGraph?.updateBands(currentSettings.bands);
    }
    if (settings.volume !== undefined) {
        currentSettings.volume = settings.volume;
        volumeSlider.value = settings.volume;
        handleVolumeSlider();
    }
    if (settings.preamp !== undefined) currentSettings.preamp = settings.preamp;
    if (settings.pan !== undefined) currentSettings.pan = settings.pan;
    if (settings.mono !== undefined) currentSettings.mono = settings.mono;
    if (settings.range !== undefined) {
        currentSettings.range = settings.range;
        dspGraph?.setMaxDb(settings.range);
    }
    if (settings.bandParams) {
        currentSettings.bandParams = { ...settings.bandParams };
        dspGraph?.updateParams(settings.bandParams);
    }
    dspStrip?.setMasterValues({
        pan: currentSettings.pan,
        preamp: currentSettings.preamp,
        mono: currentSettings.mono
    });
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
            currentSettings.enabled = true;
            powerToggle.checked = true;
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
            statusText.textContent = 'Off';
            currentSettings.enabled = false;
            powerToggle.checked = false;
            stopVisualizerUpdates();
            showToast('Lỗi xử lý âm thanh: ' + (message.error || ''), 'error');
            break;
    }
}

// ===================== VISUALIZER POLLING =====================
function startVisualizerUpdates() {
    if (visualizerInterval) return;

    visualizerInterval = setInterval(() => {
        chrome.runtime.sendMessage({ type: 'GET_ANALYSER_DATA' }, (response) => {
            if (response && response.success && response.data) {
                visualizer?.updateData(response.data);
            }
        });
    }, 45); // ~22 FPS for smooth visualization
}

function stopVisualizerUpdates() {
    if (visualizerInterval) {
        clearInterval(visualizerInterval);
        visualizerInterval = null;
    }
    visualizer?.reset();
}

// ===================== IMPORT / EXPORT =====================
function encodeConfig(config) {
    const json = JSON.stringify(config);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return 'AEQ3:' + base64.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join('');
}

function decodeConfig(encoded) {
    try {
        if (encoded.startsWith('AEQ3:') || encoded.startsWith('AEQ2:') || encoded.startsWith('AEQ1:')) {
            const base64 = encoded.substring(5).split('').map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join('');
            return JSON.parse(decodeURIComponent(escape(atob(base64))));
        }
        return JSON.parse(encoded);
    } catch (e) {
        throw new Error('Định dạng file không tương thích');
    }
}

function handleExport() {
    const exportData = {
        version: '3.0',
        exportDate: new Date().toISOString(),
        settings: {
            volume: currentSettings.volume,
            preset: currentSettings.preset,
            bands: { ...currentSettings.bands },
            effects: { ...currentSettings.effects },
            preamp: currentSettings.preamp,
            pan: currentSettings.pan,
            mono: currentSettings.mono,
            range: currentSettings.range,
            bandParams: currentSettings.bandParams
        },
        userPresets: { ...userPresets },
        siteSettings: siteManager.siteSettings
    };

    const blob = new Blob([encodeConfig(exportData)], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audio-eq-pro-backup-${new Date().toISOString().slice(0, 10)}.aeq`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Đã xuất file cấu hình dự phòng (.aeq)', 'success');
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    try {
        const text = await file.text();
        const data = decodeConfig(text);

        if (!data.settings?.bands) throw new Error('Dữ liệu không hợp lệ');

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

        showToast('Nhập cấu hình thành công!', 'success');
    } catch (error) {
        showToast('Lỗi khi nhập file: ' + error.message, 'error');
    }
}

// ===================== STORAGE =====================
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.MASTER_ENABLED], (result) => {
            const masterEnabled = result[STORAGE_KEYS.MASTER_ENABLED] ?? result[STORAGE_KEYS.SETTINGS]?.enabled ?? false;
            if (result[STORAGE_KEYS.SETTINGS]) {
                currentSettings = {
                    ...currentSettings,
                    ...result[STORAGE_KEYS.SETTINGS],
                    enabled: masterEnabled,
                    effects: {
                        ...DEFAULT_EFFECTS,
                        ...(result[STORAGE_KEYS.SETTINGS].effects || {})
                    }
                };
            } else {
                currentSettings.enabled = masterEnabled;
            }
            resolve();
        });
    });
}

async function saveSettings() {
    return new Promise((resolve) => {
        const settingsToSave = {
            volume: currentSettings.volume,
            preset: currentSettings.preset,
            bands: { ...currentSettings.bands },
            effects: { ...currentSettings.effects },
            preamp: currentSettings.preamp || 0,
            pan: currentSettings.pan || 0,
            mono: !!currentSettings.mono,
            range: currentSettings.range || AUDIO_CONFIG.DEFAULT_RANGE_DB,
            bandParams: currentSettings.bandParams || {},
            enabled: currentSettings.enabled
        };

        // If currently on a domain with custom settings saved, sync updates directly to this site's profile
        if (currentDomain && siteManager.hasSiteSettings(currentDomain)) {
            siteManager.saveForSite(currentDomain, currentSettings).then(() => {
                updateSiteProfileUI();
                generateSitePresetsList();
            });
        }

        chrome.storage.local.set({
            [STORAGE_KEYS.SETTINGS]: settingsToSave,
            [STORAGE_KEYS.MASTER_ENABLED]: currentSettings.enabled
        }, resolve);
    });
}

async function loadUserPresets() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEYS.USER_PRESETS], (result) => {
            if (result[STORAGE_KEYS.USER_PRESETS]) userPresets = result[STORAGE_KEYS.USER_PRESETS];
            resolve();
        });
    });
}

async function saveUserPresets() {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEYS.USER_PRESETS]: userPresets }, resolve);
    });
}

// ===================== STATUS & COMMUNICATION =====================
async function checkStatus() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, async (response) => {
            const [activeTab] = await new Promise(r => chrome.tabs.query({ active: true, currentWindow: true }, r));
            const isValidWebTab = activeTab?.url && (activeTab.url.startsWith('http://') || activeTab.url.startsWith('https://'));

            if (response?.isActive) {
                currentSettings.enabled = true;
            } else if (response?.masterEnabled && isValidWebTab) {
                // User previously left audio ON: auto-start capture seamlessly for this active tab
                chrome.runtime.sendMessage({ type: 'START_AUDIO_CAPTURE' }, (startRes) => {
                    if (startRes && startRes.success) {
                        currentSettings.enabled = true;
                        powerToggle.checked = true;
                        updateStatus(true);
                        sendSettingsUpdate();
                        startVisualizerUpdates();
                    }
                });
            } else {
                currentSettings.enabled = false;
            }

            powerToggle.checked = currentSettings.enabled;
            updateStatus(currentSettings.enabled);
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
            effects: currentSettings.effects,
            preamp: currentSettings.preamp || 0,
            pan: currentSettings.pan || 0,
            mono: !!currentSettings.mono,
            bandParams: currentSettings.bandParams || {}
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
    handleVolumeSlider();

    // Preset
    presetSelect.value = PRESETS[currentSettings.preset] ? currentSettings.preset : 'custom';

    // EQ
    updateEQKnobs();

    // DSP Components Master Sync
    dspStrip?.setMasterValues({
        pan: currentSettings.pan,
        preamp: currentSettings.preamp,
        mono: currentSettings.mono
    });
    dspGraph?.updateBands(currentSettings.bands);
    dspGraph?.updateParams(currentSettings.bandParams || {});

    // Visualizer
    if (currentSettings.enabled) {
        startVisualizerUpdates();
    }
}

function updateEQKnobs() {
    const range = currentSettings.range || 12;
    EQ_BANDS.forEach(band => {
        const knobContainer = eqKnobs[band.key];
        if (knobContainer) {
            const value = currentSettings.bands[band.key] || 0;
            updateKnobValue(knobContainer, value, -range, range);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
