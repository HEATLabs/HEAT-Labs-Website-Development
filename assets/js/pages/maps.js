// Function to fetch view count from API
async function fetchViewCount(imageName) {
    try {
        const response = await fetch(`https://views.heatlabs.net/api/stats?image=pcwstats-tracker-pixel-${imageName}.png`);
        if (!response.ok) {
            throw new Error('Failed to load view count');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading view count:', error);
        return {
            totalViews: 0
        }; // Return 0 if there's an error
    }
}

// Function to update view counters on all map cards
async function updateMapViewCounters() {
    const mapCards = document.querySelectorAll('.map-card');

    for (const card of mapCards) {
        const mapLink = card.querySelector('a.btn-map');
        if (mapLink) {
            // Extract the map name from the href (e.g., "maps/nord-oko.html" -> "nord-oko")
            const mapName = mapLink.getAttribute('href').split('/').pop().replace('.html', '');

            // Fetch the view count
            const viewsData = await fetchViewCount(mapName);
            const viewsElement = card.querySelector('.views-count');

            if (viewsElement) {
                viewsElement.textContent = viewsData.totalViews.toLocaleString();
            }
        }
    }
}

// Fetch map data from JSON file
async function fetchMapData() {
    try {
        const response = await fetch('https://cdn1.heatlabs.net/maps.json');
        if (!response.ok) {
            throw new Error('Failed to load map data');
        }
        const data = await response.json();
        return data.maps; // Return the maps array from the JSON
    } catch (error) {
        console.error('Error loading map data:', error);
        return []; // Return empty array if there's an error
    }
}

// Create map card HTML
function createMapCard(map) {
    const card = document.createElement('div');
    card.className = 'map-card';
    card.setAttribute('data-status', map.status);
    card.setAttribute('data-map-id', map.id);
    card.setAttribute('data-state', map.state);

    // Calculate area for sorting if size is known
    let area = 0;
    if (map.size !== 'Unknown Size' && map.size.includes('x')) {
        const dimensions = map.size.split('x').map(dim => parseInt(dim.trim().replace('m', '')));
        if (dimensions.length === 2 && !isNaN(dimensions[0]) && !isNaN(dimensions[1])) {
            area = dimensions[0] * dimensions[1];
        }
    }
    card.setAttribute('data-area', area);

    // Format size display - show "Unknown Size" if it's unknown
    const sizeDisplay = map.size === 'Unknown Size' ? 'Unknown Size' : map.size;

    card.innerHTML = `
        <div class="map-img-container">
            <div class="map-views-counter">
                <i class="fas fa-eye"></i>
                <span class="views-count">0</span>
            </div>
            <img src="${map.image}" alt="${map.name} Map" class="map-img" onerror="this.src='https://cdn5.heatlabs.net/placeholder/imagefailedtoload.webp'">
            <div class="map-tag">${map.status}</div>
        </div>
        <div class="map-info">
            <h3>${map.name}</h3>
            <div class="map-meta items-center">
                <span><i class="fas fa-ruler-combined"></i> ${sizeDisplay}</span>
                <span><i class="fas fa-route"></i> ${map.type}</span>
            </div>
            <p class="map-desc">${map.description}</p>
            <a href="maps/${map.slug}" class="btn-accent btn-map">
                <i class="fas fa-map-marked-alt mr-2"></i>View Map
            </a>
        </div>
    `;

    return card;
}

// Animate map cards into view
function animateMapCards() {
    const mapCards = Array.from(document.querySelectorAll('.map-card'));
    mapCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animated');
        }, index * 100); // Stagger the animations
    });
}

// Render all map cards
async function renderMapCards() {
    const mapsGrid = document.querySelector('.maps-grid');

    // Clear existing hardcoded cards
    mapsGrid.innerHTML = '';

    const maps = await fetchMapData();

    if (!maps || maps.length === 0) {
        mapsGrid.innerHTML = '<p class="text-center py-10">Failed to load map data. Please try again later.</p>';
        return;
    }

    // Create and append cards for each map that has state: "displayed"
    maps.forEach(map => {
        // Only create cards for maps with state: "displayed"
        if (map.state === "displayed") {
            const card = createMapCard(map);
            mapsGrid.appendChild(card);
        }
    });

    // Animate the cards into view
    animateMapCards();

    // Update view counters
    updateMapViewCounters();

    // Re-initialize filter functionality with new cards
    initFilterButtons();
    filterMaps();
}

// Initialize filters
const filters = {
    size: [],
    status: ['Available Now']
};

// DOM elements
const activeFiltersContainer = document.querySelector('.active-filters');
const noFiltersMessage = document.querySelector('.no-filters-message');
const mapsGrid = document.querySelector('.maps-grid');
let mapCards = [];

