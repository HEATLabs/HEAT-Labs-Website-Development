// Store all posts data
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
let postsPerPage = 12;

// Function to fetch news data from JSON
async function fetchNewsData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/news.json');
        if (!response.ok) {
            throw new Error('Failed to load news data');
        }
        const data = await response.json();
        return data.posts || [];
    } catch (error) {
        console.error('Error loading news data:', error);
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

// Function to get unique categories from posts
function getUniqueCategories(posts) {
    const categories = new Set();
    posts.forEach(post => {
        if (post.category) {
            categories.add(post.category);
        }
    });
    return ['all', ...Array.from(categories)];
}

// Function to format category name for display
function formatCategoryName(category) {
    if (category === 'all') return 'All Types';
    return category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Function to populate category filter
function populateCategoryFilter(categories) {
    const filterSelect = document.getElementById('categoryFilter');
    if (!filterSelect) return;

    filterSelect.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = formatCategoryName(category);
        filterSelect.appendChild(option);
    });
}

// Function to create a news card element
function createNewsCard(post) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.dataset.date = post.raw_date || post.full_date;
    card.dataset.category = post.category || 'uncategorized';

    // Format the date
    const formattedDate = formatDate(post.raw_date || post.full_date);

    // Determine tag display name - use formatted category name
    const tagDisplay = post.category ? formatCategoryName(post.category) : 'News';

    card.innerHTML = `
        <div class="news-img-container">
            <img alt="${post.title}" class="news-img" src="${post.image}" loading="lazy" />
            <div class="news-tag">${tagDisplay}</div>
        </div>
        <div class="news-info">
            <h3>${post.title}</h3>
            <div class="news-meta">
                <span>
                    <i class="fa-solid fa-calendar"></i> ${formattedDate}
                </span>
            </div>
            <p class="news-desc">${post.description}</p>
            <a class="btn-accent btn-news" href="${post.url}" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-newspaper mr-2"></i>Read More
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

// Function to filter posts based on current filters
function filterPosts() {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');

    const categoryValue = categoryFilter ? categoryFilter.value : 'all';
    const sortValue = sortFilter ? sortFilter.value : 'latest';

    // Filter by category
    let filtered = allPosts;
    if (categoryValue !== 'all') {
        filtered = filtered.filter(post => post.category === categoryValue);
    }

    // Sort by date
    filtered.sort((a, b) => {
        const dateA = new Date(a.raw_date || a.full_date);
        const dateB = new Date(b.raw_date || b.full_date);
        return sortValue === 'latest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
}

// Function to render the current page
function renderCurrentPage() {
    const newsGrid = document.querySelector('.news-grid');
    if (!newsGrid) return;

    // Get filtered posts
    filteredPosts = filterPosts();

    // Calculate pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = Math.min(startIndex + postsPerPage, filteredPosts.length);
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Clear the grid
    newsGrid.innerHTML = '';

    // Check if there are any posts to display
    if (paginatedPosts.length === 0) {
        newsGrid.innerHTML = `
            <div class="text-center py-12 col-span-full">
                <i class="fas fa-newspaper fa-4x text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold">No Posts Found</h3>
                <p class="text-gray-500">Try adjusting your filters.</p>
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
    paginatedPosts.forEach(post => {
        const card = createNewsCard(post);
        newsGrid.appendChild(card);
    });

    // Update pagination controls
    updatePaginationControls(totalPages);

    // Reinitialize animations
    setTimeout(() => {
        const currentCards = newsGrid.querySelectorAll('.news-card');
        currentCards.forEach(card => {
            card.classList.add('animated');
        });
    }, 50);
}

// Initialize news functionality
document.addEventListener('DOMContentLoaded', async function() {
    const sortFilter = document.getElementById('sortFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const postsPerPageFilter = document.getElementById('postsPerPage');

    // Fetch news data
    allPosts = await fetchNewsData();

    if (allPosts.length === 0) {
        // Show fallback message if no data
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = `
                <div class="text-center py-12 col-span-full">
                    <i class="fas fa-newspaper fa-4x text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold">No News Posts Available</h3>
                    <p class="text-gray-500">Please check back later for updates.</p>
                </div>
            `;
        }
        // Hide pagination if no data
        const paginationContainer = document.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.style.display = 'none';
        }
        return;
    }

    // Populate category filter
    const categories = getUniqueCategories(allPosts);
    populateCategoryFilter(categories);

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

    if (categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            currentPage = 1;
            renderCurrentPage();
        });
    }

    if (postsPerPageFilter) {
        postsPerPageFilter.addEventListener('change', () => {
            postsPerPage = postsPerPageFilter.value === 'all' ? allPosts.length : parseInt(postsPerPageFilter.value);
            currentPage = 1;
            renderCurrentPage();
        });
    }

    // Initialize animations after page load
    setTimeout(() => {
        const newsCards = document.querySelectorAll('.news-card');
        newsCards.forEach(card => {
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