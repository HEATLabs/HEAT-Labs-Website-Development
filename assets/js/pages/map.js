// Map Page JS for HEAT Labs
document.addEventListener('DOMContentLoaded', function() {
    // Initialize gamemode selector functionality
    const gamemodeButtons = document.querySelectorAll('.gamemode-btn');
    const gamemodeSections = document.querySelectorAll('.gamemode-section');

    // Set up click handlers for gamemode buttons
    gamemodeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            gamemodeButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Get the gamemode to show
            const gamemode = this.dataset.gamemode;

            // Hide all gamemode sections
            gamemodeSections.forEach(section => {
                section.classList.remove('active');
            });

            // Show the selected gamemode section
            document.getElementById(gamemode).classList.add('active');

            // Update URL hash if needed
            window.location.hash = gamemode;
        });
    });

    // Check for hash on page load to set initial gamemode
    if (window.location.hash) {
        const initialGamemode = window.location.hash.substring(1);
        const initialButton = document.querySelector(`.gamemode-btn[data-gamemode="${initialGamemode}"]`);

        if (initialButton) {
            initialButton.click();
        }
    }

    // Fetch and display view count
    fetchViewCount().then(views => {
        const mapMeta = document.querySelector('.map-meta');
        if (mapMeta) {
            const viewCounter = document.createElement('span');
            viewCounter.className = 'map-views-counter';
            viewCounter.innerHTML = `
                <i class="fas fa-eye"></i>
                <span class="map-views-count">${views.totalViews.toLocaleString()}</span> views
            `;
            mapMeta.appendChild(viewCounter);
        }
    });

    // Initialize interactive map zoom for map overview images
    initializeInteractiveMapZoom();

    // Initialize any interactive elements specific to map pages
    initializeMapPageElements();

    // Fetch map data
    fetchMapDataAndInitialize();
});

// Fetch map data
async function fetchMapDataAndInitialize() {
    try {
        // Get the current page slug from the URL
        const currentPath = window.location.pathname;
        let slug = currentPath.split('/').pop() || '';
        slug = slug.replace(/\.html$/, '');

        if (slug === '') {
            const pathParts = currentPath.split('/').filter(part => part !== '');
            slug = pathParts[pathParts.length - 1] || '';
        }

        if (!slug || slug === 'maps' || slug === '') {
            console.log('No valid map slug found');
            return;
        }

        // Fetch the maps data from GitHub
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/maps.json');
        if (!response.ok) {
            throw new Error('Failed to load map data');
        }

        const data = await response.json();
        const mapData = data.maps.find(map => map.slug === slug);

        if (!mapData) {
            console.warn('No map data found for slug:', slug);
            return;
        }

        console.log('Found map data:', mapData.name);

        // Update sidebar quick facts
        updateQuickFacts(mapData);

        // Initialize gamemode selector with the same data
        renderGamemodeSelector(mapData);

    } catch (error) {
        console.error('Error loading map data:', error);
    }
}

// Helper function to replace {mapName} placeholders in text
function replaceMapNamePlaceholders(text, mapName) {
    if (!text) return text;
    return text.replace(/\{mapName\}/g, mapName);
}

