// player-records logic
(function() {
  // Configuration
  const RECORDS_JSON_URL = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/player-records.json';
  const DISCORD_INVITE_URL = 'https://discord.gg/KRYEw9aGZT';

  // Category mapping for display names and icons
  const CATEGORY_CONFIG = {
    'Total Captures': { icon: 'fa-flag-checkered', color: '#ff8300', unit: '' },
    'Total Vehicles Destroyed': { icon: 'fa-tank', color: '#ff8300', unit: '' },
    'Total Deaths': { icon: 'fa-skull', color: '#ff8300', unit: '' },
    'Total Assists': { icon: 'fa-hands-helping', color: '#ff8300', unit: '' },
    'Total Damage Caused': { icon: 'fa-bolt', color: '#ff8300', unit: '' },
    'Total Damage Blocked': { icon: 'fa-shield-haltered', color: '#ff8300', unit: '' },
    'Total Currency': { icon: 'fa-coins', color: '#ff8300', unit: '' },
    'Total Tech Coins': { icon: 'fa-microchip', color: '#ff8300', unit: '' }
  };

  const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

  // DOM Elements
  const recordsGrid = document.getElementById('recordsGrid');
  const recordsLoading = document.getElementById('recordsLoading');
  const recordsError = document.getElementById('recordsError');
  const retryBtn = document.getElementById('retryRecordsBtn');

  // Modal Elements
  const modalOverlay = document.getElementById('proofModalOverlay');
  const modalClose = document.getElementById('proofModalClose');
  const proofImage = document.getElementById('proofImage');
  const proofPlayer = document.getElementById('proofPlayer');
  const proofCategory = document.getElementById('proofCategory');
  const proofValue = document.getElementById('proofValue');
  const proofMap = document.getElementById('proofMap');
  const proofVehicle = document.getElementById('proofVehicle');
  const proofAgent = document.getElementById('proofAgent');

  // State
  let recordsData = [];
  let categoriesWithRecords = new Set();

  // Helper Functions
  function formatNumber(value) {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  }

  function getCategoryIcon(category) {
    return CATEGORY_CONFIG[category]?.icon || 'fa-trophy';
  }

  function getCategoryUnit(category) {
    return CATEGORY_CONFIG[category]?.unit || '';
  }

  // Group records by category
  function groupRecordsByCategory(records) {
    const grouped = {};
    ALL_CATEGORIES.forEach(cat => {
      grouped[cat] = [];
    });

    records.forEach(record => {
      for (const category of ALL_CATEGORIES) {
        if (record[category]) {
          const recordData = record[category];
          grouped[category].push({
            ...recordData,
            timestamp: record.timestamp,
            entry_id: record.entry_id
          });
          categoriesWithRecords.add(category);
          break;
        }
      }
    });

    // Sort each category by number (descending)
    for (const category in grouped) {
      grouped[category].sort((a, b) => b.number - a.number);
    }

    return grouped;
  }

  // Create a record card HTML
  function createRecordCard(category, record) {
    const icon = getCategoryIcon(category);
    const unit = getCategoryUnit(category);
    const formattedValue = formatNumber(record.number);

    return `
      <div class="record-card" data-category="${category}" data-entry-id="${record.entry_id}">
        <div class="record-card-header">
          <span class="record-category">
            <i class="fas ${icon}"></i> ${category}
          </span>
          <span class="record-value-large">${formattedValue}${unit}</span>
        </div>
        <div class="record-card-body">
          <div class="record-player">
            <i class="fas fa-user-circle"></i>
            <div class="record-player-info">
              <h4>${escapeHtml(record.player_name || 'Unknown Player')}</h4>
              <p>Record holder</p>
            </div>
          </div>
          <div class="record-details">
            <div class="record-detail-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>Map:</span>
              <span>${escapeHtml(record.map || 'Unknown')}</span>
            </div>
            <div class="record-detail-item">
              <i class="fas fa-car"></i>
              <span>Vehicle:</span>
              <span>${escapeHtml(record.vehicle || 'Unknown')}</span>
            </div>
            <div class="record-detail-item">
              <i class="fas fa-user-ninja"></i>
              <span>Agent:</span>
              <span>${escapeHtml(record.agent || 'Unknown')}</span>
            </div>
            <div class="record-detail-item">
              <i class="fas fa-calendar-alt"></i>
              <span>Recorded:</span>
              <span>${formatDate(record.timestamp)}</span>
            </div>
          </div>
          <div class="record-actions">
            <button class="btn-proof" data-proof-url="${record.proof_image || ''}" data-player="${escapeHtml(record.player_name)}" data-category="${category}" data-value="${formattedValue}" data-map="${escapeHtml(record.map)}" data-vehicle="${escapeHtml(record.vehicle)}" data-agent="${escapeHtml(record.agent)}">
              <i class="fas fa-camera"></i> View Proof
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Create empty category placeholder
  function createEmptyCategoryCard(category) {
    const icon = getCategoryIcon(category);

    return `
      <div class="empty-category-card">
        <div class="empty-icon">
          <i class="fas ${icon}"></i>
        </div>
        <h4>${category}</h4>
        <p>No records have been set for this category yet.</p>
        <a href="${DISCORD_INVITE_URL}" target="_blank" class="discord-link">
          <i class="fab fa-discord"></i> Submit a Record
        </a>
      </div>
    `;
  }

  // Format date from timestamp string
  function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return timestamp.split(' ')[0];
    }
  }

  // Simple escape to prevent XSS
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Render all records
  function renderRecords() {
    if (!recordsData || recordsData.length === 0) {
      renderEmptyCategories();
      return;
    }

    const groupedRecords = groupRecordsByCategory(recordsData);
    let allCardsHtml = '';

    for (const category of ALL_CATEGORIES) {
      const categoryRecords = groupedRecords[category];
      if (categoryRecords && categoryRecords.length > 0) {
        const topRecord = categoryRecords[0];
        allCardsHtml += createRecordCard(category, topRecord);
      } else {
        allCardsHtml += createEmptyCategoryCard(category);
      }
    }

    recordsGrid.innerHTML = allCardsHtml;
    attachProofButtonListeners();
  }

  function renderEmptyCategories() {
    let emptyCardsHtml = '';
    for (const category of ALL_CATEGORIES) {
      emptyCardsHtml += createEmptyCategoryCard(category);
    }
    recordsGrid.innerHTML = emptyCardsHtml;
  }

  // Attach event listeners to proof buttons
  function attachProofButtonListeners() {
    const proofButtons = document.querySelectorAll('.btn-proof');
    proofButtons.forEach(btn => {
      btn.removeEventListener('click', handleProofClick);
      btn.addEventListener('click', handleProofClick);
    });
  }

  function handleProofClick(event) {
    const btn = event.currentTarget;
    const proofUrl = btn.getAttribute('data-proof-url');
    const player = btn.getAttribute('data-player');
    const category = btn.getAttribute('data-category');
    const value = btn.getAttribute('data-value');
    const map = btn.getAttribute('data-map');
    const vehicle = btn.getAttribute('data-vehicle');
    const agent = btn.getAttribute('data-agent');

    if (!proofUrl) {
      alert('No proof image available for this record.');
      return;
    }

    proofImage.src = proofUrl;
    proofPlayer.textContent = player;
    proofCategory.textContent = category;
    proofValue.textContent = value;
    proofMap.textContent = map;
    proofVehicle.textContent = vehicle;
    proofAgent.textContent = agent;

    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
      if (!modalOverlay.classList.contains('active')) {
        proofImage.src = '';
      }
    }, 200);
  }

  // Fetch records - exactly like tanks.js does it
  async function fetchRecords() {
    try {
      recordsLoading.style.display = 'flex';
      recordsError.style.display = 'none';
      recordsGrid.style.display = 'none';

      const response = await fetch(RECORDS_JSON_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }

      recordsData = data;
      categoriesWithRecords.clear();

      recordsLoading.style.display = 'none';
      recordsGrid.style.display = 'grid';
      renderRecords();

    } catch (error) {
      console.error('Error loading player records:', error);
      recordsLoading.style.display = 'none';
      recordsError.style.display = 'block';
      recordsGrid.style.display = 'none';
    }
  }

  // Modal close handlers
  function initModal() {
    if (modalClose) {
      modalClose.addEventListener('click', closeModal);
    }
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          closeModal();
        }
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
      }
    });
  }

  // Retry handler
  if (retryBtn) {
    retryBtn.addEventListener('click', fetchRecords);
  }

  // Initialize
  function init() {
    initModal();
    fetchRecords();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();