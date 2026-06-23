/* Event Stats Page */
class EventStats {
  constructor() {
    this.players = new Map();
    this.shardsLoaded = 0;
    this.totalShards = 0;
    this.isLoading = false;
    this.searchTimeout = null;
    this.charts = {};

    // DOM elements
    this.elements = {
      searchInput: document.getElementById('playerSearchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      suggestions: document.getElementById('searchSuggestions'),
      totalPlayers: document.getElementById('totalPlayersCount'),
      totalShards: document.getElementById('totalShardsCount'),
      playerProfile: document.getElementById('playerProfile'),
      noResults: document.getElementById('noResults'),
      loadingState: document.getElementById('loadingState'),
      initialState: document.getElementById('initialState'),
    };

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupExampleSearches();
    await this.loadShardData();
    this.updateStats();
  }

  setupEventListeners() {
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
    });

    // Close suggestions on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.stats-search-container')) {
        this.hideSuggestions();
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
  }

  setupExampleSearches() {
    // Example searches removed as requested
  }

  async loadShardData() {
    try {
      this.showLoading('Loading shard data...');

      // Load the shard list
      const shardListResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/event-data.json');
      const shardUrls = await shardListResponse.json();
      this.totalShards = shardUrls.length;

      // Load shards in batches to avoid overwhelming the browser
      const batchSize = 10;
      for (let i = 0; i < shardUrls.length; i += batchSize) {
        const batch = shardUrls.slice(i, i + batchSize);
        await Promise.all(batch.map(url => this.loadShard(url)));
        this.shardsLoaded = Math.min(i + batchSize, this.totalShards);
        this.updateStats();
      }

      this.hideLoading();
      this.showInitialState();

      console.log(`Loaded ${this.players.size} players from ${this.shardsLoaded} shards`);

    } catch (error) {
      console.error('Error loading shard data:', error);
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
          // Store player data with ID as key for lookup
          const playerKey = id.toLowerCase();
          if (!this.players.has(playerKey)) {
            this.players.set(playerKey, { id, ...playerData });
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load shard: ${url}`, error);
    }
  }

  handleSearch(query) {
    clearTimeout(this.searchTimeout);

    if (query.length < 2) {
      this.hideSuggestions();
      if (!query) {
        this.showInitialState();
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
            <span>💥 ${this.formatNumber(p.damage)}</span>
            <span>⚔️ ${p.battles}</span>
          </div>
        </div>
      `).join('')}
    `;

    container.style.display = 'block';

    // Click handler for suggestions
    container.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const playerId = item.dataset.playerId;
        const player = this.players.get(playerId);
        if (player) {
          this.elements.searchInput.value = player.nickname || playerId;
          this.hideSuggestions();
          this.showPlayer(playerId);
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
    const lowerQuery = query.toLowerCase();
    let matchedPlayer = null;
    let matchedKey = null;

    // Try exact match first
    for (const [key, player] of this.players) {
      const nickname = (player.nickname || key).toLowerCase();
      if (key === lowerQuery || nickname === lowerQuery) {
        matchedPlayer = player;
        matchedKey = key;
        break;
      }
    }

    // Try partial match
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
      this.showPlayer(matchedKey);
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

    // Scroll to profile
    this.elements.playerProfile.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  renderPlayerProfile(player, playerId) {
    const damage = player.damage || 0;
    const battles = player.battles || 0;
    const wins = player.wins || 0;
    const frags = player.frags || 0;
    const qualified = player.qualified || false;
    const percentile = player.damage_percentile || null;
    const nickname = player.nickname || playerId;

    // Header
    document.getElementById('playerNickname').textContent = nickname;
    document.getElementById('playerId').textContent = `#${playerId.split('#')[1] || playerId}`;

    // Badges
    document.getElementById('qualifiedBadge').textContent = qualified ? 'Qualified' : 'Not Qualified';
    document.getElementById('qualifiedBadge').className = `badge ${qualified ? 'badge-qualified' : 'badge-unqualified'}`;

    document.getElementById('percentileBadge').textContent = percentile !== null ? `Top ${percentile}%` : 'N/A';
    document.getElementById('percentileBadge').style.display = percentile !== null ? 'inline-flex' : 'none';

    // Summary stats
    document.getElementById('totalDamage').textContent = this.formatNumber(damage);
    document.getElementById('totalBattles').textContent = battles;
    document.getElementById('totalWins').textContent = wins;
    document.getElementById('totalFrags').textContent = frags;

    // Win Rate
    const winRate = battles > 0 ? (wins / battles) * 100 : 0;
    document.getElementById('winRateDisplay').textContent = `${winRate.toFixed(1)}%`;
    document.getElementById('winRateBar').style.width = `${Math.min(winRate, 100)}%`;
    document.getElementById('winsDisplay').textContent = wins;
    document.getElementById('battlesDisplay').textContent = battles;

    // Performance
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
      // Show empty state for charts
      document.querySelectorAll('.chart-container canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#666';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
      });
      return;
    }

    // Destroy existing charts
    if (this.charts.dailyHistory) {
      this.charts.dailyHistory.destroy();
    }
    if (this.charts.damageProgression) {
      this.charts.damageProgression.destroy();
    }

    const days = history.map(d => `Window ${d.day_index}`);
    const damages = history.map(d => d.damage);
    const battles = history.map(d => d.battles);
    const wins = history.map(d => d.wins);

    // Calculate cumulative damage for progression chart
    let cumulative = 0;
    const cumulativeDamage = history.map(d => {
      cumulative += d.damage;
      return cumulative;
    });

    // Daily History Chart (Bar chart showing damage per day)
    const ctx1 = document.getElementById('dailyHistoryChart').getContext('2d');
    this.charts.dailyHistory = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          label: 'Damage',
          data: damages,
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
            display: true,
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff',
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999',
              callback: (value) => this.formatNumber(value),
            },
            grid: {
              color: 'rgba(255,255,255,0.05)',
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999',
            },
            grid: {
              display: false,
            }
          }
        }
      }
    });

    // Damage Progression Chart (Line chart)
    const ctx2 = document.getElementById('damageProgressionChart').getContext('2d');
    this.charts.damageProgression = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'Total Damage (Cumulative)',
            data: cumulativeDamage,
            borderColor: 'rgba(255, 131, 0, 1)',
            backgroundColor: 'rgba(255, 131, 0, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(255, 131, 0, 1)',
            pointRadius: 4,
          },
          {
            label: 'Battles',
            data: battles,
            borderColor: 'rgba(52, 152, 219, 1)',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(52, 152, 219, 1)',
            pointRadius: 4,
            yAxisID: 'y1',
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#ffffff',
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            position: 'left',
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999',
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
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999',
            },
            grid: {
              display: false,
            }
          },
          x: {
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#999',
            },
            grid: {
              display: false,
            }
          }
        }
      }
    });
  }

  showInitialState() {
    this.elements.playerProfile.style.display = 'none';
    this.elements.noResults.style.display = 'none';
    this.elements.initialState.style.display = 'block';
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
  }

  hideLoading() {
    this.elements.loadingState.style.display = 'none';
  }

  showError(message) {
    this.elements.loadingState.style.display = 'block';
    this.elements.loadingState.querySelector('p').textContent = '⚠️ ' + message;
    this.elements.loadingState.querySelector('p').style.color = '#e74c3c';
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Chart.js to load
  if (typeof Chart !== 'undefined') {
    new EventStats();
  }
});