// Function to render gamemode selector and details
function renderGamemodeSelector(mapData) {
    const gamemodes = mapData.gamemodes;
    const modeKeys = Object.keys(gamemodes);

    if (modeKeys.length === 0) {
        // If no gamemodes at all, show a message
        const container = document.getElementById('gamemodeButtonsContainer');
        if (container) {
            container.innerHTML = '<p class="text-gray-500">No gamemode information available for this map yet.</p>';
        }
        return;
    }

    // Get the buttons container
    const buttonsContainer = document.getElementById('gamemodeButtonsContainer');
    if (!buttonsContainer) return;

    // Clear existing buttons
    buttonsContainer.innerHTML = '';

    // Create buttons for each gamemode (including 'unknown')
    modeKeys.forEach((key, index) => {
        const mode = gamemodes[key];
        const button = document.createElement('button');
        button.className = `gamemode-selector-btn ${index === 0 ? 'active' : ''}`;
        button.dataset.gamemode = key;
        button.dataset.index = index;
        // Use the mode_name from the data, or fallback to formatted key
        let displayName = mode.mode_name || key.replace('_', ' ').toUpperCase();
        // If it's the unknown gamemode, show "Unknown" or the provided name
        if (key === 'unknown' && mode.mode_name) {
            displayName = mode.mode_name;
        }
        button.textContent = displayName;
        buttonsContainer.appendChild(button);
    });

    // Set first gamemode as active by default and display its data
    const firstKey = modeKeys[0];
    if (firstKey) {
        updateGamemodeDetails(gamemodes[firstKey], mapData.name);
    }

    // Add click event listeners to the new buttons
    buttonsContainer.querySelectorAll('.gamemode-selector-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class from all buttons
            buttonsContainer.querySelectorAll('.gamemode-selector-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to clicked button
            this.classList.add('active');

            // Get the gamemode key and update details
            const modeKey = this.dataset.gamemode;
            if (modeKey && gamemodes[modeKey]) {
                updateGamemodeDetails(gamemodes[modeKey], mapData.name);
            }
        });
    });
}

// Function to update gamemode details in the UI
function updateGamemodeDetails(modeData, mapName) {
    // Helper to replace placeholders
    const replacePlaceholders = (text) => replaceMapNamePlaceholders(text, mapName || 'this map');

    // Update description
    const descriptionElement = document.getElementById('modeDescription');
    if (descriptionElement) {
        descriptionElement.textContent = replacePlaceholders(modeData.mode_description) || 'No description available';
    }

    // Update Match Format
    const matchFormat = document.getElementById('matchFormat');
    const matchFormatDesc = document.getElementById('matchFormatDesc');
    if (matchFormat) {
        matchFormat.textContent = replacePlaceholders(modeData.match_format) || 'Unknown Format';
    }
    if (matchFormatDesc) {
        matchFormatDesc.textContent = replacePlaceholders(modeData.match_format_description) || 'Match format details coming soon';
    }

    // Update Time Limit
    const timeLimit = document.getElementById('timeLimit');
    const timeLimitDesc = document.getElementById('timeLimitDesc');
    if (timeLimit) {
        timeLimit.textContent = replacePlaceholders(modeData.max_match_time) || 'Unknown Time Limit';
    }
    if (timeLimitDesc) {
        timeLimitDesc.textContent = replacePlaceholders(modeData.max_match_description) || 'Time limit details coming soon';
    }

    // Update Control Points
    const controlPoints = document.getElementById('controlPoints');
    const controlPointsDesc = document.getElementById('controlPointsDesc');
    if (controlPoints) {
        controlPoints.textContent = replacePlaceholders(modeData.control_points) || 'Unknown Control Points';
    }
    if (controlPointsDesc) {
        controlPointsDesc.textContent = replacePlaceholders(modeData.control_points_description) || 'Control point details coming soon';
    }

    // Update Win Condition
    const winCondition = document.getElementById('winCondition');
    const winConditionDesc = document.getElementById('winConditionDesc');
    if (winCondition) {
        winCondition.textContent = replacePlaceholders(modeData.win_condition) || 'Unknown Win Condition';
    }
    if (winConditionDesc) {
        winConditionDesc.textContent = replacePlaceholders(modeData.win_condition_description) || 'Win condition details coming soon';
    }
}

