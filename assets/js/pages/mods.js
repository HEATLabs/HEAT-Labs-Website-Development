document.addEventListener('DOMContentLoaded', function() {
    // Initialize filters
    const filters = {
        category: [],
        status: []
    };

    // DOM elements
    const activeFiltersContainer = document.querySelector('.mods-active-filters');
    const modsGrid = document.querySelector('.mods-grid');
    let modCards = [];
    let allModsData = [];

    // Fetch mod data from JSON file
    async function fetchModData() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/mods.json');
            if (!response.ok) {
                throw new Error('Failed to load mod data');
            }
            const data = await response.json();
            allModsData = data;
            return data;
        } catch (error) {
            console.error('Error loading mod data:', error);
            return []; // Return empty array if theres an error
        }
    }

    // Get first category for display (splits by comma and takes the first one)
    function getDisplayCategory(category) {
        if (!category) return 'Unknown';
        const categories = category.split(',').map(c => c.trim());
        return categories[0] || 'Unknown';
    }

    // Get all categories as an array for filtering
    function getCategoryArray(category) {
        if (!category) return ['Unknown'];
        return category.split(',').map(c => c.trim());
    }

    // Create mod card HTML
    function createModCard(mod) {
        const card = document.createElement('div');
        card.className = 'mod-card';
        card.setAttribute('data-creator', mod.creator);
        // Store the raw category string for filtering
        card.setAttribute('data-category-raw', mod.category);
        // Store individual categories as data attributes for easier filtering
        const categories = getCategoryArray(mod.category);
        card.setAttribute('data-categories', JSON.stringify(categories));
        card.setAttribute('data-status', mod.status);
        card.setAttribute('data-mod-id', mod.id);

        const displayCategory = getDisplayCategory(mod.category);

        // Only show mod status if it exists
        const modStatusHTML = mod.status && mod.status.trim() !== '' ?
            `<div class="mod-status">${mod.status}</div>` : '';

        card.innerHTML = `
            <div class="mod-img-container">
                <img src="${mod.image}" alt="${mod.name} Preview" class="mod-img" onerror="this.src='https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/placeholder/imagefailedtoload.webp'">
                ${modStatusHTML}
            </div>
            <div class="mod-info">
                <h3>${mod.name}</h3>
                <div class="mod-meta">
                    <span><i class="fas fa-user"></i> By ${mod.creator}</span>
                    <span><i class="fas fa-tag"></i> ${displayCategory}</span>
                </div>
                <div class="mod-description">
                    ${mod.description}
                </div>
                <div class="mod-buttons">
                    <a href="${mod.slug}" class="btn-accent" target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-external-link-alt mr-2"></i>View Mod
                    </a>
                </div>
            </div>
        `;

        return card;
    }

    // Animate mod cards into view
    function animateModCards() {
        modCards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animated');
            }, index * 100); // Stagger the animations
        });
    }

    // Render all mod cards
    async function renderModCards() {
        const mods = await fetchModData();
        modsGrid.innerHTML = ''; // Clear existing cards

        if (!mods || mods.length === 0) {
            modsGrid.innerHTML = '<p class="text-center py-10">Failed to load mod data. Please try again later.</p>';
            return;
        }

        // Create and append cards for each mod
        mods.forEach(mod => {
            const card = createModCard(mod);
            modsGrid.appendChild(card);
        });

        // Store references to all mod cards
        modCards = Array.from(document.querySelectorAll('.mod-card'));

        // Animate the cards into view
        animateModCards();

        // Initialize filter functionality
        initFilterButtons();
    }

    // Initialize filter buttons
    function initFilterButtons() {
        // Status filter buttons
        document.querySelectorAll('.status-filter').forEach(button => {
            button.addEventListener('click', function() {
                const status = this.getAttribute('data-status');
                toggleFilter('status', status, this);
                filterMods();
            });
        });

        // Category filter buttons
        document.querySelectorAll('.category-filter').forEach(button => {
            button.addEventListener('click', function() {
                const category = this.getAttribute('data-category');
                toggleFilter('category', category, this);
                filterMods();
            });
        });

        // Initialize active filters display
        updateActiveFilters();
    }

    // Toggle filter on/off
    function toggleFilter(filterType, value, button) {
        const index = filters[filterType].indexOf(value);

        if (index === -1) {
            filters[filterType].push(value);
            button.classList.add('active');
        } else {
            filters[filterType].splice(index, 1);
            button.classList.remove('active');
        }

        updateActiveFilters();
    }

    // Update active filters display
    function updateActiveFilters() {
        activeFiltersContainer.innerHTML = '';

        // Check if any filters are active
        const hasFilters = filters.category.length > 0 || filters.status.length > 0;

        if (!hasFilters) {
            activeFiltersContainer.innerHTML = '<div class="mods-no-filters-message">No filters selected</div>';
            return;
        }

        // Add category filters
        filters.category.forEach(category => {
            const pill = createFilterPill(category, 'category');
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
        pill.className = 'mods-filter-pill';
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
            filterMods();
        });

        return pill;
    }

    // Filter mods based on active filters
    function filterMods() {
        if (modCards.length === 0) return;

        modCards.forEach(card => {
            // Get the status from the mod-status element (if it exists)
            const cardStatus = card.querySelector('.mod-status') ?
                card.querySelector('.mod-status').textContent : 'Unknown';

            // Get the categories from the data-categories attribute
            let cardCategories = [];
            try {
                const categoriesData = card.getAttribute('data-categories');
                if (categoriesData) {
                    cardCategories = JSON.parse(categoriesData);
                }
            } catch (e) {
                // Fallback: try to get from raw category attribute
                const rawCategory = card.getAttribute('data-category-raw');
                if (rawCategory) {
                    cardCategories = rawCategory.split(',').map(c => c.trim());
                } else {
                    cardCategories = ['Unknown'];
                }
            }

            // Check if any of the card's categories match the selected filters
            const categoryMatch = filters.category.length === 0 ||
                cardCategories.some(cat => filters.category.includes(cat));

            const statusMatch = filters.status.length === 0 || filters.status.includes(cardStatus);

            if (categoryMatch && statusMatch) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Initialize the page
    renderModCards();
});