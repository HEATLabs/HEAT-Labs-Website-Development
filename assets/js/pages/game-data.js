// Game Data Page JavaScript
class GameDataPage {
    constructor() {
        this.currentTab = 'achievements';
        this.achievements = [];
        this.statistics = [];
        this.filteredAchievements = [];
        this.filteredStatistics = [];
        this.searchTerm = '';
        this.sortOrder = 'number';

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.loadGameData();
        });
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab || e.target.closest('.tab-button').dataset.tab);
            });
        });

        // Search
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterItems();
                this.renderCurrentTab();
            });
        }

        // Sort filter
        const sortFilter = document.querySelector('#sortFilter');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                this.sortItems();
                this.renderCurrentTab();
            });
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });

        this.renderCurrentTab();
    }

    async loadGameData() {
        try {
            this.showLoading();

            // Load achievements
            const achievementsResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Database/refs/heads/main/game-data/steam_achievements.json');
            const achievementsData = await achievementsResponse.json();
            this.achievements = achievementsData.achievements;
            this.filteredAchievements = [...this.achievements];

            // Load statistics
            const statisticsResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Database/refs/heads/main/game-data/steam_statistics.json');
            const statisticsData = await statisticsResponse.json();
            this.statistics = statisticsData.metrics;
            this.filteredStatistics = [...this.statistics];

            // Update summary cards
            this.updateSummaryCards(achievementsData, statisticsData);

            // Render initial tab
            this.renderCurrentTab();

        } catch (error) {
            console.error('Error loading game data:', error);
            this.showError();
        }
    }

    updateSummaryCards(achievementsData, statisticsData) {
        const summaryContainer = document.querySelector('.summary-cards');
        if (!summaryContainer) return;

        // Format the last updated date
        const lastUpdated = new Date(achievementsData.last_updated);
        const formattedDate = lastUpdated.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        summaryContainer.innerHTML = `
            <div class="summary-card">
                <div class="summary-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="summary-content">
                    <h3>Total Achievements</h3>
                    <div class="number">${achievementsData.total_achievements}</div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="summary-content">
                    <h3>Game Metrics</h3>
                    <div class="number">${statisticsData.total_metrics}</div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">
                    <i class="fas fa-gamepad"></i>
                </div>
                <div class="summary-content">
                    <h3>Steam App ID</h3>
                    <div class="number">${achievementsData.game_app_id}</div>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="summary-content">
                    <h3>Last Updated</h3>
                    <div class="number">${formattedDate}</div>
                </div>
            </div>
        `;
    }

    filterItems() {
        if (this.currentTab === 'achievements') {
            this.filteredAchievements = this.achievements.filter(achievement =>
                achievement.displayName.toLowerCase().includes(this.searchTerm) ||
                achievement.description.toLowerCase().includes(this.searchTerm)
            );
        } else {
            this.filteredStatistics = this.statistics.filter(statistic =>
                statistic.displayName.toLowerCase().includes(this.searchTerm) ||
                statistic.name.toLowerCase().includes(this.searchTerm)
            );
        }
    }

    sortItems() {
        if (this.currentTab === 'achievements') {
            this.filteredAchievements.sort((a, b) => {
                if (this.sortOrder === 'number') {
                    return a.number - b.number;
                } else if (this.sortOrder === 'name') {
                    return a.displayName.localeCompare(b.displayName);
                }
                return 0;
            });
        } else {
            this.filteredStatistics.sort((a, b) => {
                if (this.sortOrder === 'name') {
                    return a.displayName.localeCompare(b.displayName);
                }
                return 0;
            });
        }
    }

    renderCurrentTab() {
        if (this.currentTab === 'achievements') {
            this.renderAchievements();
        } else {
            this.renderStatistics();
        }

        // Animate cards after render
        setTimeout(() => {
            document.querySelectorAll('.achievement-card, .statistic-card').forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animated');
                }, index * 50);
            });
        }, 50);

        // Show/hide empty state if needed
        this.updateEmptyState();
    }

    renderAchievements() {
        const container = document.getElementById('achievementsGrid');
        if (!container) return;

        // Sort achievements by number for proper display
        const sortedAchievements = [...this.filteredAchievements].sort((a, b) => a.number - b.number);

        // Render all filtered achievements
        container.innerHTML = sortedAchievements.map(achievement => `
            <div class="achievement-card" data-number="${achievement.number}">
                <div class="achievement-header">
                    <div class="achievement-number">${achievement.number}</div>
                    <div class="achievement-icon">
                        <img src="${achievement.iconUnlockedFallback}"
                             alt="${achievement.displayName}"
                             onerror="this.src='${achievement.iconUnlocked}'"
                             loading="lazy">
                    </div>
                    <div class="achievement-title">
                        <h3>${achievement.displayName}</h3>
                    </div>
                </div>
                <div class="achievement-info">
                    <p class="achievement-description">${achievement.description}</p>
                    <div class="achievement-stats">
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderStatistics() {
        const container = document.getElementById('statisticsGrid');
        if (!container) return;

        // Get icon based on metric type
        const getMetricIcon = (metricName) => {
            if (metricName.includes('Damage')) return 'fas fa-bullseye';
            if (metricName.includes('Kill')) return 'fas fa-skull-crossbones';
            if (metricName.includes('Win') || metricName.includes('Trophy')) return 'fas fa-trophy';
            if (metricName.includes('Base') || metricName.includes('Capture')) return 'fas fa-flag';
            if (metricName.includes('Critical') || metricName.includes('Crit')) return 'fas fa-bolt';
            if (metricName.includes('Restore') || metricName.includes('Repair')) return 'fas fa-heart';
            if (metricName.includes('Assist')) return 'fas fa-handshake';
            if (metricName.includes('Block')) return 'fas fa-shield-alt';
            if (metricName.includes('Longshot')) return 'fas fa-arrows-to-circle';
            if (metricName.includes('Ramming')) return 'fas fa-car-burst';
            if (metricName.includes('Close')) return 'fas fa-fist-raised';
            return 'fas fa-chart-line';
        };

        // Get category based on metric content
        const getMetricCategory = (metricName) => {
            if (metricName.includes('Damage') || metricName.includes('Kill')) return 'Combat';
            if (metricName.includes('Win') || metricName.includes('Match')) return 'Performance';
            if (metricName.includes('Base') || metricName.includes('Capture')) return 'Objectives';
            if (metricName.includes('Critical')) return 'Critical Hits';
            if (metricName.includes('Restore') || metricName.includes('Repair')) return 'Support';
            if (metricName.includes('Assist')) return 'Teamwork';
            if (metricName.includes('Block')) return 'Defense';
            return 'General';
        };

        // Sort statistics by display name
        const sortedStatistics = [...this.filteredStatistics].sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
        );

        // Render all filtered statistics
        container.innerHTML = sortedStatistics.map((stat) => `
            <div class="statistic-card">
                <div class="statistic-header">
                    <div class="statistic-icon">
                        <i class="${getMetricIcon(stat.displayName)}"></i>
                    </div>
                    <div class="statistic-content">
                        <h3>${stat.displayName}</h3>
                        <div class="statistic-type">${getMetricCategory(stat.displayName)}</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateEmptyState() {
        // Check if current tab has no items
        let hasItems = false;
        let container = null;

        if (this.currentTab === 'achievements') {
            hasItems = this.filteredAchievements.length > 0;
            container = document.getElementById('achievementsGrid');
        } else {
            hasItems = this.filteredStatistics.length > 0;
            container = document.getElementById('statisticsGrid');
        }

        if (!container) return;

        // If no items and search is active, show empty state
        if (!hasItems && this.searchTerm) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No ${this.currentTab} found</h3>
                    <p>Try adjusting your search term</p>
                </div>
            `;
        }
    }

    showLoading() {
        const containers = ['achievementsGrid', 'statisticsGrid'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Loading game data...</p>
                    </div>
                `;
            }
        });
    }

    showError() {
        const containers = ['achievementsGrid', 'statisticsGrid'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load data</h3>
                        <p>Please try refreshing the page</p>
                    </div>
                `;
            }
        });
    }
}

// Initialize the page
const gameDataPage = new GameDataPage();