// Function to fetch view count from API
async function fetchViewCount() {
    try {
        // Get the tracking pixel URL from the meta tag
        const trackingPixel = document.querySelector('.heatlabs-tracking-pixel');
        if (!trackingPixel || !trackingPixel.src) {
            return {
                totalViews: 0
            };
        }

        // Extract the image filename from the tracking pixel URL
        const imageName = trackingPixel.src.split('/').pop();

        // Build the stats API URL
        const statsApiUrl = `https://views.heatlabs.net/api/stats?image=${imageName}`;
        const response = await fetch(statsApiUrl);

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

// Function to update the quick facts sidebar card
function updateQuickFacts(mapData) {
    // Find the Quick Facts card by looking for the heading text
    const allCards = document.querySelectorAll('.sidebar-card');
    let quickFactsCard = null;

    allCards.forEach(card => {
        const h3 = card.querySelector('h3');
        if (h3 && h3.textContent.trim() === 'Map Quick Facts') {
            quickFactsCard = card;
        }
    });

    if (!quickFactsCard) {
        console.warn('Map Quick Facts card not found in DOM');
        return;
    }

    // Get all list items in the card
    const listItems = quickFactsCard.querySelectorAll('li');

    if (listItems.length < 3) {
        console.warn('Not enough list items found in Quick Facts card');
        return;
    }

    // Update Size (first list item)
    const sizeSpan = listItems[0].querySelector('span');
    if (sizeSpan) {
        sizeSpan.textContent = mapData.size || 'Info coming soon';
    } else {
        const strong = listItems[0].querySelector('strong');
        if (strong) {
            const textNode = strong.nextSibling;
            if (textNode) {
                textNode.textContent = ' ' + (mapData.size || 'Info coming soon');
            }
        }
    }

    // Update Terrain (second list item)
    const terrainSpan = listItems[1].querySelector('span');
    if (terrainSpan) {
        terrainSpan.textContent = mapData.terrain || 'Info coming soon';
    } else {
        const strong = listItems[1].querySelector('strong');
        if (strong) {
            const textNode = strong.nextSibling;
            if (textNode) {
                textNode.textContent = ' ' + (mapData.terrain || 'Info coming soon');
            }
        }
    }

    // Update Game Modes (third list item)
    const modesSpan = listItems[2].querySelector('span');
    let modesText = 'Info coming soon';

    if (mapData.gamemodes) {
        const modeNames = Object.keys(mapData.gamemodes)
            .map(key => {
                const mode = mapData.gamemodes[key];
                // Get the mode name from the object, or fallback to formatted key
                if (mode && mode.mode_name) {
                    return mode.mode_name;
                }
                // Format the key as a readable name
                return key.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            })
            .filter(name => name && name !== '');

        if (modeNames.length > 0) {
            modesText = modeNames.join(', ');
        }
    }

    if (modesSpan) {
        modesSpan.textContent = modesText;
    } else {
        const strong = listItems[2].querySelector('strong');
        if (strong) {
            const textNode = strong.nextSibling;
            if (textNode) {
                textNode.textContent = ' ' + modesText;
            }
        }
    }
}

function initializeMapPageElements() {
    // Initialize image gallery
    initializeImageGallery();

    // FAQ Accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // Add intersection observer for animated elements if needed
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });

        // Observe any elements that need to animate in
        document.querySelectorAll('.map-image, .sidebar-card').forEach(el => {
            observer.observe(el);
        });
    }
}

