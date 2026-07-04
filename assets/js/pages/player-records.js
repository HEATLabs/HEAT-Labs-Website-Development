/* player-records.js */
class PlayerRecords {
    constructor() {
        this.records = {};
        this.players = new Map();
        this.recordsByMode = {
            conquest: [],
            control: [],
            hardpoint: [],
            'kill-confirmed': []
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
            'kill-confirmed': null
        };
        this.currentFilter = {
            mode: 'global',
            statKey: 'damage_caused'
        };

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
            globalTopDamage: document.getElementById('globalTopDamage'),
            tabGlobal: document.getElementById('tabGlobal'),
            tabConquest: document.getElementById('tabConquest'),
            tabControl: document.getElementById('tabControl'),
            tabHardpoint: document.getElementById('tabHardpoint'),
            tabKillConfirmed: document.getElementById('tabKillConfirmed'),
            tabContentGlobal: document.getElementById('tabContentGlobal'),
            tabContentConquest: document.getElementById('tabContentConquest'),
            tabContentControl: document.getElementById('tabContentControl'),
            tabContentHardpoint: document.getElementById('tabContentHardpoint'),
            tabContentKillConfirmed: document.getElementById('tabContentKillConfirmed'),
            globalDamageTableBody: document.getElementById('globalDamageTableBody'),
            globalKillsTableBody: document.getElementById('globalKillsTableBody'),
            globalAssistsTableBody: document.getElementById('globalAssistsTableBody'),
            globalXPTableBody: document.getElementById('globalXPTableBody'),
            globalCapturesTableBody: document.getElementById('globalCapturesTableBody'),
            globalBlockedTableBody: document.getElementById('globalBlockedTableBody'),
            globalCreditsTableBody: document.getElementById('globalCreditsTableBody'),
            globalIntelTableBody: document.getElementById('globalIntelTableBody'),
            globalConfirmsTableBody: document.getElementById('globalConfirmsTableBody'),
            globalDeniesTableBody: document.getElementById('globalDeniesTableBody'),
            conquestContent: document.getElementById('conquestContent'),
            controlContent: document.getElementById('controlContent'),
            hardpointContent: document.getElementById('hardpointContent'),
            killConfirmedContent: document.getElementById('killConfirmedContent'),
        };

