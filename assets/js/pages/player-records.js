/* player-records.js */
class PlayerRecords {
    constructor() {
        this.records = {};
        this.players = new Map();
        this.recordsByMode = {
            conquest: [],
            control: [],
            hardpoint: [],
            'kill-confirmed': [],
            'plant-defuse': []
        };
        this.isLoading = false;
        this.isDataLoaded = false;
        this.charts = {};
        this.globalCharts = {};
        this.modeCharts = {};
        this.currentLeaderboardPage = 1;
        this.leaderboardPageSize = 10;
        this.leaderboardData = null;
        this.leaderboardStatKey = null;
        this.lastUpdated = {
            conquest: null,
            control: null,
            hardpoint: null,
            'kill-confirmed': null,
            'plant-defuse': null
        };
        this.currentFilter = {
            mode: 'global',
            statKey: 'damage_caused'
        };
        this.currentGlobalStatKey = 'damage_caused';
        this.removalReasons = {};

        // PvE toggle state per tab (persisted in localStorage)
        this.pveToggleState = this.loadPveToggleState();

        // DOM elements
        this.elements = {
            loadingProgress: document.getElementById('loadingProgress'),
            loadingProgressBar: document.getElementById('loadingProgressBar'),
            loadingProgressLabel: document.getElementById('loadingProgressLabel'),
            loadingProgressPercent: document.getElementById('loadingProgressPercent'),
            loadingState: document.getElementById('loadingState'),
            globalStats: document.getElementById('globalStats'),
            globalCharts: document.getElementById('globalCharts'),
            globalTotalRecords: document.getElementById('globalTotalRecords'),
            globalRecordHolders: document.getElementById('globalRecordHolders'),
            globalModesCount: document.getElementById('globalModesCount'),
            tabGlobal: document.getElementById('tabGlobal'),
            tabConquest: document.getElementById('tabConquest'),
            tabControl: document.getElementById('tabControl'),
            tabHardpoint: document.getElementById('tabHardpoint'),
            tabKillConfirmed: document.getElementById('tabKillConfirmed'),
            tabPlantDefuse: document.getElementById('tabPlantDefuse'),
            tabContentGlobal: document.getElementById('tabContentGlobal'),
            tabContentConquest: document.getElementById('tabContentConquest'),
            tabContentControl: document.getElementById('tabContentControl'),
            tabContentHardpoint: document.getElementById('tabContentHardpoint'),
            tabContentKillConfirmed: document.getElementById('tabContentKillConfirmed'),
            tabContentPlantDefuse: document.getElementById('tabContentPlantDefuse'),
            globalSingleTableBody: document.getElementById('globalSingleTableBody'),
            conquestContent: document.getElementById('conquestContent'),
            controlContent: document.getElementById('controlContent'),
            hardpointContent: document.getElementById('hardpointContent'),
            killConfirmedContent: document.getElementById('killConfirmedContent'),
            plantDefuseContent: document.getElementById('plantDefuseContent'),
        };

        // Stat category definitions for the dropdown
        this.statCategories = [
            { key: 'damage_caused', label: 'Damage', icon: 'fa-bolt', color: '#ff8300' },
            { key: 'destroyed', label: 'Kills', icon: 'fa-skull', color: '#e74c3c' },
            { key: 'assists', label: 'Assists', icon: 'fa-handshake', color: '#3498db' },
            { key: 'XP', label: 'XP', icon: 'fa-star', color: '#f1c40f' },
            { key: 'captures', label: 'Captures', icon: 'fa-flag-checkered', color: '#2ecc71' },
            { key: 'damage_blocked', label: 'Blocked', icon: 'fa-shield', color: '#9b59b6' },
            { key: 'credits', label: 'Credits', icon: 'fa-coins', color: '#f39c12' },
            { key: 'intel', label: 'Intel', icon: 'fa-microchip', color: '#1abc9c' },
            { key: 'confirms', label: 'Confirms', icon: 'fa-check-double', color: '#2ecc71' },
            { key: 'denies', label: 'Denies', icon: 'fa-ban', color: '#9b59b6' },
            { key: 'plants', label: 'Plants', icon: 'fa-bomb', color: '#e67e22' },
            { key: 'defuses', label: 'Defuses', icon: 'fa-shield-halved', color: '#2ecc71' }
        ];

        // Stat counter configurations (all except the 3 basic ones)
        this.statCounters = [
            { key: 'damage_caused', label: 'Highest Damage', icon: 'fa-bolt', color: '#ff8300', id: 'statCardDamageCaused' },
            { key: 'destroyed', label: 'Most Kills', icon: 'fa-skull', color: '#e74c3c', id: 'statCardDestroyed' },
            { key: 'assists', label: 'Most Assists', icon: 'fa-handshake', color: '#3498db', id: 'statCardAssists' },
            { key: 'XP', label: 'Highest XP', icon: 'fa-star', color: '#f1c40f', id: 'statCardXP' },
            { key: 'captures', label: 'Most Captures', icon: 'fa-flag-checkered', color: '#2ecc71', id: 'statCardCaptures' },
            { key: 'damage_blocked', label: 'Most Blocked', icon: 'fa-shield', color: '#9b59b6', id: 'statCardDamageBlocked' },
            { key: 'credits', label: 'Most Credits', icon: 'fa-coins', color: '#f39c12', id: 'statCardCredits' },
            { key: 'intel', label: 'Most Intel', icon: 'fa-microchip', color: '#1abc9c', id: 'statCardIntel' },
            { key: 'confirms', label: 'Most Confirms', icon: 'fa-check-double', color: '#2ecc71', id: 'statCardConfirms' },
            { key: 'denies', label: 'Most Denies', icon: 'fa-ban', color: '#9b59b6', id: 'statCardDenies' },
            { key: 'plants', label: 'Most Plants', icon: 'fa-bomb', color: '#e67e22', id: 'statCardPlants' },
            { key: 'defuses', label: 'Most Defuses', icon: 'fa-shield-halved', color: '#2ecc71', id: 'statCardDefuses' },
            { key: 'deaths', label: 'Most Deaths', icon: 'fa-skull-crossbones', color: '#e74c3c', id: 'statCardDeaths' },
            { key: 'tech', label: 'Most Tech', icon: 'fa-microchip', color: '#00bcd4', id: 'statCardTech' },
            { key: 'matches', label: 'Most Entries', icon: 'fa-clock', color: '#f1c40f', id: 'statCardMatches' },
            { key: 'fastest_match', label: 'Fastest Match', icon: 'fa-bolt', color: '#ff6b6b', id: 'statCardFastestMatch' }
        ];

        // Store stat counter element references
        this.statCounterElements = {};

        this.init();
    }

    // Helper method to truncate player names
    truncatePlayerName(name, maxLength = 14) {
        if (!name) return 'N/A';
        if (name.length <= maxLength) return name;
        return name.substring(0, maxLength) + '...';
    }

    // Get removal reason for a player
    getRemovalReason(playerId) {
        return this.removalReasons[playerId] || null;
    }

    // Check if a player is disqualified
    isPlayerDisqualified(playerId) {
        return this.removalReasons.hasOwnProperty(playerId);
    }

    // Get removal reason for display
    getRemovalReasonDisplay(playerId) {
        const reason = this.getRemovalReason(playerId);
        if (!reason) return 'This player has been disqualified from the leaderboards.';
        return reason;
    }

