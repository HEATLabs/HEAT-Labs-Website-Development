// Store original cards array
let originalCards = [];
let currentPage = 1;
let postsPerPage = 12;
let allPosts = [];

// Function to fetch blog data from JSON
async function fetchBlogData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/blog.json');
        if (!response.ok) {
            throw new Error('Failed to load blog data');
        }
        const data = await response.json();
        return data.posts || [];
    } catch (error) {
        console.error('Error loading blog data:', error);
        return [];
    }
}

// Function to fetch view count from API
async function fetchBlogViewCount(blogName) {
    try {
        const baseName = blogName.replace(/^.*[\\\/]/, '').replace('.html', '');
        const response = await fetch(`https://views.heatlabs.net/api/stats?image=pcwstats-tracker-pixel-${baseName}.png`);
        if (!response.ok) {
            throw new Error('Failed to load view count');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading view count:', error);
        return {
            totalViews: 0
        };
    }
}

// Function to update view counters on all blog cards
async function updateBlogViewCounters() {
    const blogCards = document.querySelectorAll('.blog-card');
    for (const card of blogCards) {
        const blogLink = card.querySelector('a.btn-blog');
        if (blogLink) {
            const href = blogLink.getAttribute('href');
            const viewsData = await fetchBlogViewCount(href);
            const viewsElement = card.querySelector('.views-count');
            if (viewsElement) {
                viewsElement.textContent = viewsData.totalViews.toLocaleString();
            }
        }
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

// Function to create a blog card HTML element
function createBlogCard(post) {
    const card = document.createElement('div');
    card.className = 'blog-card';
    card.dataset.date = post.date;
    card.dataset.type = post.type;

    // Map type to display name
    const typeDisplayMap = {
        'bug-hunting': 'Bug Hunting',
        'easter-egg-friday': 'Easter Egg Friday',
        'developer-insights': 'Developer Insights',
        'feature-showcase': 'Feature Showcase',
        'meet-the-team': 'Meet The Team'
    };
    const displayType = typeDisplayMap[post.type] || post.type_name || post.type;

    card.innerHTML = `
        <div class="blog-img-container">
            <div class="blog-views-counter">
                <i class="fas fa-eye"></i>
                <span class="views-count">0</span>
            </div>
            <img src="${post.image}" alt="${post.title}" class="blog-img" loading="lazy">
            <div class="blog-tag">${displayType}</div>
        </div>
        <div class="blog-info">
            <h3>${post.title}</h3>
            <div class="blog-meta">
                <span>
                    <i class="fa-solid fa-calendar"></i> ${formatDate(post.date)}
                </span>
                <span>
                    <i class="fa-solid fa-at"></i> ${post.author}
                </span>
            </div>
            <p class="blog-desc">${post.description}</p>
            <a href="blog/${post.slug}" class="btn-accent btn-blog">
                <i class="fas fa-newspaper mr-2"></i>Read More
            </a>
        </div>
    `;

    return card;
}

// Function to populate filter dropdowns
function populateFilters(posts) {
    const typeFilter = document.getElementById('typeFilter');
    if (!typeFilter) return;

    // Get unique types
    const types = new Set();
    posts.forEach(post => {
        const displayType = post.type_name || post.type;
        types.add(displayType);
    });

    // Clear existing options (keep "All Posts")
    while (typeFilter.options.length > 1) {
        typeFilter.remove(1);
    }

    // Add type options
    const sortedTypes = Array.from(types).sort();
    sortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.toLowerCase().replace(/ /g, '-');
        option.textContent = type;
        typeFilter.appendChild(option);
    });
}

// Function to update date displays in cards
function updateCardDates(cards) {
    cards.forEach(card => {
        const dateElement = card.querySelector('.blog-meta span:first-child');
        if (dateElement) {
            const dateString = card.dataset.date;
            const formattedDate = formatDate(dateString);
            dateElement.innerHTML = `<i class="fa-solid fa-calendar"></i> ${formattedDate}`;
        }
    });
}

// Function to update pagination controls
function updatePaginationControls(totalPages) {
    const paginationContainer = document.querySelector('.pagination-controls');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevButton.className = 'pagination-button';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateBlogDisplay();
        }
    });
    paginationContainer.appendChild(prevButton);

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
            updateBlogDisplay();
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
            updateBlogDisplay();
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
            updateBlogDisplay();
        });
        paginationContainer.appendChild(lastPageButton);
    }

    const nextButton = document.createElement('button');
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextButton.className = 'pagination-button';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateBlogDisplay();
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Function to sort and filter blog cards
function updateBlogDisplay() {
    const sortFilter = document.getElementById('sortFilter');
    const typeFilter = document.getElementById('typeFilter');
    const postsPerPageFilter = document.getElementById('postsPerPage');
    const blogGrid = document.querySelector('.blog-grid');

    if (!blogGrid || allPosts.length === 0) return;

    const sortValue = sortFilter ? sortFilter.value : 'latest';
    const typeValue = typeFilter ? typeFilter.value : 'all';
    postsPerPage = postsPerPageFilter && postsPerPageFilter.value !== 'all' ? parseInt(postsPerPageFilter.value) : allPosts.length;

    // Filter posts by type
    let filteredPosts = allPosts;
    if (typeValue !== 'all') {
        filteredPosts = allPosts.filter(post => {
            const postType = (post.type_name || post.type).toLowerCase().replace(/ /g, '-');
            return postType === typeValue;
        });
    }

    // Sort posts by date
    filteredPosts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortValue === 'latest' ? dateB - dateA : dateA - dateB;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = Math.min(startIndex + postsPerPage, filteredPosts.length);
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Clear the grid
    blogGrid.innerHTML = '';

    // Add paginated posts to the grid
    paginatedPosts.forEach(post => {
        const card = createBlogCard(post);
        blogGrid.appendChild(card);
    });

    // Update view counters
    setTimeout(() => {
        updateBlogViewCounters();
    }, 100);

    // Update pagination controls
    updatePaginationControls(totalPages);

    // Animate cards
    setTimeout(() => {
        const cards = blogGrid.querySelectorAll('.blog-card');
        cards.forEach(card => {
            card.classList.add('animated');
        });
    }, 50);
}

// Initialize blog functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Fetch blog data
    allPosts = await fetchBlogData();

    if (allPosts.length === 0) {
        console.error('No blog posts found');
        return;
    }

    // Populate filters
    populateFilters(allPosts);

    // Initialize with default sorting
    updateBlogDisplay();

    // Add event listeners for filter changes
    const sortFilter = document.getElementById('sortFilter');
    const typeFilter = document.getElementById('typeFilter');
    const postsPerPageFilter = document.getElementById('postsPerPage');

    if (sortFilter) {
        sortFilter.addEventListener('change', () => {
            currentPage = 1;
            updateBlogDisplay();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', () => {
            currentPage = 1;
            updateBlogDisplay();
        });
    }

    if (postsPerPageFilter) {
        postsPerPageFilter.addEventListener('change', () => {
            currentPage = 1;
            updateBlogDisplay();
        });
    }
});

// Force re-initialization on back button
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        currentPage = 1;
        updateBlogDisplay();
    }
});