        this.init();
    }

    // Load PvE toggle state from localStorage
    loadPveToggleState() {
        const defaultState = {
            global: true,
            conquest: true,
            control: true,
            hardpoint: true,
            'kill-confirmed': true
        };
        try {
            const saved = localStorage.getItem('playerRecords_pveToggle');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all keys exist
                return {
                    ...defaultState,
                    ...parsed
                };
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
        // Map tab names to button IDs correctly
        let buttonId;
        if (tab === 'global') {
            buttonId = 'pveToggleGlobal';
        } else if (tab === 'kill-confirmed') {
            buttonId = 'pveToggleKillconfirmed';
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
    }

    // Check if PvE records should be included for a given tab
    isPveIncluded(tab) {
        // If the tab is 'global', check the global toggle state
        if (tab === 'global') {
            return this.pveToggleState['global'] !== false;
        }
        // For mode tabs, check the mode-specific toggle state
        return this.pveToggleState[tab] !== false;
    }

    // Get filtered records for a mode (excluding PvE if toggle is OFF)
    // This now checks the global toggle state when called from global context
    getFilteredRecordsForMode(mode, useGlobalFilter = false) {
        const allRecords = this.recordsByMode[mode] || [];
        // If useGlobalFilter is true, use the global toggle state
        // Otherwise use the mode-specific toggle state
        const includePve = useGlobalFilter
            ? this.isPveIncluded('global')
            : this.isPveIncluded(mode);
        return allRecords.filter(record => {
            if (includePve) return true;
            // Exclude PvE records (matchType === 'pve')
            return record.matchType !== 'pve';
        });
    }

    // Get all filtered records across modes (for global tab)
    getAllFilteredRecords() {
        const allRecords = [];
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed'];
        for (const mode of modes) {
            // For global tab, always use the global filter
            const filtered = this.getFilteredRecordsForMode(mode, true);
            allRecords.push(...filtered);
        }
        return allRecords;
    }

    // Refresh a specific tab's content
    refreshTab(tab) {
        if (tab === 'global') {
            this.renderGlobalStats();
            this.destroyGlobalCharts();
            this.renderGlobalCharts();
            this.renderGlobalTables();
        } else {
            // Re-render the specific mode tab
            this.renderModeTab(tab);
        }
    }

    // Render a single mode tab
    renderModeTab(mode) {
        const container = {
            conquest: this.elements.conquestContent,
            control: this.elements.controlContent,
            hardpoint: this.elements.hardpointContent,
            'kill-confirmed': this.elements.killConfirmedContent
        } [mode];

        if (!container) return;

        const records = this.getFilteredRecordsForMode(mode);
        const modeDisplayNames = {
            'conquest': 'Conquest',
            'control': 'Control',
            'hardpoint': 'Hardpoint',
            'kill-confirmed': 'Kill Confirmed'
        };

        // Base stat configs for all modes
        const baseStatConfigs = [{
                key: 'damage_caused',
                label: 'Damage',
                icon: 'fa-bolt',
                color: 'var(--accent-color)'
            },
            {
                key: 'destroyed',
                label: 'Kills',
                icon: 'fa-skull',
                color: '#e74c3c'
            },
            {
                key: 'assists',
                label: 'Assists',
                icon: 'fa-handshake',
                color: '#3498db'
            },
            {
                key: 'XP',
                label: 'XP',
                icon: 'fa-star',
                color: '#f1c40f'
            },
            {
                key: 'credits',
                label: 'Credits',
                icon: 'fa-coins',
                color: '#f39c12'
            },
            {
                key: 'intel',
                label: 'Intel',
                icon: 'fa-microchip',
                color: '#1abc9c'
            }
        ];

        const modeStatConfigs = {
            'conquest': [
                ...baseStatConfigs,
                {
                    key: 'captures',
                    label: 'Captures',
                    icon: 'fa-flag-checkered',
                    color: '#2ecc71'
                },
                {
                    key: 'damage_blocked',
                    label: 'Blocked',
                    icon: 'fa-shield',
                    color: '#9b59b6'
                }
            ],
            'control': [
                ...baseStatConfigs,
                {
                    key: 'captures',
                    label: 'Captures',
                    icon: 'fa-flag-checkered',
                    color: '#2ecc71'
                },
                {
                    key: 'damage_blocked',
                    label: 'Blocked',
                    icon: 'fa-shield',
                    color: '#9b59b6'
                }
            ],
            'hardpoint': [
                ...baseStatConfigs,
                {
                    key: 'captures',
                    label: 'Captures',
                    icon: 'fa-flag-checkered',
                    color: '#2ecc71'
                },
                {
                    key: 'damage_blocked',
                    label: 'Blocked',
                    icon: 'fa-shield',
                    color: '#9b59b6'
                }
            ],
            'kill-confirmed': [
                ...baseStatConfigs,
                {
                    key: 'confirms',
                    label: 'Confirms',
                    icon: 'fa-check-double',
                    color: '#2ecc71'
                },
                {
                    key: 'denies',
                    label: 'Denies',
                    icon: 'fa-ban',
                    color: '#9b59b6'
                }
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
    }

    async init() {
        this.setupEventListeners();
        await this.loadRecordData();
        this.processRecords();
        this.updateAllPveToggleButtons();
        this.renderGlobalStats();
        this.renderGlobalCharts();
        this.renderGlobalTables();
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

        // Guidelines buttons - all tabs
        const guidelinesBtns = document.querySelectorAll('#openGuidelinesBtn, #openGuidelinesBtn2, #openGuidelinesBtn3, #openGuidelinesBtn4, #openGuidelinesBtn5');
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
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.stats-tab').forEach(btn => btn.classList.remove('active'));

        const tabMap = {
            'global': this.elements.tabGlobal,
            'conquest': this.elements.tabConquest,
            'control': this.elements.tabControl,
            'hardpoint': this.elements.tabHardpoint,
            'kill-confirmed': this.elements.tabKillConfirmed
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
            'kill-confirmed': this.elements.tabContentKillConfirmed
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

            // Load the records data
            const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/player-records.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.records = data.records || {};

            // Extract last updated times
            if (this.records.ROOT && this.records.ROOT.last_updated) {
                this.lastUpdated = {
                    conquest: this.records.ROOT.last_updated.conquest || null,
                    control: this.records.ROOT.last_updated.control || null,
                    hardpoint: this.records.ROOT.last_updated.hardpoint || null,
                    'kill-confirmed': this.records.ROOT.last_updated['kill-confirmed'] || null
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
        // Process each mode
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed'];

        for (const mode of modes) {
            this.recordsByMode[mode] = [];

            if (this.records[mode]) {
                for (const [playerId, playerRecords] of Object.entries(this.records[mode])) {
                    // Store player in map
                    if (!this.players.has(playerId)) {
                        this.players.set(playerId, {
                            id: playerId,
                            records: [],
                            totalRecords: 0
                        });
                    }

                    // Process each record
                    for (const record of playerRecords) {
                        // Determine match type based on tech value
                        const tech = record.tech || 0;
                        const matchType = tech < 40 ? 'pve' : 'pvp';

                        const enrichedRecord = {
                            ...record,
                            playerId: playerId,
                            mode: mode,
                            matchType: matchType,
                            tech: tech
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

            // Pattern: date in format DDMMYYYY
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
    sortRecordsByStatAndDate(records, statKey) {
        return [...records].sort((a, b) => {
            // First sort by stat value (descending)
            const aValue = a[statKey] || 0;
            const bValue = b[statKey] || 0;

            if (bValue !== aValue) {
                return bValue - aValue;
            }

            // If stat values are equal, sort by date (descending - most recent first)
            const aDate = this.extractDateFromProof(a.proof);
            const bDate = this.extractDateFromProof(b.proof);

            // If both have valid dates, compare them
            if (aDate && bDate) {
                return bDate.getTime() - aDate.getTime();
            }

            // If one has a date and the other doesn't, the one with date comes first
            if (aDate && !bDate) return -1;
            if (!aDate && bDate) return 1;

            // If neither has a date, maintain original order or fallback to player ID
            return (a.playerId || '').localeCompare(b.playerId || '');
        });
    }

    // Get unique players with their best record for a stat (each player appears once)
    getUniqueTopRecords(statKey, limit = 10, mode = null) {
        const allRecords = [];

        // Get records from specific mode or all modes
        if (mode) {
            const filteredRecords = this.getFilteredRecordsForMode(mode);
            for (const record of filteredRecords) {
                if (record[statKey] !== undefined && record[statKey] !== null) {
                    allRecords.push(record);
                }
            }
        } else {
            // For global tab, use all modes with the global PvE filter
            const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed'];
            for (const modeName of modes) {
                const filteredRecords = this.getFilteredRecordsForMode(modeName, true);
                for (const record of filteredRecords) {
                    if (record[statKey] !== undefined && record[statKey] !== null) {
                        allRecords.push(record);
                    }
                }
            }
        }

        // Group by player, keep only their best record for this stat
        const playerBestMap = new Map();
        for (const record of allRecords) {
            const playerId = record.playerId;
            if (!playerBestMap.has(playerId)) {
                playerBestMap.set(playerId, record);
            } else {
                const existing = playerBestMap.get(playerId);
                const existingValue = existing[statKey] || 0;
                const newValue = record[statKey] || 0;

                // Keep the higher value, or if equal, keep the more recent one
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

        // Convert to array and sort
        const uniqueRecords = Array.from(playerBestMap.values());
        const sorted = this.sortRecordsByStatAndDate(uniqueRecords, statKey);

        // Return with rank information
        return sorted.slice(0, limit).map((record, index) => ({
            ...record,
            rank: index + 1
        }));
    }

    // Get all records for a specific player for a specific stat
    getPlayerRecordsForStat(playerId, statKey) {
        const player = this.players.get(playerId);
        if (!player) return null;

        // Get all records for this player that have this stat
        const allRecords = player.records || [];
        const filteredRecords = allRecords.filter(record => {
            // Check if the stat exists and is valid
            if (record[statKey] === undefined || record[statKey] === null || record[statKey] <= 0) {
                return false;
            }
            // Check PvE filter for this record's mode
            const mode = record.mode;
            const includePve = this.isPveIncluded('global');
            return includePve || record.matchType !== 'pve';
        });

        // Sort by stat value (descending) and then by date
        return this.sortRecordsByStatAndDate(filteredRecords, statKey);
    }

    renderLastUpdated() {
        const modeDisplayNames = {
            'conquest': 'Conquest',
            'control': 'Control',
            'hardpoint': 'Hardpoint',
            'kill-confirmed': 'Kill Confirmed'
        };

        // Add last updated to each mode tab header
        for (const [mode, timestamp] of Object.entries(this.lastUpdated)) {
            if (!timestamp) continue;

            const tabContentId = `tabContent${mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', '')}`;
            const tabContent = document.getElementById(tabContentId);
            if (!tabContent) continue;

            // Find or create the last updated element
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

        // Also add to global tab
        const globalHeader = document.querySelector('#tabContentGlobal .global-stats-header');
        if (globalHeader) {
            let globalUpdated = globalHeader.querySelector('.global-last-updated');
            if (!globalUpdated) {
                globalUpdated = document.createElement('div');
                globalUpdated.className = 'global-last-updated';
                globalHeader.appendChild(globalUpdated);
            }

            // Find the most recent update across all modes
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
        const allFilteredRecords = this.getAllFilteredRecords();
        let totalRecords = allFilteredRecords.length;
        let highestDamage = 0;
        let modeCount = 0;
        const uniquePlayers = new Set();

        for (const record of allFilteredRecords) {
            uniquePlayers.add(record.playerId);
            if (record.damage_caused && record.damage_caused > highestDamage) {
                highestDamage = record.damage_caused;
            }
        }

        // Count modes that have records (after filtering)
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed'];
        for (const mode of modes) {
            const filtered = this.getFilteredRecordsForMode(mode, true);
            if (filtered.length > 0) {
                modeCount++;
            }
        }

        if (this.elements.globalTotalRecords) this.elements.globalTotalRecords.textContent = totalRecords;
        if (this.elements.globalRecordHolders) this.elements.globalRecordHolders.textContent = uniquePlayers.size;
        if (this.elements.globalModesCount) this.elements.globalModesCount.textContent = modeCount;
        if (this.elements.globalTopDamage) this.elements.globalTopDamage.textContent = this.formatNumber(highestDamage);
    }

    // Helper method to get distribution data for bar charts
    getDistributionData(field, sortAlphabetically = true, modeFilter = null) {
        const distribution = {};
        const modes = modeFilter ? [modeFilter] : ['conquest', 'control', 'hardpoint', 'kill-confirmed'];

        for (const mode of modes) {
            // For global distribution, use the global filter
            const filteredRecords = this.getFilteredRecordsForMode(mode, true);
            for (const record of filteredRecords) {
                let value = record[field];
                if (value !== undefined && value !== null && value !== '') {
                    // Special handling for outcome - ensure "Draw" is included if present
                    if (field === 'outcome') {
                        // Normalize outcome values
                        if (value.toLowerCase() === 'victory') value = 'Victory';
                        else if (value.toLowerCase() === 'defeat') value = 'Defeat';
                        else if (value.toLowerCase() === 'draw') value = 'Draw';
                    }
                    const key = String(value);
                    distribution[key] = (distribution[key] || 0) + 1;
                }
            }
        }

        // Sort entries alphabetically by key (label name)
        const sortedEntries = Object.entries(distribution).sort((a, b) => a[0].localeCompare(b[0]));

        const result = {};
        const limitedEntries = sortedEntries.slice(0, 10);
        for (const [key, count] of limitedEntries) {
            result[key] = count;
        }

        // If there are more than 10 entries, add an "Others" category
        if (sortedEntries.length > 10) {
            const othersCount = sortedEntries.slice(10).reduce((sum, [, count]) => sum + count, 0);
            result['Others'] = othersCount;
        }
        return result;
    }

    renderGlobalCharts() {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999';

        // Destroy existing global charts
        this.destroyGlobalCharts();

        // Get all filtered records for distribution
        const allFilteredRecords = this.getAllFilteredRecords();

        // 1. Records by Mode
        const modeLabels = ['Conquest', 'Control', 'Hardpoint', 'Kill Confirmed'];
        const modeData = [
            this.getFilteredRecordsForMode('conquest', true).length,
            this.getFilteredRecordsForMode('control', true).length,
            this.getFilteredRecordsForMode('hardpoint', true).length,
            this.getFilteredRecordsForMode('kill-confirmed', true).length
        ];

        const ctx1 = document.getElementById('globalRecordsByModeChart').getContext('2d');
        this.globalCharts.recordsByMode = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: modeLabels,
                datasets: [{
                    label: 'Records',
                    data: modeData,
                    backgroundColor: ['rgba(255, 131, 0, 0.7)', 'rgba(52, 152, 219, 0.7)', 'rgba(46, 204, 113, 0.7)', 'rgba(155, 89, 182, 0.7)'],
                    borderColor: ['rgba(255, 131, 0, 1)', 'rgba(52, 152, 219, 1)', 'rgba(46, 204, 113, 1)', 'rgba(155, 89, 182, 1)'],
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

        // 2. Top Damage Records
        const topDamage = this.getUniqueTopRecords('damage_caused', 10);
        const damageLabels = topDamage.map(r => r.playerId.substring(0, 12) + (r.playerId.length > 12 ? '...' : ''));
        const damageValues = topDamage.map(r => r.damage_caused || 0);

        const ctx2 = document.getElementById('globalTopDamageChart').getContext('2d');
        this.globalCharts.topDamage = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: damageLabels,
                datasets: [{
                    label: 'Damage',
                    data: damageValues,
                    backgroundColor: 'rgba(255, 131, 0, 0.7)',
                    borderColor: 'rgba(255, 131, 0, 1)',
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
                            callback: (value) => this.formatNumber(value),
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

        // 3. Records by Category
        const categoryData = this.getCategoryStats();
        const categoryLabels = ['Damage', 'Kills', 'Assists', 'XP', 'Captures', 'Confirms', 'Denies'];
        const categoryColors = [
            'rgba(255, 131, 0, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(52, 152, 219, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(46, 204, 113, 0.8)',
            'rgba(155, 89, 182, 0.8)',
            'rgba(230, 126, 34, 0.8)'
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

        // 4. Player Records Distribution
        const playerRecordCounts = [];
        for (const player of this.players.values()) {
            // Count only records that are included based on global filter
            let count = 0;
            for (const record of player.records) {
                const includePve = this.isPveIncluded('global');
                if (includePve || record.matchType !== 'pve') {
                    count++;
                }
            }
            if (count > 0) {
                playerRecordCounts.push(count);
            }
        }
        playerRecordCounts.sort((a, b) => a - b);

        const binEdges = [1, 2, 3, 4, 5, 6];
        const histogram = Array(binEdges.length - 1).fill(0);

        for (const count of playerRecordCounts) {
            for (let i = 0; i < binEdges.length - 1; i++) {
                if (count >= binEdges[i] && count < binEdges[i + 1]) {
                    histogram[i]++;
                    break;
                }
            }
            if (count >= binEdges[binEdges.length - 1]) {
                histogram[histogram.length - 1]++;
            }
        }

        const histLabels = histogram.map((_, i) => {
            return `${binEdges[i]}-${binEdges[i+1]}`;
        });

        const ctx4 = document.getElementById('globalPlayerRecordsChart').getContext('2d');
        this.globalCharts.playerRecords = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: histLabels,
                datasets: [{
                    label: 'Players',
                    data: histogram,
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: 'rgba(46, 204, 113, 1)',
                    borderWidth: 1,
                    borderRadius: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false,
                    },
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

        // 5. Map Distribution (Bar Chart)
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

        // 6. Outcome Distribution
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

        // 7. Tank Distribution (Bar Chart)
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

        // 8. Agent Distribution (Bar Chart)
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
        const chartKeys = ['recordsByMode', 'topDamage', 'recordsByCategory', 'playerRecords',
            'mapDistribution', 'outcomeDistribution', 'tankDistribution', 'agentDistribution'
        ];
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
            denies = 0;

        const allRecords = this.getAllFilteredRecords();
        for (const record of allRecords) {
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
        }

        const total = damage + kills + assists + xp + captures + confirms + denies;
        if (total === 0) {
            return [1, 1, 1, 1, 1, 1, 1];
        }

        return [damage, kills, assists, xp, captures, confirms, denies];
    }

    renderGlobalTables() {
        this.renderGlobalTable('damage_caused', 'Damage', this.elements.globalDamageTableBody);
        this.renderGlobalTable('destroyed', 'Kills', this.elements.globalKillsTableBody);
        this.renderGlobalTable('assists', 'Assists', this.elements.globalAssistsTableBody);
        this.renderGlobalTable('XP', 'XP', this.elements.globalXPTableBody);
        this.renderGlobalTable('captures', 'Captures', this.elements.globalCapturesTableBody);
        this.renderGlobalTable('damage_blocked', 'Blocked', this.elements.globalBlockedTableBody);
        this.renderGlobalTable('credits', 'Credits', this.elements.globalCreditsTableBody);
        this.renderGlobalTable('intel', 'Intel', this.elements.globalIntelTableBody);
        this.renderGlobalTable('confirms', 'Confirms', this.elements.globalConfirmsTableBody);
        this.renderGlobalTable('denies', 'Denies', this.elements.globalDeniesTableBody);
    }

    // Uses getUniqueTopRecords to show each player only once
    renderGlobalTable(statKey, statLabel, tbody) {
        if (!tbody) return;

        // Get unique players with their best record for this stat
        const records = this.getUniqueTopRecords(statKey, 20);

        if (!records.length) {
            const allRecords = this.getAllFilteredRecords();
            const hasRecords = allRecords.some(r => r[statKey] !== undefined && r[statKey] !== null && r[statKey] > 0);
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

            html += `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td><strong class="player-name-clickable" data-playerid="${record.playerId}" data-statkey="${statKey}" style="cursor:pointer;color:var(--accent-color, #ff8300);">${record.playerId}</strong></td>
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

    renderModeTabs() {
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed'];
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

            html += `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td><strong class="player-name-clickable" data-playerid="${record.playerId}" data-statkey="${statKey}" style="cursor:pointer;color:var(--accent-color, #ff8300);">${record.playerId}</strong></td>
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
        // Use unique players for this mode and stat
        const sorted = this.getUniqueTopRecords(statKey, 1000, mode);

        if (!sorted.length) {
            const includePve = this.isPveIncluded(mode);
            const msg = includePve ?
                `No records found for ${label} in ${this.getModeDisplayName(mode)}` :
                `No PvP records found for ${label} in ${this.getModeDisplayName(mode)} (PvE is currently hidden)`;
            this.showToast(msg, 'error');
            return;
        }

        // Store data for pagination
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
            'denies': 'Denies'
        };

        const statLabel = statLabels[statKey] || statKey;
        const modeName = this.getModeDisplayName(mode);

        // Build leaderboard HTML
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

            html += `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${rank}</span></td>
                    <td><strong class="player-name-clickable" data-playerid="${record.playerId}" data-statkey="${statKey}" style="cursor:pointer;color:var(--accent-color, #ff8300);">${record.playerId}</strong></td>
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

        // Remove existing modal if any
        const existingModal = document.getElementById('leaderboardModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', html);

        // Store instance reference for pagination
        window.playerRecordsInstance = this;

        // Add proof click handlers
        document.querySelectorAll('#leaderboardModal .action-btn-proof').forEach(btn => {
            btn.addEventListener('click', () => {
                const proofUrl = btn.dataset.proof;
                this.showProofModal(proofUrl);
            });
        });

        // Add profile click handlers
        document.querySelectorAll('#leaderboardModal .action-btn-profile, #leaderboardModal .player-name-clickable').forEach(el => {
            el.addEventListener('click', () => {
                const playerId = el.dataset.playerid;
                const statKey = el.dataset.statkey || 'damage_caused';
                // Close leaderboard modal first
                const modal = document.getElementById('leaderboardModal');
                if (modal) modal.remove();
                this.showPlayerProfile(playerId, statKey);
            });
        });

        // Close modal on overlay click
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

        // Get the current modal and re-render
        const modal = document.getElementById('leaderboardModal');
        if (modal) {
            // Get mode, statKey, and label from modal data attributes
            const mode = modal.dataset.mode || 'conquest';
            const statKey = modal.dataset.stat || 'damage_caused';
            const label = modal.dataset.label || 'Damage';

            // Remove old modal and render new page
            modal.remove();
            this.renderLeaderboardPage(mode, statKey, label);
        }
    }

    // Show player profile modal with all their records for a specific stat
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
            'denies': 'Denies'
        };

        const statLabel = statLabels[statKey] || statKey;

        // Get all records for this player for this specific stat
        const allRecords = this.getPlayerRecordsForStat(playerId, statKey);
        if (!allRecords || allRecords.length === 0) {
            this.showToast(`No ${statLabel} records found for ${playerId}`, 'error');
            return;
        }

        // Build the profile modal
        let html = `
            <div class="profile-modal-overlay" id="profileModal">
                <div class="profile-modal-content">
                    <button class="profile-modal-close" onclick="document.getElementById('profileModal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="profile-info">
                            <h2>${playerId}</h2>
                            <p><i class="fas fa-trophy" style="color: var(--accent-color, #ff8300);"></i> ${allRecords.length} ${statLabel} record${allRecords.length > 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div class="profile-records">
                        <h3><i class="fas fa-chart-bar" style="color: var(--accent-color, #ff8300);"></i> ${statLabel} Records</h3>
                        <div class="table-wrapper">
                            <table class="records-table profile-records-table">
                                <thead>
                                    <tr>
                                        <th>${statLabel}</th>
                                        <th>Mode</th>
                                        <th>Type</th>
                                        <th>Vehicle</th>
                                        <th>Agent</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
        `;

        let rank = 1;
        for (const record of allRecords) {
            const recordDate = this.getRecordDate(record.proof);
            const modeDisplayName = this.getModeDisplayName(record.mode);
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
            const matchTypeLabel = record.matchType === 'pvp' ? 'PvP' : 'PvE';
            const matchTypeClass = record.matchType === 'pvp' ? 'match-type-pvp' : 'match-type-pve';

            html += `
                <tr>
                    <td><span class="rank-badge ${rankClass}">${this.formatNumber(record[statKey] || 0)}</span></td>
                    <td><span class="mode-badge">${modeDisplayName}</span></td>
                    <td><span class="match-type-badge ${matchTypeClass}">${matchTypeLabel}</span></td>
                    <td>${record.vehicle || 'N/A'}</td>
                    <td>${record.agent || 'N/A'}</td>
                    <td>${recordDate}</td>
                    <td>
                        <div class="action-buttons">
                            ${record.proof ? `<button class="action-btn action-btn-proof" data-proof="${record.proof}"><i class="fas fa-image"></i></button>` : ''}
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
                    </div>
                    <div class="profile-footer">
                        <button onclick="document.getElementById('profileModal').remove()" class="profile-close-btn">Close</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing profile modal if any
        const existingModal = document.getElementById('profileModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', html);

        // Add proof click handlers
        document.querySelectorAll('#profileModal .action-btn-proof').forEach(btn => {
            btn.addEventListener('click', () => {
                const proofUrl = btn.dataset.proof;
                // Close profile modal first
                const modal = document.getElementById('profileModal');
                if (modal) modal.remove();
                this.showProofModal(proofUrl);
            });
        });

        // Close modal on overlay click
        document.getElementById('profileModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });

        // Close on Escape key
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

        // Check if a proof modal already exists and remove it
        const existingModal = document.getElementById('proofModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Close any leaderboard modal that might be open
        const leaderboardModal = document.getElementById('leaderboardModal');
        if (leaderboardModal) {
            leaderboardModal.remove();
        }

        // Close any profile modal that might be open
        const profileModal = document.getElementById('profileModal');
        if (profileModal) {
            profileModal.remove();
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

        // Close on overlay click
        document.getElementById('proofModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });

        // Close on Escape key
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
            // Extract filename from URL
            const filename = proofUrl.split('/').pop();
            if (!filename) return 'N/A';

            // Pattern: date in format DDMMYYYY or DDMMYYYY with hyphens
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
            'kill-confirmed': 'Kill Confirmed'
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
                            <span>Do <strong>not</strong> hover over any badge, statistic, or metric while taking your screenshot of the <span class="highlight">YOUR PERFORMANCE</span> tab, as this may interfere with verification and result in your submission being rejected.</span>
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
                    </ul>
                    <div class="guidelines-footer">
                        <p>Questions? Join our <a href="https://discord.heatlabs.net" target="_blank">Discord server</a> for assistance.</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Close on overlay click
        document.getElementById('guidelinesModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.remove();
            }
        });

        // Close on Escape key
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
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
}

// Add toast animation styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes toastSlideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .mode-badge {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.7rem;
        font-weight: 600;
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }

    .player-name-clickable {
        cursor: pointer;
        transition: color 0.2s ease;
    }
    .player-name-clickable:hover {
        color: #ff6b00 !important;
        text-decoration: underline;
    }

    .match-type-badge {
        display: inline-block;
        padding: 0.15rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    .match-type-pvp {
        background: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
    }
    .match-type-pve {
        background: rgba(46, 204, 113, 0.2);
        color: #2ecc71;
        border: 1px solid rgba(46, 204, 113, 0.3);
    }

    .last-updated-text {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
        opacity: 0.8;
    }
    .last-updated-text i {
        margin-right: 0.4rem;
    }

    .global-last-updated {
        margin-top: 0.5rem;
    }

    /* PvE Toggle Button */
    .pve-toggle-btn {
        padding: 0.5rem 1.5rem;
        border: none;
        border-radius: 0.5rem;
        color: #fff;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all var(--transition-speed, 0.3s);
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }
    .pve-toggle-btn:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
`;
document.head.appendChild(toastStyles);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined') {
        new PlayerRecords();
    } else {
        console.error('Chart.js not loaded');
    }
});