    // Load PvE toggle state from localStorage
    loadPveToggleState() {
        const defaultState = {
            global: true,
            conquest: true,
            control: true,
            hardpoint: true,
            'kill-confirmed': true,
            'plant-defuse': true
        };
        try {
            const saved = localStorage.getItem('playerRecords_pveToggle');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...defaultState, ...parsed };
            }
        } catch (e) {
            console.warn('Failed to load PvE toggle state:', e);
        }
        return defaultState;
    }

    // Save PvE toggle state to localStorage
    savePveToggleState() {
        try {
            localStorage.setItem('playerRecords_pveToggle', JSON.stringify(this.pveToggleState));
        } catch (e) {
            console.warn('Failed to save PvE toggle state:', e);
        }
    }

    // Toggle PvE state for a specific tab
    togglePveState(tab) {
        this.pveToggleState[tab] = !this.pveToggleState[tab];
        this.savePveToggleState();
        this.updatePveToggleButton(tab);
        // Refresh all data for this tab
        this.refreshTab(tab);
    }

    // Update the PvE toggle button text/color
    updatePveToggleButton(tab) {
        const isEnabled = this.pveToggleState[tab] !== false;
        let buttonId;
        if (tab === 'global') {
            buttonId = 'pveToggleGlobal';
        } else if (tab === 'kill-confirmed') {
            buttonId = 'pveToggleKillconfirmed';
        } else if (tab === 'plant-defuse') {
            buttonId = 'pveTogglePlantdefuse';
        } else {
            buttonId = `pveToggle${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
        }
        const button = document.getElementById(buttonId);
        if (button) {
            if (isEnabled) {
                button.innerHTML = '<i class="fas fa-robot"></i> Include PvE: ON';
                button.style.background = '#2ecc71';
            } else {
                button.innerHTML = '<i class="fas fa-robot"></i> Include PvE: OFF';
                button.style.background = '#e74c3c';
            }
        }
    }

    // Update all PvE toggle buttons to reflect current state
    updateAllPveToggleButtons() {
        this.updatePveToggleButton('global');
        this.updatePveToggleButton('conquest');
        this.updatePveToggleButton('control');
        this.updatePveToggleButton('hardpoint');
        this.updatePveToggleButton('kill-confirmed');
        this.updatePveToggleButton('plant-defuse');
    }

    // Check if PvE records should be included for a given tab
    isPveIncluded(tab) {
        if (tab === 'global') {
            return this.pveToggleState['global'] !== false;
        }
        return this.pveToggleState[tab] !== false;
    }

    // Get filtered records for a mode
    getFilteredRecordsForMode(mode, useGlobalFilter = false) {
        const allRecords = this.recordsByMode[mode] || [];
        const includePve = useGlobalFilter ?
            this.isPveIncluded('global') :
            this.isPveIncluded(mode);
        return allRecords.filter(record => {
            if (includePve) return true;
            return record.matchType !== 'pve';
        });
    }

    // Get all filtered records across modes (for global tab)
    getAllFilteredRecords() {
        const allRecords = [];
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed', 'plant-defuse'];
        for (const mode of modes) {
            const filtered = this.getFilteredRecordsForMode(mode, true);
            allRecords.push(...filtered);
        }
        return allRecords;
    }

    // Get ALL records for a player (no filters - for profile view)
    getAllRecordsForPlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return [];
        return player.records || [];
    }

    // Get all records for a player (including disqualified, for profile view)
    getAllRecordsForPlayerIncludingDisqualified(playerId) {
        const player = this.players.get(playerId);
        if (!player) return [];
        return player.records || [];
    }

    // Refresh a specific tab's content
    refreshTab(tab) {
        if (tab === 'global') {
            this.renderGlobalStats();
            this.destroyGlobalCharts();
            this.renderGlobalCharts();
            this.renderGlobalSingleTable(this.currentGlobalStatKey);
        } else {
            this.renderModeTab(tab);
        }
    }

    // Render a single mode tab
    renderModeTab(mode) {
        const container = {
            conquest: this.elements.conquestContent,
            control: this.elements.controlContent,
            hardpoint: this.elements.hardpointContent,
            'kill-confirmed': this.elements.killConfirmedContent,
            'plant-defuse': this.elements.plantDefuseContent
        } [mode];

        if (!container) return;

        const records = this.getFilteredRecordsForMode(mode);
        const modeDisplayNames = {
            'conquest': 'Conquest',
            'control': 'Control',
            'hardpoint': 'Hardpoint',
            'kill-confirmed': 'Kill Confirmed',
            'plant-defuse': 'Plant & Defuse'
        };

        // Base stat configs for all modes
        const baseStatConfigs = [
            { key: 'damage_caused', label: 'Damage', icon: 'fa-bolt', color: 'var(--accent-color)' },
            { key: 'destroyed', label: 'Kills', icon: 'fa-skull', color: '#e74c3c' },
            { key: 'assists', label: 'Assists', icon: 'fa-handshake', color: '#3498db' },
            { key: 'XP', label: 'XP', icon: 'fa-star', color: '#f1c40f' },
            { key: 'credits', label: 'Credits', icon: 'fa-coins', color: '#f39c12' },
            { key: 'intel', label: 'Intel', icon: 'fa-microchip', color: '#1abc9c' }
        ];

        const modeStatConfigs = {
            'conquest': [
                ...baseStatConfigs,
                { key: 'captures', label: 'Captures', icon: 'fa-flag-checkered', color: '#2ecc71' },
                { key: 'damage_blocked', label: 'Blocked', icon: 'fa-shield', color: '#9b59b6' }
            ],
            'control': [
                ...baseStatConfigs,
                { key: 'captures', label: 'Captures', icon: 'fa-flag-checkered', color: '#2ecc71' },
                { key: 'damage_blocked', label: 'Blocked', icon: 'fa-shield', color: '#9b59b6' }
            ],
            'hardpoint': [
                ...baseStatConfigs,
                { key: 'captures', label: 'Captures', icon: 'fa-flag-checkered', color: '#2ecc71' },
                { key: 'damage_blocked', label: 'Blocked', icon: 'fa-shield', color: '#9b59b6' }
            ],
            'kill-confirmed': [
                ...baseStatConfigs,
                { key: 'confirms', label: 'Confirms', icon: 'fa-check-double', color: '#2ecc71' },
                { key: 'denies', label: 'Denies', icon: 'fa-ban', color: '#9b59b6' }
            ],
            'plant-defuse': [
                ...baseStatConfigs,
                { key: 'plants', label: 'Plants', icon: 'fa-bomb', color: '#e67e22' },
                { key: 'defuses', label: 'Defuses', icon: 'fa-shield-halved', color: '#2ecc71' }
            ]
        };

        const statConfigs = modeStatConfigs[mode] || baseStatConfigs;

        if (!records.length) {
            const noRecordsMsg = this.isPveIncluded(mode) ?
                `No records available for ${modeDisplayNames[mode]} mode` :
                `No PvP records available for ${modeDisplayNames[mode]} mode (PvE is currently hidden)`;
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search fa-3x"></i>
                    <h3>No Records Found</h3>
                    <p>${noRecordsMsg}</p>
                </div>
            `;
            return;
        }

        let cardsHtml = '';
        for (const config of statConfigs) {
            const topRecords = this.getUniqueTopRecords(config.key, 5, mode);
            cardsHtml += `
                <div class="mode-stat-card">
                    <div class="mode-stat-card-header">
                        <i class="fas ${config.icon}" style="color: ${config.color};"></i>
                        <h3>Top ${config.label}</h3>
                    </div>
                    <div class="mode-stat-card-body">
                        <table class="records-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>${config.label}</th>
                                    <th>Type</th>
                                    <th>Vehicle</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderModeTableRows(topRecords, config.key, mode)}
                            </tbody>
                        </table>
                        <div class="view-full-btn-container">
                            <button class="view-full-btn" data-mode="${mode}" data-stat="${config.key}" data-label="${config.label}">
                                <i class="fas fa-list"></i> View Full ${config.label} Leaderboard
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="mode-content">
                ${cardsHtml}
            </div>
        `;

        // Add event listeners for view full leaderboard buttons
        container.querySelectorAll('.view-full-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                const statKey = btn.dataset.stat;
                const label = btn.dataset.label;
                this.showFullLeaderboard(mode, statKey, label);
            });
        });

        // Add event listeners for proof buttons
        container.querySelectorAll('.action-btn-proof').forEach(btn => {
            btn.addEventListener('click', () => {
                const proofUrl = btn.dataset.proof;
                this.showProofModal(proofUrl);
            });
        });

        // Add event listeners for profile buttons
        container.querySelectorAll('.action-btn-profile, .player-name-clickable').forEach(el => {
            el.addEventListener('click', () => {
                const playerId = el.dataset.playerid;
                const statKey = el.dataset.statkey || 'damage_caused';
                this.showPlayerProfile(playerId, statKey);
            });
        });

        // Add event listeners for disqualification info buttons
        container.querySelectorAll('.action-btn-disqualify').forEach(btn => {
            btn.addEventListener('click', () => {
                const playerId = btn.dataset.playerid;
                this.showDisqualificationModal(playerId);
            });
        });
    }

    async init() {
        this.setupEventListeners();
        await this.loadRecordData();
        this.processRecords();
        this.updateAllPveToggleButtons();
        this.renderGlobalStats();
        this.renderGlobalCharts();
        this.renderGlobalSingleTable('damage_caused');
        this.renderModeTabs();
        this.renderLastUpdated();
        this.isDataLoaded = true;
    }

    setupEventListeners() {
        // Tab switching
        this.elements.tabGlobal.addEventListener('click', () => this.switchTab('global'));
        this.elements.tabConquest.addEventListener('click', () => this.switchTab('conquest'));
        this.elements.tabControl.addEventListener('click', () => this.switchTab('control'));
        this.elements.tabHardpoint.addEventListener('click', () => this.switchTab('hardpoint'));
        this.elements.tabKillConfirmed.addEventListener('click', () => this.switchTab('kill-confirmed'));
        this.elements.tabPlantDefuse.addEventListener('click', () => this.switchTab('plant-defuse'));

        // Guidelines buttons - all tabs
        const guidelinesBtns = document.querySelectorAll('#openGuidelinesBtn, #openGuidelinesBtn2, #openGuidelinesBtn3, #openGuidelinesBtn4, #openGuidelinesBtn5, #openGuidelinesBtn6');
        guidelinesBtns.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.showGuidelinesModal());
            }
        });

        // PvE toggle buttons - all tabs
        const pveToggleBtns = document.querySelectorAll('.pve-toggle-btn');
        pveToggleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.togglePveState(tab);
            });
        });

        // Global stat dropdown change
        const globalStatSelect = document.getElementById('globalStatSelect');
        if (globalStatSelect) {
            globalStatSelect.addEventListener('change', (e) => {
                this.currentGlobalStatKey = e.target.value;
                this.renderGlobalSingleTable(this.currentGlobalStatKey);
            });
        }
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.stats-tab').forEach(btn => btn.classList.remove('active'));

        const tabMap = {
            'global': this.elements.tabGlobal,
            'conquest': this.elements.tabConquest,
            'control': this.elements.tabControl,
            'hardpoint': this.elements.tabHardpoint,
            'kill-confirmed': this.elements.tabKillConfirmed,
            'plant-defuse': this.elements.tabPlantDefuse
        };

        if (tabMap[tab]) {
            tabMap[tab].classList.add('active');
        }

        // Update content
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

        const contentMap = {
            'global': this.elements.tabContentGlobal,
            'conquest': this.elements.tabContentConquest,
            'control': this.elements.tabContentControl,
            'hardpoint': this.elements.tabContentHardpoint,
            'kill-confirmed': this.elements.tabContentKillConfirmed,
            'plant-defuse': this.elements.tabContentPlantDefuse
        };

        if (contentMap[tab]) {
            contentMap[tab].classList.add('active');
        }

        // Update filter for the current tab
        this.currentFilter.mode = tab;
    }

    async loadRecordData() {
        try {
            this.showLoading('Loading record data...');
            this.elements.loadingProgress.style.display = 'block';
            this.elements.loadingProgressLabel.textContent = 'Loading records...';
            this.elements.loadingProgressPercent.textContent = '0%';
            this.elements.loadingProgressBar.style.width = '0%';

            const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/player-records.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.records = data.records || {};

            // Extract removal reasons from ROOT
            if (this.records.ROOT && this.records.ROOT.removals) {
                this.removalReasons = this.records.ROOT.removals;
            }

            // Extract last updated times
            if (this.records.ROOT && this.records.ROOT.last_updated) {
                this.lastUpdated = {
                    conquest: this.records.ROOT.last_updated.conquest || null,
                    control: this.records.ROOT.last_updated.control || null,
                    hardpoint: this.records.ROOT.last_updated.hardpoint || null,
                    'kill-confirmed': this.records.ROOT.last_updated['kill-confirmed'] || null,
                    'plant-defuse': this.records.ROOT.last_updated['plant-defuse'] || null
                };
            }

            this.elements.loadingProgressBar.style.width = '100%';
            this.elements.loadingProgressPercent.textContent = '100%';
            this.elements.loadingProgressLabel.textContent = 'Done!';

            setTimeout(() => {
                this.elements.loadingProgress.style.display = 'none';
            }, 500);

            this.hideLoading();

            console.log(`Loaded records:`, this.records);

        } catch (error) {
            console.error('Error loading record data:', error);
            this.elements.loadingProgress.style.display = 'none';
            this.showError('Failed to load record data. Please refresh the page.');
        }
    }

    processRecords() {
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed', 'plant-defuse'];

        for (const mode of modes) {
            this.recordsByMode[mode] = [];

            if (this.records[mode]) {
                for (const [playerId, playerRecords] of Object.entries(this.records[mode])) {
                    if (!this.players.has(playerId)) {
                        this.players.set(playerId, {
                            id: playerId,
                            records: [],
                            totalRecords: 0,
                            isDisqualified: this.isPlayerDisqualified(playerId)
                        });
                    }

                    for (const record of playerRecords) {
                        const tech = record.tech || 0;
                        const matchType = tech < 40 ? 'pve' : 'pvp';
                        // Check if this specific record is disqualified
                        const isDisqualified = record.disqualified === true;

                        const enrichedRecord = {
                            ...record,
                            playerId: playerId,
                            mode: mode,
                            matchType: matchType,
                            tech: tech,
                            disqualified: isDisqualified
                        };
                        this.recordsByMode[mode].push(enrichedRecord);
                        this.players.get(playerId).records.push(enrichedRecord);
                        this.players.get(playerId).totalRecords++;
                    }
                }
            }
        }
    }

    // Extract date from proof URL for sorting
    extractDateFromProof(proofUrl) {
        if (!proofUrl) return null;
        try {
            const filename = proofUrl.split('/').pop();
            if (!filename) return null;

            const dateMatch = filename.match(/(\d{2})(\d{2})(\d{4})/);
            if (dateMatch) {
                const day = parseInt(dateMatch[1]);
                const month = parseInt(dateMatch[2]) - 1;
                const year = parseInt(dateMatch[3]);
                const dateObj = new Date(year, month, day);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj;
                }
            }
            return null;
        } catch {
            return null;
        }
    }

    // Sort records by stat value (descending) and then by date (descending, most recent first)
    // Disqualified records go to the bottom
    sortRecordsByStatAndDate(records, statKey) {
        return [...records].sort((a, b) => {
            // Check if player is disqualified (global removal)
            const aPlayerDisqualified = this.isPlayerDisqualified(a.playerId);
            const bPlayerDisqualified = this.isPlayerDisqualified(b.playerId);
            const aDisqualified = a.disqualified || aPlayerDisqualified;
            const bDisqualified = b.disqualified || bPlayerDisqualified;

            // Disqualified records go to the bottom
            if (aDisqualified && !bDisqualified) return 1;
            if (!aDisqualified && bDisqualified) return -1;

            const aValue = a[statKey] || 0;
            const bValue = b[statKey] || 0;

            if (bValue !== aValue) {
                return bValue - aValue;
            }

            const aDate = this.extractDateFromProof(a.proof);
            const bDate = this.extractDateFromProof(b.proof);

            if (aDate && bDate) {
                return bDate.getTime() - aDate.getTime();
            }

            if (aDate && !bDate) return -1;
            if (!aDate && bDate) return 1;

            return (a.playerId || '').localeCompare(b.playerId || '');
        });
    }

    // Get unique players with their best record for a stat
    getUniqueTopRecords(statKey, limit = 10, mode = null) {
        const allRecords = [];

        if (mode) {
            const filteredRecords = this.getFilteredRecordsForMode(mode);
            for (const record of filteredRecords) {
                const value = record[statKey];
                if (value !== undefined && value !== null && value > 0) {
                    allRecords.push(record);
                }
            }
        } else {
            const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed', 'plant-defuse'];
            for (const modeName of modes) {
                const filteredRecords = this.getFilteredRecordsForMode(modeName, true);
                for (const record of filteredRecords) {
                    const value = record[statKey];
                    if (value !== undefined && value !== null && value > 0) {
                        allRecords.push(record);
                    }
                }
            }
        }

        const playerBestMap = new Map();
        for (const record of allRecords) {
            const playerId = record.playerId;
            if (!playerBestMap.has(playerId)) {
                playerBestMap.set(playerId, record);
            } else {
                const existing = playerBestMap.get(playerId);
                const existingValue = existing[statKey] || 0;
                const newValue = record[statKey] || 0;

                if (newValue > existingValue) {
                    playerBestMap.set(playerId, record);
                } else if (newValue === existingValue) {
                    const existingDate = this.extractDateFromProof(existing.proof);
                    const newDate = this.extractDateFromProof(record.proof);
                    if (newDate && (!existingDate || newDate > existingDate)) {
                        playerBestMap.set(playerId, record);
                    }
                }
            }
        }

        const uniqueRecords = Array.from(playerBestMap.values());
        const sorted = this.sortRecordsByStatAndDate(uniqueRecords, statKey);

        return sorted.slice(0, limit).map((record, index) => ({
            ...record,
            rank: index + 1
        }));
    }

    // Get a player's rank for a specific stat
    getPlayerRankForStat(playerId, statKey) {
        // If player is disqualified, return 0 (N/A)
        if (this.isPlayerDisqualified(playerId)) {
            return 0;
        }

        const allRecords = [];
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed', 'plant-defuse'];

        for (const modeName of modes) {
            const modeRecords = this.recordsByMode[modeName] || [];
            for (const record of modeRecords) {
                const value = record[statKey];
                if (value !== undefined && value !== null && value > 0) {
                    allRecords.push(record);
                }
            }
        }

        const playerBestMap = new Map();
        for (const record of allRecords) {
            const pid = record.playerId;
            if (!playerBestMap.has(pid)) {
                playerBestMap.set(pid, record);
            } else {
                const existing = playerBestMap.get(pid);
                const existingValue = existing[statKey] || 0;
                const newValue = record[statKey] || 0;
                if (newValue > existingValue) {
                    playerBestMap.set(pid, record);
                } else if (newValue === existingValue) {
                    const existingDate = this.extractDateFromProof(existing.proof);
                    const newDate = this.extractDateFromProof(record.proof);
                    if (newDate && (!existingDate || newDate > existingDate)) {
                        playerBestMap.set(pid, record);
                    }
                }
            }
        }

        const sorted = Array.from(playerBestMap.values()).sort((a, b) => {
            // Check if player is disqualified
            const aDisqualified = this.isPlayerDisqualified(a.playerId);
            const bDisqualified = this.isPlayerDisqualified(b.playerId);
            if (aDisqualified && !bDisqualified) return 1;
            if (!aDisqualified && bDisqualified) return -1;

            const aVal = a[statKey] || 0;
            const bVal = b[statKey] || 0;
            if (bVal !== aVal) return bVal - aVal;
            const aDate = this.extractDateFromProof(a.proof);
            const bDate = this.extractDateFromProof(b.proof);
            if (aDate && bDate) return bDate.getTime() - aDate.getTime();
            if (aDate && !bDate) return -1;
            if (!aDate && bDate) return 1;
            return 0;
        });

        let rank = 0;
        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].playerId === playerId) {
                rank = i + 1;
                break;
            }
        }

        return rank;
    }

    // Get player's highest value and average for a specific stat
    getPlayerStatSummary(playerId, statKey) {
        const records = this.getAllRecordsForPlayer(playerId);
        const validRecords = records.filter(r => {
            const val = r[statKey];
            return val !== undefined && val !== null && val > 0;
        });

        if (validRecords.length === 0) {
            return {
                highest: 0,
                average: 0,
                count: 0,
                bestRecord: null
            };
        }

        const values = validRecords.map(r => r[statKey] || 0);
        const highest = Math.max(...values);
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;

        let bestRecord = validRecords[0];
        for (const r of validRecords) {
            const rVal = r[statKey] || 0;
            const bestVal = bestRecord[statKey] || 0;
            if (rVal > bestVal) {
                bestRecord = r;
            } else if (rVal === bestVal) {
                const rDate = this.extractDateFromProof(r.proof);
                const bestDate = this.extractDateFromProof(bestRecord.proof);
                if (rDate && (!bestDate || rDate > bestDate)) {
                    bestRecord = r;
                }
            }
        }

        return {
            highest: highest,
            average: average,
            count: validRecords.length,
            bestRecord: bestRecord
        };
    }

    renderLastUpdated() {
        const modeDisplayNames = {
            'conquest': 'Conquest',
            'control': 'Control',
            'hardpoint': 'Hardpoint',
            'kill-confirmed': 'Kill Confirmed',
            'plant-defuse': 'Plant & Defuse'
        };

        const tabIdMap = {
            'conquest': 'tabContentConquest',
            'control': 'tabContentControl',
            'hardpoint': 'tabContentHardpoint',
            'kill-confirmed': 'tabContentKillConfirmed',
            'plant-defuse': 'tabContentPlantDefuse'
        };

        for (const [mode, timestamp] of Object.entries(this.lastUpdated)) {
            if (!timestamp) continue;

            const tabContentId = tabIdMap[mode];
            if (!tabContentId) continue;

            const tabContent = document.getElementById(tabContentId);
            if (!tabContent) continue;

            let lastUpdatedEl = tabContent.querySelector('.mode-last-updated');
            if (!lastUpdatedEl) {
                lastUpdatedEl = document.createElement('div');
                lastUpdatedEl.className = 'mode-last-updated';
                const header = tabContent.querySelector('.mode-stats-header');
                if (header) {
                    header.appendChild(lastUpdatedEl);
                }
            }

            const date = new Date(timestamp);
            const formattedDate = date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            });
            lastUpdatedEl.innerHTML = `<p class="last-updated-text"><i class="fas fa-clock"></i> Last Updated: ${formattedDate} UTC</p>`;
        }

        const globalHeader = document.querySelector('#tabContentGlobal .global-stats-header');
        if (globalHeader) {
            let globalUpdated = globalHeader.querySelector('.global-last-updated');
            if (!globalUpdated) {
                globalUpdated = document.createElement('div');
                globalUpdated.className = 'global-last-updated';
                globalHeader.appendChild(globalUpdated);
            }

            let mostRecent = null;
            for (const timestamp of Object.values(this.lastUpdated)) {
                if (timestamp && (!mostRecent || new Date(timestamp) > new Date(mostRecent))) {
                    mostRecent = timestamp;
                }
            }

            if (mostRecent) {
                const date = new Date(mostRecent);
                const formattedDate = date.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC'
                });
                globalUpdated.innerHTML = `<p class="last-updated-text"><i class="fas fa-clock"></i> Last Updated: ${formattedDate} UTC</p>`;
            }
        }
    }

    renderGlobalStats() {
        // Get all records WITHOUT filtering out disqualified
        const allRecords = this.getAllFilteredRecords();
        // But for counting stats, we need to exclude disqualified records
        const validRecords = allRecords.filter(r => {
            const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
            return !r.disqualified && !isPlayerDisq;
        });

        let totalRecords = validRecords.length;
        let modeCount = 0;
        const uniquePlayers = new Set();

        const statMaxima = {};
        for (const config of this.statCounters) {
            statMaxima[config.key] = {
                value: 0,
                playerId: null,
                proof: null,
                record: null,
                date: null
            };
        }

        // Special handling for 'matches' counter: count total records per player
        const playerMatchCount = new Map();
        for (const record of validRecords) {
            uniquePlayers.add(record.playerId);
            // Count matches per player
            const pid = record.playerId;
            playerMatchCount.set(pid, (playerMatchCount.get(pid) || 0) + 1);
        }

        // For 'matches' we need the player with most records
        let maxMatches = 0;
        let maxMatchesPlayer = null;
        for (const [pid, count] of playerMatchCount.entries()) {
            if (count > maxMatches) {
                maxMatches = count;
                maxMatchesPlayer = pid;
            }
        }
        // Store in statMaxima for 'matches'
        statMaxima['matches'] = {
            value: maxMatches,
            playerId: maxMatchesPlayer,
            proof: null,
            record: null,
            date: null
        };

        // For other stats, compute as before
        for (const record of validRecords) {
            for (const config of this.statCounters) {
                const key = config.key;
                if (key === 'matches' || key === 'fastest_match') continue; // skip, handled separately
                const value = record[key];
                if (value !== undefined && value !== null && value > 0) {
                    const current = statMaxima[key];
                    const recordDate = this.extractDateFromProof(record.proof);

                    if (value > current.value) {
                        current.value = value;
                        current.playerId = record.playerId;
                        current.proof = record.proof || null;
                        current.record = record;
                        current.date = recordDate;
                    } else if (value === current.value) {
                        if (recordDate && (!current.date || recordDate > current.date)) {
                            current.playerId = record.playerId;
                            current.proof = record.proof || null;
                            current.record = record;
                            current.date = recordDate;
                        }
                    }
                }
            }
        }

        // For 'fastest_match' we show "Coming Soon" without logic
        statMaxima['fastest_match'] = {
            value: 'Coming Soon',
            playerId: null,
            proof: null,
            record: null,
            date: null
        };

        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed', 'plant-defuse'];
        for (const mode of modes) {
            const filtered = this.getFilteredRecordsForMode(mode, true);
            const hasValid = filtered.some(r => {
                const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
                return !r.disqualified && !isPlayerDisq;
            });
            if (hasValid) {
                modeCount++;
            }
        }

        if (this.elements.globalTotalRecords) this.elements.globalTotalRecords.textContent = totalRecords;
        if (this.elements.globalRecordHolders) this.elements.globalRecordHolders.textContent = uniquePlayers.size;
        if (this.elements.globalModesCount) this.elements.globalModesCount.textContent = modeCount;

        this.updateStatCounters(statMaxima);
    }

    updateStatCounters(statMaxima) {
        const row2Grid = document.querySelector('.global-stats-grid-row2');
        if (!row2Grid) return;

        row2Grid.innerHTML = '';

        for (const config of this.statCounters) {
            const data = statMaxima[config.key];
            let value = data ? data.value : 0;
            const playerId = data ? data.playerId : null;
            const proof = data ? data.proof : null;

            // For 'fastest_match' we always show "Coming Soon"
            if (config.key === 'fastest_match') {
                value = 'Coming Soon';
            }

            const card = document.createElement('div');
            card.className = 'global-stat-card';
            card.id = config.id || `statCard${config.key.charAt(0).toUpperCase() + config.key.slice(1)}`;

            const icon = document.createElement('div');
            icon.className = 'global-stat-icon';
            icon.innerHTML = `<i class="fas ${config.icon}" style="color: ${config.color};"></i>`;
            card.appendChild(icon);

            const valueEl = document.createElement('div');
            valueEl.className = 'global-stat-value';
            valueEl.id = `globalStat${config.key.charAt(0).toUpperCase() + config.key.slice(1)}`;
            valueEl.dataset.stat = config.key;
            valueEl.dataset.player = playerId || '';
            valueEl.dataset.proof = proof || '';
            valueEl.dataset.value = (typeof value === 'number') ? value : value;
            // If value is "Coming Soon" display as is, else format number
            if (config.key === 'fastest_match') {
                valueEl.textContent = 'Coming Soon';
            } else {
                valueEl.textContent = this.formatNumber(value);
            }
            card.appendChild(valueEl);

            const labelEl = document.createElement('div');
            labelEl.className = 'global-stat-label';

            const labelText = document.createTextNode(config.label + ' ');
            labelEl.appendChild(labelText);

            // Only add info icon if not "Coming Soon"
            if (config.key !== 'fastest_match') {
                const infoEl = document.createElement('span');
                infoEl.className = 'global-stat-info';
                infoEl.dataset.stat = config.key;
                infoEl.dataset.player = playerId || '';
                infoEl.dataset.proof = proof || '';
                infoEl.dataset.value = (typeof value === 'number') ? value : value;
                infoEl.innerHTML = '<i class="fas fa-info-circle"></i>';
                labelEl.appendChild(infoEl);
            }

            card.appendChild(labelEl);

            if (playerId && config.key !== 'fastest_match') {
                const playerNameEl = document.createElement('div');
                playerNameEl.className = 'global-stat-player';
                playerNameEl.textContent = this.truncatePlayerName(playerId, 20);
                playerNameEl.title = playerId;
                card.appendChild(playerNameEl);
            }

            row2Grid.appendChild(card);
            this.statCounterElements[config.key] = valueEl;
        }

        this.setupStatInfoListeners();
    }

    setupStatInfoListeners() {
        const infoElements = document.querySelectorAll('.global-stat-info');
        infoElements.forEach(el => {
            const newEl = el.cloneNode(true);
            el.parentNode.replaceChild(newEl, el);

            newEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const statKey = newEl.dataset.stat;
                const playerId = newEl.dataset.player;
                const proof = newEl.dataset.proof;
                const label = newEl.closest('.global-stat-label')?.textContent?.trim() || statKey;

                if (proof) {
                    this.showProofModal(proof);
                } else if (playerId) {
                    this.showPlayerProfile(playerId, statKey);
                } else {
                    this.showToast(`No proof available for ${label}`, 'warning');
                }
            });
        });
    }

    // Helper method to get distribution data for bar charts
    getDistributionData(field, sortAlphabetically = true, modeFilter = null) {
        const distribution = {};
        const modes = modeFilter ? [modeFilter] : ['conquest', 'control', 'hardpoint', 'kill-confirmed', 'plant-defuse'];

        for (const mode of modes) {
            const filteredRecords = this.getFilteredRecordsForMode(mode, true);
            for (const record of filteredRecords) {
                // Skip disqualified records for charts
                const isPlayerDisq = this.isPlayerDisqualified(record.playerId);
                if (record.disqualified || isPlayerDisq) continue;

                let value = record[field];
                if (value !== undefined && value !== null && value !== '') {
                    if (field === 'outcome') {
                        if (value.toLowerCase() === 'victory') value = 'Victory';
                        else if (value.toLowerCase() === 'defeat') value = 'Defeat';
                        else if (value.toLowerCase() === 'draw') value = 'Draw';
                        distribution[value] = (distribution[value] || 0) + 1;
                    } else if (field === 'vehicle') {
                        const vehicles = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
                        for (const vehicle of vehicles) {
                            distribution[vehicle] = (distribution[vehicle] || 0) + 1;
                        }
                    } else {
                        distribution[value] = (distribution[value] || 0) + 1;
                    }
                }
            }
        }

        const sortedEntries = Object.entries(distribution).sort((a, b) => a[0].localeCompare(b[0]));

        const result = {};
        const limitedEntries = sortedEntries.slice(0, 10);
        for (const [key, count] of limitedEntries) {
            result[key] = count;
        }

        if (sortedEntries.length > 10) {
            const othersCount = sortedEntries.slice(10).reduce((sum, [, count]) => sum + count, 0);
            result['Others'] = othersCount;
        }
        return result;
    }

    renderGlobalCharts() {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999';

        this.destroyGlobalCharts();

        const allFilteredRecords = this.getAllFilteredRecords();
        // For charts, exclude disqualified records
        const validRecords = allFilteredRecords.filter(r => {
            const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
            return !r.disqualified && !isPlayerDisq;
        });

        // 1. Records by Mode
        const modeLabels = ['Conquest', 'Control', 'Hardpoint', 'Kill Confirmed', 'Plant & Defuse'];
        const modeData = [
            this.getFilteredRecordsForMode('conquest', true).filter(r => {
                const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
                return !r.disqualified && !isPlayerDisq;
            }).length,
            this.getFilteredRecordsForMode('control', true).filter(r => {
                const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
                return !r.disqualified && !isPlayerDisq;
            }).length,
            this.getFilteredRecordsForMode('hardpoint', true).filter(r => {
                const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
                return !r.disqualified && !isPlayerDisq;
            }).length,
            this.getFilteredRecordsForMode('kill-confirmed', true).filter(r => {
                const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
                return !r.disqualified && !isPlayerDisq;
            }).length,
            this.getFilteredRecordsForMode('plant-defuse', true).filter(r => {
                const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
                return !r.disqualified && !isPlayerDisq;
            }).length
        ];

        const ctx1 = document.getElementById('globalRecordsByModeChart').getContext('2d');
        this.globalCharts.recordsByMode = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: modeLabels,
                datasets: [{
                    label: 'Records',
                    data: modeData,
                    backgroundColor: ['rgba(255, 131, 0, 0.7)', 'rgba(52, 152, 219, 0.7)', 'rgba(46, 204, 113, 0.7)', 'rgba(155, 89, 182, 0.7)', 'rgba(0, 229, 200, 0.7)'],
                    borderColor: ['rgba(255, 131, 0, 1)', 'rgba(52, 152, 219, 1)', 'rgba(46, 204, 113, 1)', 'rgba(155, 89, 182, 1)', 'rgba(0, 229, 200, 1)'],
                    borderWidth: 2,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: secondaryColor,
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // 2. Records by Category
        const categoryData = this.getCategoryStats();
        const categoryLabels = ['Damage', 'Kills', 'Assists', 'XP', 'Captures', 'Confirms', 'Denies', 'Plants', 'Defuses'];
        const categoryColors = [
            'rgba(255, 131, 0, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(52, 152, 219, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(230, 126, 34, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(52, 152, 219, 0.8)'
        ];
        const filteredData = categoryData;

        const ctx3 = document.getElementById('globalRecordsByCategoryChart').getContext('2d');
        this.globalCharts.recordsByCategory = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: filteredData,
                    backgroundColor: categoryColors,
                    borderWidth: 2,
                    borderColor: textColor,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            padding: 10,
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });

        // 3. Map Distribution (Bar Chart)
        const mapData = this.getDistributionData('map', true);
        const mapLabels = Object.keys(mapData);
        const mapValues = Object.values(mapData);
        const mapColors = this.generateBarColors(mapLabels.length);

        const ctx5 = document.getElementById('globalMapChart').getContext('2d');
        this.globalCharts.mapDistribution = new Chart(ctx5, {
            type: 'bar',
            data: {
                labels: mapLabels,
                datasets: [{
                    label: 'Records',
                    data: mapValues,
                    backgroundColor: mapColors,
                    borderColor: mapColors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1.5,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: secondaryColor,
                            stepSize: 1,
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                            maxTicksLimit: 10,
                            font: {
                                size: 8
                            },
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // 4. Outcome Distribution
        const outcomeData = this.getDistributionData('outcome', true);
        const outcomeLabels = Object.keys(outcomeData);
        const outcomeValues = Object.values(outcomeData);
        const outcomeColors = {
            'Victory': 'rgba(46, 204, 113, 0.7)',
            'Defeat': 'rgba(231, 76, 60, 0.7)',
            'Draw': 'rgba(241, 196, 15, 0.7)'
        };
        const outcomeBorderColors = {
            'Victory': 'rgba(46, 204, 113, 1)',
            'Defeat': 'rgba(231, 76, 60, 1)',
            'Draw': 'rgba(241, 196, 15, 1)'
        };
        const outcomeColorArray = outcomeLabels.map(label => outcomeColors[label] || 'rgba(155, 89, 182, 0.7)');
        const outcomeBorderArray = outcomeLabels.map(label => outcomeBorderColors[label] || 'rgba(155, 89, 182, 1)');

        const ctx6 = document.getElementById('globalOutcomeChart').getContext('2d');
        this.globalCharts.outcomeDistribution = new Chart(ctx6, {
            type: 'bar',
            data: {
                labels: outcomeLabels,
                datasets: [{
                    label: 'Records',
                    data: outcomeValues,
                    backgroundColor: outcomeColorArray,
                    borderColor: outcomeBorderArray,
                    borderWidth: 1.5,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: secondaryColor,
                            stepSize: 1,
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                            font: {
                                size: 10
                            },
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // 5. Tank Distribution (Bar Chart)
        const tankData = this.getDistributionData('vehicle', true);
        const tankLabels = Object.keys(tankData);
        const tankValues = Object.values(tankData);
        const tankColors = this.generateBarColors(tankLabels.length);

        const ctx7 = document.getElementById('globalTankChart').getContext('2d');
        this.globalCharts.tankDistribution = new Chart(ctx7, {
            type: 'bar',
            data: {
                labels: tankLabels,
                datasets: [{
                    label: 'Records',
                    data: tankValues,
                    backgroundColor: tankColors,
                    borderColor: tankColors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1.5,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: secondaryColor,
                            stepSize: 1,
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                            font: {
                                size: 7
                            },
                            maxRotation: 45,
                            minRotation: 0,
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // 6. Agent Distribution (Bar Chart)
        const agentData = this.getDistributionData('agent', true);
        const agentLabels = Object.keys(agentData);
        const agentValues = Object.values(agentData);
        const agentColors = this.generateBarColors(agentLabels.length);

        const ctx8 = document.getElementById('globalAgentChart').getContext('2d');
        this.globalCharts.agentDistribution = new Chart(ctx8, {
            type: 'bar',
            data: {
                labels: agentLabels,
                datasets: [{
                    label: 'Records',
                    data: agentValues,
                    backgroundColor: agentColors,
                    borderColor: agentColors.map(c => c.replace('0.7', '1')),
                    borderWidth: 1.5,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: secondaryColor,
                            stepSize: 1,
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                            maxTicksLimit: 10,
                            font: {
                                size: 8
                            },
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });
    }

    // Helper to generate colors for bar charts
    generateBarColors(count) {
        const colors = [
            'rgba(255, 131, 0, 0.7)',
            'rgba(52, 152, 219, 0.7)',
            'rgba(46, 204, 113, 0.7)',
            'rgba(155, 89, 182, 0.7)',
            'rgba(241, 196, 15, 0.7)',
            'rgba(231, 76, 60, 0.7)',
            'rgba(26, 188, 156, 0.7)',
            'rgba(230, 126, 34, 0.7)',
            'rgba(149, 165, 166, 0.7)',
            'rgba(142, 68, 173, 0.7)',
            'rgba(44, 62, 80, 0.7)',
            'rgba(39, 174, 96, 0.7)'
        ];
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        return result;
    }

    destroyGlobalCharts() {
        const chartKeys = ['recordsByMode', 'recordsByCategory', 'mapDistribution', 'outcomeDistribution', 'tankDistribution', 'agentDistribution'];
        for (const key of chartKeys) {
            if (this.globalCharts[key]) {
                this.globalCharts[key].destroy();
                delete this.globalCharts[key];
            }
        }
    }

    getTopRecords(statKey, limit = 10) {
        const allRecords = this.getAllFilteredRecords();
        const sorted = this.sortRecordsByStatAndDate(allRecords, statKey);
        return sorted.slice(0, limit);
    }

    getCategoryStats() {
        let damage = 0,
            kills = 0,
            assists = 0,
            xp = 0,
            captures = 0,
            confirms = 0,
            denies = 0,
            plants = 0,
            defuses = 0;

        const allRecords = this.getAllFilteredRecords();
        for (const record of allRecords) {
            // Skip disqualified records
            const isPlayerDisq = this.isPlayerDisqualified(record.playerId);
            if (record.disqualified || isPlayerDisq) continue;

            if (record.damage_caused && record.damage_caused > 30000) damage++;
            else if (record.damage_caused && record.damage_caused > 0) damage++;

            if (record.destroyed && record.destroyed > 15) kills++;
            else if (record.destroyed) kills++;

            if (record.assists && record.assists > 10) assists++;
            else if (record.assists) assists++;

            if (record.XP && record.XP > 10000) xp++;
            else if (record.XP) xp++;

            if (record.captures && record.captures > 3) captures++;
            else if (record.captures) captures++;

            if (record.confirms && record.confirms > 10) confirms++;
            else if (record.confirms) confirms++;

            if (record.denies && record.denies > 2) denies++;
            else if (record.denies) denies++;

            if (record.plants && record.plants > 3) plants++;
            else if (record.plants) plants++;

            if (record.defuses && record.defuses > 2) defuses++;
            else if (record.defuses) defuses++;
        }

        const total = damage + kills + assists + xp + captures + confirms + denies + plants + defuses;
        if (total === 0) {
            return [1, 1, 1, 1, 1, 1, 1, 1, 1];
        }

        return [damage, kills, assists, xp, captures, confirms, denies, plants, defuses];
    }

    // RENDER SINGLE GLOBAL TABLE WITH DROPDOWN
    renderGlobalSingleTable(statKey) {
        const tbody = this.elements.globalSingleTableBody;
        if (!tbody) return;

        // Update dropdown to match current selection
        const select = document.getElementById('globalStatSelect');
        if (select) {
            select.value = statKey;
        }

        // Find the category label
        const category = this.statCategories.find(c => c.key === statKey);
        const statLabel = category ? category.label : statKey;

        const records = this.getUniqueTopRecords(statKey, 20);

        if (!records.length) {
            const allRecords = this.getAllFilteredRecords();
            const hasRecords = allRecords.some(r => {
                const isPlayerDisq = this.isPlayerDisqualified(r.playerId);
                return !r.disqualified && !isPlayerDisq && r[statKey] !== undefined && r[statKey] !== null && r[statKey] > 0;
            });
            if (!hasRecords) {
                tbody.innerHTML = `<tr><td colspan="9" class="no-data">No ${statLabel} records found (PvE may be hidden)</td></tr>`;
            } else {
                tbody.innerHTML = `<tr><td colspan="9" class="no-data">No records found for ${statLabel}</td></tr>`;
            }
            return;
        }

        let html = '';
        let rank = 1;

        for (const record of records) {
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
            const recordDate = this.getRecordDate(record.proof);
            const modeDisplayName = this.getModeDisplayName(record.mode);
            const matchTypeLabel = record.matchType === 'pvp' ? 'PvP' : 'PvE';
            const matchTypeClass = record.matchType === 'pvp' ? 'match-type-pvp' : 'match-type-pve';
            const truncatedName = this.truncatePlayerName(record.playerId, 14);
            const isDisqualified = record.disqualified || false;
            const isPlayerDisqualified = this.isPlayerDisqualified(record.playerId);

            // Player name styling - strike through if disqualified
            const playerNameStyle = isDisqualified || isPlayerDisqualified ?
                'cursor:pointer;color:var(--accent-color, #ff8300);text-decoration:line-through;' :
                'cursor:pointer;color:var(--accent-color, #ff8300);';

            html += `
                <tr class="${isDisqualified || isPlayerDisqualified ? 'disqualified-row' : ''}">
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td>
                        <strong class="player-name-clickable" data-playerid="${record.playerId}" data-statkey="${statKey}" style="${playerNameStyle}" title="${record.playerId}">
                            ${truncatedName}
                            ${(isDisqualified || isPlayerDisqualified) ? '' : ''}
                        </strong>
                    </td>
                    <td>${this.formatNumber(record[statKey] || 0)}</td>
                    <td><span class="mode-badge">${modeDisplayName}</span></td>
                    <td><span class="match-type-badge ${matchTypeClass}">${matchTypeLabel}</span></td>
                    <td>${record.vehicle || 'N/A'}</td>
                    <td>${record.agent || 'N/A'}</td>
                    <td>${recordDate}</td>
                    <td>
                        <div class="action-buttons">
                            ${record.proof ? `<button class="action-btn action-btn-proof" data-proof="${record.proof}"><i class="fas fa-image"></i></button>` : ''}
                            <button class="action-btn action-btn-profile" data-playerid="${record.playerId}" data-statkey="${statKey}"><i class="fas fa-user"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            rank++;
        }

        tbody.innerHTML = html;

        // Add proof click handlers
        tbody.querySelectorAll('.action-btn-proof').forEach(btn => {
            btn.addEventListener('click', () => {
                const proofUrl = btn.dataset.proof;
                this.showProofModal(proofUrl);
            });
        });

        // Add player profile click handlers
        tbody.querySelectorAll('.action-btn-profile, .player-name-clickable').forEach(el => {
            el.addEventListener('click', () => {
                const playerId = el.dataset.playerid;
                const statKey = el.dataset.statkey || 'damage_caused';
                this.showPlayerProfile(playerId, statKey);
            });
        });
    }

    // Show disqualification reason modal
    showDisqualificationModal(playerId) {
        const reason = this.getRemovalReason(playerId);
        if (!reason) {
            this.showToast('No disqualification reason available for this player.', 'warning');
            return;
        }

        const existingModal = document.getElementById('disqualifyModal');
        if (existingModal) {
            existingModal.remove();
        }

        const html = `
            <div class="disqualify-modal-overlay" id="disqualifyModal">
                <div class="disqualify-modal-content">
                    <button class="disqualify-modal-close" onclick="this.closest('.disqualify-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
                        <i class="fas fa-exclamation-triangle" style="color:#e74c3c;font-size:2rem;"></i>
                        <h3 style="color:var(--text-primary);margin:0;">Player Disqualified</h3>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:0.5rem;padding:1rem;border-left:4px solid #e74c3c;">
                        <p style="color:var(--text-primary);margin:0;line-height:1.6;white-space:pre-wrap;word-break:break-word;">${reason}</p>
                    </div>
                    <div style="margin-top:1rem;text-align:right;">
                        <button onclick="this.closest('.disqualify-modal-overlay').remove()" style="padding:0.5rem 1.5rem;border:none;border-radius:0.5rem;background:var(--accent-color);color:#fff;font-weight:600;cursor:pointer;">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('disqualifyModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });

        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('disqualifyModal');
                if (modal) {
                    modal.remove();
                    document.removeEventListener('keydown', closeHandler);
                }
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    // OLD renderGlobalTables - replaced by renderGlobalSingleTable
    renderGlobalTables() {
        // This is now handled by renderGlobalSingleTable
        // Kept for compatibility but not used
    }

    renderModeTabs() {
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed', 'plant-defuse'];
        for (const mode of modes) {
            this.renderModeTab(mode);
        }
    }

    getModeTopRecords(mode, statKey, limit = 5) {
        const records = this.getFilteredRecordsForMode(mode);
        const sorted = this.sortRecordsByStatAndDate(records, statKey);
        return sorted.slice(0, limit);
    }

    // Uses unique players for mode table rows
    renderModeTableRows(records, statKey, mode) {
        if (!records.length) {
            const includePve = this.isPveIncluded(mode);
            const msg = includePve ? 'No records found' : 'No PvP records found (PvE is currently hidden)';
            return `<tr><td colspan="7" class="no-data">${msg}</td></tr>`;
        }

        let rank = 1;
        let html = '';

        for (const record of records) {
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
            const recordDate = this.getRecordDate(record.proof);
            const matchTypeLabel = record.matchType === 'pvp' ? 'PvP' : 'PvE';
            const matchTypeClass = record.matchType === 'pvp' ? 'match-type-pvp' : 'match-type-pve';
            const truncatedName = this.truncatePlayerName(record.playerId, 14);
            const isDisqualified = record.disqualified || false;
            const isPlayerDisqualified = this.isPlayerDisqualified(record.playerId);

            const playerNameStyle = isDisqualified || isPlayerDisqualified ?
                'cursor:pointer;color:var(--accent-color, #ff8300);text-decoration:line-through;' :
                'cursor:pointer;color:var(--accent-color, #ff8300);';

            html += `
                <tr class="${isDisqualified || isPlayerDisqualified ? 'disqualified-row' : ''}">
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td>
                        <strong class="player-name-clickable" data-playerid="${record.playerId}" data-statkey="${statKey}" style="${playerNameStyle}" title="${record.playerId}">
                            ${truncatedName}
                            ${(isDisqualified || isPlayerDisqualified) ? '' : ''}
                        </strong>
                    </td>
                    <td>${this.formatNumber(record[statKey] || 0)}</td>
                    <td><span class="match-type-badge ${matchTypeClass}">${matchTypeLabel}</span></td>
                    <td>${record.vehicle || 'N/A'}</td>
                    <td>${recordDate}</td>
                    <td>
                        <div class="action-buttons">
                            ${record.proof ? `<button class="action-btn action-btn-proof" data-proof="${record.proof}"><i class="fas fa-image"></i></button>` : ''}
                            <button class="action-btn action-btn-profile" data-playerid="${record.playerId}" data-statkey="${statKey}"><i class="fas fa-user"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            rank++;
        }

        return html;
    }

    // Uses unique players for full leaderboard
    showFullLeaderboard(mode, statKey, label) {
        const sorted = this.getUniqueTopRecords(statKey, 1000, mode);

        if (!sorted.length) {
            const includePve = this.isPveIncluded(mode);
            const msg = includePve ?
                `No records found for ${label} in ${this.getModeDisplayName(mode)}` :
                `No PvP records found for ${label} in ${this.getModeDisplayName(mode)} (PvE is currently hidden)`;
            this.showToast(msg, 'error');
            return;
        }

        this.leaderboardData = sorted;
        this.leaderboardStatKey = statKey;
        this.currentLeaderboardPage = 1;

        this.renderLeaderboardPage(mode, statKey, label);
    }

    renderLeaderboardPage(mode, statKey, label) {
        const sorted = this.leaderboardData;
        const totalPages = Math.ceil(sorted.length / this.leaderboardPageSize);
        const currentPage = this.currentLeaderboardPage;
        const startIndex = (currentPage - 1) * this.leaderboardPageSize;
        const endIndex = Math.min(startIndex + this.leaderboardPageSize, sorted.length);
        const pageRecords = sorted.slice(startIndex, endIndex);

        const statLabels = {
            'damage_caused': 'Damage',
            'destroyed': 'Kills',
            'assists': 'Assists',
            'XP': 'XP',
            'captures': 'Captures',
            'damage_blocked': 'Blocked',
            'credits': 'Credits',
            'intel': 'Intel',
            'confirms': 'Confirms',
            'denies': 'Denies',
            'plants': 'Plants',
            'defuses': 'Defuses',
            'matches': 'Matches',
            'fastest_match': 'Fastest Match'
        };

        const statLabel = statLabels[statKey] || statKey;
        const modeName = this.getModeDisplayName(mode);

        let html = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);" id="leaderboardModal" data-mode="${mode}" data-stat="${statKey}" data-label="${label}">
                <div style="background: var(--card-bg); border-radius: 1rem; border: 1px solid var(--border-color); padding: 2rem; max-width: 1000px; width: 95%; max-height: 85vh; overflow-y: auto; position: relative;">
                    <button style="position: sticky; top: 0; float: right; background: var(--bg-tertiary); border: none; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; padding: 0.5rem; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; z-index: 1;" onclick="document.getElementById('leaderboardModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <h3 style="text-align: center; color: var(--text-primary); margin-bottom: 0.5rem;">
                        <i class="fas fa-trophy" style="color: var(--accent-color);"></i> ${statLabel} Leaderboard (${modeName})
                    </h3>
                    <p style="text-align: center; color: var(--text-secondary); margin-bottom: 1rem;">
                        Showing ${startIndex + 1}-${endIndex} of ${sorted.length} entries
                    </p>
                    <div class="table-wrapper">
                        <table class="records-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Player</th>
                                    <th>${statLabel}</th>
                                    <th>Type</th>
                                    <th>Vehicle</th>
                                    <th>Agent</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        let rank = startIndex + 1;
        for (const record of pageRecords) {
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
            const recordDate = this.getRecordDate(record.proof);
            const matchTypeLabel = record.matchType === 'pvp' ? 'PvP' : 'PvE';
            const matchTypeClass = record.matchType === 'pvp' ? 'match-type-pvp' : 'match-type-pve';
            const truncatedName = this.truncatePlayerName(record.playerId, 14);
            const isDisqualified = record.disqualified || false;
            const isPlayerDisqualified = this.isPlayerDisqualified(record.playerId);

            const playerNameStyle = isDisqualified || isPlayerDisqualified ?
                'cursor:pointer;color:var(--accent-color, #ff8300);text-decoration:line-through;' :
                'cursor:pointer;color:var(--accent-color, #ff8300);';

            html += `
                <tr class="${isDisqualified || isPlayerDisqualified ? 'disqualified-row' : ''}">
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td>
                        <strong class="player-name-clickable" data-playerid="${record.playerId}" data-statkey="${statKey}" style="${playerNameStyle}" title="${record.playerId}">
                            ${truncatedName}
                            ${(isDisqualified || isPlayerDisqualified) ? '' : ''}
                        </strong>
                    </td>
                    <td>${this.formatNumber(record[statKey] || 0)}</td>
                    <td><span class="match-type-badge ${matchTypeClass}">${matchTypeLabel}</span></td>
                    <td>${record.vehicle || 'N/A'}</td>
                    <td>${record.agent || 'N/A'}</td>
                    <td>${recordDate}</td>
                    <td>
                        <div class="action-buttons">
                            ${record.proof ? `<button class="action-btn action-btn-proof" data-proof="${record.proof}"><i class="fas fa-image"></i></button>` : ''}
                            <button class="action-btn action-btn-profile" data-playerid="${record.playerId}" data-statkey="${statKey}"><i class="fas fa-user"></i></button>
                        </div>
                    </td>
                </tr>
            `;
            rank++;
        }

        html += `
                            </tbody>
                        </table>
                    </div>
                    <div style="display: flex; justify-content: center; align-items: center; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap;">
                        <button onclick="window.playerRecordsInstance.goToLeaderboardPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} style="padding: 0.4rem 1rem; border: 1px solid var(--border-color); border-radius: 0.4rem; background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-weight: 600;">
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                        <span style="color: var(--text-secondary);">Page ${currentPage} of ${totalPages}</span>
                        <button onclick="window.playerRecordsInstance.goToLeaderboardPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''} style="padding: 0.4rem 1rem; border: 1px solid var(--border-color); border-radius: 0.4rem; background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer; font-weight: 600;">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div style="text-align: center; margin-top: 0.75rem;">
                        <button onclick="document.getElementById('leaderboardModal').remove()" style="padding: 0.5rem 2rem; border: none; border-radius: 0.5rem; background: var(--accent-color); color: #fff; font-weight: 600; cursor: pointer;">Close</button>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('leaderboardModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', html);

        window.playerRecordsInstance = this;

        document.querySelectorAll('#leaderboardModal .action-btn-proof').forEach(btn => {
            btn.addEventListener('click', () => {
                const proofUrl = btn.dataset.proof;
                this.showProofModal(proofUrl);
            });
        });

        document.querySelectorAll('#leaderboardModal .action-btn-profile, #leaderboardModal .player-name-clickable').forEach(el => {
            el.addEventListener('click', () => {
                const playerId = el.dataset.playerid;
                const statKey = el.dataset.statkey || 'damage_caused';
                const modal = document.getElementById('leaderboardModal');
                if (modal) modal.remove();
                this.showPlayerProfile(playerId, statKey);
            });
        });

        document.getElementById('leaderboardModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });
    }

    goToLeaderboardPage(page) {
        const sorted = this.leaderboardData;
        const totalPages = Math.ceil(sorted.length / this.leaderboardPageSize);
        if (page < 1 || page > totalPages) return;

        this.currentLeaderboardPage = page;

        const modal = document.getElementById('leaderboardModal');
        if (modal) {
            const mode = modal.dataset.mode || 'conquest';
            const statKey = modal.dataset.stat || 'damage_caused';
            const label = modal.dataset.label || 'Damage';

            modal.remove();
            this.renderLeaderboardPage(mode, statKey, label);
        }
    }

    // Enhanced player profile modal
    showPlayerProfile(playerId, statKey = 'damage_caused') {
        const player = this.players.get(playerId);
        if (!player) {
            this.showToast(`Player "${playerId}" not found`, 'error');
            return;
        }

        const statLabels = {
            'damage_caused': 'Damage',
            'destroyed': 'Kills',
            'assists': 'Assists',
            'XP': 'XP',
            'captures': 'Captures',
            'damage_blocked': 'Blocked',
            'credits': 'Credits',
            'intel': 'Intel',
            'confirms': 'Confirms',
            'denies': 'Denies',
            'plants': 'Plants',
            'defuses': 'Defuses',
            'deaths': 'Deaths',
            'tech': 'Tech',
            'matches': 'Matches',
            'fastest_match': 'Fastest Match'
        };

        const truncatedName = this.truncatePlayerName(playerId, 20);
        const allRecords = this.getAllRecordsForPlayer(playerId);
        const isDisqualified = this.isPlayerDisqualified(playerId);
        const removalReason = this.getRemovalReason(playerId);

        const trackedStats = ['damage_caused', 'destroyed', 'assists', 'XP', 'captures', 'damage_blocked', 'credits', 'intel', 'confirms', 'denies', 'plants', 'defuses', 'deaths', 'tech', 'matches', 'fastest_match'];

        let statsHtml = '';
        let hasAnyStats = false;

        for (const stat of trackedStats) {
            const summary = this.getPlayerStatSummary(playerId, stat);
            const rank = this.getPlayerRankForStat(playerId, stat);
            const label = statLabels[stat] || stat;

            if (stat === 'fastest_match') {
                // Skip fastest_match logic, just show Coming Soon
                continue;
            }

            if (summary.count > 0 || stat === 'matches') {
                hasAnyStats = true;

                // If disqualified, show N/A for rank and average, but keep the stat value
                const rankDisplay = isDisqualified ? 'N/A' : (rank > 0 ? `#${rank}` : 'N/A');
                const proofUrl = summary.bestRecord?.proof || null;
                let bestValue = summary.highest;

                // For matches, we calculate total matches for this player
                if (stat === 'matches') {
                    bestValue = allRecords.length;
                }

                // For disqualified players, only show the stat value, no average or rank
                if (isDisqualified) {
                    statsHtml += `
                        <div class="profile-stat-card" style="opacity:0.8;">
                            <div class="profile-stat-card-header">
                                <span class="profile-stat-label">${label}</span>
                                <span class="profile-stat-rank-badge" style="color:#e74c3c;">DISQUALIFIED</span>
                            </div>
                            <div class="profile-stat-card-body">
                                <div class="profile-stat-main">
                                    <span class="profile-stat-high">${this.formatNumber(bestValue)}</span>
                                    ${proofUrl ? `<button class="profile-stat-proof-btn" data-proof="${proofUrl}" title="View Proof"><i class="fas fa-image"></i></button>` : ''}
                                </div>
                                <div class="profile-stat-details">
                                    <span class="profile-stat-avg" style="color:var(--text-secondary);">N/A</span>
                                    <span class="profile-stat-count">${summary.count} game${summary.count > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Normal display for non-disqualified players
                    statsHtml += `
                        <div class="profile-stat-card">
                            <div class="profile-stat-card-header">
                                <span class="profile-stat-label">${label}</span>
                                <span class="profile-stat-rank-badge">Rank ${rankDisplay}</span>
                            </div>
                            <div class="profile-stat-card-body">
                                <div class="profile-stat-main">
                                    <span class="profile-stat-high">${this.formatNumber(bestValue)}</span>
                                    ${proofUrl ? `<button class="profile-stat-proof-btn" data-proof="${proofUrl}" title="View Proof"><i class="fas fa-image"></i></button>` : ''}
                                </div>
                                <div class="profile-stat-details">
                                    <span class="profile-stat-avg">Avg: ${this.formatNumber(Math.round(summary.average))}</span>
                                    <span class="profile-stat-count">${summary.count} game${summary.count > 1 ? 's' : ''}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // Add a "Coming Soon" placeholder for Fastest Match
        statsHtml += `
            <div class="profile-stat-card" style="opacity:0.7; border-style:dashed;">
                <div class="profile-stat-card-header">
                    <span class="profile-stat-label">Fastest Match</span>
                    <span class="profile-stat-rank-badge">Coming Soon</span>
                </div>
                <div class="profile-stat-card-body">
                    <div class="profile-stat-main">
                        <span class="profile-stat-high" style="font-size:1rem; color:var(--text-secondary);">—</span>
                    </div>
                    <div class="profile-stat-details">
                        <span class="profile-stat-avg" style="color:var(--text-secondary);">Not yet available</span>
                    </div>
                </div>
            </div>
        `;

        // Disqualification banner - use onclick with direct DOM reference
        let disqualifyBanner = '';
        if (isDisqualified) {
            disqualifyBanner = `
                <div style="background:rgba(231,76,60,0.15);border-radius:0.5rem;padding:0.75rem 1rem;margin-bottom:1rem;border-left:4px solid #e74c3c;display:flex;align-items:center;gap:0.75rem;cursor:pointer;" onclick="window.playerRecordsInstance.showDisqualificationModal('${playerId}')">
                    <i class="fas fa-exclamation-triangle" style="color:#e74c3c;font-size:1.2rem;"></i>
                    <span style="color:var(--text-primary);flex:1;">
                        <strong>DISQUALIFIED</strong> - Click for details
                    </span>
                    <i class="fas fa-chevron-right" style="color:var(--text-secondary);"></i>
                </div>
            `;
        }

        if (!hasAnyStats) {
            statsHtml = `<div class="profile-no-stats">No statistics available for this player.</div>`;
        }

        let html = `
            <div class="profile-modal-overlay" id="profileModal">
                <div class="profile-modal-content profile-modal-enhanced">
                    <button class="profile-modal-close" onclick="document.getElementById('profileModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>

                    <div class="profile-header">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="profile-info">
                            <h2 title="${playerId}" style="${isDisqualified ? 'text-decoration:line-through;' : ''}">${truncatedName} ${isDisqualified ? '<i class="fas fa-exclamation-triangle" style="color:#e74c3c;font-size:1rem;" title="Disqualified"></i>' : ''}</h2>
                            <div class="profile-meta">
                                <span><i class="fas fa-trophy" style="color: var(--accent-color, #ff8300);"></i> ${allRecords.length} entr${allRecords.length > 1 ? 'ies' : 'y'}</span>
                                <span class="profile-rank-note"><i class="fas fa-info-circle"></i> Profile shows global ranks only</span>
                            </div>
                        </div>
                    </div>

                    ${disqualifyBanner}

                    <div class="profile-stats-grid">
                        ${statsHtml}
                    </div>

                    <div class="profile-footer">
                        <button onclick="document.getElementById('profileModal').remove()" class="profile-close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('profileModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', html);

        // Store reference to this instance for onclick handlers
        window.playerRecordsInstance = this;

        document.querySelectorAll('#profileModal .profile-stat-proof-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const proofUrl = btn.dataset.proof;
                if (proofUrl) {
                    const modal = document.getElementById('profileModal');
                    if (modal) modal.remove();
                    this.showProofModal(proofUrl);
                }
            });
        });

        document.getElementById('profileModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });

        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('profileModal');
                if (modal) {
                    modal.remove();
                    document.removeEventListener('keydown', closeHandler);
                }
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    showProofModal(proofUrl) {
        if (!proofUrl) return;

        const existingModal = document.getElementById('proofModal');
        if (existingModal) {
            existingModal.remove();
        }

        const leaderboardModal = document.getElementById('leaderboardModal');
        if (leaderboardModal) {
            leaderboardModal.remove();
        }

        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.remove();
        }

        const tooltip = document.querySelector('.stat-info-tooltip');
        if (tooltip) {
            tooltip.remove();
        }

        const html = `
            <div class="proof-modal-overlay" id="proofModal">
                <div class="proof-modal-content">
                    <button class="proof-modal-close" onclick="document.getElementById('proofModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${proofUrl}" alt="Proof Image" class="proof-modal-image" loading="lazy">
                    <div class="proof-modal-info">
                        <p><strong>Record Date:</strong> ${this.getRecordDate(proofUrl)}</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('proofModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });

        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('proofModal');
                if (modal) {
                    modal.remove();
                    document.removeEventListener('keydown', closeHandler);
                }
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    getRecordDate(proofUrl) {
        if (!proofUrl) return 'N/A';
        try {
            const filename = proofUrl.split('/').pop();
            if (!filename) return 'N/A';

            const dateMatch = filename.match(/(\d{2})(\d{2})(\d{4})/);
            if (dateMatch) {
                const day = dateMatch[1];
                const month = parseInt(dateMatch[2]) - 1;
                const year = dateMatch[3];
                const dateObj = new Date(year, month, day);
                if (!isNaN(dateObj.getTime())) {
                    return dateObj.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                }
            }
            return 'N/A';
        } catch {
            return 'N/A';
        }
    }

    getModeDisplayName(mode) {
        const displayNames = {
            'conquest': 'Conquest',
            'control': 'Control',
            'hardpoint': 'Hardpoint',
            'kill-confirmed': 'Kill Confirmed',
            'plant-defuse': 'Plant & Defuse'
        };
        return displayNames[mode] || mode;
    }

    // Toast notification system
    showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1100;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                pointer-events: none;
                max-width: 90%;
            `;
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconClass = 'fas fa-info-circle';
        if (type === 'success') iconClass = 'fas fa-check-circle';
        else if (type === 'warning') iconClass = 'fas fa-exclamation-circle';
        else if (type === 'error') iconClass = 'fas fa-times-circle';

        toast.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${message}</span>
        `;

        toast.style.cssText = `
            background-color: var(--card-bg);
            color: var(--text-primary);
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: auto;
            min-width: 250px;
            max-width: 100%;
            border-left: 4px solid ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : type === 'error' ? '#F44336' : '#2196F3'};
            animation: toastSlideIn 0.3s ease-out;
            transition: all 0.3s ease;
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    showGuidelinesModal() {
        const existingModal = document.getElementById('guidelinesModal');
        if (existingModal) {
            existingModal.remove();
            return;
        }

        const html = `
            <div class="guidelines-modal-overlay" id="guidelinesModal">
                <div class="guidelines-modal-content">
                    <button class="guidelines-modal-close" onclick="document.getElementById('guidelinesModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <h2><i class="fas fa-book"></i> Submission Guidelines</h2>
                    <p class="guidelines-subtitle">Please read these guidelines carefully before submitting any records.</p>
                    <ul class="guidelines-list">
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Only original, <strong>unedited</strong>, and <strong>uncropped</strong> screenshots of the <span class="highlight">End of Match</span> screen are eligible.</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Screenshots must be submitted in the official Discord server's <span class="discord-highlight">#clips-and-highlights</span> channel.</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Do <strong>not</strong> hover over any badge, statistic, or metric while taking your screenshot of the <span class="highlight">SUMMARY</span> tab, as this may interfere with verification and result in your submission being rejected.</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Any submission where statistics, badges, player names, or other required data elements are <strong>covered, obscured, cropped, blurred, or otherwise unreadable</strong> will be considered <strong>incomplete</strong> and will <strong>not</strong> be accepted.</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Any submissions that do not meet these requirements will <strong>not</strong> be accepted.</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>All record submissions are manually reviewed and verified by the HEAT Labs team before being added to the database.</span>
                        </li>
                        <li>
                            <i class="fas fa-check-circle"></i>
                            <span>Records are updated every <strong>24 to 72 hours</strong> as this process takes time to validate all new submissions.</span>
                        </li>
                        <li>
                            <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
                            <span><strong>Tampering with records or attempting to resubmit old entries to gain higher spots on the leaderboard will result in complete removal from the leaderboards.</strong> All entries are verified and timestamped.</span>
                        </li>
                    </ul>
                    <div class="guidelines-footer">
                        <p>Questions? Join our <a href="https://discord.heatlabs.net" target="_blank">Discord server</a> for assistance.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('guidelinesModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });

        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('guidelinesModal');
                if (modal) {
                    modal.remove();
                    document.removeEventListener('keydown', closeHandler);
                }
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    showLoading(message = 'Loading...') {
        const loadingState = this.elements.loadingState;
        if (loadingState) {
            loadingState.style.display = 'block';
            const p = loadingState.querySelector('p');
            if (p) p.textContent = message;
        }
    }

    hideLoading() {
        const loadingState = this.elements.loadingState;
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    showError(message) {
        const loadingState = this.elements.loadingState;
        if (loadingState) {
            loadingState.style.display = 'block';
            const p = loadingState.querySelector('p');
            if (p) {
                p.textContent = '⚠️ ' + message;
                p.style.color = '#e74c3c';
            }
        }
    }

    capitalize(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatNumber(num) {
        if (num === undefined || num === null) return '0';
        if (typeof num === 'string') return num; // for "Coming Soon"
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined') {
        new PlayerRecords();
    } else {
        console.error('Chart.js not loaded');
    }
});