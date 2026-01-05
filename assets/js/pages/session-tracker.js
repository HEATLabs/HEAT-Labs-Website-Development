document.addEventListener('DOMContentLoaded', function() {
    // Session tracker state
    const sessionState = {
        playerName: '',
        tanks: [],
        playerStats: [],
        sortConfig: {
            key: 'battles',
            direction: 'desc'
        },
        isTracking: false,
        refreshInterval: null,
        tanksData: []
    };

    // DOM elements
    const sessionInput = document.getElementById('sessionInput');
    const sessionSubmit = document.getElementById('sessionSubmit');
    const sessionInputSection = document.getElementById('sessionInputSection');
    const sessionStatsSection = document.getElementById('sessionStatsSection');
    const sessionPlayerName = document.getElementById('sessionPlayerName');
    const sessionRefreshBtn = document.getElementById('sessionRefreshBtn');
    const sessionLastUpdate = document.getElementById('sessionLastUpdate');
    const sessionStatsBody = document.getElementById('sessionStatsBody');
    const sessionTableHeaders = document.querySelectorAll('.session-stats-table th[data-sort]');

    // Initialize session tracker
    async function initSessionTracker() {
        await loadTanksData();
        setupEventListeners();
    }

    // Load tanks data
    async function loadTanksData() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/tanks.json');
            if (!response.ok) {
                throw new Error('Failed to load tanks data');
            }
            sessionState.tanksData = await response.json();
        } catch (error) {
            console.error('Error loading tanks data:', error);
            // Fallback to empty array
            sessionState.tanksData = [];
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Input submission
        sessionSubmit.addEventListener('click', startTracking);
        sessionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                startTracking();
            }
        });

        // Refresh button
        sessionRefreshBtn.addEventListener('click', refreshStats);

        // Table sorting
        sessionTableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sortKey = header.getAttribute('data-sort');
                handleSort(sortKey);
            });
        });
    }

    // Start tracking player stats
    function startTracking() {
        const playerName = sessionInput.value.trim();

        if (!playerName) {
            alert('Please enter your in-game name');
            return;
        }

        sessionState.playerName = playerName;
        sessionState.isTracking = true;

        // Show stats section
        sessionInputSection.style.display = 'none';
        sessionStatsSection.style.display = 'block';

        // Update player name display
        sessionPlayerName.textContent = playerName;

        // Generate initial stats
        generatePlayerStats();

        // Start auto-refresh
        startAutoRefresh();
    }

    // Generate random stats (placeholder for API, WG pls)
    function generatePlayerStats() {
        const playerStats = [];

        // Filter tanks that have at least one battle
        const playedTanks = sessionState.tanksData.filter(tank => Math.random() > 0.3); // 70% chance a tank has battles (yes)

        playedTanks.forEach(tank => {
            const battles = Math.floor(Math.random() * 500) + 1;
            const wins = Math.floor(Math.random() * battles);
            const objectives = Math.floor(Math.random() * battles * 0.8);
            const kills = Math.floor(Math.random() * battles * 3);
            const assists = Math.floor(Math.random() * battles * 2);
            const damage = Math.floor(Math.random() * 100000) + 10000;

            playerStats.push({
                tankId: tank.id,
                tankName: tank.name,
                tankSlug: tank.slug,
                tankImage: tank.image,
                battles: battles,
                wins: wins,
                winrate: battles > 0 ? (wins / battles) * 100 : 0,
                objectives: objectives,
                kills: kills,
                assists: assists,
                damage: damage,
                damagePerBattle: battles > 0 ? damage / battles : 0
            });
        });

        sessionState.playerStats = playerStats;
        renderStatsTable();
        updateLastUpdateTime();
    }

    // Render stats table
    function renderStatsTable() {
        const sortedStats = sortStats([...sessionState.playerStats]);

        sessionStatsBody.innerHTML = '';

        if (sortedStats.length === 0) {
            sessionStatsBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-gray-500">
                        No battle data available for this player
                    </td>
                </tr>
            `;
            return;
        }

        sortedStats.forEach(stat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="tank-cell">
                        <img src="${stat.tankImage}" alt="${stat.tankName}" class="tank-icon" onerror="this.src='https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/logo/logo.webp'">
                        <span class="tank-name">${stat.tankName}</span>
                    </div>
                </td>
                <td class="stat-cell battles">${stat.battles.toLocaleString()}</td>
                <td class="stat-cell winrate">${stat.winrate.toFixed(2)}%</td>
                <td class="stat-cell objectives">${stat.objectives.toLocaleString()}</td>
                <td class="stat-cell kills">${stat.kills.toLocaleString()}</td>
                <td class="stat-cell assists">${stat.assists.toLocaleString()}</td>
                <td class="stat-cell damage">${stat.damage.toLocaleString()}</td>
            `;
            sessionStatsBody.appendChild(row);
        });
    }

    // Sort stats based on current sort configuration
    function sortStats(stats) {
        const {
            key,
            direction
        } = sessionState.sortConfig;

        return stats.sort((a, b) => {
            let aValue = a[key];
            let bValue = b[key];

            // Handle string comparison for tank names
            if (key === 'tankName') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }

    // Handle table sorting
    function handleSort(sortKey) {
        const {
            key,
            direction
        } = sessionState.sortConfig;

        let newDirection = 'desc';

        if (key === sortKey) {
            newDirection = direction === 'asc' ? 'desc' : 'asc';
        }

        sessionState.sortConfig = {
            key: sortKey,
            direction: newDirection
        };

        // Update sort indicators
        updateSortIndicators();

        // Re-render table
        renderStatsTable();
    }

    // Update sort indicators in table headers
    function updateSortIndicators() {
        sessionTableHeaders.forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');

            const sortKey = header.getAttribute('data-sort');
            if (sortKey === sessionState.sortConfig.key) {
                header.classList.add(`sort-${sessionState.sortConfig.direction}`);
            }
        });
    }

    // Refresh stats manually
    function refreshStats() {
        if (!sessionState.isTracking) return;

        // Show loading state
        sessionRefreshBtn.classList.add('loading');
        sessionRefreshBtn.disabled = true;

        // Simulate API call (WG please give us the API)
        setTimeout(() => {
            generatePlayerStats();
            sessionRefreshBtn.classList.remove('loading');
            sessionRefreshBtn.disabled = false;
        }, 1000);
    }

    // Start auto-refresh interval
    function startAutoRefresh() {
        // Clear existing interval
        if (sessionState.refreshInterval) {
            clearInterval(sessionState.refreshInterval);
        }

        // auto refresh every 1 minute
        sessionState.refreshInterval = setInterval(() => {
            if (sessionState.isTracking) {
                generatePlayerStats();
            }
        }, 60000);
    }

    // Update last update time display
    function updateLastUpdateTime() {
        const now = new Date();
        sessionLastUpdate.textContent = now.toLocaleTimeString();
    }

    // Stop tracking
    function stopTracking() {
        sessionState.isTracking = false;

        if (sessionState.refreshInterval) {
            clearInterval(sessionState.refreshInterval);
            sessionState.refreshInterval = null;
        }

        // Show input section
        sessionInputSection.style.display = 'block';
        sessionStatsSection.style.display = 'none';
    }

    // Initialize the tracker
    initSessionTracker();
});