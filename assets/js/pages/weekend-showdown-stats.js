/**
 * Weekend Showdown Stats Page
 * Fetches and displays leaderboard data from the event API
 */

class WeekendShowdownStats {
    constructor() {
        // Core state
        this.meta = null;
        this.shardData = new Map(); // bucket -> data
        this.playerCache = new Map(); // normalizedNick -> placements
        this.shardsLoaded = 0;
        this.totalShards = 0;
        this.isLoading = false;
        this.isDataLoaded = false;

        // Navigation state
        this.navState = {
            day: null,
            vehicle: null,
            sortByAgent: true
        };

        // Search state
        this.searchTimeout = null;
        this.searchResults = [];
        this.currentSearchQuery = '';

        // Countdown timer
        this.countdownTimer = null;

        // Constants
        this.DATA_BASE = '/events/weekend-showdown-2026-07-10/data';
        this.STALE_AFTER_MS = 2 * 60 * 60 * 1000;

        // DOM elements
        this.elements = {
            // Loading
            loadingProgress: document.getElementById('loadingProgress'),
            loadingProgressBar: document.getElementById('loadingProgressBar'),
            loadingProgressLabel: document.getElementById('loadingProgressLabel'),
            loadingProgressPercent: document.getElementById('loadingProgressPercent'),
            loadingStatus: document.getElementById('loadingStatus'),

            // Event info
            eventTitle: document.getElementById('eventTitle'),
            eventStatus: document.getElementById('eventStatus'),
            eventCountdown: document.getElementById('eventCountdown'),
            nextUpdate: document.getElementById('nextUpdate'),
            eventInfoBanner: document.getElementById('eventInfoBanner'),

            // Selectors
            daySelector: document.getElementById('daySelector'),
            vehicleSelector: document.getElementById('vehicleSelector'),
            vehicleSortToggle: document.getElementById('vehicleSortToggle'),

            // Search
            searchInput: document.getElementById('playerSearchInput'),
            clearSearchBtn: document.getElementById('clearSearchBtn'),
            suggestions: document.getElementById('searchSuggestions'),
            totalPlayers: document.getElementById('totalPlayersCount'),
            totalShards: document.getElementById('totalShardsCount'),

            // Board
            boardContainer: document.getElementById('boardContainer'),
            boardTitle: document.getElementById('boardTitle'),
            boardMetric: document.getElementById('boardMetric'),
            boardCount: document.getElementById('boardCount'),
            boardContent: document.getElementById('boardContent'),

            // Rewards
            rewardsTable: document.getElementById('rewardsTable'),

            // States
            searchResults: document.getElementById('searchResults'),
            searchResultsContent: document.getElementById('searchResultsContent'),
            closeSearchResults: document.getElementById('closeSearchResults'),
            noResults: document.getElementById('noResults'),
            loadingState: document.getElementById('loadingState'),
            initialState: document.getElementById('initialState'),
        };

        this.init();
    }

    // ──────────────────────────────────────────────────────────────
    // Initialization
    // ──────────────────────────────────────────────────────────────

    async init() {
        this.setupEventListeners();
        this.showInitialState();
        await this.loadEventData();
    }

