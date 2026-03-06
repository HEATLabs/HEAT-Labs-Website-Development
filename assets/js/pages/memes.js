// Memes Gallery Page JS
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const memesGrid = document.getElementById('memesGrid');
    const loadingIndicator = document.getElementById('memesLoading');
    const errorMessage = document.getElementById('memesError');
    const noResults = document.getElementById('noResults');
    const retryBtn = document.getElementById('retryBtn');

    // State
    let memesData = [];
    let isLoading = false;
    let imagesLoaded = 0;
    let totalImages = 0;

    // Initialize
    initMemesGallery();

    // Initialize the gallery
    function initMemesGallery() {
        loadMemes();
        initEventListeners();
        initResizeHandler();
    }

    // Handle window resize for responsive grid
    function initResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (memesData.length > 0) {
                    renderMemes();
                }
            }, 250);
        });
    }

    // Load memes from JSON
    async function loadMemes() {
        if (isLoading) return;
        isLoading = true;
        showLoading();

        try {
            const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/memes.json');

            if (!response.ok) {
                throw new Error('Failed to load memes data');
            }

            memesData = await response.json();
            renderMemes();
            hideLoading();
        } catch (error) {
            console.error('Error loading memes:', error);
            showError();
        } finally {
            isLoading = false;
        }
    }

    // Get number of columns based on screen width
    function getColumnCount() {
        const width = window.innerWidth;
        if (width <= 480) return 1;
        if (width <= 768) return 2;
        if (width <= 1200) return 3;
        return 4;
    }

    // Distribute memes into columns for horizontal flow
    function distributeMemesIntoColumns() {
        const columnCount = getColumnCount();
        const columns = Array.from({
            length: columnCount
        }, () => []);

        // Distribute memes horizontally (row by row)
        memesData.forEach((meme, index) => {
            const columnIndex = index % columnCount;
            columns[columnIndex].push(meme);
        });

        return columns;
    }

    // Create meme card HTML
    function createMemeCard(meme) {
        const card = document.createElement('div');
        card.className = 'meme-card';
        card.setAttribute('data-name', meme.name.toLowerCase());
        card.setAttribute('data-author', meme.author.toLowerCase());
        card.setAttribute('data-index', meme.path);

        // Create image container with placeholder
        const imgContainer = document.createElement('div');
        imgContainer.className = 'meme-img-container';

        const img = document.createElement('img');
        img.className = 'meme-img';
        img.alt = meme.name;
        img.loading = 'lazy';
        img.decoding = 'async';

        // Set low-quality placeholder or transparent pixel
        img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E';
        img.dataset.src = meme.path;

        img.onerror = function() {
            this.src = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/placeholder/imagefailedtoload.webp';
            this.classList.add('loaded');
        };

        img.onload = function() {
            this.classList.add('loaded');
            card.style.height = 'auto';
        };

        imgContainer.appendChild(img);

        // Create info section
        const infoDiv = document.createElement('div');
        infoDiv.className = 'meme-info';
        infoDiv.innerHTML = `
            <h3>${meme.name}</h3>
            <div class="meme-author">
                <i class="fas fa-user"></i>
                <span>${meme.author}</span>
            </div>
        `;

        card.appendChild(imgContainer);
        card.appendChild(infoDiv);

        // Add click event for modal preview
        card.addEventListener('click', () => openMemeModal(meme));

        return card;
    }

    // Render memes in horizontal grid layout
    function renderMemes() {
        memesGrid.innerHTML = '';
        memesGrid.style.opacity = '1';

        if (memesData.length === 0) {
            showNoResults();
            return;
        }

        // Get columns with distributed memes
        const columns = distributeMemesIntoColumns();

        // Create column containers
        columns.forEach((columnMemes, columnIndex) => {
            const columnDiv = document.createElement('div');
            columnDiv.className = 'meme-column';
            columnDiv.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                flex: 1;
                min-width: 0;
            `;

            // Add memes to column
            columnMemes.forEach((meme, memeIndex) => {
                const card = createMemeCard(meme);
                columnDiv.appendChild(card);

                // Stagger animation based on overall position
                const animationDelay = (columnIndex * 50) + (memeIndex * 30);
                setTimeout(() => {
                    card.classList.add('animated');
                }, animationDelay);
            });

            memesGrid.appendChild(columnDiv);
        });

        // Initialize lazy loading after render
        initLazyLoading();
    }

    // Initialize lazy loading for images
    function initLazyLoading() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });

        // Observe all images with data-src
        document.querySelectorAll('.meme-img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Initialize event listeners
    function initEventListeners() {
        // Retry button
        if (retryBtn) {
            retryBtn.addEventListener('click', loadMemes);
        }

        // Close modal with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMemeModal();
            }
        });

        // Smooth scroll handling
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            document.body.classList.add('is-scrolling');

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                document.body.classList.remove('is-scrolling');
            }, 150);
        }, {
            passive: true
        });
    }

    // Open meme modal for preview
    function openMemeModal(meme) {
        // Create modal if it doesn't exist
        let modalOverlay = document.querySelector('.meme-modal-overlay');
        if (!modalOverlay) {
            modalOverlay = document.createElement('div');
            modalOverlay.className = 'meme-modal-overlay';
            modalOverlay.innerHTML = `
                <div class="meme-modal">
                    <button class="meme-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                    <img class="meme-modal-img" alt="${meme.name}">
                    <div class="meme-modal-info">
                        <h3>${meme.name}</h3>
                        <div class="meme-modal-author">By ${meme.author}</div>
                    </div>
                </div>
            `;
            document.body.appendChild(modalOverlay);

            // Add close event
            const closeBtn = modalOverlay.querySelector('.meme-modal-close');
            closeBtn.addEventListener('click', closeMemeModal);
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    closeMemeModal();
                }
            });
        }

        // Set modal content
        const modalImg = modalOverlay.querySelector('.meme-modal-img');
        modalImg.src = meme.path;
        modalImg.alt = meme.name;

        const modalTitle = modalOverlay.querySelector('.meme-modal-info h3');
        modalTitle.textContent = meme.name;

        const modalAuthor = modalOverlay.querySelector('.meme-modal-author');
        modalAuthor.textContent = `By ${meme.author}`;

        // Show modal
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close meme modal
    function closeMemeModal() {
        const modalOverlay = document.querySelector('.meme-modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';

            // Remove modal after animation
            setTimeout(() => {
                if (modalOverlay && !modalOverlay.classList.contains('active')) {
                    modalOverlay.remove();
                }
            }, 300);
        }
    }

    // UI Helper Functions
    function showLoading() {
        loadingIndicator.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        noResults.classList.add('hidden');
        memesGrid.style.opacity = '0.5';
    }

    function hideLoading() {
        loadingIndicator.classList.add('hidden');
        memesGrid.style.opacity = '1';
    }

    function showError() {
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.remove('hidden');
        noResults.classList.add('hidden');
    }

    function showNoResults() {
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.add('hidden');
        noResults.classList.remove('hidden');
    }
});