// Store all posts data
let allGuides = [];
let filteredGuides = [];
let currentPage = 1;
let guidesPerPage = 12;

// Function to fetch guides data from JSON
async function fetchGuidesData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/guides.json');
        if (!response.ok) {
            throw new Error('Failed to load guides data');
        }
        const data = await response.json();
        return data.posts || [];
    } catch (error) {
        console.error('Error loading guides data:', error);
        return [];
    }
}

// Function to format date as "Month Day, Year"
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

// Function to get unique types from guides
function getUniqueTypes(guides) {
    const types = new Set();
    guides.forEach(guide => {
        if (guide.type) {
            types.add(guide.type);
        }
    });
    return ['all', ...Array.from(types)];
}

// Function to format type name for display
function formatTypeName(type) {
    if (type === 'all') return 'All Types';
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Function to populate type filter
function populateTypeFilter(types) {
    const filterSelect = document.getElementById('typeFilter');
    if (!filterSelect) return;

    filterSelect.innerHTML = '';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = formatTypeName(type);
        filterSelect.appendChild(option);
    });
}

// Function to create a guide card element
function createGuideCard(guide) {
    const card = document.createElement('div');
    card.className = 'guide-card';
    card.dataset.date = guide.raw_date || guide.date;
    card.dataset.type = guide.type || 'uncategorized';

    // Format the date
    const formattedDate = guide.raw_date || formatDate(guide.date);

    // Determine tag display name
    const tagDisplay = guide.type_name || (guide.type ? formatTypeName(guide.type) : 'Guide');

    // Build the href
    let href;
    let targetAttr = '';
    if (guide.slug.startsWith('http')) {
        href = guide.slug;
        targetAttr = 'target="_blank" rel="noopener noreferrer"';
    } else {
        href = `guides/${guide.slug}`;
    }

    card.innerHTML = `
        <div class="guide-img-container">
            <img alt="${guide.title}" class="guide-img" src="${guide.image}" loading="lazy" />
            <span class="guide-date">${formattedDate}</span>
        </div>
        <div class="guide-content">
            <div class="guide-meta">
                <span class="guide-type-tag">${tagDisplay}</span>
                <span class="guide-author"><i class="fas fa-user"></i> ${guide.author}</span>
            </div>
            <h4>${guide.title}</h4>
            <p class="guide-excerpt">${guide.description}</p>
            <a class="btn-accent" href="${href}" ${targetAttr}>
                <i class="fas fa-book-open mr-2"></i>Read Guide
            </a>
        </div>
    `;

    return card;
}