// Function to extract size from map card
function getMapSize(card) {
    const area = parseInt(card.getAttribute('data-area'));
    return area;
}

// Filter maps based on active filters
function filterMaps() {
    // Get fresh list of map cards
    mapCards = Array.from(document.querySelectorAll('.map-card'));

    mapCards.forEach(card => {
        const cardStatus = card.querySelector('.map-tag')?.textContent || 'Unknown';
        const cardState = card.getAttribute('data-state');

        // Skip hidden cards
        if (cardState === 'hidden') {
            card.style.display = 'none';
            return;
        }

        const statusMatch = filters.status.length === 0 ||
            (filters.status.includes('Available Now') && cardStatus === 'Available Now') ||
            (filters.status.includes('To Be Released') && cardStatus === 'To Be Released');

        let sizeMatch = true;
        if (filters.size.length > 0) {
            if (filters.size.includes('Biggest First') || filters.size.includes('Smallest First')) {
                // Sorting will handle this
                sizeMatch = true;
            }
        }

        if (statusMatch && sizeMatch) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Apply sorting if size filter is active
    if (filters.size.length > 0) {
        const container = document.querySelector('.maps-grid');
        const cards = Array.from(container.querySelectorAll('.map-card[style*="display: block"]'));

        cards.sort((a, b) => {
            const sizeA = getMapSize(a);
            const sizeB = getMapSize(b);

            if (filters.size.includes('Biggest First')) {
                return sizeB - sizeA;
            } else {
                return sizeA - sizeB;
            }
        });

        // Re-append sorted cards
        cards.forEach(card => container.appendChild(card));
    }
}

// Toggle filter on/off
function toggleFilter(filterType, value, button) {
    // For both size and status filters, only allow one to be active at a time
    if (filterType === 'size' || filterType === 'status') {
        const isAlreadyActive = filters[filterType].includes(value);

        if (isAlreadyActive) {
            // If clicking the active filter, remove it
            filters[filterType] = [];
            button.classList.remove('active');
        } else {
            // Otherwise, set this as the only active filter
            filters[filterType] = [value];

            // Update all filter buttons of this type
            document.querySelectorAll(`.${filterType}-filter`).forEach(btn => {
                btn.classList.remove('active');
            });

            // Activate the clicked button
            button.classList.add('active');
        }
    }

    updateActiveFilters();
    filterMaps();
}

// Update active filters display
function updateActiveFilters() {
    activeFiltersContainer.innerHTML = '';

    // Check if any filters are active
    const hasFilters = filters.size.length > 0 || filters.status.length > 0;

    if (!hasFilters) {
        activeFiltersContainer.innerHTML = '<div class="no-filters-message">No filters selected</div>';
        return;
    }

    // Add size filters
    filters.size.forEach(size => {
        const pill = createFilterPill(size, 'size');
        activeFiltersContainer.appendChild(pill);
    });

    // Add status filters
    filters.status.forEach(status => {
        const pill = createFilterPill(status, 'status');
        activeFiltersContainer.appendChild(pill);
    });
}

// Create filter pill element
function createFilterPill(value, filterType) {
    const pill = document.createElement('div');
    pill.className = 'filter-pill';
    pill.innerHTML = `
        ${value}
        <button class="remove-filter" data-filter-type="${filterType}" data-value="${value}">
            <i class="fas fa-times"></i>
        </button>
    `;

    pill.querySelector('.remove-filter').addEventListener('click', function() {
        const filterType = this.getAttribute('data-filter-type');
        const value = this.getAttribute('data-value');

        // Remove from filters
        const index = filters[filterType].indexOf(value);
        if (index !== -1) {
            filters[filterType].splice(index, 1);
        }

        // Update corresponding filter button
        const button = document.querySelector(`.${filterType}-filter[data-${filterType}="${value}"]`);
        if (button) button.classList.remove('active');

        updateActiveFilters();
        filterMaps();
    });

    return pill;
}

// Initialize filter buttons
function initFilterButtons() {
    // Size filter buttons
    document.querySelectorAll('.size-filter').forEach(button => {
        button.addEventListener('click', function() {
            const size = this.getAttribute('data-size');
            toggleFilter('size', size, this);
        });
    });

    // Status filter buttons
    document.querySelectorAll('.status-filter').forEach(button => {
        button.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            toggleFilter('status', status, this);
        });
    });

    // Initialize active filters display
    updateActiveFilters();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Render dynamic map cards
    renderMapCards();

    // Sets default map status filter to Available Now
    const availableNowBtn = document.querySelector('.status-filter[data-status="Available Now"]');
    if (availableNowBtn) {
        availableNowBtn.classList.add('active');
    }
});