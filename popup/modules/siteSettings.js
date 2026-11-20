// Site Settings Module
// Per-site/per-tab audio profile management
import { STORAGE_KEYS, SITE_SETTINGS_DEFAULT_CONFIG } from '../../constant.js';

/**
 * Extract domain from URL
 */
export function getDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch {
        return null;
    }
}

/**
 * Known sites with recommended presets
 */
export const SITE_RECOMMENDATIONS = {
    'youtube.com': { preset: 'flat', desc: 'YouTube - Đa dạng nội dung' },
    'music.youtube.com': { preset: 'pop', desc: 'YouTube Music' },
    'spotify.com': { preset: 'pop', desc: 'Spotify' },
    'soundcloud.com': { preset: 'edm', desc: 'SoundCloud - EDM/Electronic' },
    'netflix.com': { preset: 'movie', desc: 'Netflix - Xem phim' },
    'primevideo.com': { preset: 'movie', desc: 'Prime Video' },
    'hulu.com': { preset: 'movie', desc: 'Hulu' },
    'disneyplus.com': { preset: 'movie', desc: 'Disney+' },
    'twitch.tv': { preset: 'gaming', desc: 'Twitch - Gaming stream' },
    'meet.google.com': { preset: 'meeting', desc: 'Google Meet' },
    'zoom.us': { preset: 'meeting', desc: 'Zoom Meeting' },
    'teams.microsoft.com': { preset: 'meeting', desc: 'Microsoft Teams' },
    'discord.com': { preset: 'vocal-booster', desc: 'Discord' },
    'podcasts.apple.com': { preset: 'podcast', desc: 'Apple Podcasts' },
    'open.spotify.com': { preset: 'pop', desc: 'Spotify Web Player' },
    'music.apple.com': { preset: 'pop', desc: 'Apple Music' },
    'tidal.com': { preset: 'flat', desc: 'Tidal - HiFi' },
    'deezer.com': { preset: 'pop', desc: 'Deezer' },
    'pandora.com': { preset: 'pop', desc: 'Pandora' }
};

/**
 * Site Settings Manager Class
 */
export class SiteSettingsManager {
    constructor() {
        this.siteSettings = {};
        this.globalEnabled = SITE_SETTINGS_DEFAULT_CONFIG.globalEnabled;
        this.autoApply = SITE_SETTINGS_DEFAULT_CONFIG.autoApply;
    }

    /**
     * Load site settings from storage
     */
    async load() {
        return new Promise((resolve) => {
            chrome.storage.local.get([STORAGE_KEYS.SITE_SETTINGS, STORAGE_KEYS.SITE_SETTINGS_CONFIG], (result) => {
                if (result[STORAGE_KEYS.SITE_SETTINGS]) {
                    this.siteSettings = result[STORAGE_KEYS.SITE_SETTINGS];
                }
                if (result[STORAGE_KEYS.SITE_SETTINGS_CONFIG]) {
                    this.globalEnabled = result[STORAGE_KEYS.SITE_SETTINGS_CONFIG].globalEnabled ?? SITE_SETTINGS_DEFAULT_CONFIG.globalEnabled;
                    this.autoApply = result[STORAGE_KEYS.SITE_SETTINGS_CONFIG].autoApply ?? SITE_SETTINGS_DEFAULT_CONFIG.autoApply;
                }
                resolve();
            });
        });
    }

    /**
     * Save site settings to storage
     */
    async save() {
        return new Promise((resolve) => {
            chrome.storage.local.set({
                [STORAGE_KEYS.SITE_SETTINGS]: this.siteSettings,
                [STORAGE_KEYS.SITE_SETTINGS_CONFIG]: {
                    globalEnabled: this.globalEnabled,
                    autoApply: this.autoApply
                }
            }, resolve);
        });
    }

    /**
     * Get settings for a specific site
     */
    getForSite(domain) {
        if (!domain || !this.globalEnabled) return null;
        return this.siteSettings[domain] || null;
    }

    /**
     * Save settings for a specific site
     */
    async saveForSite(domain, settings) {
        if (!domain) return;

        this.siteSettings[domain] = {
            preset: settings.preset,
            volume: settings.volume,
            bands: { ...settings.bands },
            effects: settings.effects ? { ...settings.effects } : undefined,
            preamp: settings.preamp !== undefined ? settings.preamp : 0,
            pan: settings.pan !== undefined ? settings.pan : 0,
            mono: !!settings.mono,
            range: settings.range || 12,
            bandParams: settings.bandParams ? { ...settings.bandParams } : {},
            enabled: settings.enabled !== undefined ? settings.enabled : true,
            savedAt: Date.now()
        };

        await this.save();
    }

    /**
     * Remove settings for a specific site
     */
    async removeForSite(domain) {
        if (!domain) return;
        delete this.siteSettings[domain];
        await this.save();
    }

    /**
     * Get all saved sites
     */
    getAllSites() {
        return Object.entries(this.siteSettings).map(([domain, settings]) => ({
            domain,
            ...settings
        }));
    }

    /**
     * Check if site has saved settings
     */
    hasSiteSettings(domain) {
        return domain && !!this.siteSettings[domain];
    }

    /**
     * Get recommended preset for a site
     */
    getRecommendation(domain) {
        if (!domain) return null;
        return SITE_RECOMMENDATIONS[domain] || null;
    }

