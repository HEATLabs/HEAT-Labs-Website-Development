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

// Function to fetch GitHub release version from API
async function fetchGitHubVersion(githubUrl) {
    try {
        // Extract owner and repo from GitHub URL
        // Handle different GitHub URL formats
        let apiUrl;

        if (githubUrl.includes('api.github.com/repos')) {
            // Already an API URL
            apiUrl = githubUrl;
        } else if (githubUrl.includes('github.com')) {
            // Convert to API URL
            const urlParts = githubUrl.replace('https://github.com/', '').split('/');
            const owner = urlParts[0];
            const repo = urlParts[1];
            apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
        } else {
            // Not a GitHub URL, return as is
            return githubUrl;
        }

        const response = await fetch(apiUrl);

        if (!response.ok) {
            // If the request fails (e.g., rate limited, no releases), return the original URL
            console.warn('Failed to fetch GitHub version:', response.status);
            return githubUrl;
        }

        const data = await response.json();

        // Extract version from tag_name or name
        if (data.tag_name) {
            return data.tag_name;
        } else if (data.name) {
            return data.name;
        } else {
            return githubUrl;
        }
    } catch (error) {
        console.error('Error fetching GitHub version:', error);
        return githubUrl;
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

        // Fetch detailed mod data from MD file if available
        let modDetails = null;
        if (mod.details) {
            try {
                const detailsResponse = await fetch(mod.details);
                const detailsText = await detailsResponse.text();
                modDetails = parseModDetails(detailsText);
            } catch (error) {
                console.warn('Could not fetch mod details:', error);
            }
        }

        // Fetch GitHub version if modVersion is a GitHub URL
        let modVersion = mod.modVersion || 'Info coming soon';
        if (modVersion && modVersion.includes('github.com')) {
            modVersion = await fetchGitHubVersion(modVersion);
        }

        // Update page elements with mod data
        updateModPageElements(mod, modVersion, modDetails);

    } catch (error) {
        console.error('Error fetching mod data:', error);
    }
}

