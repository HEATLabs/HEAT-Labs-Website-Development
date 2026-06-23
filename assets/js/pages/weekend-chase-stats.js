/* Event Stats Page */
class EventStats {
    constructor() {
        this.players = new Map();
        this.shardsLoaded = 0;
        this.totalShards = 0;
        this.isLoading = false;
        this.isDataLoaded = false;
        this.searchTimeout = null;
        this.charts = {};
        this.globalCharts = {};
        this.currentPlayerId = null;
        this.comparePlayerId = null;
        this.compareMode = 'none'; // 'none', 'global', 'player'
        this.globalStats = null;
        this.compareSearchTimeout = null;

        // DOM elements
        this.elements = {
            searchInput: document.getElementById('playerSearchInput'),
            clearSearchBtn: document.getElementById('clearSearchBtn'),
            suggestions: document.getElementById('searchSuggestions'),
            totalPlayers: document.getElementById('totalPlayersCount'),
            totalShards: document.getElementById('totalShardsCount'),
            loadingStatus: document.getElementById('loadingStatus'),
            playerProfile: document.getElementById('playerProfile'),
            noResults: document.getElementById('noResults'),
            loadingState: document.getElementById('loadingState'),
            initialState: document.getElementById('initialState'),
            loadingProgress: document.getElementById('loadingProgress'),
            loadingProgressBar: document.getElementById('loadingProgressBar'),
            loadingProgressLabel: document.getElementById('loadingProgressLabel'),
            loadingProgressPercent: document.getElementById('loadingProgressPercent'),
            globalStats: document.getElementById('globalStats'),
            globalCharts: document.getElementById('globalCharts'),
            compareNoneBtn: document.getElementById('compareNoneBtn'),
            compareGlobalBtn: document.getElementById('compareGlobalBtn'),
            comparePlayerBtn: document.getElementById('comparePlayerBtn'),
            comparePlayerInput: document.getElementById('comparePlayerInput'),
            comparePlayerSearch: document.getElementById('comparePlayerSearch'),
            comparePlayerBtnGo: document.getElementById('comparePlayerBtnGo'),
            comparisonStats: document.getElementById('comparisonStats'),
            comparisonStatsGrid: document.getElementById('comparisonStatsGrid'),
            compareSuggestions: document.getElementById('compareSuggestions'),
            tabGlobal: document.getElementById('tabGlobal'),
            tabPlayer: document.getElementById('tabPlayer'),
            tabContentGlobal: document.getElementById('tabContentGlobal'),
            tabContentPlayer: document.getElementById('tabContentPlayer'),
        };

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.showInitialState();
        await this.loadShardData();
        this.updateStats();
        this.calculateGlobalStats();
        this.renderGlobalStats();
        this.renderGlobalCharts();
        this.isDataLoaded = true;
        this.elements.loadingStatus.textContent = '\u2713 Data loaded';
    }

