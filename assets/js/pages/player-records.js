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
            conquestContent: document.getElementById('conquestContent'),
            controlContent: document.getElementById('controlContent'),
            hardpointContent: document.getElementById('hardpointContent'),
            killConfirmedContent: document.getElementById('killConfirmedContent'),
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadRecordData();
        this.processRecords();
        this.renderGlobalStats();
        this.renderGlobalCharts();
        this.renderGlobalTables();
        this.renderModeTabs();
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
                        const enrichedRecord = {
                            ...record,
                            playerId: playerId,
                            mode: mode
                        };
                        this.recordsByMode[mode].push(enrichedRecord);
                        this.players.get(playerId).records.push(enrichedRecord);
                        this.players.get(playerId).totalRecords++;
                    }
                }
            }
        }
    }

    renderGlobalStats() {
        let totalRecords = 0;
        let highestDamage = 0;
        let modeCount = 0;

        for (const mode of ['conquest', 'control', 'hardpoint', 'kill-confirmed']) {
            if (this.records[mode] && Object.keys(this.records[mode]).length > 0) {
                modeCount++;
                const modeRecords = this.recordsByMode[mode] || [];
                totalRecords += modeRecords.length;

                for (const record of modeRecords) {
                    if (record.damage_caused && record.damage_caused > highestDamage) {
                        highestDamage = record.damage_caused;
                    }
                }
            }
        }

        if (this.elements.globalTotalRecords) this.elements.globalTotalRecords.textContent = totalRecords;
        if (this.elements.globalRecordHolders) this.elements.globalRecordHolders.textContent = this.players.size;
        if (this.elements.globalModesCount) this.elements.globalModesCount.textContent = modeCount;
        if (this.elements.globalTopDamage) this.elements.globalTopDamage.textContent = this.formatNumber(highestDamage);
    }

    renderGlobalCharts() {
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999';

        // Destroy existing global charts
        this.destroyGlobalCharts();

        // 1. Records by Mode
        const modeLabels = ['Conquest', 'Control', 'Hardpoint', 'Kill Confirmed'];
        const modeData = [
            this.recordsByMode.conquest.length,
            this.recordsByMode.control.length,
            this.recordsByMode.hardpoint.length,
            this.recordsByMode['kill-confirmed'].length
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

        // 2. Top Damage Records (Top 10)
        const topDamage = this.getTopRecords('damage_caused', 10);
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

        // 3. Records by Category - REMOVED "Other" category
        const categoryData = this.getCategoryStats();
        const categoryLabels = ['Damage', 'Kills', 'Assists', 'XP', 'Captures'];
        const categoryColors = [
            'rgba(255, 131, 0, 0.8)',
            'rgba(231, 76, 60, 0.8)',
            'rgba(52, 152, 219, 0.8)',
            'rgba(241, 196, 15, 0.8)',
            'rgba(46, 204, 113, 0.8)'
        ];
        // Only use first 5 values (remove "Other")
        const filteredData = categoryData.slice(0, 5);

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

        // 4. Player Records Distribution - Custom bins: 1-2, 2-3, 3-4, 4-5, 5-6
        const playerRecordCounts = [];
        for (const player of this.players.values()) {
            playerRecordCounts.push(player.totalRecords);
        }
        playerRecordCounts.sort((a, b) => a - b);

        // Custom bins: 1-2, 2-3, 3-4, 4-5, 5-6
        const binEdges = [1, 2, 3, 4, 5, 6];
        const histogram = Array(binEdges.length - 1).fill(0);

        for (const count of playerRecordCounts) {
            for (let i = 0; i < binEdges.length - 1; i++) {
                if (count >= binEdges[i] && count < binEdges[i + 1]) {
                    histogram[i]++;
                    break;
                }
            }
            // If count >= 6, add to the last bin
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
    }

    destroyGlobalCharts() {
        for (const key of ['recordsByMode', 'topDamage', 'recordsByCategory', 'playerRecords']) {
            if (this.globalCharts[key]) {
                this.globalCharts[key].destroy();
                delete this.globalCharts[key];
            }
        }
    }

    getTopRecords(statKey, limit = 10) {
        const allRecords = [];
        for (const mode of ['conquest', 'control', 'hardpoint', 'kill-confirmed']) {
            for (const record of this.recordsByMode[mode] || []) {
                if (record[statKey] !== undefined && record[statKey] !== null) {
                    allRecords.push(record);
                }
            }
        }

        allRecords.sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0));
        return allRecords.slice(0, limit);
    }

    getCategoryStats() {
        let damage = 0,
            kills = 0,
            assists = 0,
            xp = 0,
            captures = 0,
            other = 0;

        for (const mode of ['conquest', 'control', 'hardpoint', 'kill-confirmed']) {
            for (const record of this.recordsByMode[mode] || []) {
                if (record.damage_caused && record.damage_caused > 30000) damage++;
                else if (record.damage_caused) other++;

                if (record.destroyed && record.destroyed > 15) kills++;
                else if (record.destroyed) other++;

                if (record.assists && record.assists > 10) assists++;
                else if (record.assists) other++;

                if (record.XP && record.XP > 10000) xp++;
                else if (record.XP) other++;

                if (record.captures && record.captures > 3) captures++;
                else if (record.captures) other++;
            }
        }

        // Ensure we have some data
        const total = damage + kills + assists + xp + captures;
        if (total === 0) {
            return [1, 1, 1, 1, 1];
        }

        // Return only 5 categories (remove "Other")
        return [damage, kills, assists, xp, captures];
    }

    renderGlobalTables() {
        this.renderGlobalTable('damage_caused', 'Damage', this.elements.globalDamageTableBody);
        this.renderGlobalTable('destroyed', 'Kills', this.elements.globalKillsTableBody);
        this.renderGlobalTable('assists', 'Assists', this.elements.globalAssistsTableBody);
        this.renderGlobalTable('XP', 'XP', this.elements.globalXPTableBody);
        this.renderGlobalTable('captures', 'Captures', this.elements.globalCapturesTableBody);
        this.renderGlobalTable('damage_blocked', 'Damage Blocked', this.elements.globalBlockedTableBody);
        this.renderGlobalTable('credits', 'Credits', this.elements.globalCreditsTableBody);
        this.renderGlobalTable('intel', 'Intel', this.elements.globalIntelTableBody);
    }

    renderGlobalTable(statKey, statLabel, tbody) {
        if (!tbody) return;

        const records = this.getTopRecords(statKey, 20);

        if (!records.length) {
            tbody.innerHTML = `<tr><td colspan="8" class="no-data">No records found for ${statLabel}</td></tr>`;
            return;
        }

        let rank = 1;
        let html = '';

        for (const record of records) {
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
            const recordDate = this.getRecordDate(record.proof);

            html += `
        <tr>
          <td><span class="rank-badge ${rankClass}">${rank}</span></td>
          <td><strong>${record.playerId}</strong></td>
          <td>${this.formatNumber(record[statKey] || 0)}</td>
          <td><span class="mode-badge">${this.capitalize(record.mode)}</span></td>
          <td>${record.vehicle || 'N/A'}</td>
          <td>${record.agent || 'N/A'}</td>
          <td>${recordDate}</td>
          <td>
            <div class="action-buttons">
              ${record.proof ? `<button class="action-btn action-btn-proof" data-proof="${record.proof}"><i class="fas fa-image"></i> Proof</button>` : ''}
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
    }

    renderModeTabs() {
        const modes = ['conquest', 'control', 'hardpoint', 'kill-confirmed'];
        const modeDisplayNames = {
            'conquest': 'Conquest',
            'control': 'Control',
            'hardpoint': 'Hardpoint',
            'kill-confirmed': 'Kill Confirmed'
        };

        const statConfigs = [{
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
                key: 'captures',
                label: 'Captures',
                icon: 'fa-flag-checkered',
                color: '#2ecc71'
            },
            {
                key: 'damage_blocked',
                label: 'Damage Blocked',
                icon: 'fa-shield',
                color: '#9b59b6'
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

        const contentMap = {
            'conquest': this.elements.conquestContent,
            'control': this.elements.controlContent,
            'hardpoint': this.elements.hardpointContent,
            'kill-confirmed': this.elements.killConfirmedContent
        };

        for (const mode of modes) {
            const container = contentMap[mode];
            if (!container) continue;

            const records = this.recordsByMode[mode] || [];

            if (!records.length) {
                container.innerHTML = `
          <div class="no-results">
            <i class="fas fa-search fa-3x"></i>
            <h3>No Records Found</h3>
            <p>No records available for ${modeDisplayNames[mode]} mode</p>
          </div>
        `;
                continue;
            }

            let cardsHtml = '';
            for (const config of statConfigs) {
                const topRecords = this.getModeTopRecords(mode, config.key, 5);
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
        }
    }

    getModeTopRecords(mode, statKey, limit = 5) {
        const records = this.recordsByMode[mode] || [];
        const sorted = [...records].sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0));
        return sorted.slice(0, limit);
    }

    renderModeTableRows(records, statKey, mode) {
        if (!records.length) {
            return `<tr><td colspan="6" class="no-data">No records found</td></tr>`;
        }

        let rank = 1;
        let html = '';

        for (const record of records) {
            const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
            const recordDate = this.getRecordDate(record.proof);
            html += `
        <tr>
          <td><span class="rank-badge ${rankClass}">${rank}</span></td>
          <td><strong>${record.playerId}</strong></td>
          <td>${this.formatNumber(record[statKey] || 0)}</td>
          <td>${record.vehicle || 'N/A'}</td>
          <td>${recordDate}</td>
          <td>
            <div class="action-buttons">
              ${record.proof ? `<button class="action-btn action-btn-proof" data-proof="${record.proof}"><i class="fas fa-image"></i> Proof</button>` : ''}
            </div>
          </td>
        </tr>
      `;
            rank++;
        }

        return html;
    }

    showFullLeaderboard(mode, statKey, label) {
        const records = this.recordsByMode[mode] || [];
        const sorted = [...records].sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0));

        if (!sorted.length) {
            this.showToast(`No records found for ${label} in ${this.capitalize(mode)}`, 'error');
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
            'damage_blocked': 'Damage Blocked',
            'credits': 'Credits',
            'intel': 'Intel'
        };

        const statLabel = statLabels[statKey] || statKey;
        const modeName = this.capitalize(mode);

        // Build leaderboard HTML
        let html = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 2000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);" id="leaderboardModal">
        <div style="background: var(--card-bg); border-radius: 1rem; border: 1px solid var(--border-color); padding: 2rem; max-width: 900px; width: 95%; max-height: 85vh; overflow-y: auto; position: relative;">
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

            html += `
        <tr>
          <td><span class="rank-badge ${rankClass}">${rank}</span></td>
          <td><strong>${record.playerId}</strong></td>
          <td>${this.formatNumber(record[statKey] || 0)}</td>
          <td>${record.vehicle || 'N/A'}</td>
          <td>${record.agent || 'N/A'}</td>
          <td>${recordDate}</td>
          <td>
            <div class="action-buttons">
              ${record.proof ? `<button class="action-btn action-btn-proof" data-proof="${record.proof}"><i class="fas fa-image"></i> Proof</button>` : ''}
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
            // We need to re-render with the new page
            // But we lost the mode and statKey context, so we need to store them
            // Let's use stored values or re-parse from the modal
            const mode = modal.dataset.mode || 'conquest';
            const statKey = modal.dataset.statKey || 'damage_caused';
            const label = modal.dataset.label || 'Damage';

            // Remove old modal and render new page
            modal.remove();
            this.renderLeaderboardPage(mode, statKey, label);
        }
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
              <span>Only original, <strong>unedited</strong>, and <strong>uncropped</strong> screenshots of the <span class="highlight">YOUR PERFORMANCE</span> after-match screen are eligible.</span>
            </li>
            <li>
              <i class="fas fa-check-circle"></i>
              <span>Screenshots must be submitted in the official Discord server's <span class="discord-highlight">#clips-and-highlights</span> channel.</span>
            </li>
            <li>
              <i class="fas fa-check-circle"></i>
              <span>Due to software limitations, only screenshots captured with the game language set to <span class="highlight">English</span> can be processed and indexed in the player records database.</span>
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