// Function to update pagination controls
function updatePaginationControls(totalPages) {
    const paginationContainer = document.querySelector('.pagination-controls');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = 'pagination-button';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderCurrentPage();
        }
    });
    paginationContainer.appendChild(prevButton);

    // Page numbers
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.textContent = '1';
        firstPageButton.className = 'pagination-button';
        firstPageButton.addEventListener('click', () => {
            currentPage = 1;
            renderCurrentPage();
        });
        paginationContainer.appendChild(firstPageButton);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.className = `pagination-button ${i === currentPage ? 'active' : ''}`;
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderCurrentPage();
        });
        paginationContainer.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            ellipsis.className = 'pagination-ellipsis';
            paginationContainer.appendChild(ellipsis);
        }

        const lastPageButton = document.createElement('button');
        lastPageButton.textContent = totalPages;
        lastPageButton.className = 'pagination-button';
        lastPageButton.addEventListener('click', () => {
            currentPage = totalPages;
            renderCurrentPage();
        });
        paginationContainer.appendChild(lastPageButton);
    }

    // Next button
    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = 'pagination-button';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderCurrentPage();
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Function to filter guides based on current filters
function filterGuides() {
    const typeFilter = document.getElementById('typeFilter');
    const sortFilter = document.getElementById('sortFilter');

    const typeValue = typeFilter ? typeFilter.value : 'all';
    const sortValue = sortFilter ? sortFilter.value : 'latest';

    // Filter by type
    let filtered = allGuides;
    if (typeValue !== 'all') {
        filtered = filtered.filter(guide => guide.type === typeValue);
    }

    // Sort by date
    filtered.sort((a, b) => {
        const dateA = new Date(a.raw_date || a.date);
        const dateB = new Date(b.raw_date || b.date);
        return sortValue === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
}

// Function to render the current page
function renderCurrentPage() {
    const guidesGrid = document.querySelector('.guides-grid');
    if (!guidesGrid) return;

    // Get filtered guides
    filteredGuides = filterGuides();

    // Calculate pagination
    const totalPages = Math.ceil(filteredGuides.length / guidesPerPage);
    const startIndex = (currentPage - 1) * guidesPerPage;
    const endIndex = Math.min(startIndex + guidesPerPage, filteredGuides.length);
    const paginatedGuides = filteredGuides.slice(startIndex, endIndex);

    // Clear the grid
    guidesGrid.innerHTML = '';

    // Check if there are any guides to display
    if (paginatedGuides.length === 0) {
        guidesGrid.innerHTML = `
            <div class="text-center py-12 col-span-full no-guides-placeholder">
                <div class="placeholder-icon">
                    <i class="fas fa-book-open"></i>
                </div>
                <h3>No Guides Found</h3>
                <p>Try adjusting your filters. If you'd like to contribute a guide, we'd love to hear from you!</p>
                <div class="mt-4 flex gap-4 justify-center flex-wrap">
                    <a href="discord" class="cta-button inline-flex items-center px-6 py-3 bg-discord-color text-white rounded-lg font-medium hover:bg-discord-color-dark transition-colors">
                        <i class="fab fa-discord mr-2"></i> Join Discord
                    </a>
                    <a href="resources/contact-us" class="cta-button inline-flex items-center px-6 py-3 bg-accent-color text-white rounded-lg font-medium hover:bg-accent-color-dark transition-colors">
                        <i class="fas fa-pen-fancy mr-2"></i> Submit Guide
                    </a>
                </div>
            </div>
        `;
        // Hide pagination if no results
        const paginationContainer = document.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }

    // Show pagination if there are results
    const paginationContainer = document.querySelector('.pagination-container');
    if (paginationContainer) {
        paginationContainer.style.display = 'flex';
    }

    // Add cards back to the grid
    paginatedGuides.forEach(guide => {
        const card = createGuideCard(guide);
        guidesGrid.appendChild(card);
    });

    // Update pagination controls
    updatePaginationControls(totalPages);

    // Reinitialize animations
    setTimeout(() => {
        const currentCards = guidesGrid.querySelectorAll('.guide-card');
        currentCards.forEach(card => {
            card.classList.add('animated');
        });
    }, 50);
}

// Initialize guides functionality
document.addEventListener('DOMContentLoaded', async function() {
    const sortFilter = document.getElementById('sortFilter');
    const typeFilter = document.getElementById('typeFilter');
    const guidesPerPageFilter = document.getElementById('guidesPerPage');

    // Fetch guides data
    allGuides = await fetchGuidesData();

    if (allGuides.length === 0) {
        // Show fallback message if no data
        const guidesGrid = document.querySelector('.guides-grid');
        if (guidesGrid) {
            guidesGrid.innerHTML = `
                <div class="text-center py-12 col-span-full no-guides-placeholder">
                    <div class="placeholder-icon">
                        <i class="fas fa-book-open"></i>
                    </div>
                    <h3>No Guides Available</h3>
                    <p>We're building our library of community guides. Check back soon or consider contributing your own!</p>
                    <div class="mt-4 flex gap-4 justify-center flex-wrap">
                        <a href="discord" class="cta-button inline-flex items-center px-6 py-3 bg-discord-color text-white rounded-lg font-medium hover:bg-discord-color-dark transition-colors">
                            <i class="fab fa-discord mr-2"></i> Join Discord
                        </a>
                        <a href="resources/contact-us" class="cta-button inline-flex items-center px-6 py-3 bg-accent-color text-white rounded-lg font-medium hover:bg-accent-color-dark transition-colors">
                            <i class="fas fa-pen-fancy mr-2"></i> Submit Guide
                        </a>
                    </div>
                </div>
            `;
        }
        const paginationContainer = document.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }

    // Populate type filter
    const types = getUniqueTypes(allGuides);
    populateTypeFilter(types);

    // Initialize with default sorting and filtering
    currentPage = 1;
    renderCurrentPage();

    // Add event listeners for filter changes
    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            currentPage = 1;
            renderCurrentPage();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            currentPage = 1;
            renderCurrentPage();
        });
    }

    if (guidesPerPageFilter) {
        guidesPerPageFilter.addEventListener('change', () => {
            guidesPerPage = guidesPerPageFilter.value === 'all' ? allGuides.length : parseInt(guidesPerPageFilter.value);
            currentPage = 1;
            renderCurrentPage();
        });
    }

    // Initialize animations after page load
    setTimeout(() => {
        const guideCards = document.querySelectorAll('.guide-card');
        guideCards.forEach(card => {
            card.classList.add('animated');
        });
    }, 300);
});

// Force re-initialization on back button
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        currentPage = 1;
        renderCurrentPage();
    }
});