    setupEventListeners() {
        // Tab switching
        this.elements.tabGlobal.addEventListener('click', () => this.switchTab('global'));
        this.elements.tabPlayer.addEventListener('click', () => this.switchTab('player'));

        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.elements.clearSearchBtn.style.display = query ? 'block' : 'none';
            this.handleSearch(query);
        });

        // Clear search
        this.elements.clearSearchBtn.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.elements.clearSearchBtn.style.display = 'none';
            this.hideSuggestions();
            this.showInitialState();
            this.clearComparison();
        });

        // Close suggestions on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.stats-search-container')) {
                this.hideSuggestions();
            }
            if (!e.target.closest('.compare-input-wrapper')) {
                this.hideCompareSuggestions();
            }
        });

        // Enter key search
        this.elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    this.hideSuggestions();
                    this.searchPlayer(query);
                }
            }
        });

        // Comparison buttons
        this.elements.compareNoneBtn.addEventListener('click', () => {
            this.setCompareMode('none');
            this.elements.comparePlayerInput.style.display = 'none';
            if (this.currentPlayerId) {
                this.showPlayer(this.currentPlayerId);
            }
        });

        this.elements.compareGlobalBtn.addEventListener('click', () => {
            this.setCompareMode('global');
            this.elements.comparePlayerInput.style.display = 'none';
            if (this.currentPlayerId) {
                this.showPlayer(this.currentPlayerId);
            }
        });

        this.elements.comparePlayerBtn.addEventListener('click', () => {
            this.setCompareMode('player');
            this.elements.comparePlayerInput.style.display = 'flex';
            this.elements.comparePlayerSearch.focus();
            if (this.currentPlayerId) {
                this.showPlayer(this.currentPlayerId);
            }
        });

        // Compare player search with suggestions
        this.elements.comparePlayerSearch.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.handleCompareSearch(query);
        });

        this.elements.comparePlayerSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    this.hideCompareSuggestions();
                    this.findAndComparePlayer(query);
                }
            }
        });

        // Compare button
        this.elements.comparePlayerBtnGo.addEventListener('click', () => {
            const query = this.elements.comparePlayerSearch.value.trim();
            if (query) {
                this.hideCompareSuggestions();
                this.findAndComparePlayer(query);
            }
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.stats-tab').forEach(btn => btn.classList.remove('active'));
        if (tab === 'global') {
            this.elements.tabGlobal.classList.add('active');
            this.elements.tabContentGlobal.classList.add('active');
            this.elements.tabContentPlayer.classList.remove('active');
        } else {
            this.elements.tabPlayer.classList.add('active');
            this.elements.tabContentPlayer.classList.add('active');
            this.elements.tabContentGlobal.classList.remove('active');
        }
    }

    setCompareMode(mode) {
        this.compareMode = mode;
        document.querySelectorAll('.comparison-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    handleCompareSearch(query) {
        clearTimeout(this.compareSearchTimeout);

        if (query.length < 2) {
            this.hideCompareSuggestions();
            return;
        }

        this.compareSearchTimeout = setTimeout(() => {
            const suggestions = this.getSuggestions(query);
            this.showCompareSuggestions(suggestions, query);
        }, 200);
    }

    showCompareSuggestions(suggestions, query) {
        const container = this.elements.compareSuggestions;
        if (!suggestions.length) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <div class="suggestions-header">
                <span>${suggestions.length} players found</span>
                <small>Click to select</small>
            </div>
            ${suggestions.map(p => `
                <div class="suggestion-item" data-player-id="${p.id}">
                    <div class="suggestion-name">${this.highlightMatch(p.nickname, query)}</div>
                    <div class="suggestion-stats">
                        <span><i class="fas fa-bolt"></i> ${this.formatNumber(p.damage)}</span>
                        <span><i class="fas fa-crosshairs"></i> ${p.battles}</span>
                        <span>${p.qualified ? '<i class="fas fa-check-circle" style="color:#2ecc71;"></i>' : '<i class="fas fa-times-circle" style="color:#e74c3c;"></i>'}</span>
                    </div>
                </div>
            `).join('')}
        `;

        container.style.display = 'block';

        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const playerId = item.dataset.playerId;
                const player = this.players.get(playerId);
                if (player && playerId !== this.currentPlayerId) {
                    this.elements.comparePlayerSearch.value = player.nickname || playerId;
                    this.hideCompareSuggestions();
                    this.comparePlayerId = playerId;
                    this.showPlayer(this.currentPlayerId);
                } else if (player && playerId === this.currentPlayerId) {
                    this.showToast('Cannot compare a player with themselves. Please search for a different player.', 'warning');
                    this.hideCompareSuggestions();
                }
            });
        });
    }

    hideCompareSuggestions() {
        if (this.elements.compareSuggestions) {
            this.elements.compareSuggestions.style.display = 'none';
        }
    }

    findAndComparePlayer(query) {
        const lowerQuery = query.toLowerCase();
        let matchedPlayer = null;
        let matchedKey = null;

        for (const [key, player] of this.players) {
            const nickname = (player.nickname || key).toLowerCase();
            if (key === lowerQuery || nickname === lowerQuery || nickname.includes(lowerQuery) || key.includes(lowerQuery)) {
                matchedPlayer = player;
                matchedKey = key;
                break;
            }
        }

        if (matchedPlayer && matchedKey !== this.currentPlayerId) {
            this.comparePlayerId = matchedKey;
            this.showPlayer(this.currentPlayerId);
        } else if (matchedPlayer && matchedKey === this.currentPlayerId) {
            this.showToast('Cannot compare a player with themselves. Please search for a different player.', 'warning');
        } else {
            this.showToast('Player not found. Please try a different search.', 'error');
        }
    }

    clearComparison() {
        this.comparePlayerId = null;
        this.compareMode = 'none';
        this.elements.comparePlayerSearch.value = '';
        this.elements.comparisonStats.style.display = 'none';
        document.querySelectorAll('.comparison-toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === 'none');
        });
        this.elements.comparePlayerInput.style.display = 'none';
        this.hideCompareSuggestions();
    }

    async loadShardData() {
        try {
            this.showLoading('Loading shard data...');
            this.elements.loadingProgress.style.display = 'block';
            this.elements.loadingProgressLabel.textContent = 'Loading shard list...';
            this.elements.loadingProgressPercent.textContent = '0%';
            this.elements.loadingProgressBar.style.width = '0%';

            // Load the shard list
            const shardListResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/event-data.json');
            const shardUrls = await shardListResponse.json();
            this.totalShards = shardUrls.length;

            // Load shards in batches to avoid overwhelming the browser
            const batchSize = 10;
            let loadedCount = 0;

            for (let i = 0; i < shardUrls.length; i += batchSize) {
                const batch = shardUrls.slice(i, i + batchSize);
                await Promise.all(batch.map(url => this.loadShard(url)));
                loadedCount = Math.min(i + batchSize, this.totalShards);
                this.shardsLoaded = loadedCount;

                // Update progress
                const percent = Math.round((loadedCount / this.totalShards) * 100);
                this.elements.loadingProgressBar.style.width = `${percent}%`;
                this.elements.loadingProgressPercent.textContent = `${percent}%`;
                this.elements.loadingProgressLabel.textContent = `Loading shard ${loadedCount}/${this.totalShards}...`;

                this.updateStats();
            }

            this.elements.loadingProgress.style.display = 'none';
            this.hideLoading();
            this.showInitialState();

            console.log(`Loaded ${this.players.size} players from ${this.shardsLoaded} shards`);

        } catch (error) {
            console.error('Error loading shard data:', error);
            this.elements.loadingProgress.style.display = 'none';
            this.showError('Failed to load event data. Please refresh the page.');
        }
    }

    async loadShard(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (data.players) {
                for (const [id, playerData] of Object.entries(data.players)) {
                    const playerKey = id.toLowerCase();
                    if (!this.players.has(playerKey)) {
                        this.players.set(playerKey, {
                            id,
                            ...playerData
                        });
                    }
                }
            }
        } catch (error) {
            console.warn(`Failed to load shard: ${url}`, error);
        }
    }

    handleSearch(query) {
        clearTimeout(this.searchTimeout);

        if (!this.isDataLoaded) {
            this.elements.loadingStatus.textContent = '\u23f3 Loading data...';
            return;
        }

        if (query.length < 2) {
            this.hideSuggestions();
            if (!query) {
                this.showInitialState();
                this.clearComparison();
            }
            return;
        }

        this.searchTimeout = setTimeout(() => {
            const suggestions = this.getSuggestions(query);
            this.showSuggestions(suggestions, query);
        }, 200);
    }

    getSuggestions(query) {
        const lowerQuery = query.toLowerCase();
        const results = [];

        for (const [key, player] of this.players) {
            const nickname = player.nickname || key;
            if (nickname.toLowerCase().includes(lowerQuery) || key.includes(lowerQuery)) {
                results.push({
                    id: key,
                    nickname: nickname,
                    damage: player.damage || 0,
                    battles: player.battles || 0,
                    qualified: player.qualified || false,
                });
            }
            if (results.length >= 20) break;
        }

        return results;
    }

    showSuggestions(suggestions, query) {
        const container = this.elements.suggestions;
        if (!suggestions.length) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = `
            <div class="suggestions-header">
                <span>${suggestions.length} players found</span>
                <small>Press Enter to see all results</small>
            </div>
            ${suggestions.map(p => `
                <div class="suggestion-item" data-player-id="${p.id}">
                    <div class="suggestion-name">${this.highlightMatch(p.nickname, query)}</div>
                    <div class="suggestion-stats">
                        <span><i class="fas fa-bolt"></i> ${this.formatNumber(p.damage)}</span>
                        <span><i class="fas fa-crosshairs"></i> ${p.battles}</span>
                        <span>${p.qualified ? '<i class="fas fa-check-circle" style="color:#2ecc71;"></i>' : '<i class="fas fa-times-circle" style="color:#e74c3c;"></i>'}</span>
                    </div>
                </div>
            `).join('')}
        `;

        container.style.display = 'block';

        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const playerId = item.dataset.playerId;
                const player = this.players.get(playerId);
                if (player) {
                    this.elements.searchInput.value = player.nickname || playerId;
                    this.hideSuggestions();
                    this.currentPlayerId = playerId;
                    this.showPlayer(playerId);
                    // Switch to player tab
                    this.switchTab('player');
                }
            });
        });
    }

    hideSuggestions() {
        this.elements.suggestions.style.display = 'none';
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    searchPlayer(query) {
        if (!this.isDataLoaded) {
            this.elements.loadingStatus.textContent = '\u23f3 Please wait for data to load...';
            return;
        }

        const lowerQuery = query.toLowerCase();
        let matchedPlayer = null;
        let matchedKey = null;

        for (const [key, player] of this.players) {
            const nickname = (player.nickname || key).toLowerCase();
            if (key === lowerQuery || nickname === lowerQuery) {
                matchedPlayer = player;
                matchedKey = key;
                break;
            }
        }

        if (!matchedPlayer) {
            for (const [key, player] of this.players) {
                const nickname = (player.nickname || key).toLowerCase();
                if (nickname.includes(lowerQuery) || key.includes(lowerQuery)) {
                    matchedPlayer = player;
                    matchedKey = key;
                    break;
                }
            }
        }

        if (matchedPlayer) {
            this.currentPlayerId = matchedKey;
            this.showPlayer(matchedKey);
            this.switchTab('player');
        } else {
            this.showNoResults();
        }
    }

    showPlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) {
            this.showNoResults();
            return;
        }

        this.hideLoading();
        this.hideNoResults();
        this.elements.initialState.style.display = 'none';
        this.elements.playerProfile.style.display = 'block';

        this.renderPlayerProfile(player, playerId);
        this.renderHistory(player);
        this.renderCharts(player);

        // Show comparison stats if in comparison mode
        if (this.compareMode === 'global') {
            this.renderGlobalComparison(player);
        } else if (this.compareMode === 'player' && this.comparePlayerId) {
            const comparePlayer = this.players.get(this.comparePlayerId);
            if (comparePlayer) {
                this.renderPlayerComparison(player, comparePlayer);
            } else {
                this.elements.comparisonStats.style.display = 'none';
            }
        } else {
            this.elements.comparisonStats.style.display = 'none';
        }

        // Scroll to profile
        this.elements.playerProfile.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    renderPlayerProfile(player, playerId) {
        const damage = player.damage || 0;
        const battles = player.battles || 0;
        const wins = player.wins || 0;
        const frags = player.frags || 0;
        const qualified = player.qualified || false;
        const percentile = player.damage_percentile || null;
        const nickname = player.nickname || playerId;

        document.getElementById('playerNickname').textContent = nickname;

        document.getElementById('qualifiedBadge').textContent = qualified ? 'Qualified' : 'Not Qualified';
        document.getElementById('qualifiedBadge').className = `badge ${qualified ? 'badge-qualified' : 'badge-unqualified'}`;

        document.getElementById('percentileBadge').textContent = percentile !== null ? `Top ${percentile}%` : 'N/A';
        document.getElementById('percentileBadge').style.display = percentile !== null ? 'inline-flex' : 'none';

        document.getElementById('totalDamage').textContent = this.formatNumber(damage);
        document.getElementById('totalBattles').textContent = battles;
        document.getElementById('totalWins').textContent = wins;
        document.getElementById('totalFrags').textContent = frags;

        const winRate = battles > 0 ? (wins / battles) * 100 : 0;
        document.getElementById('winRateDisplay').textContent = `${winRate.toFixed(1)}%`;
        document.getElementById('winRateBar').style.width = `${Math.min(winRate, 100)}%`;
        document.getElementById('winsDisplay').textContent = wins;
        document.getElementById('battlesDisplay').textContent = battles;

        document.getElementById('damagePerBattle').textContent = battles > 0 ? Math.round(damage / battles) : 0;
        document.getElementById('fragsPerBattle').textContent = battles > 0 ? (frags / battles).toFixed(2) : 0;
        document.getElementById('damagePercentileDisplay').textContent = percentile !== null ? `Top ${percentile}%` : 'N/A';
        document.getElementById('qualificationStatus').textContent = qualified ? 'Qualified' : 'Not Qualified';
        document.getElementById('qualificationStatus').className = `stat-row-value ${qualified ? 'text-success' : 'text-danger'}`;
    }

    renderHistory(player) {
        const tbody = document.getElementById('historyTableBody');
        const history = player.history || [];

        if (!history.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">No history data available</td></tr>`;
            return;
        }

        tbody.innerHTML = history
            .sort((a, b) => a.day_index - b.day_index)
            .map(day => {
                const winRate = day.battles > 0 ? (day.wins / day.battles * 100).toFixed(1) : 0;
                return `
                    <tr>
                        <td>Window ${day.day_index}</td>
                        <td>${day.rank ? `#${day.rank}` : 'N/A'}</td>
                        <td>${day.battles}</td>
                        <td>${day.wins}</td>
                        <td>${winRate}%</td>
                        <td>${this.formatNumber(day.damage)}</td>
                    </tr>
                `;
            }).join('');
    }

    renderCharts(player) {
        const history = (player.history || []).sort((a, b) => a.day_index - b.day_index);

        if (!history.length) {
            this.clearCharts();
            return;
        }

        // Destroy existing charts
        this.destroyCharts();

        const days = history.map(d => `Window ${d.day_index}`);
        const damages = history.map(d => d.damage);
        const battles = history.map(d => d.battles);
        const wins = history.map(d => d.wins);
        const winRates = history.map(d => d.battles > 0 ? (d.wins / d.battles * 100) : 0);

        let cumulative = 0;
        const cumulativeDamage = history.map(d => {
            cumulative += d.damage;
            return cumulative;
        });

        // Get comparison data if in comparison mode
        let compareDamages = null;
        let compareBattles = null;
        let compareWinRates = null;
        let compareDays = null;

        if (this.compareMode === 'player' && this.comparePlayerId) {
            const comparePlayer = this.players.get(this.comparePlayerId);
            if (comparePlayer && comparePlayer.history) {
                const compareHistory = comparePlayer.history.sort((a, b) => a.day_index - b.day_index);
                compareDays = compareHistory.map(d => `Window ${d.day_index}`);
                compareDamages = compareHistory.map(d => d.damage);
                compareBattles = compareHistory.map(d => d.battles);
                compareWinRates = compareHistory.map(d => d.battles > 0 ? (d.wins / d.battles * 100) : 0);
            }
        } else if (this.compareMode === 'global' && this.globalStats) {
            // Calculate per-window global averages
            const allHistories = [];
            for (const [key, p] of this.players) {
                if (p.history) {
                    allHistories.push(p.history);
                }
            }

            // Find max window index
            let maxWindow = 0;
            for (const h of allHistories) {
                for (const day of h) {
                    if (day.day_index > maxWindow) maxWindow = day.day_index;
                }
            }

            // Calculate per-window averages
            const windowAverages = [];
            for (let i = 0; i <= maxWindow; i++) {
                let totalDamage = 0;
                let totalBattles = 0;
                let totalWins = 0;
                let count = 0;
                for (const h of allHistories) {
                    const day = h.find(d => d.day_index === i);
                    if (day) {
                        totalDamage += day.damage || 0;
                        totalBattles += day.battles || 0;
                        totalWins += day.wins || 0;
                        count++;
                    }
                }
                windowAverages.push({
                    damage: count > 0 ? totalDamage / count : 0,
                    battles: count > 0 ? totalBattles / count : 0,
                    winRate: count > 0 ? (totalWins / totalBattles * 100) || 0 : 0,
                });
            }

            // Map window averages to the days of this player
            compareDamages = days.map((_, idx) => {
                const dayIndex = history[idx].day_index;
                return windowAverages[dayIndex] ? windowAverages[dayIndex].damage : 0;
            });
            compareBattles = days.map((_, idx) => {
                const dayIndex = history[idx].day_index;
                return windowAverages[dayIndex] ? windowAverages[dayIndex].battles : 0;
            });
            compareWinRates = days.map((_, idx) => {
                const dayIndex = history[idx].day_index;
                return windowAverages[dayIndex] ? windowAverages[dayIndex].winRate : 0;
            });
        }

        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999';

        // Daily History Chart
        const ctx1 = document.getElementById('dailyHistoryChart').getContext('2d');
        const dailyDatasets = [{
            label: 'Damage',
            data: damages,
            backgroundColor: 'rgba(255, 131, 0, 0.7)',
            borderColor: 'rgba(255, 131, 0, 1)',
            borderWidth: 2,
            borderRadius: 4,
        }];

        if (compareDamages) {
            dailyDatasets.push({
                label: this.compareMode === 'player' ? 'Compare Damage' : 'Global Avg Damage',
                data: compareDamages,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 2,
                borderRadius: 4,
            });
        }

        this.charts.dailyHistory = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: days,
                datasets: dailyDatasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                        }
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
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // Damage Progression Chart
        const ctx2 = document.getElementById('damageProgressionChart').getContext('2d');
        const progressionDatasets = [{
            label: 'Total Damage (Cumulative)',
            data: cumulativeDamage,
            borderColor: 'rgba(255, 131, 0, 1)',
            backgroundColor: 'rgba(255, 131, 0, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255, 131, 0, 1)',
            pointRadius: 4,
        }, {
            label: 'Battles',
            data: battles,
            borderColor: 'rgba(52, 152, 219, 1)',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(52, 152, 219, 1)',
            pointRadius: 4,
            yAxisID: 'y1',
        }];

        if (compareDamages) {
            let compareCumulative = 0;
            const compareCumulativeData = compareDamages.map(d => {
                compareCumulative += d;
                return compareCumulative;
            });
            progressionDatasets.push({
                label: this.compareMode === 'player' ? 'Compare Cumulative' : 'Global Avg Cumulative',
                data: compareCumulativeData,
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(46, 204, 113, 1)',
                pointRadius: 4,
                borderDash: [5, 5],
            });
        }

        this.charts.damageProgression = new Chart(ctx2, {
            type: 'line',
            data: {
                labels: days,
                datasets: progressionDatasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        ticks: {
                            color: secondaryColor,
                            callback: (value) => this.formatNumber(value),
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        ticks: {
                            color: secondaryColor,
                        },
                        grid: {
                            display: false,
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                            maxTicksLimit: 10,
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // Win Rate Trend Chart
        const ctx3 = document.getElementById('winRateTrendChart').getContext('2d');
        const winRateDatasets = [{
            label: 'Win Rate %',
            data: winRates,
            borderColor: 'rgba(46, 204, 113, 1)',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(46, 204, 113, 1)',
            pointRadius: 4,
        }];

        if (compareWinRates) {
            winRateDatasets.push({
                label: this.compareMode === 'player' ? 'Compare Win Rate' : 'Global Avg Win Rate',
                data: compareWinRates,
                borderColor: 'rgba(231, 76, 60, 1)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                pointRadius: 4,
                borderDash: [5, 5],
            });
        }

        this.charts.winRateTrend = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: days,
                datasets: winRateDatasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: secondaryColor,
                            callback: (value) => `${value}%`,
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                            maxTicksLimit: 10,
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // Damage Efficiency Chart (Damage per Battle per window)
        const ctx4 = document.getElementById('damageEfficiencyChart').getContext('2d');
        const efficiency = history.map(d => d.battles > 0 ? Math.round(d.damage / d.battles) : 0);
        const compareEfficiency = compareDamages && compareBattles ?
            compareDamages.map((d, i) => compareBattles[i] > 0 ? Math.round(d / compareBattles[i]) : 0) : null;

        const efficiencyDatasets = [{
            label: 'Damage per Battle',
            data: efficiency,
            borderColor: 'rgba(155, 89, 182, 1)',
            backgroundColor: 'rgba(155, 89, 182, 0.3)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(155, 89, 182, 1)',
            pointRadius: 4,
        }];

        if (compareEfficiency) {
            efficiencyDatasets.push({
                label: this.compareMode === 'player' ? 'Compare DpB' : 'Global Avg DpB',
                data: compareEfficiency,
                borderColor: 'rgba(241, 196, 15, 1)',
                backgroundColor: 'rgba(241, 196, 15, 0.2)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(241, 196, 15, 1)',
                pointRadius: 4,
                borderDash: [5, 5],
            });
        }

        this.charts.damageEfficiency = new Chart(ctx4, {
            type: 'line',
            data: {
                labels: days,
                datasets: efficiencyDatasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                        }
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
                            maxTicksLimit: 10,
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });
    }

    clearCharts() {
        this.destroyCharts();
        document.querySelectorAll('.chart-container canvas').forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#666';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
        });
    }

    destroyCharts() {
        if (this.charts.dailyHistory) {
            this.charts.dailyHistory.destroy();
            delete this.charts.dailyHistory;
        }
        if (this.charts.damageProgression) {
            this.charts.damageProgression.destroy();
            delete this.charts.damageProgression;
        }
        if (this.charts.winRateTrend) {
            this.charts.winRateTrend.destroy();
            delete this.charts.winRateTrend;
        }
        if (this.charts.damageEfficiency) {
            this.charts.damageEfficiency.destroy();
            delete this.charts.damageEfficiency;
        }
    }

    renderGlobalComparison(player) {
        if (!this.globalStats) return;

        const stats = this.globalStats;
        const damage = player.damage || 0;
        const battles = player.battles || 0;
        const wins = player.wins || 0;
        const frags = player.frags || 0;
        const winRate = battles > 0 ? (wins / battles * 100) : 0;

        const comparisonData = [
            { label: 'Total Damage', playerVal: damage, globalVal: stats.avgDamage || 0, format: 'number' },
            { label: 'Battles', playerVal: battles, globalVal: stats.avgBattles || 0, format: 'number' },
            { label: 'Frags', playerVal: frags, globalVal: stats.avgFrags || 0, format: 'number' },
            { label: 'Win Rate', playerVal: winRate, globalVal: stats.avgWinRate || 0, format: 'percent' },
            { label: 'Damage per Battle', playerVal: battles > 0 ? Math.round(damage / battles) : 0, globalVal: stats.avgDamagePerBattle || 0, format: 'number' },
        ];

        this.renderComparisonStats(comparisonData, 'Global Average');
    }

    renderPlayerComparison(player, comparePlayer) {
        const damage = player.damage || 0;
        const battles = player.battles || 0;
        const wins = player.wins || 0;
        const frags = player.frags || 0;
        const winRate = battles > 0 ? (wins / battles * 100) : 0;

        const cDamage = comparePlayer.damage || 0;
        const cBattles = comparePlayer.battles || 0;
        const cWins = comparePlayer.wins || 0;
        const cFrags = comparePlayer.frags || 0;
        const cWinRate = cBattles > 0 ? (cWins / cBattles * 100) : 0;

        const compareName = comparePlayer.nickname || this.comparePlayerId;

        const comparisonData = [
            { label: 'Total Damage', playerVal: damage, globalVal: cDamage, format: 'number' },
            { label: 'Battles', playerVal: battles, globalVal: cBattles, format: 'number' },
            { label: 'Frags', playerVal: frags, globalVal: cFrags, format: 'number' },
            { label: 'Win Rate', playerVal: winRate, globalVal: cWinRate, format: 'percent' },
            { label: 'Damage per Battle', playerVal: battles > 0 ? Math.round(damage / battles) : 0, globalVal: cBattles > 0 ? Math.round(cDamage / cBattles) : 0, format: 'number' },
        ];

        this.renderComparisonStats(comparisonData, compareName);
    }

    renderComparisonStats(data, compareLabel) {
        const grid = this.elements.comparisonStatsGrid;
        this.elements.comparisonStats.style.display = 'block';

        grid.innerHTML = data.map(item => {
            const diff = item.playerVal - item.globalVal;
            const diffPercent = item.globalVal !== 0 ? (diff / item.globalVal * 100) : 0;
            const diffClass = Math.abs(diffPercent) < 1 ? 'neutral' : (diffPercent > 0 ? 'positive' : 'negative');
            const diffSign = diffPercent > 0 ? '+' : '';

            let playerDisplay = item.format === 'percent' ? `${item.playerVal.toFixed(1)}%` : this.formatNumber(Math.round(item.playerVal));
            let globalDisplay = item.format === 'percent' ? `${item.globalVal.toFixed(1)}%` : this.formatNumber(Math.round(item.globalVal));
            let diffDisplay = Math.abs(diffPercent) < 1 ? '\u2248 Equal' : `${diffSign}${diffPercent.toFixed(1)}%`;

            return `
                <div class="comparison-stat-card">
                    <div class="stat-label">${item.label}</div>
                    <div class="stat-values">
                        <span class="player-value">${playerDisplay}</span>
                        <span class="vs">vs</span>
                        <span class="compare-value">${globalDisplay}</span>
                    </div>
                    <div class="stat-diff ${diffClass}">${diffDisplay}</div>
                </div>
            `;
        }).join('');
    }

    calculateGlobalStats() {
        let totalPlayers = this.players.size;
        let qualified = 0;
        let totalDamage = 0;
        let totalBattles = 0;
        let totalFrags = 0;
        let totalWins = 0;
        let damageDistribution = [];
        let winRates = [];

        for (const [key, player] of this.players) {
            if (player.qualified) qualified++;
            totalDamage += player.damage || 0;
            totalBattles += player.battles || 0;
            totalFrags += player.frags || 0;
            totalWins += player.wins || 0;

            const winRate = player.battles > 0 ? (player.wins / player.battles * 100) : 0;
            winRates.push(winRate);

            damageDistribution.push(player.damage || 0);
        }

        const avgDamage = totalPlayers > 0 ? totalDamage / totalPlayers : 0;
        const avgBattles = totalPlayers > 0 ? totalBattles / totalPlayers : 0;
        const avgFrags = totalPlayers > 0 ? totalFrags / totalPlayers : 0;
        const avgWinRate = totalPlayers > 0 ? winRates.reduce((a, b) => a + b, 0) / totalPlayers : 0;
        const qualificationRate = totalPlayers > 0 ? (qualified / totalPlayers * 100) : 0;

        this.globalStats = {
            totalPlayers,
            qualified,
            notQualified: totalPlayers - qualified,
            avgDamage,
            avgBattles,
            avgFrags,
            avgWinRate,
            qualificationRate,
            avgDamagePerBattle: avgBattles > 0 ? avgDamage / avgBattles : 0,
            damageDistribution,
            winRates,
        };
    }

    renderGlobalStats() {
        if (!this.globalStats) return;

        document.getElementById('globalTotalPlayers').textContent = this.formatNumber(this.globalStats.totalPlayers);
        document.getElementById('globalQualified').textContent = this.formatNumber(this.globalStats.qualified);
        document.getElementById('globalNotQualified').textContent = this.formatNumber(this.globalStats.notQualified);
        document.getElementById('globalAvgDamage').textContent = this.formatNumber(Math.round(this.globalStats.avgDamage));
        document.getElementById('globalAvgBattles').textContent = this.globalStats.avgBattles.toFixed(1);
        document.getElementById('globalAvgFrags').textContent = this.globalStats.avgFrags.toFixed(1);
        document.getElementById('globalAvgWinRate').textContent = `${this.globalStats.avgWinRate.toFixed(1)}%`;
        document.getElementById('globalQualificationRate').textContent = `${this.globalStats.qualificationRate.toFixed(1)}%`;
    }

    renderGlobalCharts() {
        if (!this.globalStats) return;

        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff';
        const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999';

        // Destroy existing global charts
        if (this.globalCharts.damage) {
            this.globalCharts.damage.destroy();
        }
        if (this.globalCharts.qualification) {
            this.globalCharts.qualification.destroy();
        }
        if (this.globalCharts.winRate) {
            this.globalCharts.winRate.destroy();
        }
        if (this.globalCharts.battlesDamage) {
            this.globalCharts.battlesDamage.destroy();
        }

        // Damage Distribution Chart - Use logarithmic bins for better readability
        const damageData = this.globalStats.damageDistribution;

        // Create logarithmic bins
        const bins = 8;
        const maxDamage = Math.max(...damageData, 1);
        const minDamage = Math.min(...damageData.filter(d => d > 0), 1);

        // Create logarithmic bin edges
        const logMin = Math.log10(minDamage);
        const logMax = Math.log10(maxDamage);
        const logStep = (logMax - logMin) / bins;

        const binEdges = [];
        for (let i = 0; i <= bins; i++) {
            binEdges.push(Math.pow(10, logMin + i * logStep));
        }

        const histogram = Array(bins).fill(0);

        damageData.forEach(d => {
            if (d === 0) {
                // Put zero damage in the first bin
                histogram[0]++;
                return;
            }
            for (let i = 0; i < bins; i++) {
                if (d >= binEdges[i] && d < binEdges[i + 1]) {
                    histogram[i]++;
                    break;
                }
                if (i === bins - 1 && d >= binEdges[i]) {
                    histogram[i]++;
                }
            }
        });

        // Create readable labels for logarithmic bins
        const labels = histogram.map((_, i) => {
            const start = Math.round(binEdges[i]);
            const end = Math.round(binEdges[i + 1]);
            if (i === 0) {
                return `0-${this.formatNumber(end)}`;
            }
            if (i === bins - 1) {
                return `${this.formatNumber(start)}+`;
            }
            return `${this.formatNumber(start)}-${this.formatNumber(end)}`;
        });

        const ctx1 = document.getElementById('globalDamageChart').getContext('2d');
        this.globalCharts.damage = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Players',
                    data: histogram,
                    backgroundColor: 'rgba(255, 131, 0, 0.7)',
                    borderColor: 'rgba(255, 131, 0, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
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
                            font: { size: 8 },
                            maxRotation: 45,
                            minRotation: 45,
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // Qualification Status Chart (Doughnut)
        const ctx2 = document.getElementById('globalQualificationChart').getContext('2d');
        this.globalCharts.qualification = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Qualified', 'Not Qualified'],
                datasets: [{
                    data: [this.globalStats.qualified, this.globalStats.notQualified],
                    backgroundColor: ['#2ecc71', '#e74c3c'],
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
                        }
                    }
                }
            }
        });

        // Win Rate Distribution
        const winRateData = this.globalStats.winRates;
        const wrBins = 20;
        const wrHistogram = Array(wrBins).fill(0);

        winRateData.forEach(wr => {
            const binIndex = Math.min(Math.floor(wr / (100 / wrBins)), wrBins - 1);
            wrHistogram[binIndex]++;
        });

        const wrLabels = wrHistogram.map((_, i) => {
            const start = Math.round(i * (100 / wrBins));
            const end = Math.round((i + 1) * (100 / wrBins));
            return `${start}-${end}%`;
        });

        const ctx3 = document.getElementById('globalWinRateChart').getContext('2d');
        this.globalCharts.winRate = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: wrLabels,
                datasets: [{
                    label: 'Players',
                    data: wrHistogram,
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
                            font: { size: 8 },
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // Battles vs Damage Scatter
        const sampleSize = Math.min(500, this.players.size);
        const sampledPlayers = Array.from(this.players.values()).slice(0, sampleSize);
        const scatterData = sampledPlayers.map(p => ({
            x: p.battles || 0,
            y: p.damage || 0,
        }));

        const ctx4 = document.getElementById('globalBattlesDamageChart').getContext('2d');
        this.globalCharts.battlesDamage = new Chart(ctx4, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Players',
                    data: scatterData,
                    backgroundColor: 'rgba(255, 131, 0, 0.6)',
                    borderColor: 'rgba(255, 131, 0, 0.8)',
                    pointRadius: 3,
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
                    x: {
                        title: {
                            display: true,
                            text: 'Battles',
                            color: secondaryColor,
                        },
                        ticks: {
                            color: secondaryColor,
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Total Damage',
                            color: secondaryColor,
                        },
                        ticks: {
                            color: secondaryColor,
                            callback: (value) => this.formatNumber(value),
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)',
                        }
                    }
                }
            }
        });
    }

    // Toast notification system
    showToast(message, type = 'info') {
        // Check if toast container exists, create if not
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

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Set icon based on type
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

        // Auto dismiss after 3 seconds
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

    showInitialState() {
        this.elements.playerProfile.style.display = 'none';
        this.elements.noResults.style.display = 'none';
        this.elements.initialState.style.display = 'block';
        // Show global stats tab content
        this.switchTab('global');
        this.elements.globalStats.style.display = 'block';
        this.elements.globalCharts.style.display = 'block';
    }

    showNoResults() {
        this.elements.playerProfile.style.display = 'none';
        this.elements.initialState.style.display = 'none';
        this.elements.noResults.style.display = 'block';
    }

    hideNoResults() {
        this.elements.noResults.style.display = 'none';
    }

    showLoading(message = 'Loading...') {
        this.elements.loadingState.style.display = 'block';
        this.elements.loadingState.querySelector('p').textContent = message;
        this.elements.playerProfile.style.display = 'none';
        this.elements.noResults.style.display = 'none';
        this.elements.initialState.style.display = 'none';
        this.elements.loadingStatus.textContent = '\u23f3 Loading...';
    }

    hideLoading() {
        this.elements.loadingState.style.display = 'none';
        this.elements.loadingStatus.textContent = '\u2713 Data loaded';
    }

    showError(message) {
        this.elements.loadingState.style.display = 'block';
        this.elements.loadingState.querySelector('p').textContent = '\u26a0\ufe0f ' + message;
        this.elements.loadingState.querySelector('p').style.color = '#e74c3c';
        this.elements.loadingStatus.textContent = '\u274c Error';
    }

    updateStats() {
        document.getElementById('totalPlayersCount').textContent = this.formatNumber(this.players.size);
        document.getElementById('totalShardsCount').textContent = this.shardsLoaded;
    }

    formatNumber(num) {
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
`;
document.head.appendChild(toastStyles);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined') {
        new EventStats();
    }
});