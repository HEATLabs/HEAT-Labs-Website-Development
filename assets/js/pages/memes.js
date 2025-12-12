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
    let observer = null;

    // Initialize
    initMemesGallery();

    // Initialize the gallery
    function initMemesGallery() {
        loadMemes();
        initEventListeners();
        initIntersectionObserver();
    }

    // Load memes from JSON
    async function loadMemes() {
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
        }
    }

    // Create meme card HTML
    function createMemeCard(meme) {
        const card = document.createElement('div');
        card.className = 'meme-card';
        card.setAttribute('data-name', meme.name.toLowerCase());
        card.setAttribute('data-author', meme.author.toLowerCase());

        card.innerHTML = `
            <div class="meme-img-container">
                <img
                    src="${meme.path}"
                    alt="${meme.name}"
                    class="meme-img"
                    loading="lazy"
                    decoding="async"
                    onerror="this.src='https://cdn5.heatlabs.net/placeholder/imagefailedtoload.webp'"
                >
            </div>
            <div class="meme-info">
                <h3>${meme.name}</h3>
                <div class="meme-author">
                    <i class="fas fa-user"></i>
                    <span>${meme.author}</span>
                </div>
            </div>
        `;

        // Add click event for modal preview
        card.addEventListener('click', () => openMemeModal(meme));

        // Lazy load image with Intersection Observer
        const img = card.querySelector('.meme-img');
        if (observer) {
            observer.observe(img);
        }

        return card;
    }

    // Render all memes to the grid
    function renderMemes() {
        memesGrid.innerHTML = '';

        if (memesData.length === 0) {
            showNoResults();
            return;
        }

        memesData.forEach((meme, index) => {
            const card = createMemeCard(meme);
            memesGrid.appendChild(card);

            // Animate card entrance
            setTimeout(() => {
                card.classList.add('animated');
            }, index * 50);
        });

        // Reset columns after rendering
        setTimeout(() => {
            memesGrid.style.opacity = '1';
        }, 100);
    }

    // Initialize Intersection Observer for lazy loading
    function initIntersectionObserver() {
        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.onload = () => {
                        img.classList.add('loaded');
                    };
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
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
        memesGrid.style.opacity = '0.3';
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