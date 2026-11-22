// Studio DSP Channel Strip & Parametric Inspector v3.0 Pro
// Master Pan, Mono Mode, Preamp Gain, Band Q, Filter Types
import { icon } from './icons.js';

export const FILTER_TYPES = [
    { key: 'peaking', name: 'Bell (Peaking)', iconName: 'bell' },
    { key: 'lowshelf', name: 'Low Shelf', iconName: 'trending-down' },
    { key: 'highshelf', name: 'High Shelf', iconName: 'trending-up' }
];

export const EQ_RANGES = [6, 12, 24];

/**
 * Create DSP Channel Strip and Band Inspector UI
 */
export function createDspStrip(options = {}) {
    const {
        pan = 0,
        mono = false,
        preamp = 0,
        range = 12,
        selectedBand = '1k',
        bandInfo = {},
        onPanChange = () => {},
        onMonoToggle = () => {},
        onPreampChange = () => {},
        onRangeChange = () => {},
        onBandParamChange = () => {}
    } = options;

    const container = document.createElement('div');
    container.className = 'dsp-strip-container';
    container.innerHTML = `
        <!-- Master DSP Controls Row -->
        <div class="dsp-master-controls">
            <!-- Stereo Pan -->
            <div class="dsp-control-group pan-group">
                <div class="dsp-label-row">
                    <span class="dsp-title">Stereo Pan</span>
                    <span class="dsp-val" id="dspPanVal">${pan === 0 ? 'C' : (pan < 0 ? `L${Math.round(Math.abs(pan)*100)}` : `R${Math.round(pan*100)}`)}</span>
                </div>
                <div class="pan-slider-wrap">
                    <span class="pan-end">L</span>
                    <input type="range" class="dsp-slider" id="dspPanSlider" min="-1" max="1" step="0.05" value="${pan}">
                    <span class="pan-end">R</span>
                </div>
            </div>

            <!-- Preamp Gain -->
            <div class="dsp-control-group preamp-group">
                <div class="dsp-label-row">
                    <span class="dsp-title">Preamp</span>
                    <span class="dsp-val" id="dspPreampVal">${preamp > 0 ? `+${preamp}` : preamp} dB</span>
                </div>
                <input type="range" class="dsp-slider" id="dspPreampSlider" min="-12" max="12" step="0.5" value="${preamp}">
            </div>

            <!-- Mono Button -->
            <button class="dsp-mono-btn ${mono ? 'active' : ''}" id="dspMonoBtn" title="Gộp kênh Mono / Stereo">
                <span class="mono-icon">${icon('radio', 13)}</span>
                <span class="mono-text">${mono ? 'Mono' : 'Stereo'}</span>
            </button>

            <!-- EQ Range Scale Selector -->
            <div class="dsp-range-selector" title="Thang đo biên độ EQ">
                <span class="range-label">Range:</span>
                <div class="range-pills">
                    ${EQ_RANGES.map(r => `
                        <button class="range-pill ${r === range ? 'active' : ''}" data-range="${r}">±${r}dB</button>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Parametric Band Inspector -->
        <div class="dsp-band-inspector" id="dspBandInspector">
            <div class="inspector-header">
                <div class="inspector-band-badge">
                    <span class="inspector-dot"></span>
                    <span class="inspector-title" id="inspectorBandTitle">Band 1kHz</span>
                </div>
                <button class="inspector-bypass-btn" id="inspectorBypassBtn" title="Bypass / Bật tắt riêng dải tần này">
                    <span>Mute Band</span>
                </button>
            </div>

            <div class="inspector-params-grid">
                <!-- Q / Bandwidth -->
                <div class="inspector-param">
                    <div class="dsp-label-row">
                        <span class="dsp-title">Bandwidth (Q)</span>
                        <span class="dsp-val" id="inspectorQVal">1.2</span>
                    </div>
                    <input type="range" class="dsp-slider" id="inspectorQSlider" min="0.4" max="6.0" step="0.1" value="1.2">
                </div>

                <!-- Filter Type -->
                <div class="inspector-param">
                    <div class="dsp-label-row">
                        <span class="dsp-title">Filter Type</span>
                    </div>
                    <select class="inspector-select" id="inspectorFilterType">
                        ${FILTER_TYPES.map(ft => `<option value="${ft.key}">${ft.name}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
    `;

    // DOM Elements
    const panSlider = container.querySelector('#dspPanSlider');
    const panVal = container.querySelector('#dspPanVal');
    const preampSlider = container.querySelector('#dspPreampSlider');
    const preampVal = container.querySelector('#dspPreampVal');
    const monoBtn = container.querySelector('#dspMonoBtn');
    const rangePills = container.querySelectorAll('.range-pill');

    const inspectorBandTitle = container.querySelector('#inspectorBandTitle');
    const inspectorBypassBtn = container.querySelector('#inspectorBypassBtn');
    const inspectorQSlider = container.querySelector('#inspectorQSlider');
    const inspectorQVal = container.querySelector('#inspectorQVal');
    const inspectorFilterType = container.querySelector('#inspectorFilterType');

    let currentSelectedBand = selectedBand;
    let currentBandInfo = { ...bandInfo };
    let currentMono = mono;

    // Pan Event
    panSlider.addEventListener('input', () => {
        const val = parseFloat(panSlider.value);
        panVal.textContent = val === 0 ? 'C' : (val < 0 ? `L${Math.round(Math.abs(val)*100)}` : `R${Math.round(val*100)}`);
        onPanChange(val);
    });

    // Double-click Pan to Center
    panSlider.addEventListener('dblclick', () => {
        panSlider.value = 0;
        panVal.textContent = 'C';
        onPanChange(0);
    });

    // Preamp Event
    preampSlider.addEventListener('input', () => {
        const val = parseFloat(preampSlider.value);
        preampVal.textContent = `${val > 0 ? `+${val}` : val} dB`;
        onPreampChange(val);
    });

    // Double-click Preamp to 0dB
    preampSlider.addEventListener('dblclick', () => {
        preampSlider.value = 0;
        preampVal.textContent = '0 dB';
        onPreampChange(0);
    });

    // Mono Event
    monoBtn.addEventListener('click', () => {
        currentMono = !currentMono;
        monoBtn.classList.toggle('active', currentMono);
        monoBtn.querySelector('.mono-text').textContent = currentMono ? 'Mono' : 'Stereo';
        onMonoToggle(currentMono);
    });

    // Range Event
    rangePills.forEach(pill => {
        pill.addEventListener('click', () => {
            rangePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const newRange = parseInt(pill.dataset.range);
            onRangeChange(newRange);
        });
    });

    // Inspector Events
    inspectorQSlider.addEventListener('input', () => {
        const q = parseFloat(inspectorQSlider.value);
        inspectorQVal.textContent = q.toFixed(1);
        onBandParamChange(currentSelectedBand, { Q: q });
    });

    inspectorFilterType.addEventListener('change', () => {
        const type = inspectorFilterType.value;
        onBandParamChange(currentSelectedBand, { type });
    });

    inspectorBypassBtn.addEventListener('click', () => {
        const isBypassed = !inspectorBypassBtn.classList.contains('active');
        inspectorBypassBtn.classList.toggle('active', isBypassed);
        inspectorBypassBtn.querySelector('span').textContent = isBypassed ? 'Muted' : 'Mute Band';
        onBandParamChange(currentSelectedBand, { bypass: isBypassed });
    });

    // Public API to update inspector when user clicks a different band
    container.selectBand = (bandKey, label, params = {}) => {
        currentSelectedBand = bandKey;
        inspectorBandTitle.textContent = `Band ${label}`;

        const q = params.Q || 1.2;
        inspectorQSlider.value = q;
        inspectorQVal.textContent = q.toFixed(1);

        const type = params.type || 'peaking';
        inspectorFilterType.value = type;

        const bypass = !!params.bypass;
        inspectorBypassBtn.classList.toggle('active', bypass);
        inspectorBypassBtn.querySelector('span').textContent = bypass ? 'Muted' : 'Mute Band';
    };

    container.setMasterValues = (vals = {}) => {
        if (vals.pan !== undefined) {
            panSlider.value = vals.pan;
            panVal.textContent = vals.pan === 0 ? 'C' : (vals.pan < 0 ? `L${Math.round(Math.abs(vals.pan)*100)}` : `R${Math.round(vals.pan*100)}`);
        }
        if (vals.preamp !== undefined) {
            preampSlider.value = vals.preamp;
            preampVal.textContent = `${vals.preamp > 0 ? `+${vals.preamp}` : vals.preamp} dB`;
        }
        if (vals.mono !== undefined) {
            currentMono = vals.mono;
            monoBtn.classList.toggle('active', currentMono);
            monoBtn.querySelector('.mono-text').textContent = currentMono ? 'Mono' : 'Stereo';
        }
        if (vals.range !== undefined) {
            rangePills.forEach(p => {
                p.classList.toggle('active', parseInt(p.dataset.range) === vals.range);
            });
        }
    };

    return container;
}
