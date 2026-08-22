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

    // Cache for mod details
    const modDetailsCache = new Map();

    // Platform icon mapping
    const platformIcons = {
        'Windows': 'fa-brands fa-microsoft',
        'MacOS': 'fa-brands fa-apple',
        'Linux': 'fa-brands fa-linux'
    };

    // Platform short names for display
    const platformShortNames = {
        'Windows': 'Win',
        'MacOS': 'Mac',
        'Linux': 'Lin'
    };

    // Parse markdown frontmatter
    function parseFrontmatter(markdown) {
        try {
            const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
            const match = markdown.match(frontmatterRegex);

            if (!match) {
                console.warn('No frontmatter found in markdown');
                return null;
            }

            const frontmatterText = match[1];
            const lines = frontmatterText.split('\n');
            const data = {};

            let currentKey = null;
            let currentValue = [];
            let isMultiline = false;

            for (let line of lines) {
                line = line.trim();
                if (line === '') continue;

                // Check if it's a key: value line
                const keyValueMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);

                if (keyValueMatch) {
                    // If we were building a multiline value, save it
                    if (currentKey && isMultiline) {
                        data[currentKey] = currentValue.join('\n').trim();
                        currentKey = null;
                        currentValue = [];
                        isMultiline = false;
                    }

                    const key = keyValueMatch[1];
                    let value = keyValueMatch[2];

                    // Check if this is the start of a list or multiline value
                    if (value === '') {
                        currentKey = key;
                        currentValue = [];
                        isMultiline = true;
                        continue;
                    }

                    // Try to parse arrays
                    if (value.startsWith('[') && value.endsWith(']')) {
                        try {
                            const arrayMatch = value.match(/\[(.*)\]/);
                            if (arrayMatch) {
                                const items = arrayMatch[1].split(',').map(item =>
                                    item.trim().replace(/^["']|["']$/g, '')
                                );
                                data[key] = items;
                                continue;
                            }
                        } catch (e) {
                            // If parsing fails, store as string
                        }
                    }

                    // Try to parse booleans
                    if (value === 'true' || value === 'false') {
                        data[key] = value === 'true';
                        continue;
                    }

                    // Try to parse numbers
                    if (!isNaN(value) && value !== '') {
                        data[key] = Number(value);
                        continue;
                    }

                    data[key] = value;
                } else if (currentKey && isMultiline) {
                    // This is a continuation of a multiline value
                    currentValue.push(line);
                }
            }

            // Save any remaining multiline value
            if (currentKey && isMultiline) {
                data[currentKey] = currentValue.join('\n').trim();
            }

            return data;
        } catch (error) {
            console.error('Error parsing frontmatter:', error);
            return null;
        }
    }

    // Fetch mod details from markdown file
    async function fetchModDetails(detailsUrl) {
        if (modDetailsCache.has(detailsUrl)) {
            return modDetailsCache.get(detailsUrl);
        }

        try {
            console.log('Fetching details from:', detailsUrl);
            const response = await fetch(detailsUrl);
            if (!response.ok) {
                throw new Error(`Failed to load mod details: ${detailsUrl} (${response.status})`);
            }
            const markdown = await response.text();
            const frontmatter = parseFrontmatter(markdown);

            if (frontmatter) {
                console.log('Parsed frontmatter:', frontmatter);
                modDetailsCache.set(detailsUrl, frontmatter);
                return frontmatter;
            }
            return null;
        } catch (error) {
            console.error('Error loading mod details:', error);
            return null;
        }
    }

    // Get platform support from downloads
    function getPlatformsFromDownloads(downloads) {
        if (!downloads || !downloads.links || !Array.isArray(downloads.links)) {
            return [];
        }
        const platforms = downloads.links
            .filter(link => link.os && link.os !== 'URL' && link.os.trim() !== '')
            .map(link => link.os);

        console.log('Extracted platforms:', platforms);
        return platforms;
    }

    // Fetch mod data from JSON file
    async function fetchModData() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/mods.json');
            if (!response.ok) {
                throw new Error('Failed to load mod data');
            }
            const data = await response.json();
            console.log('Loaded mods from JSON:', data);

            // Fetch details for each mod to get actual category and platform info
            const enrichedData = [];
            for (const mod of data) {
                let details = null;

                if (mod.details) {
                    details = await fetchModDetails(mod.details);
                }

                if (details) {
                    // Use category from details if available
                    if (details.category) {
                        mod.category = details.category;
                        console.log(`Updated category for ${mod.name}: ${mod.category}`);
                    } else {
                        // If no category in details, use a default
                        mod.category = 'Gameplay';
                        console.warn(`No category found in details for ${mod.name}, using default: Gameplay`);
                    }

                    // Store platform info
                    if (details.downloads) {
                        mod.platforms = getPlatformsFromDownloads(details.downloads);
                        console.log(`Platforms for ${mod.name}:`, mod.platforms);
                    } else {
                        // Default platform if none found
                        mod.platforms = ['Windows'];
                        console.warn(`No downloads found in details for ${mod.name}, using default: Windows`);
                    }
                } else {
                    // No details found, use defaults
                    console.warn(`No details found for ${mod.name}, using defaults`);

                    // Check if category already exists in the JSON (fallback)
                    if (!mod.category) {
                        mod.category = 'Gameplay';
                    }

                    if (!mod.platforms || mod.platforms.length === 0) {
                        mod.platforms = ['Windows'];
                    }
                }

                // Ensure category is always set
                if (!mod.category) {
                    mod.category = 'Gameplay';
                }

                // Ensure platforms is always an array
                if (!mod.platforms || !Array.isArray(mod.platforms)) {
                    mod.platforms = ['Windows'];
                }

                enrichedData.push(mod);
            }

            allModsData = enrichedData;
            console.log('Final enriched data:', enrichedData);
            return enrichedData;
        } catch (error) {
            console.error('Error loading mod data:', error);
            return []; // Return empty array if there's an error
        }
    }

    // Get first category for display (splits by comma and takes the first one)
    function getDisplayCategory(category) {
        if (!category) return 'Gameplay';
        const categories = category.split(',').map(c => c.trim());
        return categories[0] || 'Gameplay';
    }

    // Get all categories as an array for filtering
    function getCategoryArray(category) {
        if (!category) return ['Gameplay'];
        return category.split(',').map(c => c.trim());
    }

    // Create platform badges HTML
    function createPlatformBadges(platforms) {
        if (!platforms || platforms.length === 0) {
            console.log('No platforms found for this mod, using default Windows');
            return '<span class="mod-platform-badge" title="Windows"><i class="fa-brands fa-windows"></i></span>';
        }

        console.log('Creating badges for platforms:', platforms);

        return platforms.map(platform => {
            const icon = platformIcons[platform] || 'fa-solid fa-desktop';
            const shortName = platformShortNames[platform] || platform.substring(0, 3);
            return `<span class="mod-platform-badge" title="${platform}"><i class="${icon}"></i></span>`;
        }).join('');
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
        card.setAttribute('data-status', mod.status || 'Unknown');
        card.setAttribute('data-mod-id', mod.id);

        const displayCategory = getDisplayCategory(mod.category);

        // Only show mod status if it exists
        const modStatusHTML = mod.status && mod.status.trim() !== '' ?
            `<div class="mod-status">${mod.status}</div>` : '';

        // Platform badges - force at least Windows if none found
        let platforms = mod.platforms || [];
        if (platforms.length === 0) {
            platforms = ['Windows']; // Default
        }

        const platformBadgesHTML = `<div class="mod-platforms">${createPlatformBadges(platforms)}</div>`;

        // Use the slug directly - if it's a full URL, use it as-is
        const viewLink = mod.slug.startsWith('http') ? mod.slug : `${window.location.origin}/${mod.slug}`;

        card.innerHTML = `
            <div class="mod-img-container">
                <img src="${mod.image}" alt="${mod.name} Preview" class="mod-img" onerror="this.src='https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/placeholder/imagefailedtoload.webp'">
                ${modStatusHTML}
                ${platformBadgesHTML}
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
                    <a href="${viewLink}" class="btn-accent" target="_blank" rel="noopener noreferrer">
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
                    cardCategories = ['Gameplay'];
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