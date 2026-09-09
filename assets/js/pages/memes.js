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

    // Video file extensions to check
    const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];

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

    // Check if a file is a video based on extension
    function isVideoFile(path) {
        if (!path) return false;
        const lowerPath = path.toLowerCase();
        return VIDEO_EXTENSIONS.some(ext => lowerPath.endsWith(ext));
    }

    // Generate thumbnail from video
    function generateVideoThumbnail(video) {
        return new Promise((resolve) => {
            // Seek to the beginning (or 0.1 seconds for some videos that have black first frame)
            video.currentTime = 0.1;

            video.addEventListener('seeked', function onSeeked() {
                video.removeEventListener('seeked', onSeeked);

                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Set canvas size to match video aspect ratio
                    const aspectRatio = video.videoWidth / video.videoHeight;
                    const maxWidth = 400;
                    const width = Math.min(video.videoWidth, maxWidth);
                    const height = width / aspectRatio;

                    canvas.width = width;
                    canvas.height = height;

                    // Draw video frame on canvas
                    ctx.drawImage(video, 0, 0, width, height);

                    // Convert to data URL
                    const posterDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(posterDataUrl);
                } catch (error) {
                    console.error('Error generating thumbnail:', error);
                    resolve(null);
                }
            });

            // If video doesn't seek properly, try loading metadata
            if (video.readyState < 2) {
                video.addEventListener('loadedmetadata', function onLoaded() {
                    video.removeEventListener('loadedmetadata', onLoaded);
                    video.currentTime = 0.1;
                });
            }
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

    // Copy link to clipboard
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showCopyNotification('Meme copied to clipboard!');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    // Fallback copy method for older browsers
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showCopyNotification('Meme copied to clipboard!');
        } catch (err) {
            showCopyNotification('Failed to copy meme');
        }
        document.body.removeChild(textarea);
    }

    // Show copy notification
    function showCopyNotification(message) {
        let notification = document.querySelector('.copy-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'copy-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.classList.add('visible');

        clearTimeout(notification._timeout);
        notification._timeout = setTimeout(() => {
            notification.classList.remove('visible');
        }, 2500);
    }

    // Create copy button HTML
    function createCopyButton(link) {
        const button = document.createElement('button');
        button.className = 'meme-copy-btn';
        button.innerHTML = `<i class="fas fa-copy"></i> Copy Meme`;
        button.title = 'Copy meme to clipboard';

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            copyToClipboard(link);
        });

        return button;
    }

    // Create video element for video memes with thumbnail
    function createVideoElement(meme, card) {
        const video = document.createElement('video');
        video.className = 'meme-video';
        video.src = meme.path;
        video.alt = meme.name;
        video.playsInline = true;
        video.muted = true;
        video.loop = false;
        video.preload = 'metadata';

        // Add a placeholder background while thumbnail loads
        video.style.backgroundColor = 'var(--bg-tertiary)';

        // Store the video reference for thumbnail generation
        let thumbnailGenerated = false;

        // Generate and set thumbnail when metadata is loaded
        video.addEventListener('loadedmetadata', async function onMetadata() {
            video.removeEventListener('loadedmetadata', onMetadata);

            // Only generate thumbnail once and not for small/empty videos
            if (!thumbnailGenerated && video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    // Use the video itself to generate thumbnail
                    const posterDataUrl = await generateVideoThumbnail(video);
                    if (posterDataUrl) {
                        // Set poster attribute
                        video.setAttribute('poster', posterDataUrl);
                        video.classList.add('has-poster');
                        thumbnailGenerated = true;
                    }
                } catch (error) {
                    console.error('Failed to generate thumbnail for video:', meme.name, error);
                }
            }
        });

        // Fallback: if metadata already loaded
        if (video.readyState >= 1 && video.videoWidth > 0) {
            // Trigger manually if metadata already loaded
            generateVideoThumbnail(video).then(posterDataUrl => {
                if (posterDataUrl && !thumbnailGenerated) {
                    video.setAttribute('poster', posterDataUrl);
                    video.classList.add('has-poster');
                    thumbnailGenerated = true;
                }
            }).catch(() => {});
        }

        // Add click handler to open modal when video is clicked
        video.addEventListener('click', (e) => {
            e.stopPropagation();
            // Only open modal if not clicking on controls
            if (e.target === video) {
                openMemeModal(meme);
            }
        });

        // Auto-play when visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (video.paused) {
                        setTimeout(() => {
                            if (entry.isIntersecting && video.paused) {
                                video.play().catch(() => {});
                            }
                        }, 300);
                    }
                } else {
                    if (!video.paused) {
                        video.pause();
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        observer.observe(video);
        video._observer = observer;

        // Handle video errors
        video.onerror = function() {
            this.style.display = 'none';
            const fallbackImg = document.createElement('img');
            fallbackImg.className = 'meme-img';
            fallbackImg.src = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/placeholder/imagefailedtoload.webp';
            fallbackImg.alt = meme.name;
            fallbackImg.loading = 'lazy';
            fallbackImg.decoding = 'async';
            fallbackImg.classList.add('loaded');
            this.parentNode.replaceChild(fallbackImg, this);
        };

        return video;
    }

    // Create image element for image memes
    function createImageElement(meme) {
        const img = document.createElement('img');
        img.className = 'meme-img';
        img.alt = meme.name;
        img.loading = 'lazy';
        img.decoding = 'async';

        img.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E';
        img.dataset.src = meme.path;

        img.onerror = function() {
            this.src = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/placeholder/imagefailedtoload.webp';
            this.classList.add('loaded');
        };

        img.onload = function() {
            this.classList.add('loaded');
        };

        return img;
    }

    // Create meme card HTML
    function createMemeCard(meme) {
        const card = document.createElement('div');
        card.className = 'meme-card';
        card.setAttribute('data-name', meme.name.toLowerCase());
        card.setAttribute('data-author', meme.author.toLowerCase());
        card.setAttribute('data-index', meme.path);

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'meme-img-container';

        // Determine if it's a video or image
        const isVideo = isVideoFile(meme.path);

        let mediaElement;
        if (isVideo) {
            mediaElement = createVideoElement(meme, card);
            // Add video indicator badge
            const videoBadge = document.createElement('div');
            videoBadge.className = 'meme-video-badge';
            videoBadge.innerHTML = '<i class="fas fa-play"></i> Video';
            contentContainer.appendChild(videoBadge);
        } else {
            mediaElement = createImageElement(meme);
        }

        contentContainer.appendChild(mediaElement);

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

        // Add copy button to info section
        const copyBtn = createCopyButton(meme.path);
        infoDiv.appendChild(copyBtn);

        card.appendChild(contentContainer);
        card.appendChild(infoDiv);

        // Add click event for modal preview on the card itself
        card.addEventListener('click', (e) => {
            if (e.target.closest('.meme-copy-btn')) return;
            if (e.target.closest('.meme-video')) return;
            if (e.target.closest('.meme-video-badge')) return;
            openMemeModal(meme);
        });

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

    // Initialize lazy loading for images and videos
    function initLazyLoading() {
        // For images with data-src (lazy loading)
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

        document.querySelectorAll('.meme-img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        // For videos - ensure they load metadata when visible
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    if (video.readyState === 0) {
                        video.load();
                    }
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });

        document.querySelectorAll('.meme-video').forEach(video => {
            videoObserver.observe(video);
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

        // Pause all videos when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                document.querySelectorAll('.meme-video').forEach(video => {
                    if (!video.paused) {
                        video.pause();
                    }
                });
            }
        });
    }

    // Create modal video element
    function createModalVideo(meme) {
        const video = document.createElement('video');
        video.className = 'meme-modal-video';
        video.src = meme.path;
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';

        // Try to generate poster for modal too
        video.addEventListener('loadedmetadata', async function onMetadata() {
            video.removeEventListener('loadedmetadata', onMetadata);
            if (video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    const posterDataUrl = await generateVideoThumbnail(video);
                    if (posterDataUrl) {
                        video.setAttribute('poster', posterDataUrl);
                    }
                } catch (error) {
                    console.error('Failed to generate thumbnail for modal:', error);
                }
            }
        });

        // Handle video errors
        video.onerror = function() {
            this.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'meme-modal-error';
            errorMsg.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Unable to play this video</p>
                <a href="${meme.path}" target="_blank" rel="noopener noreferrer">Open in new tab</a>
            `;
            this.parentNode.appendChild(errorMsg);
        };

        return video;
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
                    <div class="meme-modal-content-wrapper"></div>
                    <div class="meme-modal-info">
                        <div class="meme-modal-info-left">
                            <h3></h3>
                            <div class="meme-modal-author"></div>
                        </div>
                        <button class="meme-modal-copy-btn">
                            <i class="fas fa-copy"></i> Copy Meme
                        </button>
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

            // Add copy button event for modal
            const modalCopyBtn = modalOverlay.querySelector('.meme-modal-copy-btn');
            modalCopyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wrapper = modalOverlay.querySelector('.meme-modal-content-wrapper');
                const img = wrapper.querySelector('img');
                const video = wrapper.querySelector('video');
                if (img) {
                    copyToClipboard(img.src);
                } else if (video) {
                    copyToClipboard(video.src);
                }
            });

            // Keyboard controls for video
            document.addEventListener('keydown', (e) => {
                if (!modalOverlay.classList.contains('active')) return;
                const video = modalOverlay.querySelector('.meme-modal-video');
                if (!video) return;
                if (e.key === ' ' || e.key === 'Space') {
                    e.preventDefault();
                    if (video.paused) {
                        video.play();
                    } else {
                        video.pause();
                    }
                }
            });
        }

        // Get the content wrapper
        const wrapper = modalOverlay.querySelector('.meme-modal-content-wrapper');
        wrapper.innerHTML = '';

        // Determine if it's a video or image
        const isVideo = isVideoFile(meme.path);

        let mediaElement;
        if (isVideo) {
            mediaElement = createModalVideo(meme);
            wrapper.appendChild(mediaElement);

            // Auto-play modal video when opened
            setTimeout(() => {
                mediaElement.play().catch(() => {
                    // Autoplay was prevented - user can click play
                });
            }, 100);
        } else {
            const img = document.createElement('img');
            img.className = 'meme-modal-img';
            img.src = meme.path;
            img.alt = meme.name;
            wrapper.appendChild(img);
        }

        // Set modal info
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
            // Pause any video in the modal
            const video = modalOverlay.querySelector('.meme-modal-video');
            if (video && !video.paused) {
                video.pause();
            }

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