function initializeImageGallery() {
    const galleryModal = document.getElementById('galleryModal');
    const galleryMainImage = document.getElementById('galleryMainImage');
    const galleryImageCaption = document.getElementById('galleryImageCaption');
    const galleryThumbnailsContainer = document.getElementById('galleryThumbnailsContainer');
    const galleryCloseBtn = document.getElementById('galleryCloseBtn');
    const galleryPrevBtn = document.getElementById('galleryPrevBtn');
    const galleryNextBtn = document.getElementById('galleryNextBtn');

    // Collect all images from the page that should be in the gallery
    const galleryImages = [];

    // Add main content images
    document.querySelectorAll('.map-image img').forEach(img => {
        // Skip images that are inside interactive containers
        const parentContainer = img.closest('.interactive-map-container');
        if (!parentContainer) {
            galleryImages.push({
                src: img.src,
                alt: img.alt,
                caption: img.nextElementSibling?.textContent || ''
            });
        }
    });

    // Add sidebar gallery images
    document.querySelectorAll('.sidebar-card .gallery-thumbnail img').forEach(img => {
        galleryImages.push({
            src: img.parentElement.href,
            alt: img.alt,
            caption: img.alt
        });
    });

    // If no images found, don't initialize the gallery
    if (galleryImages.length === 0) return;

    let currentImageIndex = 0;

    // Function to open the gallery at a specific index
    function openGallery(index) {
        if (index < 0 || index >= galleryImages.length) return;

        currentImageIndex = index;
        updateGalleryImage();
        galleryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Function to update the gallery with current image
    function updateGalleryImage() {
        const currentImage = galleryImages[currentImageIndex];
        galleryMainImage.src = currentImage.src;
        galleryMainImage.alt = currentImage.alt;
        galleryImageCaption.textContent = currentImage.caption;

        // Update active thumbnail
        document.querySelectorAll('.gallery-thumbnail-item').forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === currentImageIndex);
        });

        // Scroll thumbnails to show active one
        const activeThumb = document.querySelector('.gallery-thumbnail-item.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }

    // Function to close the gallery
    function closeGallery() {
        galleryModal.classList.remove('active');
        document.body.style.overflow = '';
        galleryMainImage.classList.remove('zoomed');
    }

    // Create thumbnail items
    function createThumbnails() {
        galleryThumbnailsContainer.innerHTML = '';
        galleryImages.forEach((img, index) => {
            const thumbItem = document.createElement('div');
            thumbItem.className = 'gallery-thumbnail-item';
            if (index === currentImageIndex) thumbItem.classList.add('active');

            const thumbImg = document.createElement('img');
            thumbImg.src = img.src;
            thumbImg.alt = img.alt;

            thumbItem.appendChild(thumbImg);
            thumbItem.addEventListener('click', () => {
                currentImageIndex = index;
                updateGalleryImage();
            });

            galleryThumbnailsContainer.appendChild(thumbItem);
        });
    }

    // Initialize thumbnails
    createThumbnails();

    // Set up click handlers for all gallery images
    document.querySelectorAll('.map-image img:not(.interactive-map-container img), .sidebar-card .gallery-thumbnail').forEach((element, index) => {
        // Skip if inside interactive container
        const parentContainer = element.closest('.interactive-map-container');
        if (parentContainer) return;

        element.addEventListener('click', (e) => {
            e.preventDefault();
            openGallery(index);
        });
    });

    // Navigation buttons
    galleryPrevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        updateGalleryImage();
    });

    galleryNextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        updateGalleryImage();
    });

    // Close button
    galleryCloseBtn.addEventListener('click', closeGallery);

    // Close when clicking outside the image
    galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) {
            closeGallery();
        }
    });

    // Zoom functionality
    galleryMainImage.addEventListener('click', () => {
        galleryMainImage.classList.toggle('zoomed');
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!galleryModal.classList.contains('active')) return;

        switch (e.key) {
            case 'Escape':
                closeGallery();
                break;
            case 'ArrowLeft':
                currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
                updateGalleryImage();
                break;
            case 'ArrowRight':
                currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
                updateGalleryImage();
                break;
        }
    });

    // Swipe support for touch devices
    let touchStartX = 0;
    let touchEndX = 0;

    galleryMainImage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, {
        passive: true
    });

    galleryMainImage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, {
        passive: true
    });

    function handleSwipe() {
        if (touchStartX - touchEndX > 50) {
            // Swipe left - next image
            currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
            updateGalleryImage();
        } else if (touchEndX - touchStartX > 50) {
            // Swipe right - previous image
            currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
            updateGalleryImage();
        }
    }
}