    setupEventListeners() {
        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.elements.clearSearchBtn.style.display = query ? 'block' : 'none';
            this.handleSearch(query);
        });

        this.elements.clearSearchBtn.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.elements.clearSearchBtn.style.display = 'none';
            this.hideSuggestions();
            this.clearSearchResults();
        });

        this.elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    this.hideSuggestions();
                    this.performSearch(query);
                }
            }
        });

        // Close suggestions on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.stats-search-container')) {
                this.hideSuggestions();
            }
        });

        // Vehicle sort toggle
        this.elements.vehicleSortToggle.addEventListener('click', () => {
            this.navState.sortByAgent = !this.navState.sortByAgent;
            this.elements.vehicleSortToggle.innerHTML = this.navState.sortByAgent
                ? '<i class="fas fa-sort-alpha-down"></i>'
                : '<i class="fas fa-sort-alpha-up"></i>';
            if (this.meta) {
                this.buildVehicleList(this.meta);
                this.updateBoard(this.meta);
            }
        });

        // Close search results
        this.elements.closeSearchResults.addEventListener('click', () => {
            this.clearSearchResults();
        });
    }

    // ──────────────────────────────────────────────────────────────
    // Data Loading
    // ──────────────────────────────────────────────────────────────

    async loadEventData() {
        try {
            this.showLoading('Loading event data...');
            this.elements.loadingProgress.style.display = 'block';
            this.elements.loadingProgressLabel.textContent = 'Loading meta data...';
            this.elements.loadingProgressPercent.textContent = '0%';
            this.elements.loadingProgressBar.style.width = '0%';

            // Load meta data
            const metaUrl = this.DATA_BASE + '/meta.json';
            const metaResponse = await fetch(metaUrl);
            if (!metaResponse.ok) throw new Error(`HTTP ${metaResponse.status}`);
            this.meta = await metaResponse.json();

            // Validate contract version
            const majorVersion = String(this.meta.contract_version || '').split('.')[0];
            if (majorVersion !== '2') {
                throw new Error('Unsupported contract version: ' + this.meta.contract_version);
            }

            // Set initial navigation
            this.navState.day = this.pickDefaultDay(this.meta);
            const displayVehicles = this.getVehicleDisplayOrder(this.meta);
            this.navState.vehicle = displayVehicles.length > 0 ? displayVehicles[0].id : null;

            // Build UI
            this.renderEventInfo(this.meta);
            this.buildDayTabs(this.meta);
            this.buildVehicleList(this.meta);
            this.buildRewardsTable(this.meta);

            // Load shards for search
            this.totalShards = this.meta.shards ? this.meta.shards.count : 256;
            await this.loadAllShards();

            // Update UI
            this.updateStats();
            this.updateBoard(this.meta);
            this.isDataLoaded = true;

            // Start countdown if live
            if (this.getEventState(this.meta) === 'live') {
                this.startCountdown(this.meta);
            }

            this.elements.loadingProgress.style.display = 'none';
            this.hideLoading();
            this.elements.loadingStatus.textContent = '✓ Data loaded';

            console.log(`Loaded ${this.playerCache.size} unique players from ${this.shardsLoaded} shards`);

        } catch (error) {
            console.error('Error loading event data:', error);
            this.elements.loadingProgress.style.display = 'none';
            this.showError('Failed to load event data: ' + error.message);
        }
    }

    async loadAllShards() {
        // The shard count comes from meta, but we don't know which buckets exist
        // We'll try to discover them by checking common buckets
        const bucketChars = '0123456789abcdef';
        const buckets = [];

        // Generate all possible 2-character hex buckets (00-ff)
        for (let i = 0; i < bucketChars.length; i++) {
            for (let j = 0; j < bucketChars.length; j++) {
                buckets.push(bucketChars[i] + bucketChars[j]);
            }
        }

        // Load shards in batches
        const batchSize = 16;
        let loaded = 0;

        for (let i = 0; i < buckets.length; i += batchSize) {
            const batch = buckets.slice(i, i + batchSize);
            const results = await Promise.allSettled(
                batch.map(bucket => this.loadShard(bucket))
            );

            const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
            loaded += successCount;
            this.shardsLoaded = loaded;

            // Update progress (based on total possible buckets)
            const percent = Math.round((loaded / buckets.length) * 100);
            this.elements.loadingProgressBar.style.width = `${percent}%`;
            this.elements.loadingProgressPercent.textContent = `${percent}%`;
            this.elements.loadingProgressLabel.textContent =
                `Loading shards ${loaded}/${buckets.length}...`;

            this.updateStats();
        }
    }

    async loadShard(bucket) {
        try {
            const url = this.DATA_BASE + '/shards/' + bucket + '.json';
            const response = await fetch(url);
            if (response.status === 404) return null;
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.shardData.set(bucket, data);

            // Index players from this shard
            this.indexShard(data);

            return data;
        } catch (error) {
            // Silently skip shards that don't exist or fail
            return null;
        }
    }

    indexShard(shardData) {
        const days = shardData.days || {};
        const dataVersion = shardData.data_version || '';

        for (const [dayKey, dayData] of Object.entries(days)) {
            const vehicles = dayData.vehicles || {};
            for (const [vehicleKey, vehicleData] of Object.entries(vehicles)) {
                for (const [normalizedNick, playerData] of Object.entries(vehicleData)) {
                    // Store player data
                    if (!this.playerCache.has(normalizedNick)) {
                        this.playerCache.set(normalizedNick, []);
                    }

                    const placements = this.playerCache.get(normalizedNick);
                    placements.push({
                        day: parseInt(dayKey),
                        vehicle_id: parseInt(vehicleKey),
                        nickname: playerData.nickname || normalizedNick,
                        value: playerData.value || 0,
                        rank: playerData.rank || 0,
                        battles: playerData.battles || 0,
                        dataVersion: dataVersion
                    });
                }
            }
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Navigation Helpers
    // ──────────────────────────────────────────────────────────────

    getEventState(m) {
        const now = Date.parse(m.sim_now || m.generated_at);
        const start = Date.parse(m.event.window.start);
        const end = Date.parse(m.event.window.end);

        if (now < start) return 'pre';
        if (now > end) return 'post';
        return 'live';
    }

    pickDefaultDay(m) {
        if (m.active_day_index != null) return m.active_day_index;
        const firstNonUpcoming = m.days.find(d => d.state !== 'upcoming');
        return firstNonUpcoming ? firstNonUpcoming.index : m.days[0].index;
    }

    getVehicleDisplayOrder(m) {
        const roster = m.event.boards.roster;
        if (this.navState.sortByAgent) {
            return [...roster].sort((a, b) => {
                const an = (a.agent || '').toLowerCase();
                const bn = (b.agent || '').toLowerCase();
                if (an < bn) return -1;
                if (an > bn) return 1;
                return a.id - b.id;
            });
        }
        return roster;
    }

    getDayData(m, dayIndex) {
        return m.days.find(d => d.index === dayIndex);
    }

    getBoardData(m, dayIndex, vehicleId) {
        return m.boards.find(b => b.day === dayIndex && b.vehicle_id === vehicleId);
    }

    getVehicleName(m, vehicleId) {
        const v = m.event.boards.roster.find(r => r.id === vehicleId);
        return v ? v.name : String(vehicleId);
    }

    getVehicleRole(m, vehicleId) {
        const v = m.event.boards.roster.find(r => r.id === vehicleId);
        return v ? (v.agent || v.role) : '';
    }

    getDayMetricLabel(m, dayIndex) {
        const d = this.getDayData(m, dayIndex);
        return d ? d.label : '--';
    }

    // ──────────────────────────────────────────────────────────────
    // Rendering
    // ──────────────────────────────────────────────────────────────

    renderEventInfo(m) {
        const state = this.getEventState(m);
        const statusMap = {
            'pre': 'Upcoming',
            'live': 'Live',
            'post': 'Completed'
        };

        this.elements.eventTitle.textContent = m.event.title || 'Weekend Showdown';
        this.elements.eventStatus.textContent = statusMap[state] || state;
        this.elements.eventStatus.className = `event-info-value status-${state}`;

        // Next update
        if (m.next_update_expected) {
            const updateTime = this.formatUtcShort(m.next_update_expected);
            this.elements.nextUpdate.textContent = updateTime;
        } else {
            this.elements.nextUpdate.textContent = '--';
        }

        // Countdown
        if (state === 'pre') {
            const startMs = Date.parse(m.event.window.start);
            const remain = Math.max(0, startMs - Date.now());
            this.elements.eventCountdown.textContent = 'Starts in ' + this.formatRemaining(remain);
        } else if (state === 'live') {
            const endMs = Date.parse(m.event.window.end);
            const remain = Math.max(0, endMs - Date.now());
            this.elements.eventCountdown.textContent = 'Ends in ' + this.formatRemaining(remain);
        } else {
            this.elements.eventCountdown.textContent = 'Event complete';
        }
    }

    buildDayTabs(m) {
        const container = this.elements.daySelector;
        container.innerHTML = '';

        m.days.forEach(d => {
            const tab = document.createElement('button');
            tab.className = 'day-tab';
            tab.dataset.day = d.index;
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', d.index === this.navState.day ? 'true' : 'false');

            const stateClass = d.state === 'active' ? 'active' :
                              d.state === 'complete' ? 'complete' : 'upcoming';

            const stateLabel = d.state === 'active' ? '● LIVE' :
                              d.state === 'complete' ? '✓ Complete' : '⏳ Upcoming';

            tab.innerHTML = `
                <span class="day-tab-state ${stateClass}">${stateLabel}</span>
                <span class="day-tab-label">Day ${d.index}</span>
                <span class="day-tab-metric">${d.label}</span>
            `;

            tab.addEventListener('click', () => {
                this.navState.day = d.index;
                this.updateDayTabs(m);
                this.updateBoard(m);
            });

            container.appendChild(tab);
        });
    }

    updateDayTabs(m) {
        const tabs = this.elements.daySelector.querySelectorAll('.day-tab');
        tabs.forEach(tab => {
            const day = parseInt(tab.dataset.day);
            tab.setAttribute('aria-selected', day === this.navState.day ? 'true' : 'false');
        });
    }

    buildVehicleList(m) {
        const container = this.elements.vehicleSelector;
        container.innerHTML = '';

        const vehicles = this.getVehicleDisplayOrder(m);

        vehicles.forEach(v => {
            const item = document.createElement('button');
            item.className = 'vehicle-option';
            item.dataset.vehicle = v.id;
            item.setAttribute('role', 'option');
            item.setAttribute('aria-selected', v.id === this.navState.vehicle ? 'true' : 'false');

            const role = v.agent || v.role;

            item.innerHTML = `
                <span class="vehicle-option-name">${v.name}</span>
                <span class="vehicle-option-role">${role}</span>
            `;

            item.addEventListener('click', () => {
                this.navState.vehicle = v.id;
                this.updateVehicleList(m);
                this.updateBoard(m);
            });

            container.appendChild(item);
        });
    }

    updateVehicleList(m) {
        const items = this.elements.vehicleSelector.querySelectorAll('.vehicle-option');
        items.forEach(item => {
            const id = parseInt(item.dataset.vehicle);
            item.setAttribute('aria-selected', id === this.navState.vehicle ? 'true' : 'false');
        });
    }

    buildRewardsTable(m) {
        const tbody = this.elements.rewardsTable.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const tiers = (m.event && m.event.rewards) || [];
        tiers.forEach(tier => {
            const tr = document.createElement('tr');
            const rankTd = document.createElement('td');
            rankTd.textContent = tier.rank_from === tier.rank_to
                ? String(tier.rank_from)
                : tier.rank_from + '–' + tier.rank_to;

            const techTd = document.createElement('td');
            techTd.className = 'col-tech';
            techTd.textContent = String(tier.tech);

            tr.appendChild(rankTd);
            tr.appendChild(techTd);
            tbody.appendChild(tr);
        });
    }

    updateBoard(m) {
        const day = this.getDayData(m, this.navState.day);
        const vehicle = m.event.boards.roster.find(v => v.id === this.navState.vehicle);
        const board = this.getBoardData(m, this.navState.day, this.navState.vehicle);

        // Update title
        const vehicleName = vehicle ? vehicle.name : 'Unknown';
        const dayLabel = day ? `Day ${day.index}` : 'Day --';
        this.elements.boardTitle.textContent = `${vehicleName} · ${dayLabel}`;

        // Update metric
        const metricLabel = day ? day.label : '--';
        this.elements.boardMetric.textContent = metricLabel;

        // Update content
        const content = this.elements.boardContent;

        if (!day || day.state === 'upcoming') {
            content.innerHTML = `
                <div class="board-empty">
                    <i class="fas fa-clock"></i>
                    <p>This day has not started yet</p>
                    <span class="board-empty-detail">${day ? this.formatUtcShort(day.window.start) : ''}</span>
                </div>
            `;
            this.elements.boardCount.textContent = '0 players';
            return;
        }

        if (!board || !board.rows || board.rows.length === 0) {
            content.innerHTML = `
                <div class="board-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No standings yet for this board</p>
                    <span class="board-empty-detail">Check back later</span>
                </div>
            `;
            this.elements.boardCount.textContent = '0 players';
            return;
        }

        const topN = m.event.boards.top_n || 25;
        const rows = board.rows.slice(0, topN);

        this.elements.boardCount.textContent = `${rows.length} players`;

        // Build table
        let tableHtml = `
            <table class="board-table">
                <thead>
                    <tr>
                        <th class="col-rank">#</th>
                        <th class="col-player">Player</th>
                        <th class="col-value">${board.label}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        rows.forEach(row => {
            tableHtml += `
                <tr>
                    <td class="col-rank">#${this.formatNumber(row.rank)}</td>
                    <td class="col-player">${this.escapeHtml(row.nickname)}</td>
                    <td class="col-value">${this.formatNumber(row.value)}</td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        content.innerHTML = tableHtml;
    }

    // ──────────────────────────────────────────────────────────────
    // Countdown
    // ──────────────────────────────────────────────────────────────

    startCountdown(m) {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }

        const endMs = Date.parse(m.event.window.end);

        const tick = () => {
            const remain = Math.max(0, endMs - Date.now());
            this.elements.eventCountdown.textContent = 'Ends in ' + this.formatRemaining(remain);

            // Also update day countdown for active day
            const activeDay = m.days.find(d => d.index === this.navState.day);
            if (activeDay && activeDay.state === 'active') {
                // We'll update the board if needed
            }

            if (remain <= 0) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
                this.elements.eventCountdown.textContent = 'Event complete';
            }
        };

        tick();
        this.countdownTimer = setInterval(tick, 1000);
    }

    // ──────────────────────────────────────────────────────────────
    // Search
    // ──────────────────────────────────────────────────────────────

    handleSearch(query) {
        clearTimeout(this.searchTimeout);

        if (!this.isDataLoaded) {
            this.elements.loadingStatus.textContent = '⏳ Loading data...';
            return;
        }

        if (query.length < 2) {
            this.hideSuggestions();
            if (!query) {
                this.clearSearchResults();
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
        const normalizedQuery = this.normalizeNickname(query);
        const results = [];

        // Search by normalized nickname
        for (const [nick, placements] of this.playerCache) {
            if (nick.includes(normalizedQuery) || nick.includes(lowerQuery)) {
                const displayName = placements.length > 0 ? placements[0].nickname : nick;
                results.push({
                    nickname: displayName,
                    normalized: nick,
                    placements: placements,
                    totalValue: placements.reduce((sum, p) => sum + p.value, 0)
                });
            }
        }

        // Also search by display name
        for (const [nick, placements] of this.playerCache) {
            if (results.length >= 20) break;
            const displayName = placements.length > 0 ? placements[0].nickname.toLowerCase() : nick;
            if (displayName.includes(lowerQuery) && !results.find(r => r.normalized === nick)) {
                results.push({
                    nickname: placements.length > 0 ? placements[0].nickname : nick,
                    normalized: nick,
                    placements: placements,
                    totalValue: placements.reduce((sum, p) => sum + p.value, 0)
                });
            }
        }

        // Sort by total value descending
        results.sort((a, b) => b.totalValue - a.totalValue);

        return results.slice(0, 20);
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
                <small>Press Enter to search</small>
            </div>
            ${suggestions.map(s => `
                <div class="suggestion-item" data-nickname="${this.escapeHtml(s.normalized)}">
                    <div class="suggestion-name">${this.highlightMatch(s.nickname, query)}</div>
                    <div class="suggestion-stats">
                        <span><i class="fas fa-trophy"></i> ${s.placements.length} placements</span>
                        <span><i class="fas fa-bolt"></i> ${this.formatNumber(s.totalValue)}</span>
                    </div>
                </div>
            `).join('')}
        `;

        container.style.display = 'block';

        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const nick = item.dataset.nickname;
                this.elements.searchInput.value = nick;
                this.hideSuggestions();
                this.performSearch(nick);
            });
        });
    }

    hideSuggestions() {
        this.elements.suggestions.style.display = 'none';
    }

    performSearch(query) {
        const normalized = this.normalizeNickname(query);
        const placements = this.playerCache.get(normalized) || [];

        // Also try with the original query
        let results = placements;
        if (results.length === 0) {
            // Try to find by display name
            for (const [nick, p] of this.playerCache) {
                if (p.length > 0 && p[0].nickname.toLowerCase().includes(query.toLowerCase())) {
                    results = p;
                    break;
                }
            }
        }

        if (results.length === 0) {
            this.showNoResults();
            return;
        }

        this.showSearchResults(results, query);
    }

    showSearchResults(placements, query) {
        const container = this.elements.searchResultsContent;
        this.elements.searchResults.style.display = 'block';
        this.elements.noResults.style.display = 'none';

        const displayName = placements.length > 0 ? placements[0].nickname : query;

        // Group by day
        const groupedByDay = {};
        placements.forEach(p => {
            if (!groupedByDay[p.day]) groupedByDay[p.day] = [];
            groupedByDay[p.day].push(p);
        });

        const sortedDays = Object.keys(groupedByDay).sort((a, b) => parseInt(a) - parseInt(b));

        let html = `
            <div class="search-result-player">
                <h4>${this.escapeHtml(displayName)}</h4>
                <span class="search-result-count">${placements.length} placements</span>
            </div>
        `;

        sortedDays.forEach(day => {
            const dayData = this.getDayData(this.meta, parseInt(day));
            const dayLabel = dayData ? dayData.label : `Day ${day}`;

            html += `
                <div class="search-result-day">
                    <h5>${dayLabel}</h5>
                    <div class="search-result-vehicles">
            `;

            const dayPlacements = groupedByDay[day];
            dayPlacements.forEach(p => {
                const vehicleName = this.getVehicleName(this.meta, p.vehicle_id);
                const role = this.getVehicleRole(this.meta, p.vehicle_id);
                html += `
                    <div class="search-result-placement" data-day="${p.day}" data-vehicle="${p.vehicle_id}">
                        <span class="placement-vehicle">${vehicleName}</span>
                        <span class="placement-role">${role}</span>
                        <span class="placement-rank">#${p.rank}</span>
                        <span class="placement-value">${this.formatNumber(p.value)}</span>
                        <span class="placement-battles">${p.battles} battles</span>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        // Add click handlers to navigate to boards
        container.innerHTML = html;

        container.querySelectorAll('.search-result-placement').forEach(el => {
            el.addEventListener('click', () => {
                const day = parseInt(el.dataset.day);
                const vehicle = parseInt(el.dataset.vehicle);
                this.navState.day = day;
                this.navState.vehicle = vehicle;
                this.updateDayTabs(this.meta);
                this.updateVehicleList(this.meta);
                this.updateBoard(this.meta);
                this.clearSearchResults();
                // Scroll to board
                this.elements.boardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    clearSearchResults() {
        this.elements.searchResults.style.display = 'none';
        this.elements.searchResultsContent.innerHTML = '';
        this.elements.noResults.style.display = 'none';
        this.elements.initialState.style.display = 'none';
        this.elements.boardContainer.style.display = 'block';
    }

    // ──────────────────────────────────────────────────────────────
    // Utility Functions
    // ──────────────────────────────────────────────────────────────

    normalizeNickname(raw) {
        return String(raw == null ? '' : raw).split('#')[0].toLowerCase();
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return String(num);
    }

    formatRemaining(ms) {
        if (ms <= 0) return '0s';
        const days = Math.floor(ms / 86400000);
        const hours = Math.floor((ms % 86400000) / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`;
        if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
        return `${seconds}s`;
    }

    formatUtcShort(iso) {
        const d = new Date(iso);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${hh}:${mm} UTC`;
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ──────────────────────────────────────────────────────────────
    // State Management
    // ──────────────────────────────────────────────────────────────

    showInitialState() {
        this.elements.boardContainer.style.display = 'block';
        this.elements.searchResults.style.display = 'none';
        this.elements.noResults.style.display = 'none';
        this.elements.initialState.style.display = 'block';
        this.elements.loadingState.style.display = 'none';

        // Show empty board
        this.elements.boardTitle.textContent = 'Select a board';
        this.elements.boardMetric.textContent = '--';
        this.elements.boardCount.textContent = '0 players';
        this.elements.boardContent.innerHTML = `
            <div class="board-empty">
                <i class="fas fa-trophy"></i>
                <p>Select a day and vehicle to view the leaderboard</p>
            </div>
        `;
    }

    showNoResults() {
        this.elements.searchResults.style.display = 'none';
        this.elements.noResults.style.display = 'block';
        this.elements.initialState.style.display = 'none';
        this.elements.boardContainer.style.display = 'block';
    }

    showLoading(message) {
        this.elements.loadingState.style.display = 'block';
        this.elements.loadingState.querySelector('p').textContent = message;
        this.elements.boardContainer.style.display = 'none';
        this.elements.searchResults.style.display = 'none';
        this.elements.noResults.style.display = 'none';
        this.elements.initialState.style.display = 'none';
        this.elements.loadingStatus.textContent = '⏳ Loading...';
    }

    hideLoading() {
        this.elements.loadingState.style.display = 'none';
        this.elements.boardContainer.style.display = 'block';
        this.elements.loadingStatus.textContent = '✓ Data loaded';
    }

    showError(message) {
        this.elements.loadingState.style.display = 'block';
        this.elements.loadingState.querySelector('p').textContent = '⚠️ ' + message;
        this.elements.loadingState.querySelector('p').style.color = '#e74c3c';
        this.elements.loadingStatus.textContent = '❌ Error';
        this.elements.initialState.style.display = 'none';
    }

    updateStats() {
        this.elements.totalPlayers.textContent = this.formatNumber(this.playerCache.size);
        this.elements.totalShards.textContent = this.shardsLoaded;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new WeekendShowdownStats();
});