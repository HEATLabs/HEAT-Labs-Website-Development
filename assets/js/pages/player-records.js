// player-records logic
(function() {
    // Configuration
    const RECORDS_JSON_URL = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/player-records.json';
    const DISCORD_INVITE_URL = 'https://discord.gg/KRYEw9aGZT';

    // Category mapping for display names and icons
    const CATEGORY_CONFIG = {
        'Total Captures': {
            icon: 'fa-flag-checkered',
            color: '#ff8300',
            unit: ' Captures'
        },
        'Total Vehicles Destroyed': {
            icon: 'fa-tank',
            color: '#ff8300',
            unit: ' Kills'
        },
        'Total Deaths': {
            icon: 'fa-skull',
            color: '#ff8300',
            unit: ' Deaths'
        },
        'Total Assists': {
            icon: 'fa-hands-helping',
            color: '#ff8300',
            unit: ' Assists'
        },
        'Total Damage Caused': {
            icon: 'fa-bolt',
            color: '#ff8300',
            unit: ' HP'
        },
        'Total Damage Blocked': {
            icon: 'fa-shield-haltered',
            color: '#ff8300',
            unit: ' HP'
        }
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

    // Past Records Modal Elements
    const pastModalOverlay = document.getElementById('pastRecordsModalOverlay');
    const pastModalClose = document.getElementById('pastRecordsModalClose');
    const pastModalTitle = document.getElementById('pastModalTitle');
    const pastRecordsList = document.getElementById('pastRecordsList');

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

    // Group records by category - returns all records, not just top
    function groupAllRecordsByCategory(records) {
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

    // Create a record card HTML with "View Past Records" button (no counter)
    function createRecordCard(category, topRecord, allRecords) {
        const icon = getCategoryIcon(category);
        const unit = getCategoryUnit(category);
        const formattedValue = formatNumber(topRecord.number);
        const pastRecordsCount = allRecords.length - 1; // Excluding top record

        // Prepare past records data as JSON attribute
        const pastRecordsData = allRecords.slice(1).map(record => ({
            player_name: record.player_name,
            number: record.number,
            vehicle: record.vehicle,
            agent: record.agent,
            map: record.map,
            timestamp: record.timestamp,
            proof_image: record.proof_image,
            entry_id: record.entry_id
        }));

        return `
      <div class="record-card" data-category="${category}" data-entry-id="${topRecord.entry_id}">
        <div class="record-card-header">
          <span class="record-category">
            <i class="fas ${icon}"></i> ${category}
          </span>
          <span class="record-value-large">${formattedValue}${unit}</span>
        </div>
        <div class="record-card-body">
          <div class="record-player">
            <div class="record-player-info">
              <h4>${escapeHtml(topRecord.player_name || 'Unknown Player')}</h4>
              <p>Current record holder</p>
            </div>
          </div>
          <div class="record-details">
            <div class="record-detail-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>Map:</span>
              <span>${escapeHtml(topRecord.map || 'Unknown')}</span>
            </div>
            <div class="record-detail-item">
              <i class="fas fa-car"></i>
              <span>Vehicle:</span>
              <span>${escapeHtml(topRecord.vehicle || 'Unknown')}</span>
            </div>
            <div class="record-detail-item">
              <i class="fas fa-user-ninja"></i>
              <span>Agent:</span>
              <span>${escapeHtml(topRecord.agent || 'Unknown')}</span>
            </div>
            <div class="record-detail-item">
              <i class="fas fa-calendar-alt"></i>
              <span>Recorded:</span>
              <span>${formatDate(topRecord.timestamp)}</span>
            </div>
          </div>
          <div class="record-actions">
            <button class="btn-proof" data-proof-url="${topRecord.proof_image || ''}" data-player="${escapeHtml(topRecord.player_name)}" data-category="${category}" data-value="${formattedValue}" data-map="${escapeHtml(topRecord.map)}" data-vehicle="${escapeHtml(topRecord.vehicle)}" data-agent="${escapeHtml(topRecord.agent)}">
              <i class="fas fa-camera"></i> View Proof
            </button>
            ${pastRecordsCount > 0 ? `
            <button class="btn-past-records" data-category="${category}" data-past-records='${JSON.stringify(pastRecordsData).replace(/'/g, "&#39;")}'>
              <i class="fas fa-history"></i> Past Records
            </button>
            ` : ''}
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

    // Format date for past records display
    function formatDateTime(timestamp) {
        if (!timestamp) return 'Unknown date';
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return timestamp;
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

    // Render all records with past records
    function renderRecords() {
        if (!recordsData || recordsData.length === 0) {
            renderEmptyCategories();
            return;
        }

        const groupedRecords = groupAllRecordsByCategory(recordsData);
        let allCardsHtml = '';

        for (const category of ALL_CATEGORIES) {
            const categoryRecords = groupedRecords[category];
            if (categoryRecords && categoryRecords.length > 0) {
                const topRecord = categoryRecords[0];
                allCardsHtml += createRecordCard(category, topRecord, categoryRecords);
            } else {
                allCardsHtml += createEmptyCategoryCard(category);
            }
        }

        recordsGrid.innerHTML = allCardsHtml;
        attachProofButtonListeners();
        attachPastRecordsButtonListeners();
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

    // Attach event listeners to past records buttons
    function attachPastRecordsButtonListeners() {
        const pastButtons = document.querySelectorAll('.btn-past-records');
        pastButtons.forEach(btn => {
            btn.removeEventListener('click', handlePastRecordsClick);
            btn.addEventListener('click', handlePastRecordsClick);
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

    function handlePastRecordsClick(event) {
        const btn = event.currentTarget;
        const category = btn.getAttribute('data-category');
        const pastRecordsJson = btn.getAttribute('data-past-records');

        if (!pastRecordsJson) {
            alert('No past records available.');
            return;
        }

        try {
            const pastRecords = JSON.parse(pastRecordsJson);
            pastModalTitle.textContent = `${category} - Past Records`;

            // Generate HTML for past records list
            let recordsHtml = '';
            if (pastRecords.length === 0) {
                recordsHtml = `
          <div class="past-records-empty">
            <i class="fas fa-history"></i>
            <p>No past records available for this category.</p>
          </div>
        `;
            } else {
                pastRecords.forEach((record, index) => {
                    recordsHtml += `
          <div class="past-record-item" data-record-index="${index}">
            <div class="past-record-rank">#${index + 1}</div>
            <div class="past-record-content">
              <div class="past-record-header">
                <span class="past-record-value">${formatNumber(record.number)}${getCategoryUnit(category)}</span>
                <span class="past-record-date">${formatDateTime(record.timestamp)}</span>
              </div>
              <div class="past-record-player">
                <span class="past-record-player-name">${escapeHtml(record.player_name || 'Unknown Player')}</span>
              </div>
              <div class="past-record-details">
                <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(record.map || 'Unknown')}</span>
                <span><i class="fas fa-car"></i> ${escapeHtml(record.vehicle || 'Unknown')}</span>
                <span><i class="fas fa-user-ninja"></i> ${escapeHtml(record.agent || 'Unknown')}</span>
              </div>
              ${record.proof_image ? `
              <div class="past-record-actions">
                <button class="btn-past-proof" data-proof-url="${record.proof_image}" data-player="${escapeHtml(record.player_name)}" data-category="${category}" data-value="${formatNumber(record.number)}" data-map="${escapeHtml(record.map)}" data-vehicle="${escapeHtml(record.vehicle)}" data-agent="${escapeHtml(record.agent)}">
                  <i class="fas fa-camera"></i> View Proof
                </button>
              </div>
              ` : ''}
            </div>
          </div>
        `;
                });
            }

            pastRecordsList.innerHTML = recordsHtml;
            pastModalOverlay.classList.add('active');

            // Attach proof button listeners for past records
            const pastProofButtons = pastRecordsList.querySelectorAll('.btn-past-proof');
            pastProofButtons.forEach(btn => {
                btn.removeEventListener('click', handlePastProofClick);
                btn.addEventListener('click', handlePastProofClick);
            });

        } catch (e) {
            console.error('Error parsing past records:', e);
            alert('Error loading past records.');
        }
    }

    function handlePastProofClick(event) {
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

        pastModalOverlay.classList.remove('active');
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

    function closePastModal() {
        pastModalOverlay.classList.remove('active');
        setTimeout(() => {
            if (!pastModalOverlay.classList.contains('active')) {
                pastRecordsList.innerHTML = '';
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
        if (pastModalClose) {
            pastModalClose.addEventListener('click', closePastModal);
        }
        if (pastModalOverlay) {
            pastModalOverlay.addEventListener('click', (e) => {
                if (e.target === pastModalOverlay) {
                    closePastModal();
                }
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (modalOverlay.classList.contains('active')) {
                    closeModal();
                }
                if (pastModalOverlay.classList.contains('active')) {
                    closePastModal();
                }
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