// Initialize interactive zoom for map overview images
function initializeInteractiveMapZoom() {
    // Find all gamemode sections
    const gamemodeSections = document.querySelectorAll('.gamemode-section');

    gamemodeSections.forEach(section => {
        // Find the map-image div within this section
        const mapImageDiv = section.querySelector('.map-image');
        if (!mapImageDiv) return;

        // Find the img inside
        const img = mapImageDiv.querySelector('img');
        if (!img) return;

        // Check if this is a placeholder image
        const src = img.src || '';
        if (src.includes('upscaled_t-55-enigma.webp') ||
            src.includes('imagecomingsoon.webp') ||
            src.includes('placeholder')) {
            return; // Skip interactive zoom for placeholder images
        }

        // Get the original parent and position
        const parent = mapImageDiv.parentNode;
        const nextSibling = mapImageDiv.nextSibling;

        // Create interactive container
        const container = document.createElement('div');
        container.className = 'interactive-map-container';

        // Move the map-image div into the container
        parent.insertBefore(container, mapImageDiv);
        container.appendChild(mapImageDiv);

        // Set up the container
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.overflow = 'hidden';
        container.style.cursor = 'grab';
        container.style.touchAction = 'none';
        container.style.userSelect = 'none';
        container.style.webkitUserSelect = 'none';
        container.style.backgroundColor = 'var(--bg-secondary)';
        container.style.borderRadius = '0.75rem';
        container.style.boxShadow = 'var(--shadow-lg)';
        container.style.border = '1px solid var(--border-color)';

        // Style the map-image div
        mapImageDiv.style.margin = '0';
        mapImageDiv.style.position = 'relative';
        mapImageDiv.style.overflow = 'hidden';
        mapImageDiv.style.display = 'flex';
        mapImageDiv.style.alignItems = 'center';
        mapImageDiv.style.justifyContent = 'center';
        mapImageDiv.style.width = '100%';
        mapImageDiv.style.height = 'auto';
        mapImageDiv.style.minHeight = 'auto';
        mapImageDiv.style.padding = '0';

        // Style the image for interactive zoom
        img.style.display = 'block';
        img.style.width = '100%';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = 'none';
        img.style.borderRadius = '0';
        img.style.boxShadow = 'none';
        img.style.border = 'none';
        img.style.transition = 'none';
        img.style.transformOrigin = 'center center';
        img.style.pointerEvents = 'none';
        img.style.userSelect = 'none';
        img.style.webkitUserSelect = 'none';
        img.style.webkitUserDrag = 'none';

        // Force a layout recalculation
        container.style.display = 'block';

        // Wait for image to load to get natural dimensions
        if (img.complete && img.naturalWidth > 0) {
            setupZoomControls(container, img, mapImageDiv);
        } else {
            img.addEventListener('load', function() {
                setupZoomControls(container, img, mapImageDiv);
            });
            // Fallback if image already loaded but event didn't fire
            setTimeout(() => {
                if (img.naturalWidth > 0) {
                    setupZoomControls(container, img, mapImageDiv);
                }
            }, 500);
        }
    });
}

