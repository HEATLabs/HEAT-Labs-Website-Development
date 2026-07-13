// mod Page JS for HEAT Labs
document.addEventListener('DOMContentLoaded', function() {
    // Get mod ID or slug from meta tag
    const modIdMeta = document.querySelector('meta[name="mod-id"]');
    const modSlugMeta = document.querySelector('meta[name="mod-slug"]');
    const modId = modIdMeta ? modIdMeta.content : null;
    const modSlug = modSlugMeta ? modSlugMeta.content : null;

    // If mod ID or slug is specified, fetch and populate mod data
    if (modId || modSlug) {
        fetchModData(modId, modSlug);
    }

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
        const modMeta = document.querySelector('.mod-meta');
        if (modMeta) {
            const viewCounter = document.createElement('span');
            viewCounter.className = 'mod-views-counter';
            viewCounter.innerHTML = `
                <i class="fas fa-eye"></i>
                <span class="mod-views-count">${views.totalViews.toLocaleString()}</span> views
            `;
            modMeta.appendChild(viewCounter);
        }
    });

    // Initialize any interactive elements specific to mod pages
    initializeModPageElements();
});

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

// Function to fetch mod data based on ID or slug
async function fetchModData(modId, modSlug) {
    try {
        // Fetch the mods.json
        const modsResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/mods.json');
        const modsData = await modsResponse.json();

        // Find the mod with matching ID or slug
        let mod = null;

        if (modId) {
            mod = modsData.find(m => m.id.toString() === modId.toString());
        }

        if (!mod && modSlug) {
            // Try to match by slug (could be the name or a URL slug)
            mod = modsData.find(m => {
                // Check if slug matches the mod name (case insensitive)
                const slugMatches = m.slug && m.slug.toLowerCase().includes(modSlug.toLowerCase());
                // Check if name matches (case insensitive)
                const nameMatches = m.name.toLowerCase().replace(/\s+/g, '-') === modSlug.toLowerCase();
                return slugMatches || nameMatches;
            });
        }

        if (!mod) {
            console.error('Mod not found with ID:', modId, 'or slug:', modSlug);
            return;
        }

        // Update page elements with mod data
        updateModPageElements(mod);

    } catch (error) {
        console.error('Error fetching mod data:', error);
    }
}

function updateModPageElements(mod) {
    // Update page title and meta tags
    document.title = `${mod.name} - HEAT Labs`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `HEAT Labs - ${mod.name}`;
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = `HEAT Labs - ${mod.name}`;

    // Update mod header information
    const modHeader = document.querySelector('.mod-header');
    if (modHeader) {
        const modMeta = modHeader.querySelector('.mod-meta');

        if (modMeta) {
            // Clear the meta container but keep the structure
            modMeta.innerHTML = '';

            // Category Badge
            const categorySpan = document.createElement('span');
            categorySpan.className = 'mod-type-badge';
            categorySpan.textContent = mod.category || 'Unknown';
            modMeta.appendChild(categorySpan);

            // Creator
            const creatorSpan = document.createElement('span');
            creatorSpan.innerHTML = `<i class="fas fa-users mr-1"></i> ${mod.creator || 'Unknown'}`;
            modMeta.appendChild(creatorSpan);

            // Game Version
            if (mod.gameVersion) {
                const versionSpan = document.createElement('span');
                versionSpan.innerHTML = `<i class="fas fa-code-branch mr-1"></i> v${mod.gameVersion}`;
                modMeta.appendChild(versionSpan);
            }
        }

        const modTitle = modHeader.querySelector('.mod-title');
        if (modTitle) {
            modTitle.textContent = mod.name;
        }

        const modDescription = modHeader.querySelector('.mod-description');
        if (modDescription && mod.description) {
            modDescription.textContent = mod.description;
        }
    }

    // Update mod image in the main content
    const modImage = document.querySelector('.mod-image img');
    if (modImage && mod.image) {
        modImage.src = mod.image;
        modImage.alt = mod.name;
    }

    // Update sidebar Quick Facts
    const sidebarCards = document.querySelectorAll('.sidebar-card');
    sidebarCards.forEach(card => {
        const heading = card.querySelector('h3');
        if (heading && heading.textContent === 'Quick Facts') {
            const quickFactsList = card.querySelector('ul');
            if (quickFactsList) {
                const items = quickFactsList.querySelectorAll('li');
                if (items.length >= 3) {
                    items[0].innerHTML = `<strong>Category:</strong> ${mod.category || 'Info coming soon'}`;
                    items[1].innerHTML = `<strong>Mod Version:</strong> ${mod.modVersion || 'Info coming soon'}`;
                    items[2].innerHTML = `<strong>Game Version:</strong> ${mod.gameVersion || 'Info coming soon'}`;
                }
            }
        }
    });

    // Update "Related Mods" sidebar
    updateRelatedMods(mod);
}

// Function to fetch and display related mods
async function updateRelatedMods(currentMod) {
    try {
        const modsResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/mods.json');
        const modsData = await modsResponse.json();

        // Find mods from the same creator or same category
        const relatedMods = modsData.filter(m =>
            m.id !== currentMod.id &&
            (m.creator === currentMod.creator || m.category === currentMod.category)
        ).slice(0, 3);

        const relatedGuidesContainer = document.querySelector('.sidebar-card .related-guide')?.parentElement;
        if (relatedGuidesContainer) {
            // Clear existing related guides except the first one which is a placeholder
            const existingGuides = relatedGuidesContainer.querySelectorAll('.related-guide');
            existingGuides.forEach(guide => guide.remove());

            if (relatedMods.length > 0) {
                relatedMods.forEach(mod => {
                    const guideDiv = document.createElement('div');
                    guideDiv.className = 'related-guide';
                    guideDiv.innerHTML = `
                        <h4>
                            <a href="../details/${mod.name.toLowerCase().replace(/\s+/g, '-')}">${mod.name}</a>
                        </h4>
                        <p>${mod.category} • by ${mod.creator}</p>
                    `;
                    relatedGuidesContainer.appendChild(guideDiv);
                });
            } else {
                // Show "no related mods" message
                const noModsDiv = document.createElement('div');
                noModsDiv.className = 'related-guide';
                noModsDiv.innerHTML = `
                    <h4>No Related Mods Yet</h4>
                    <p>Mods from the same creator or similar mods will appear here.</p>
                `;
                relatedGuidesContainer.appendChild(noModsDiv);
            }

            // Re-add the "View all mods" button
            const buttonDiv = document.createElement('div');
            buttonDiv.className = 'button text-center';
            buttonDiv.innerHTML = `<a href="../index">View all mods</a>`;
            relatedGuidesContainer.appendChild(buttonDiv);
        }
    } catch (error) {
        console.error('Error fetching related mods:', error);
    }
}

function initializeModPageElements() {
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
        document.querySelectorAll('.mod-image, .sidebar-card').forEach(el => {
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
    document.querySelectorAll('.mod-image img').forEach(img => {
        galleryImages.push({
            src: img.src,
            alt: img.alt,
            caption: img.nextElementSibling?.textContent || ''
        });
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
    document.querySelectorAll('.mod-image img, .sidebar-card .gallery-thumbnail').forEach((element, index) => {
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