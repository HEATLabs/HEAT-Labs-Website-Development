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

// Function to fetch and parse mod details markdown
async function fetchModDetails(detailsUrl) {
    try {
        if (!detailsUrl) return null;

        const response = await fetch(detailsUrl);
        if (!response.ok) {
            console.warn('Failed to fetch mod details:', response.status);
            return null;
        }

        const markdown = await response.text();
        return parseMarkdownDetails(markdown);
    } catch (error) {
        console.error('Error fetching mod details:', error);
        return null;
    }
}

// Function to parse markdown details file
function parseMarkdownDetails(markdown) {
    const details = {
        name: '',
        description: '',
        download: '',
        compatibleVersion: '',
        status: '',
        category: '',
        type: '',
        license: null,
        support: null,
        features: [],
        overview: null,
        installation: null,
        videoShowcase: null
    };

    // Parse frontmatter
    const frontmatterMatch = markdown.match(/^---\s*([\s\S]*?)\s*---/);
    if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];

        // Parse simple key-value pairs
        const lines = frontmatter.split('\n');
        let currentSection = '';
        let inArray = false;
        let arrayKey = '';
        let arrayItems = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Check for section headers
            if (line.match(/^[a-zA-Z]+:/) && !line.includes('enabled:')) {
                currentSection = line.replace(':', '').trim();
                continue;
            }

            // Parse simple key: value pairs
            const keyValueMatch = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
            if (keyValueMatch) {
                const key = keyValueMatch[1].trim();
                const value = keyValueMatch[2].trim();

                // Handle nested objects
                if (key === 'enabled') {
                    if (currentSection === 'features' && arrayItems.length > 0) {
                        arrayItems[arrayItems.length - 1].enabled = value === 'true';
                    } else if (currentSection === 'overview') {
                        if (!details.overview) details.overview = {};
                        details.overview.enabled = value === 'true';
                    } else if (currentSection === 'installation') {
                        if (!details.installation) details.installation = {};
                        details.installation.enabled = value === 'true';
                    } else if (currentSection === 'videoShowcase') {
                        if (!details.videoShowcase) details.videoShowcase = {};
                        details.videoShowcase.enabled = value === 'true';
                    } else if (currentSection === 'license') {
                        if (!details.license) details.license = {};
                        details.license.enabled = value === 'true';
                    } else if (currentSection === 'support') {
                        if (!details.support) details.support = {};
                        details.support.enabled = value === 'true';
                    }
                    continue;
                }

                // Handle specific sections
                switch (currentSection) {
                    case 'features':
                        if (key === 'cards') {
                            // Start collecting card items
                            inArray = true;
                            arrayKey = 'cards';
                            arrayItems = [];
                        } else if (key === 'name' && arrayItems.length > 0) {
                            arrayItems[arrayItems.length - 1].name = value;
                        } else if (key === 'description' && arrayItems.length > 0) {
                            arrayItems[arrayItems.length - 1].description = value;
                        }
                        break;
                    case 'overview':
                        if (!details.overview) details.overview = {};
                        if (key === 'description') details.overview.description = value;
                        if (key === 'layout') details.overview.layout = value;
                        break;
                    case 'installation':
                        if (!details.installation) details.installation = {};
                        if (key === 'description') details.installation.description = value;
                        break;
                    case 'videoShowcase':
                        if (!details.videoShowcase) details.videoShowcase = {};
                        if (key === 'layout') details.videoShowcase.layout = value;
                        break;
                    case 'license':
                        if (!details.license) details.license = {};
                        if (key === 'name') details.license.name = value;
                        if (key === 'url') details.license.url = value;
                        break;
                    case 'support':
                        if (!details.support) details.support = {};
                        if (key === 'description') details.support.description = value;
                        if (key === 'feedback' && value) {
                            details.support.feedback = { enabled: true, name: '', url: '' };
                        }
                        if (key === 'support' && value) {
                            details.support.support = { enabled: true, name: '', url: '' };
                        }
                        break;
                    default:
                        // Top-level fields
                        switch (key) {
                            case 'name': details.name = value; break;
                            case 'description': details.description = value; break;
                            case 'download': details.download = value; break;
                            case 'compatible-version': details.compatibleVersion = value; break;
                            case 'status': details.status = value; break;
                            case 'category': details.category = value; break;
                            case 'type': details.type = value; break;
                        }
                        break;
                }
            }

            // Handle array items (like feature cards)
            if (line.startsWith('- enabled:')) {
                if (inArray && arrayKey === 'cards') {
                    if (arrayItems.length > 0) {
                        // Push the completed item
                    }
                    arrayItems.push({ enabled: true });
                }
            }

            // Handle nested properties in array items
            if (inArray && arrayKey === 'cards' && arrayItems.length > 0) {
                const nestedMatch = line.match(/^([a-zA-Z-]+):\s*(.*)$/);
                if (nestedMatch && !nestedMatch[1].includes('enabled')) {
                    const key = nestedMatch[1].trim();
                    const value = nestedMatch[2].trim();
                    arrayItems[arrayItems.length - 1][key] = value;
                }
            }

            // Handle overview images
            if (currentSection === 'overview' && details.overview) {
                if (line.includes('hero:')) {
                    const heroMatch = line.match(/hero:\s*(.+)/);
                    if (heroMatch) details.overview.hero = heroMatch[1].trim();
                }
                if (line.includes('items:')) {
                    if (!details.overview.images) details.overview.images = [];
                }
                if (line.match(/^\s*- /) && line.includes('.png') || line.includes('.jpg') || line.includes('.webp')) {
                    const imageMatch = line.match(/-\s*(.+)/);
                    if (imageMatch && details.overview.images) {
                        details.overview.images.push(imageMatch[1].trim());
                    }
                }
            }

            // Handle video showcase
            if (currentSection === 'videoShowcase' && details.videoShowcase) {
                if (line.includes('title:')) {
                    const titleMatch = line.match(/title:\s*(.+)/);
                    if (titleMatch) {
                        if (!details.videoShowcase.videos) details.videoShowcase.videos = [];
                        details.videoShowcase.videos.push({ title: titleMatch[1].trim() });
                    }
                }
                if (line.includes('thumbnail:')) {
                    const thumbMatch = line.match(/thumbnail:\s*(.+)/);
                    if (thumbMatch && details.videoShowcase.videos && details.videoShowcase.videos.length > 0) {
                        const lastVideo = details.videoShowcase.videos[details.videoShowcase.videos.length - 1];
                        lastVideo.thumbnail = thumbMatch[1].trim();
                    }
                }
                if (line.includes('url:')) {
                    const urlMatch = line.match(/url:\s*(.+)/);
                    if (urlMatch && details.videoShowcase.videos && details.videoShowcase.videos.length > 0) {
                        const lastVideo = details.videoShowcase.videos[details.videoShowcase.videos.length - 1];
                        lastVideo.url = urlMatch[1].trim();
                    }
                }
                if (line.includes('creator:')) {
                    const creatorMatch = line.match(/creator:\s*(.+)/);
                    if (creatorMatch && details.videoShowcase.videos && details.videoShowcase.videos.length > 0) {
                        const lastVideo = details.videoShowcase.videos[details.videoShowcase.videos.length - 1];
                        lastVideo.creator = creatorMatch[1].trim();
                    }
                }
                if (line.includes('type:')) {
                    const typeMatch = line.match(/type:\s*(.+)/);
                    if (typeMatch && details.videoShowcase.videos && details.videoShowcase.videos.length > 0) {
                        const lastVideo = details.videoShowcase.videos[details.videoShowcase.videos.length - 1];
                        lastVideo.type = typeMatch[1].trim();
                    }
                }
            }

            // Handle installation steps
            if (currentSection === 'installation' && details.installation) {
                if (line.includes('steps:') || line.includes('- name:')) {
                    if (!details.installation.steps) details.installation.steps = [];
                    const stepMatch = line.match(/name:\s*(.+)/);
                    if (stepMatch) {
                        const stepName = stepMatch[1].trim();
                        // Find the next line that has description
                        let description = '';
                        for (let j = i + 1; j < lines.length; j++) {
                            const nextLine = lines[j].trim();
                            if (nextLine.startsWith('description:')) {
                                description = nextLine.replace('description:', '').trim();
                                break;
                            }
                            if (nextLine.startsWith('- name:') || nextLine === '') {
                                break;
                            }
                        }
                        details.installation.steps.push({ name: stepName, description: description });
                    }
                }
            }
        }

        // Store features from array
        if (arrayItems.length > 0 && arrayKey === 'cards') {
            details.features = arrayItems;
        }
    }

    return details;
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

        // Fetch GitHub version if modVersion is a GitHub URL
        let modVersion = mod.modVersion || 'Info coming soon';
        if (modVersion && modVersion.includes('github.com')) {
            modVersion = await fetchGitHubVersion(modVersion);
        }

        // Fetch mod details from markdown file
        let modDetails = null;
        if (mod.details) {
            modDetails = await fetchModDetails(mod.details);
        }

        // Update page elements with mod data
        updateModPageElements(mod, modVersion, modDetails);

    } catch (error) {
        console.error('Error fetching mod data:', error);
    }
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
            const categorySpan = document.createElement('span');
            categorySpan.className = 'mod-type-badge';
            categorySpan.textContent = mod.category || 'Unknown';
            modMeta.appendChild(categorySpan);

            // Creator
            const creatorSpan = document.createElement('span');
            creatorSpan.innerHTML = `<i class="fas fa-users mr-1"></i> ${mod.creator || 'Unknown'}`;
            modMeta.appendChild(creatorSpan);

            // Game Version (if available from details)
            if (modDetails && modDetails.compatibleVersion) {
                const versionSpan = document.createElement('span');
                versionSpan.innerHTML = `<i class="fas fa-code-branch mr-1"></i> v${modDetails.compatibleVersion}`;
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

    // Update mod introduction
    if (modDetails && modDetails.description) {
        const introParagraph = document.querySelector('#mod-introduction')?.parentElement?.querySelector('p');
        if (introParagraph) {
            introParagraph.textContent = modDetails.description;
        }
    }

    // Update feature cards
    if (modDetails && modDetails.features && modDetails.features.length > 0) {
        const featureCards = document.querySelectorAll('.feature-card');
        const featuresToShow = modDetails.features.filter(f => f.enabled !== false).slice(0, 4);

        featureCards.forEach((card, index) => {
            if (index < featuresToShow.length) {
                const feature = featuresToShow[index];
                const icon = card.querySelector('.icon-wrapper i');
                const title = card.querySelector('h3');
                const desc = card.querySelector('p');

                if (title) title.textContent = feature.name || 'Feature';
                if (desc) desc.textContent = feature.description || '';
                // Keep the icon as is (or could set based on feature type)
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Update mod overview section
    updateModOverview(mod, modDetails);

    // Update installation section
    updateInstallationSection(modDetails);

    // Update video showcase
    updateVideoShowcase(modDetails);

    // Update sidebar Quick Facts
    const sidebarCards = document.querySelectorAll('.sidebar-card');
    sidebarCards.forEach(card => {
        const heading = card.querySelector('h3');
        if (heading && heading.textContent === 'Mod Facts') {
            const quickFactsList = card.querySelector('ul');
            if (quickFactsList) {
                const items = quickFactsList.querySelectorAll('li');
                if (items.length >= 3) {
                    // Use the fetched modVersion if available, otherwise fallback to the original
                    const displayVersion = modVersion || 'Info coming soon';
                    const gameVersion = (modDetails && modDetails.compatibleVersion) || 'Info coming soon';
                    items[0].innerHTML = `<strong>Category:</strong> ${mod.category || 'Info coming soon'}`;
                    items[1].innerHTML = `<strong>Mod Version:</strong> ${displayVersion}`;
                    items[2].innerHTML = `<strong>Game Version:</strong> ${gameVersion}`;
                }
            }
        }
    });

    // Update download button
    updateDownloadButton(mod, modDetails);

    // Update "Related Mods" sidebar
    updateRelatedMods(mod);
}

function updateModOverview(mod, modDetails) {
    const overviewSection = document.querySelector('.gamemode-section#standard');
    if (!overviewSection) return;

    // Update description
    const descParagraph = overviewSection.querySelector('p');
    if (descParagraph && modDetails && modDetails.overview && modDetails.overview.description) {
        descParagraph.textContent = modDetails.overview.description;
    }

    // Update images based on layout
    if (modDetails && modDetails.overview) {
        const layout = modDetails.overview.layout || 'none';
        const images = modDetails.overview.images || [];
        const hero = modDetails.overview.hero || null;

        // Remove existing image grid
        const existingGrid = overviewSection.querySelector('.grid');
        if (existingGrid) {
            existingGrid.remove();
        }

        // If layout is 'none' or no images, don't show any
        if (layout === 'none' || (images.length === 0 && !hero)) {
            return;
        }

        // Create image grid based on layout
        let gridClass = '';
        let allImages = [];

        if (layout === 'single') {
            gridClass = 'grid-cols-1';
            allImages = hero ? [hero, ...images.slice(0, 1)] : images.slice(0, 1);
        } else if (layout === 'two') {
            gridClass = 'grid-cols-1 md:grid-cols-2';
            allImages = images.slice(0, 2);
        } else if (layout === 'heroPlusTwo') {
            gridClass = 'grid-cols-1';
            allImages = hero ? [hero, ...images.slice(0, 2)] : images.slice(0, 3);
        } else if (layout === 'grid') {
            gridClass = 'grid-cols-1 md:grid-cols-2';
            allImages = images.slice(0, 4);
        } else {
            return;
        }

        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = `grid ${gridClass} gap-4 my-6`;

        // If heroPlusTwo, we need a special layout
        if (layout === 'heroPlusTwo' && allImages.length > 0) {
            // Hero image (full width)
            const heroDiv = document.createElement('div');
            if (allImages[0]) {
                heroDiv.innerHTML = `<img src="${allImages[0]}" alt="${mod.name} hero" class="rounded-lg w-full">`;
                gridContainer.appendChild(heroDiv);
            }

            // Two images below
            const twoColGrid = document.createElement('div');
            twoColGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 my-6';
            for (let i = 1; i < Math.min(allImages.length, 3); i++) {
                const imgDiv = document.createElement('div');
                imgDiv.innerHTML = `<img src="${allImages[i]}" alt="${mod.name} image ${i}" class="rounded-lg w-full">`;
                twoColGrid.appendChild(imgDiv);
            }
            gridContainer.appendChild(twoColGrid);
        } else {
            // Standard grid layout
            allImages.forEach((imgSrc, index) => {
                const imgDiv = document.createElement('div');
                imgDiv.innerHTML = `<img src="${imgSrc}" alt="${mod.name} image ${index + 1}" class="rounded-lg w-full">`;
                gridContainer.appendChild(imgDiv);
            });
        }

        overviewSection.appendChild(gridContainer);
    }
}

function updateInstallationSection(modDetails) {
    const faqContainer = document.querySelector('.faq-container');
    if (!faqContainer) return;

    if (modDetails && modDetails.installation && modDetails.installation.steps && modDetails.installation.steps.length > 0) {
        // Clear existing FAQ items
        faqContainer.innerHTML = '';

        // Create new FAQ items from installation steps
        modDetails.installation.steps.forEach((step, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = `faq-item${index === 0 ? ' active' : ''}`;

            const question = document.createElement('div');
            question.className = 'faq-question';
            question.innerHTML = `
                <h4>${step.name || `Step ${index + 1}`}</h4>
                <i class="fas fa-chevron-down"></i>
            `;

            const answer = document.createElement('div');
            answer.className = `faq-answer${index === 0 ? ' active' : ''}`;
            answer.innerHTML = `<p>${step.description || 'No description available.'}</p>`;

            faqItem.appendChild(question);
            faqItem.appendChild(answer);
            faqContainer.appendChild(faqItem);

            // Add click handler for accordion
            question.addEventListener('click', function() {
                const allItems = faqContainer.querySelectorAll('.faq-item');
                allItems.forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove('active');
                        item.querySelector('.faq-answer').classList.remove('active');
                    }
                });
                faqItem.classList.toggle('active');
                const answerEl = faqItem.querySelector('.faq-answer');
                answerEl.classList.toggle('active');
            });
        });
    }
}

function updateVideoShowcase(modDetails) {
    const videoShowcaseContainer = document.querySelector('.mb-12:has(#video-showcase)');
    if (!videoShowcaseContainer) return;

    if (modDetails && modDetails.videoShowcase && modDetails.videoShowcase.enabled !== false) {
        const layout = modDetails.videoShowcase.layout || 'single';
        const videos = modDetails.videoShowcase.videos || [];

        // If no videos, hide the section
        if (videos.length === 0) {
            videoShowcaseContainer.style.display = 'none';
            return;
        }

        // Get the existing grid containers
        const existingGrids = videoShowcaseContainer.querySelectorAll('.grid');

        // Keep the first p (title) and h2
        const titleEl = videoShowcaseContainer.querySelector('h2');
        const descEl = videoShowcaseContainer.querySelector('p');

        // Remove all grid containers
        existingGrids.forEach(grid => grid.remove());

        // Create grids based on layout
        if (layout === 'none') {
            videoShowcaseContainer.style.display = 'none';
            return;
        }

        // Helper function to create video cards
        function createVideoCard(video) {
            const card = document.createElement('div');
            card.className = 'video-card';

            const videoId = video.url ? video.url.split('v=')[1]?.split('&')[0] || video.url.split('/embed/')[1]?.split('?')[0] : '';

            card.innerHTML = `
                <div class="video-thumbnail">
                    ${videoId ? `
                        <iframe width="100%" height="315" src="https://www.youtube-nocookie.com/embed/${videoId}"
                            title="${video.title || 'Video'}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen class="rounded-t-lg"></iframe>
                    ` : `
                        <div class="video-thumbnail-placeholder" style="height:315px;background:#333;display:flex;align-items:center;justify-content:center;border-radius:8px 8px 0 0;">
                            <i class="fas fa-video" style="font-size:48px;color:#666;"></i>
                        </div>
                    `}
                </div>
                <div class="video-info">
                    <h4>${video.title || 'Untitled Video'}</h4>
                    ${video.creator ? `<p class="video-author">by ${video.creator}</p>` : ''}
                    ${video.type ? `<span class="video-type text-xs text-gray-400">${video.type}</span>` : ''}
                </div>
            `;
            return card;
        }

        // Create layout based on type
        if (layout === 'single') {
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-1 gap-8 my-8';
            if (videos.length > 0) {
                grid.appendChild(createVideoCard(videos[0]));
            }
            videoShowcaseContainer.appendChild(grid);
        } else if (layout === 'two') {
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-8 my-8';
            videos.slice(0, 2).forEach(video => {
                grid.appendChild(createVideoCard(video));
            });
            videoShowcaseContainer.appendChild(grid);
        } else if (layout === 'heroPlusTwo') {
            // Hero video (full width)
            const heroGrid = document.createElement('div');
            heroGrid.className = 'grid grid-cols-1 md:grid-cols-1 gap-8 my-8';
            if (videos.length > 0) {
                heroGrid.appendChild(createVideoCard(videos[0]));
            }
            videoShowcaseContainer.appendChild(heroGrid);

            // Two videos below
            const twoGrid = document.createElement('div');
            twoGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-8 my-8';
            videos.slice(1, 3).forEach(video => {
                twoGrid.appendChild(createVideoCard(video));
            });
            videoShowcaseContainer.appendChild(twoGrid);
        } else if (layout === 'grid') {
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-8 my-8';
            videos.slice(0, 4).forEach(video => {
                grid.appendChild(createVideoCard(video));
            });
            videoShowcaseContainer.appendChild(grid);
        }

        // Add the "Want to help improve this page?" card
        const helpGrid = document.createElement('div');
        helpGrid.className = 'grid grid-cols-1 md:grid-cols-1 gap-8 my-8';
        helpGrid.innerHTML = `
            <div class="video-card">
                <div class="video-info text-center">
                    <h4>Want to help improve this mod page?</h4>
                    <p class="video-description">Share videos from your favorite creators that showcase this mod, or send in your own! If you're a content creator and have featured this mod in your content, reach out to us or the mod's creator, we'd love to highlight your work here!</p>
                </div>
            </div>
        `;
        videoShowcaseContainer.appendChild(helpGrid);

    } else {
        // If video showcase is disabled or not present, hide the section
        videoShowcaseContainer.style.display = 'none';
    }
}

function updateDownloadButton(mod, modDetails) {
    const downloadBtn = document.querySelector('.quick-action-btn.download-btn');
    if (!downloadBtn) return;

    let downloadUrl = '';
    if (modDetails && modDetails.download) {
        downloadUrl = modDetails.download;
    } else if (mod.modVersion && mod.modVersion.includes('github.com')) {
        // If modVersion is a GitHub URL, use it as download
        downloadUrl = mod.modVersion;
    } else if (mod.slug) {
        // Fallback to slug
        downloadUrl = mod.slug;
    }

    if (downloadUrl) {
        downloadBtn.href = downloadUrl;
        downloadBtn.target = '_blank';
        downloadBtn.rel = 'noopener noreferrer';
    } else {
        downloadBtn.href = '#';
        downloadBtn.classList.add('wip');
        downloadBtn.innerHTML = '<i class="fas fa-clock"></i><span>Coming Soon</span>';
    }
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
        if (question) {
            question.addEventListener('click', () => {
                // Close all other FAQ items
                faqItems.forEach(otherItem => {
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
        }
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