// Set up zoom controls and interaction for an interactive map container
function setupZoomControls(container, img, mapImageDiv) {
    // Zoom state
    let zoomLevel = 1;
    let minZoom = 1;
    let maxZoom = 5;
    let translateX = 0;
    let translateY = 0;

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width || container.clientWidth || 800;
    const containerHeight = containerRect.height || container.clientHeight || 500;

    // Image dimensions
    const imgWidth = img.naturalWidth || img.width || 800;
    const imgHeight = img.naturalHeight || img.height || 500;

    // Calculate initial display dimensions (image fits container width)
    const aspectRatio = imgWidth / imgHeight;
    let displayWidth = containerWidth;
    let displayHeight = containerWidth / aspectRatio;

    // If height would exceed container height, fit to height instead
    if (displayHeight > containerHeight) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * aspectRatio;
    }

    // Store the natural display size for scaling calculations
    img.dataset.displayWidth = displayWidth;
    img.dataset.displayHeight = displayHeight;

    // Add zoom controls
    const controls = document.createElement('div');
    controls.className = 'zoom-controls';
    controls.innerHTML = `
        <button class="zoom-btn" data-action="zoom-in" aria-label="Zoom in">
            <i class="fas fa-plus"></i>
        </button>
        <button class="zoom-btn reset-btn" data-action="reset" aria-label="Reset view">
            <i class="fas fa-home"></i>
        </button>
        <button class="zoom-btn" data-action="zoom-out" aria-label="Zoom out">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(controls);

    // Get button references
    const zoomInBtn = controls.querySelector('[data-action="zoom-in"]');
    const zoomOutBtn = controls.querySelector('[data-action="zoom-out"]');
    const resetBtn = controls.querySelector('[data-action="reset"]');

    // Set initial image size to fit container
    function updateTransform() {
        const displayW = parseFloat(img.dataset.displayWidth) || containerWidth;
        const displayH = parseFloat(img.dataset.displayHeight) || containerHeight;

        // Calculate the scaled dimensions
        const scaledWidth = displayW * zoomLevel;
        const scaledHeight = displayH * zoomLevel;

        // Get current container dimensions
        const rect = container.getBoundingClientRect();
        const currentWidth = rect.width || containerWidth;
        const currentHeight = rect.height || containerHeight;

        // Calculate max translations to keep image in bounds
        const maxTranslateX = Math.max(0, (scaledWidth - currentWidth) / 2);
        const maxTranslateY = Math.max(0, (scaledHeight - currentHeight) / 2);

        // Clamp translations
        translateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, translateX));
        translateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, translateY));

        // Apply transform
        const transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
        img.style.transform = transform;
        img.style.transformOrigin = 'center center';
    }

    // Reset view
    function resetView() {
        zoomLevel = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
    }

    // Zoom in
    function zoomIn() {
        const newZoom = Math.min(zoomLevel * 1.2, maxZoom);
        if (newZoom !== zoomLevel) {
            zoomLevel = newZoom;
            updateTransform();
        }
    }

    // Zoom out
    function zoomOut() {
        const newZoom = Math.max(zoomLevel / 1.2, minZoom);
        if (newZoom !== zoomLevel) {
            zoomLevel = newZoom;
            updateTransform();
        }
    }

    // Mouse drag handling
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startTranslateX = 0;
    let startTranslateY = 0;

    function onDragStart(e) {
        if (e.button !== undefined && e.button !== 0) return;

        isDragging = true;
        container.style.cursor = 'grabbing';

        const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
        const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

        startX = clientX;
        startY = clientY;
        startTranslateX = translateX;
        startTranslateY = translateY;

        e.preventDefault();
    }

    function onDragMove(e) {
        if (!isDragging) return;

        const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
        const clientY = e.clientY || e.touches?.[0]?.clientY || 0;

        const deltaX = clientX - startX;
        const deltaY = clientY - startY;

        translateX = startTranslateX + deltaX;
        translateY = startTranslateY + deltaY;

        updateTransform();
        e.preventDefault();
    }

    function onDragEnd(e) {
        if (isDragging) {
            isDragging = false;
            container.style.cursor = 'grab';
        }
    }

    // Mouse events
    container.addEventListener('mousedown', onDragStart);
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);

    // Touch events
    container.addEventListener('touchstart', onDragStart, { passive: false });
    container.addEventListener('touchmove', onDragMove, { passive: false });
    container.addEventListener('touchend', onDragEnd);

    // Mouse wheel zoom
    container.addEventListener('wheel', function(e) {
        e.preventDefault();

        const delta = e.deltaY || e.deltaX || 0;
        if (delta > 0) {
            zoomOut();
        } else if (delta < 0) {
            zoomIn();
        }
    }, { passive: false });

    // Button events
    zoomInBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        zoomIn();
    });
    zoomOutBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        zoomOut();
    });
    resetBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resetView();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only if container is visible and hovered
        if (!container.matches(':hover')) return;

        switch(e.key) {
            case '=':
            case '+':
                e.preventDefault();
                zoomIn();
                break;
            case '-':
                e.preventDefault();
                zoomOut();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                resetView();
                break;
        }
    });

    // Initial reset
    resetView();

    // Update on resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Recalculate display dimensions
            const rect = container.getBoundingClientRect();
            const newWidth = rect.width || container.clientWidth || 800;
            const newHeight = rect.height || container.clientHeight || 500;

            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let displayW = newWidth;
            let displayH = newWidth / aspectRatio;

            if (displayH > newHeight) {
                displayH = newHeight;
                displayW = newHeight * aspectRatio;
            }

            img.dataset.displayWidth = displayW;
            img.dataset.displayHeight = displayH;
            resetView();
        }, 200);
    });
}