    /**
     * Toggle global site-based settings
     */
    setGlobalEnabled(enabled) {
        this.globalEnabled = enabled;
        this.save();
    }

    /**
     * Toggle auto-apply
     */
    setAutoApply(enabled) {
        this.autoApply = enabled;
        this.save();
    }
}

/**
 * Create site settings UI panel
 */
export function createSiteSettingsPanel(manager, currentDomain, currentSettings, callbacks) {
    const { onSave, onRemove, onApply } = callbacks;

    const hasSaved = manager.hasSiteSettings(currentDomain);
    const recommendation = manager.getRecommendation(currentDomain);
    const savedSettings = manager.getForSite(currentDomain);

    const panel = document.createElement('div');
    panel.className = 'site-settings-panel';
    panel.innerHTML = `
        <div class="site-settings-header">
            <div class="site-info">
                <img class="site-favicon" src="https://www.google.com/s2/favicons?domain=${currentDomain}&sz=32" />
                <div class="site-details">
                    <span class="site-domain">${currentDomain || 'Unknown'}</span>
                    <span class="site-status">${hasSaved ? '✅ Đã lưu cài đặt' : '📝 Chưa lưu'}</span>
                </div>
            </div>
            <div class="site-actions">
                ${hasSaved ? `
                    <button class="btn-site btn-remove" title="Xóa cài đặt site này">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                ` : ''}
                <button class="btn-site btn-save" title="Lưu cài đặt cho site này">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Lưu
                </button>
            </div>
        </div>
        
        ${recommendation && !hasSaved ? `
            <div class="site-recommendation">
                <span class="rec-icon">💡</span>
                <span class="rec-text">Gợi ý: <strong>${recommendation.preset}</strong> - ${recommendation.desc}</span>
                <button class="btn-apply-rec">Áp dụng</button>
            </div>
        ` : ''}
        
        ${hasSaved ? `
            <div class="site-saved-info">
                <span>Đã lưu: ${new Date(savedSettings.savedAt).toLocaleDateString('vi-VN')}</span>
                <button class="btn-apply-saved">Áp dụng lại</button>
            </div>
        ` : ''}
        
        <div class="site-settings-toggle">
            <label class="toggle-label">
                <span>Tự động áp dụng cài đặt theo site</span>
                <label class="switch-small">
                    <input type="checkbox" id="autoApplyToggle" ${manager.autoApply ? 'checked' : ''}>
                    <span class="slider-small"></span>
                </label>
            </label>
        </div>
    `;

    // Event listeners
    const faviconImg = panel.querySelector('.site-favicon');
    if (faviconImg) {
        faviconImg.addEventListener('error', () => {
            faviconImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%233b82f6"/></svg>';
        }, { once: true });
    }

    const saveBtn = panel.querySelector('.btn-save');
    const removeBtn = panel.querySelector('.btn-remove');
    const applyRecBtn = panel.querySelector('.btn-apply-rec');
    const applySavedBtn = panel.querySelector('.btn-apply-saved');
    const autoApplyToggle = panel.querySelector('#autoApplyToggle');

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            onSave(currentDomain, currentSettings);
            // Update UI
            panel.querySelector('.site-status').textContent = '✅ Đã lưu cài đặt';
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            if (confirm(`Xóa cài đặt cho ${currentDomain}?`)) {
                onRemove(currentDomain);
            }
        });
    }

    if (applyRecBtn) {
        applyRecBtn.addEventListener('click', () => {
            onApply(recommendation.preset);
        });
    }

    if (applySavedBtn) {
        applySavedBtn.addEventListener('click', () => {
            onApply(savedSettings);
        });
    }

    if (autoApplyToggle) {
        autoApplyToggle.addEventListener('change', () => {
            manager.setAutoApply(autoApplyToggle.checked);
        });
    }

    return panel;
}

/**
 * Create saved sites list
 */
export function createSavedSitesList(manager, onSelect, onRemove) {
    const sites = manager.getAllSites();

    const list = document.createElement('div');
    list.className = 'saved-sites-list';

    if (sites.length === 0) {
        list.innerHTML = `
            <div class="no-sites">
                <span>📭</span>
                <p>Chưa có site nào được lưu</p>
            </div>
        `;
        return list;
    }

    list.innerHTML = `
        <div class="sites-header">
            <span>📁 Sites đã lưu (${sites.length})</span>
        </div>
        <div class="sites-items">
            ${sites.map(site => `
                <div class="site-item" data-domain="${site.domain}">
                    <img class="site-favicon-small" 
                         src="https://www.google.com/s2/favicons?domain=${site.domain}&sz=16" />
                    <span class="site-item-domain">${site.domain}</span>
                    <span class="site-item-preset">${site.preset}</span>
                    <button class="site-item-remove" data-domain="${site.domain}">×</button>
                </div>
            `).join('')}
        </div>
    `;

    // Event listeners
    list.querySelectorAll('.site-favicon-small').forEach(img => {
        img.addEventListener('error', () => {
            img.style.display = 'none';
        }, { once: true });
    });

    list.querySelectorAll('.site-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('site-item-remove')) {
                onSelect(item.dataset.domain);
            }
        });
    });

    list.querySelectorAll('.site-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onRemove(btn.dataset.domain);
            btn.closest('.site-item').remove();
        });
    });

    return list;
}