// Function to parse mod details from MD file
function parseModDetails(mdContent) {
    const details = {};

    // Extract category
    const categoryMatch = mdContent.match(/category:\s*([^#\n]+)/i);
    if (categoryMatch && categoryMatch[1]) {
        // Get all categories, split by comma, trim each
        const categories = categoryMatch[1].split(',').map(cat => cat.trim());
        // Store full category string for the mod facts section
        details.categoryFull = categories.join(', ');
        // Store just the first category for the badge
        details.category = categories[0];
    }

    // Extract type
    const typeMatch = mdContent.match(/type:\s*([^#\n]+)/i);
    if (typeMatch && typeMatch[1]) {
        details.type = typeMatch[1].trim();
    }

    // Extract compatible version (game version)
    const versionMatch = mdContent.match(/compatible-version:\s*([^\n]+)/i);
    if (versionMatch && versionMatch[1]) {
        details.gameVersion = versionMatch[1].trim();
    }

    // Extract description from the top-level description field
    const descriptionMatch = mdContent.match(/^description:\s*(.+)$/m);
    if (descriptionMatch && descriptionMatch[1]) {
        details.description = descriptionMatch[1].trim();
    }

    // Extract overview description from the overview section
    const overviewDescMatch = mdContent.match(/overview:[\s\S]*?description:\s*(.+?)(?=\n\s*\w+:|$)/i);
    if (overviewDescMatch && overviewDescMatch[1]) {
        details.overviewDescription = overviewDescMatch[1].trim();
    }

    // Extract overview layout
    const layoutMatch = mdContent.match(/overview:[\s\S]*?layout:\s*([^\n]+)/i);
    if (layoutMatch && layoutMatch[1]) {
        details.overviewLayout = layoutMatch[1].trim();
    }

    // Extract overview images from items array only
    details.overviewImages = [];
    const itemsMatch = mdContent.match(/overview:[\s\S]*?items:([\s\S]*?)(?=\n\s*\w+:|$)/i);
    if (itemsMatch && itemsMatch[1]) {
        // Find all image paths in the items section
        const imageRegex = /-\s*([^\n]+)/gi;
        let imageMatch;
        while ((imageMatch = imageRegex.exec(itemsMatch[1])) !== null) {
            const imagePath = imageMatch[1].trim();
            if (imagePath) {
                details.overviewImages.push(imagePath);
            }
        }
    }

    // Extract installation steps
    details.installationSteps = [];
    const installationMatch = mdContent.match(/installation:[\s\S]*?steps:([\s\S]*?)(?=\n\w+:|$)/i);
    if (installationMatch && installationMatch[1]) {
        // Parse individual steps
        const stepRegex = /-\s*name:\s*Step\s*#(\d+)\s*description:\s*(.+?)(?=\n\s*-|\n\s*\w+:|$)/gi;
        let stepMatch;
        while ((stepMatch = stepRegex.exec(installationMatch[1])) !== null) {
            const stepNumber = stepMatch[1];
            const description = stepMatch[2].trim();
            details.installationSteps.push({
                name: `Step #${stepNumber}`,
                description: description
            });
        }
    }

    return details;
}

function updateModPageElements(mod, modVersion, modDetails) {
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
            let category = mod.category || 'Unknown';
            if (modDetails && modDetails.category) {
                category = modDetails.category;
            }
            const categorySpan = document.createElement('span');
            categorySpan.className = 'mod-type-badge';
            categorySpan.textContent = category;
            modMeta.appendChild(categorySpan);

            // Creator
            const creatorSpan = document.createElement('span');
            creatorSpan.innerHTML = `<i class="fas fa-users mr-1"></i> ${mod.creator || 'Unknown'}`;
            modMeta.appendChild(creatorSpan);
        }

        const modTitle = modHeader.querySelector('.mod-title');
        if (modTitle) {
            modTitle.textContent = mod.name;
        }

        const modDescription = modHeader.querySelector('.mod-description');
        if (modDescription) {
            // Use short description from mods.json
            if (mod.description) {
                modDescription.textContent = mod.description;
            }
        }
    }

    // Update "Mod Introduction" text in the main content
    const modIntroParagraph = document.querySelector('#mod-introduction');
    if (modIntroParagraph) {
        const introText = modIntroParagraph.closest('.mb-12')?.querySelector('.text-center');
        if (introText) {
            // Use description from MD file if available
            if (modDetails && modDetails.description) {
                introText.textContent = modDetails.description;
            }
        }
    }

    // Update mod image in the main content
    const modImage = document.querySelector('.mod-image img');
    if (modImage && mod.image) {
        modImage.src = mod.image;
        modImage.alt = mod.name;
    }

    // Update overview section with description and images from MD file
    const overviewSection = document.getElementById('standard');
    if (overviewSection && modDetails) {
        // Update overview description
        const overviewParagraph = overviewSection.querySelector('.text-center');
        if (overviewParagraph) {
            if (modDetails.overviewDescription) {
                overviewParagraph.textContent = modDetails.overviewDescription;
            }
        }

        // Update overview images based on layout
        const layout = modDetails.overviewLayout || 'none';
        const images = modDetails.overviewImages || [];

        // Remove existing image grids
        const existingGrids = overviewSection.querySelectorAll('.grid');
        existingGrids.forEach(grid => grid.remove());

        // If layout is 'none' or no images, don't add any images
        if (layout === 'none' || images.length === 0) {
            return;
        }

        // Build the layout
        let layoutHTML = '';

        switch (layout) {
            case 'single':
                if (images.length >= 1) {
                    layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6">
                            <div>
                                <img src="${images[0]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                    `;
                }
                break;

            case 'two':
                if (images.length >= 2) {
                    layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                            <div>
                                <img src="${images[0]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                            <div>
                                <img src="${images[1]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                    `;
                } else if (images.length === 1) {
                    layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6">
                            <div>
                                <img src="${images[0]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                    `;
                }
                break;

            case 'heroPlusTwo':
                if (images.length >= 3) {
                    layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6">
                            <div>
                                <img src="${images[0]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                            <div>
                                <img src="${images[1]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                            <div>
                                <img src="${images[2]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                    `;
                } else if (images.length === 2) {
                    layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6">
                            <div>
                                <img src="${images[0]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6">
                            <div>
                                <img src="${images[1]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                    `;
                } else if (images.length === 1) {
                    layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6">
                            <div>
                                <img src="${images[0]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                    `;
                }
                break;

            case 'grid':
                const gridImages = images.slice(0, 4);
                const gridItems = gridImages.map(img => `
                        <div>
                            <img src="${img}" alt="Mod Overview" class="rounded-lg">
                        </div>
                    `).join('');
                layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                            ${gridItems}
                        </div>
                    `;
                break;

            default:
                // Default to single image if layout is unknown but images exist
                if (images.length >= 1) {
                    layoutHTML = `
                        <div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6">
                            <div>
                                <img src="${images[0]}" alt="Mod Overview" class="rounded-lg">
                            </div>
                        </div>
                    `;
                }
                break;
        }

        // Insert the layout HTML after the description paragraph
        if (layoutHTML) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = layoutHTML;
            const gridElements = tempDiv.children;

            // Insert each grid after the description paragraph
            if (overviewParagraph) {
                for (let i = 0; i < gridElements.length; i++) {
                    overviewParagraph.after(gridElements[i]);
                }
            } else {
                // If no description paragraph, append to the section
                overviewSection.append(tempDiv);
            }
        }
    }

    // Update sidebar Quick Facts
    const sidebarCards = document.querySelectorAll('.sidebar-card');
    sidebarCards.forEach(card => {
        const heading = card.querySelector('h3');
        if (heading && heading.textContent === 'Mod Facts') {
            const quickFactsList = card.querySelector('ul');
            if (quickFactsList) {
                // Clear existing items
                quickFactsList.innerHTML = '';

                // Category
                let category = mod.category || 'Info coming soon';
                if (modDetails && modDetails.categoryFull) {
                    category = modDetails.categoryFull;
                } else if (modDetails && modDetails.category) {
                    category = modDetails.category;
                }
                const categoryItem = document.createElement('li');
                categoryItem.innerHTML = `<strong>Category:</strong> ${category}`;
                quickFactsList.appendChild(categoryItem);

                // Type
                let type = 'Info coming soon';
                if (modDetails && modDetails.type) {
                    type = modDetails.type;
                }
                const typeItem = document.createElement('li');
                typeItem.innerHTML = `<strong>Type:</strong> ${type}`;
                quickFactsList.appendChild(typeItem);

                // Game Version
                let gameVersion = 'Info coming soon';
                if (modDetails && modDetails.gameVersion) {
                    gameVersion = modDetails.gameVersion;
                }
                const gameVersionItem = document.createElement('li');
                gameVersionItem.innerHTML = `<strong>Game Version:</strong> ${gameVersion}`;
                quickFactsList.appendChild(gameVersionItem);

                // Mod Version
                const displayVersion = modVersion || 'Info coming soon';
                const modVersionItem = document.createElement('li');
                modVersionItem.innerHTML = `<strong>Mod Version:</strong> ${displayVersion}`;
                quickFactsList.appendChild(modVersionItem);
            }
        }
    });

    // Update installation steps
    const faqContainer = document.querySelector('.faq-container');
    if (faqContainer && modDetails && modDetails.installationSteps && modDetails.installationSteps.length > 0) {
        // Clear existing FAQ items
        faqContainer.innerHTML = '';

        // Create new FAQ items from installation steps
        modDetails.installationSteps.forEach((step, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = `faq-item ${index === 0 ? 'active' : ''}`;

            const faqQuestion = document.createElement('div');
            faqQuestion.className = 'faq-question';
            faqQuestion.innerHTML = `
                <h4>${step.name}</h4>
                <i class="fas fa-chevron-down"></i>
            `;

            const faqAnswer = document.createElement('div');
            faqAnswer.className = `faq-answer ${index === 0 ? 'active' : ''}`;
            faqAnswer.innerHTML = `<p>${step.description}</p>`;

            faqItem.appendChild(faqQuestion);
            faqItem.appendChild(faqAnswer);
            faqContainer.appendChild(faqItem);
        });

        // Re-attach click event listeners to FAQ items
        const newFaqItems = faqContainer.querySelectorAll('.faq-item');
        newFaqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                // Close all other FAQ items
                newFaqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const answer = otherItem.querySelector('.faq-answer');
                        if (answer) answer.classList.remove('active');
                    }
                });

                // Toggle current item
                item.classList.toggle('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) answer.classList.toggle('active');
            });
        });
    }

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
                // Fetch versions for related mods
                for (const mod of relatedMods) {
                    let modVersion = mod.modVersion || '';
                    if (modVersion && modVersion.includes('github.com')) {
                        modVersion = await fetchGitHubVersion(modVersion);
                    }

                    const guideDiv = document.createElement('div');
                    guideDiv.className = 'related-guide';
                    guideDiv.innerHTML = `
                        <h4>
                            <a href="../details/${mod.name.toLowerCase().replace(/\s+/g, '-')}">${mod.name}</a>
                        </h4>
                        <p>${mod.category} • by ${mod.creator}</p>
                        ${modVersion && modVersion !== mod.modVersion ? `<small>${modVersion}</small>` : ''}
                    `;
                    relatedGuidesContainer.appendChild(guideDiv);
                }
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