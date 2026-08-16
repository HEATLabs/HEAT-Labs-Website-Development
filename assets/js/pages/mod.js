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
            return { totalViews: 0 };
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
        return { totalViews: 0 };
    }
}

// Function to fetch GitHub release version from API
async function fetchGitHubVersion(githubUrl) {
    try {
        let apiUrl;
        if (githubUrl.includes('api.github.com/repos')) {
            apiUrl = githubUrl;
        } else if (githubUrl.includes('github.com')) {
            const urlParts = githubUrl.replace('https://github.com/', '').split('/');
            const owner = urlParts[0];
            const repo = urlParts[1];
            apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
        } else {
            return githubUrl;
        }
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.warn('Failed to fetch GitHub version:', response.status);
            return githubUrl;
        }
        const data = await response.json();
        return data.tag_name || data.name || githubUrl;
    } catch (error) {
        console.error('Error fetching GitHub version:', error);
        return githubUrl;
    }
}

// Function to fetch mod data based on ID or slug
async function fetchModData(modId, modSlug) {
    try {
        const modsResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/mods.json');
        const modsData = await modsResponse.json();
        let mod = null;
        if (modId) {
            mod = modsData.find(m => m.id.toString() === modId.toString());
        }
        if (!mod && modSlug) {
            mod = modsData.find(m => {
                const slugMatches = m.slug && m.slug.toLowerCase().includes(modSlug.toLowerCase());
                const nameMatches = m.name.toLowerCase().replace(/\s+/g, '-') === modSlug.toLowerCase();
                return slugMatches || nameMatches;
            });
        }
        if (!mod) {
            console.error('Mod not found with ID:', modId, 'or slug:', modSlug);
            return;
        }
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
        let modVersion = mod.modVersion || 'Info coming soon';
        if (modVersion && modVersion.includes('github.com')) {
            modVersion = await fetchGitHubVersion(modVersion);
        }
        updateModPageElements(mod, modVersion, modDetails);
    } catch (error) {
        console.error('Error fetching mod data:', error);
    }
}

// Function to parse mod details from MD file
function parseModDetails(mdContent) {
    const details = {};

    const downloadMatch = mdContent.match(/^download:\s*(.+)$/m);
    if (downloadMatch && downloadMatch[1]) {
        details.download = downloadMatch[1].trim();
    }

    const categoryMatch = mdContent.match(/category:\s*([^#\n]+)/i);
    if (categoryMatch && categoryMatch[1]) {
        const categories = categoryMatch[1].split(',').map(cat => cat.trim());
        details.categoryFull = categories.join(', ');
        details.category = categories[0];
    }

    const typeMatch = mdContent.match(/type:\s*([^#\n]+)/i);
    if (typeMatch && typeMatch[1]) {
        details.type = typeMatch[1].trim();
    }

    const versionMatch = mdContent.match(/compatible-version:\s*([^\n]+)/i);
    if (versionMatch && versionMatch[1]) {
        details.gameVersion = versionMatch[1].trim();
    }

    const descriptionMatch = mdContent.match(/^description:\s*(.+)$/m);
    if (descriptionMatch && descriptionMatch[1]) {
        details.description = descriptionMatch[1].trim();
    }

    // Extract features
    details.features = {
        enabled: false,
        cards: []
    };

    const featuresEnabledMatch = mdContent.match(/features:[\s\S]*?enabled:\s*(true|false)/i);
    if (featuresEnabledMatch) {
        details.features.enabled = featuresEnabledMatch[1].toLowerCase() === 'true';
    }

    if (details.features.enabled) {
        const cardsMatch = mdContent.match(/features:[\s\S]*?cards:([\s\S]*?)(?=\n\w+:|$)/i);
        if (cardsMatch && cardsMatch[1]) {
            const cardsContent = cardsMatch[1];
            const cardRegex = /-\s*enabled:\s*(true|false)\s*icon:\s*([^\n]*)\s*name:\s*([^\n]+)\s*description:\s*([^\n]+)/gi;
            let cardMatch;
            while ((cardMatch = cardRegex.exec(cardsContent)) !== null) {
                const enabled = cardMatch[1].toLowerCase() === 'true';
                if (enabled) {
                    let icon = cardMatch[2].trim();
                    icon = icon.replace(/<!--[\s\S]*?-->/g, '').trim();
                    icon = icon.replace(/\s+/g, ' ').trim();
                    details.features.cards.push({
                        icon: icon,
                        name: cardMatch[3].trim(),
                        description: cardMatch[4].trim()
                    });
                }
            }
            if (details.features.cards.length === 0) {
                const cardEntries = cardsContent.split('- enabled:');
                for (let i = 1; i < cardEntries.length; i++) {
                    const cardText = cardEntries[i];
                    const enabledMatch = cardText.match(/^\s*(true|false)/i);
                    if (enabledMatch && enabledMatch[1].toLowerCase() === 'true') {
                        let icon = '';
                        const iconMatch = cardText.match(/icon:\s*([^\n]*)/i);
                        if (iconMatch) {
                            icon = iconMatch[1].trim().replace(/<!--[\s\S]*?-->/g, '').trim();
                            icon = icon.replace(/\s+/g, ' ').trim();
                        }
                        const nameMatch = cardText.match(/name:\s*([^\n]+)/i);
                        const descMatch = cardText.match(/description:\s*([^\n]+)/i);
                        if (nameMatch && descMatch) {
                            details.features.cards.push({
                                icon: icon,
                                name: nameMatch[1].trim(),
                                description: descMatch[1].trim()
                            });
                        }
                    }
                }
            }
            if (details.features.cards.length > 4) {
                details.features.cards = details.features.cards.slice(0, 4);
            }
        }
    }

    // Extract support section
    details.support = {
        enabled: false,
        description: '',
        feedback: { enabled: false, name: '', url: '' },
        support: { enabled: false, name: '', url: '' }
    };

    const supportEnabledMatch = mdContent.match(/support:[\s\S]*?enabled:\s*(true|false)/i);
    if (supportEnabledMatch) {
        details.support.enabled = supportEnabledMatch[1].toLowerCase() === 'true';
    }

    const supportDescMatch = mdContent.match(/support:[\s\S]*?description:\s*(.+?)(?=\n\s*\w+:|$)/i);
    if (supportDescMatch && supportDescMatch[1]) {
        details.support.description = supportDescMatch[1].trim();
    }

    const feedbackMatch = mdContent.match(/feedback:[\s\S]*?enabled:\s*(true|false)[\s\S]*?name:\s*([^\n]+)[\s\S]*?url:\s*([^\n]+)/i);
    if (feedbackMatch) {
        details.support.feedback.enabled = feedbackMatch[1].toLowerCase() === 'true';
        details.support.feedback.name = feedbackMatch[2].trim();
        details.support.feedback.url = feedbackMatch[3].trim();
    }

    const supportInfoMatch = mdContent.match(/support:[\s\S]*?support:[\s\S]*?enabled:\s*(true|false)[\s\S]*?name:\s*([^\n]+)[\s\S]*?url:\s*([^\n]+)/i);
    if (supportInfoMatch) {
        details.support.support.enabled = supportInfoMatch[1].toLowerCase() === 'true';
        details.support.support.name = supportInfoMatch[2].trim();
        details.support.support.url = supportInfoMatch[3].trim();
    }

    // Extract overview
    const overviewDescMatch = mdContent.match(/overview:[\s\S]*?description:\s*(.+?)(?=\n\s*\w+:|$)/i);
    if (overviewDescMatch && overviewDescMatch[1]) {
        details.overviewDescription = overviewDescMatch[1].trim();
    }

    const layoutMatch = mdContent.match(/overview:[\s\S]*?layout:\s*([^\n]+)/i);
    if (layoutMatch && layoutMatch[1]) {
        details.overviewLayout = layoutMatch[1].trim();
    }

    details.overviewImages = [];
    const itemsMatch = mdContent.match(/overview:[\s\S]*?items:([\s\S]*?)(?=\n\s*\w+:|$)/i);
    if (itemsMatch && itemsMatch[1]) {
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
    const installationSectionMatch = mdContent.match(/installation:[\s\S]*?(?=\n\w+:|$)/i);
    if (installationSectionMatch) {
        const installationSection = installationSectionMatch[0];
        const stepsMatch = installationSection.match(/steps:([\s\S]*?)(?=\n\w+:|$)/i);
        if (stepsMatch) {
            const stepsContent = stepsMatch[1];
            const stepRegex = /-\s*name:\s*Step\s*#(\d+)\s*description:\s*([^\n]+)(?:\n|$)/gi;
            let stepMatch;
            let foundSteps = false;
            while ((stepMatch = stepRegex.exec(stepsContent)) !== null) {
                details.installationSteps.push({
                    name: `Step #${stepMatch[1]}`,
                    description: stepMatch[2].trim()
                });
                foundSteps = true;
            }
            if (!foundSteps) {
                const lines = stepsContent.split('\n');
                let currentStep = null;
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    if (line.includes('- name: Step #') || line.includes('- name: Step')) {
                        if (currentStep) details.installationSteps.push(currentStep);
                        const stepNumMatch = line.match(/Step\s*#(\d+)/i) || line.match(/Step\s*(\d+)/i);
                        const stepNumber = stepNumMatch ? stepNumMatch[1] : String(details.installationSteps.length + 1);
                        currentStep = { name: `Step #${stepNumber}`, description: '' };
                    } else if (line.includes('description:') && currentStep) {
                        const descMatch = line.match(/description:\s*(.+)/i);
                        if (descMatch && descMatch[1]) {
                            currentStep.description = descMatch[1].trim();
                        }
                    } else if (currentStep && !line.startsWith('-') && !line.includes(':')) {
                        if (currentStep.description) {
                            currentStep.description += ' ' + line;
                        } else {
                            currentStep.description = line;
                        }
                    }
                }
                if (currentStep) details.installationSteps.push(currentStep);
            }
        }
    }

    // Extract video showcase
    details.videoShowcase = {
        enabled: false,
        layout: 'none',
        videos: []
    };

    const videoEnabledMatch = mdContent.match(/videoShowcase:[\s\S]*?enabled:\s*(true|false)/i);
    if (videoEnabledMatch) {
        details.videoShowcase.enabled = videoEnabledMatch[1].toLowerCase() === 'true';
    }

    const videoLayoutMatch = mdContent.match(/videoShowcase:[\s\S]*?layout:\s*([^\n]+)/i);
    if (videoLayoutMatch) {
        details.videoShowcase.layout = videoLayoutMatch[1].trim();
    }

    const videosMatch = mdContent.match(/videoShowcase:[\s\S]*?videos:([\s\S]*?)(?=\n\w+:|$)/i);
    if (videosMatch && videosMatch[1]) {
        const videosContent = videosMatch[1];
        const videoRegex = /-\s*title:\s*([^\n]+)\s*thumbnail:\s*([^\n]+)\s*url:\s*([^\n]+)\s*creator:\s*([^\n]+)\s*type:\s*([^\n]+)/gi;
        let videoMatch;
        while ((videoMatch = videoRegex.exec(videosContent)) !== null) {
            details.videoShowcase.videos.push({
                title: videoMatch[1].trim(),
                thumbnail: videoMatch[2].trim(),
                url: videoMatch[3].trim(),
                creator: videoMatch[4].trim(),
                type: videoMatch[5].trim()
            });
        }
        if (details.videoShowcase.videos.length === 0) {
            const videoItems = videosContent.split('- title:');
            for (let i = 1; i < videoItems.length; i++) {
                const videoText = videoItems[i];
                const titleMatch = videoText.match(/^([^\n]+)/);
                const thumbnailMatch = videoText.match(/thumbnail:\s*([^\n]+)/);
                const urlMatch = videoText.match(/url:\s*([^\n]+)/);
                const creatorMatch = videoText.match(/creator:\s*([^\n]+)/);
                const typeMatch = videoText.match(/type:\s*([^\n]+)/);
                if (titleMatch && thumbnailMatch && urlMatch) {
                    details.videoShowcase.videos.push({
                        title: titleMatch[1].trim(),
                        thumbnail: thumbnailMatch[1].trim(),
                        url: urlMatch[1].trim(),
                        creator: creatorMatch ? creatorMatch[1].trim() : 'Unknown',
                        type: typeMatch ? typeMatch[1].trim() : 'Unknown'
                    });
                }
            }
        }
    }

    return details;
}

function updateModPageElements(mod, modVersion, modDetails) {
    // Update page title
    document.title = `${mod.name} - HEAT Labs`;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `HEAT Labs - ${mod.name}`;
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = `HEAT Labs - ${mod.name}`;

    // Update mod header
    const modHeader = document.querySelector('.mod-header');
    if (modHeader) {
        const modMeta = modHeader.querySelector('.mod-meta');
        if (modMeta) {
            modMeta.innerHTML = '';
            let category = mod.category || 'Unknown';
            if (modDetails && modDetails.category) category = modDetails.category;
            const categorySpan = document.createElement('span');
            categorySpan.className = 'mod-type-badge';
            categorySpan.textContent = category;
            modMeta.appendChild(categorySpan);
            const creatorSpan = document.createElement('span');
            creatorSpan.innerHTML = `<i class="fas fa-users mr-1"></i> ${mod.creator || 'Unknown'}`;
            modMeta.appendChild(creatorSpan);
        }
        const modTitle = modHeader.querySelector('.mod-title');
        if (modTitle) modTitle.textContent = mod.name;
        const modDescription = modHeader.querySelector('.mod-description');
        if (modDescription && mod.description) modDescription.textContent = mod.description;
    }

    // Update mod introduction text
    const modIntroParagraph = document.querySelector('#mod-introduction');
    if (modIntroParagraph) {
        const introText = modIntroParagraph.closest('.mb-12')?.querySelector('.text-center');
        if (introText && modDetails && modDetails.description) {
            introText.textContent = modDetails.description;
        }
    }

    // Update mod image
    const modImage = document.querySelector('.mod-image img');
    if (modImage && mod.image) {
        modImage.src = mod.image;
        modImage.alt = mod.name;
    }

    // Update feature cards
    updateFeatureCards(modDetails);

    // Update overview section
    const overviewSection = document.getElementById('standard');
    if (overviewSection && modDetails) {
        const overviewParagraph = overviewSection.querySelector('.text-center');
        if (overviewParagraph && modDetails.overviewDescription) {
            overviewParagraph.textContent = modDetails.overviewDescription;
        }
        const layout = modDetails.overviewLayout || 'none';
        const images = modDetails.overviewImages || [];
        const existingGrids = overviewSection.querySelectorAll('.grid');
        existingGrids.forEach(grid => grid.remove());
        if (layout !== 'none' && images.length > 0) {
            let layoutHTML = '';
            switch (layout) {
                case 'single':
                    if (images.length >= 1) {
                        layoutHTML = `<div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6"><div><img src="${images[0]}" alt="Mod Overview" class="rounded-lg"></div></div>`;
                    }
                    break;
                case 'two':
                    if (images.length >= 2) {
                        layoutHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6"><div><img src="${images[0]}" alt="Mod Overview" class="rounded-lg"></div><div><img src="${images[1]}" alt="Mod Overview" class="rounded-lg"></div></div>`;
                    } else if (images.length === 1) {
                        layoutHTML = `<div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6"><div><img src="${images[0]}" alt="Mod Overview" class="rounded-lg"></div></div>`;
                    }
                    break;
                case 'heroPlusTwo':
                    if (images.length >= 3) {
                        layoutHTML = `<div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6"><div><img src="${images[0]}" alt="Mod Overview" class="rounded-lg"></div></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6"><div><img src="${images[1]}" alt="Mod Overview" class="rounded-lg"></div><div><img src="${images[2]}" alt="Mod Overview" class="rounded-lg"></div></div>`;
                    } else if (images.length === 2) {
                        layoutHTML = `<div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6"><div><img src="${images[0]}" alt="Mod Overview" class="rounded-lg"></div></div><div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6"><div><img src="${images[1]}" alt="Mod Overview" class="rounded-lg"></div></div>`;
                    } else if (images.length === 1) {
                        layoutHTML = `<div class="grid grid-cols-1 md:grid-cols-1 gap-4 my-6"><div><img src="${images[0]}" alt="Mod Overview" class="rounded-lg"></div></div>`;
                    }
                    break;
                case 'grid':
                    const gridImages = images.slice(0, 4);
                    const gridItems = gridImages.map(img => `<div><img src="${img}" alt="Mod Overview" class="rounded-lg"></div>`).join('');
                    layoutHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">${gridItems}</div>`;
                    break;
            }
            if (layoutHTML) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = layoutHTML;
                const gridElements = tempDiv.children;
                if (overviewParagraph) {
                    for (let i = 0; i < gridElements.length; i++) {
                        overviewParagraph.after(gridElements[i]);
                    }
                } else {
                    overviewSection.append(tempDiv);
                }
            }
        }
    }

    // Update video showcase
    updateVideoShowcase(modDetails);

    // Update download button
    const downloadButton = document.querySelector('.quick-action-btn.download-btn');
    if (downloadButton) {
        if (modDetails && modDetails.download) {
            downloadButton.href = modDetails.download;
            downloadButton.target = '_blank';
            downloadButton.rel = 'noopener noreferrer';
        } else if (mod.modVersion) {
            downloadButton.href = mod.modVersion;
            downloadButton.target = '_blank';
            downloadButton.rel = 'noopener noreferrer';
        } else {
            downloadButton.href = '#';
            downloadButton.style.opacity = '0.6';
            downloadButton.style.cursor = 'not-allowed';
            downloadButton.title = 'Download link not available';
            downloadButton.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Download link not available for this mod yet.');
            });
        }
    }

    // Update sidebar Quick Facts
    const sidebarCards = document.querySelectorAll('.sidebar-card');
    sidebarCards.forEach(card => {
        const heading = card.querySelector('h3');
        if (heading && heading.textContent === 'Mod Facts') {
            const quickFactsList = card.querySelector('ul');
            if (quickFactsList) {
                quickFactsList.innerHTML = '';
                let category = mod.category || 'Info coming soon';
                if (modDetails && modDetails.categoryFull) category = modDetails.categoryFull;
                else if (modDetails && modDetails.category) category = modDetails.category;
                const categoryItem = document.createElement('li');
                categoryItem.innerHTML = `<strong>Category:</strong> ${category}`;
                quickFactsList.appendChild(categoryItem);
                let type = 'Info coming soon';
                if (modDetails && modDetails.type) type = modDetails.type;
                const typeItem = document.createElement('li');
                typeItem.innerHTML = `<strong>Type:</strong> ${type}`;
                quickFactsList.appendChild(typeItem);
                let gameVersion = 'Info coming soon';
                if (modDetails && modDetails.gameVersion) gameVersion = modDetails.gameVersion;
                const gameVersionItem = document.createElement('li');
                gameVersionItem.innerHTML = `<strong>Game Version:</strong> ${gameVersion}`;
                quickFactsList.appendChild(gameVersionItem);
                const displayVersion = modVersion || 'Info coming soon';
                const modVersionItem = document.createElement('li');
                modVersionItem.innerHTML = `<strong>Mod Version:</strong> ${displayVersion}`;
                quickFactsList.appendChild(modVersionItem);
            }
        }
    });

    // Update Support & Feedback
    updateSupportSection(modDetails);

    // Update installation steps
    const faqContainer = document.querySelector('.faq-container');
    if (faqContainer && modDetails && modDetails.installationSteps && modDetails.installationSteps.length > 0) {
        faqContainer.innerHTML = '';
        modDetails.installationSteps.forEach((step, index) => {
            const faqItem = document.createElement('div');
            faqItem.className = `faq-item ${index === 0 ? 'active' : ''}`;
            const faqQuestion = document.createElement('div');
            faqQuestion.className = 'faq-question';
            faqQuestion.innerHTML = `<h4>${step.name}</h4><i class="fas fa-chevron-down"></i>`;
            const faqAnswer = document.createElement('div');
            faqAnswer.className = `faq-answer ${index === 0 ? 'active' : ''}`;
            faqAnswer.innerHTML = `<p>${step.description}</p>`;
            faqItem.appendChild(faqQuestion);
            faqItem.appendChild(faqAnswer);
            faqContainer.appendChild(faqItem);
        });
        const newFaqItems = faqContainer.querySelectorAll('.faq-item');
        newFaqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                newFaqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const answer = otherItem.querySelector('.faq-answer');
                        if (answer) answer.classList.remove('active');
                    }
                });
                item.classList.toggle('active');
                const answer = item.querySelector('.faq-answer');
                if (answer) answer.classList.toggle('active');
            });
        });
    }

    updateRelatedMods(mod);
}

// Function to update feature cards with force visibility
function updateFeatureCards(modDetails) {
    console.log('updateFeatureCards called', modDetails);

    // Find the mod introduction section
    const modIntroSection = document.querySelector('#mod-introduction');
    if (!modIntroSection) {
        console.warn('Could not find #mod-introduction');
        return;
    }

    const parentContainer = modIntroSection.closest('.mb-12');
    if (!parentContainer) {
        console.warn('Could not find parent .mb-12 container');
        return;
    }

    // Force the parent container to be visible
    parentContainer.style.display = 'block';
    parentContainer.style.visibility = 'visible';
    parentContainer.style.opacity = '1';

    // Find or create the grid
    let existingGrid = parentContainer.querySelector('.grid.gap-6.my-8.text-center');

    if (!existingGrid) {
        console.log('Creating new grid element');
        existingGrid = document.createElement('div');
        existingGrid.className = 'grid gap-6 my-8 text-center';
        const modImage = parentContainer.querySelector('.mod-image');
        if (modImage) {
            modImage.after(existingGrid);
        } else {
            parentContainer.appendChild(existingGrid);
        }
    }

    // If no features, hide and return
    if (!modDetails || !modDetails.features || !modDetails.features.enabled || modDetails.features.cards.length === 0) {
        console.log('Features disabled or no cards, hiding grid');
        existingGrid.style.display = 'none';
        return;
    }

    // Force the grid to be visible with !important styles
    existingGrid.style.display = 'grid';
    existingGrid.style.visibility = 'visible';
    existingGrid.style.opacity = '1';
    existingGrid.style.height = 'auto';
    existingGrid.style.overflow = 'visible';
    existingGrid.style.width = '100%';

    const cards = modDetails.features.cards;
    const cardCount = cards.length;

    console.log(`Rendering ${cardCount} feature cards`);

    // Set grid columns
    let gridCols = 'grid-cols-1 md:grid-cols-1';
    if (cardCount === 2) gridCols = 'grid-cols-1 md:grid-cols-2';
    else if (cardCount === 3) gridCols = 'grid-cols-1 md:grid-cols-3';
    else if (cardCount >= 4) gridCols = 'grid-cols-1 md:grid-cols-2';

    // Build cards
    let cardsHTML = '';
    cards.forEach(card => {
        const iconText = card.icon || '';
        const hasIcon = iconText.trim() !== '' &&
                       iconText.trim() !== '#' &&
                       !iconText.includes('fontawesome-icon-placeholder') &&
                       !iconText.includes('Use fontawesome icons only');

        console.log('Card icon:', iconText, 'Has icon:', hasIcon);

        let iconWrapperHTML = '';
        if (hasIcon) {
            iconWrapperHTML = `<div class="icon-wrapper" style="display: flex !important;">${iconText}</div>`;
        } else {
            iconWrapperHTML = `<div class="icon-wrapper" style="display: flex !important;"><i class="fa-solid fa-cube"></i></div>`;
        }

        cardsHTML += `
            <div class="feature-card" style="display: block !important; visibility: visible !important; opacity: 1 !important; width: 100% !important;">
                ${iconWrapperHTML}
                <h3 style="display: block !important; visibility: visible !important; opacity: 1 !important;">${card.name}</h3>
                <p style="display: block !important; visibility: visible !important; opacity: 1 !important;">${card.description}</p>
            </div>
        `;
    });

    existingGrid.className = `grid ${gridCols} gap-6 my-8 text-center`;
    existingGrid.style.display = 'grid';
    existingGrid.innerHTML = cardsHTML;

    console.log('Feature cards rendered successfully');
}

// Function to update the Support & Feedback section
function updateSupportSection(modDetails) {
    const sidebarCards = document.querySelectorAll('.sidebar-card');
    let supportCard = null;
    sidebarCards.forEach(card => {
        const heading = card.querySelector('h3');
        if (heading && heading.textContent === 'Support & Feedback') {
            supportCard = card;
        }
    });
    if (!supportCard) return;
    if (!modDetails || !modDetails.support || !modDetails.support.enabled) {
        supportCard.style.display = 'none';
        return;
    }
    supportCard.style.display = '';
    const supportContent = supportCard.querySelector('.support-content p');
    if (supportContent && modDetails.support.description) {
        supportContent.textContent = modDetails.support.description;
    } else if (supportContent) {
        supportContent.textContent = 'Found a bug or have a suggestion for this mod? We\'d love to hear from you!';
    }
    const supportButtonsContainer = supportCard.querySelector('.support-buttons');
    if (supportButtonsContainer) {
        supportButtonsContainer.innerHTML = '';
        if (modDetails.support.feedback && modDetails.support.feedback.enabled) {
            const feedbackBtn = document.createElement('a');
            feedbackBtn.href = modDetails.support.feedback.url || '#';
            feedbackBtn.className = 'support-btn';
            feedbackBtn.target = '_blank';
            feedbackBtn.rel = 'noopener noreferrer';
            feedbackBtn.innerHTML = `<span>${modDetails.support.feedback.name || 'Feedback'}</span>`;
            supportButtonsContainer.appendChild(feedbackBtn);
        }
        if (modDetails.support.support && modDetails.support.support.enabled) {
            const supportBtn = document.createElement('a');
            supportBtn.href = modDetails.support.support.url || '#';
            supportBtn.className = 'support-btn';
            supportBtn.target = '_blank';
            supportBtn.rel = 'noopener noreferrer';
            supportBtn.innerHTML = `<span>${modDetails.support.support.name || 'Support'}</span>`;
            supportButtonsContainer.appendChild(supportBtn);
        }
        if (supportButtonsContainer.children.length === 0) {
            supportButtonsContainer.innerHTML = '<p style="font-size: 0.85rem; color: #6b7280; text-align: center;">No support channels available</p>';
        }
    }
}

// Function to update the video showcase section
function updateVideoShowcase(modDetails) {
    const videoShowcaseContainer = document.querySelector('#video-showcase');
    if (!videoShowcaseContainer) return;
    const parentContainer = videoShowcaseContainer.closest('.mb-12');
    if (!parentContainer) return;
    const existingGrids = parentContainer.querySelectorAll('.grid');
    existingGrids.forEach(grid => grid.remove());
    if (!modDetails || !modDetails.videoShowcase || !modDetails.videoShowcase.enabled) {
        const helpMessage = document.createElement('div');
        helpMessage.className = 'grid grid-cols-1 md:grid-cols-1 gap-8 my-8';
        helpMessage.innerHTML = `<div class="video-card"><div class="video-info text-center"><h4>Want to help improve this mod page?</h4><p class="video-description">Share videos from your favorite creators that showcase this mod, or send in your own! If you're a content creator and have featured this mod in your content, reach out to us or the mod's creator, we'd love to highlight your work here!</p></div></div>`;
        parentContainer.appendChild(helpMessage);
        return;
    }
    const layout = modDetails.videoShowcase.layout || 'none';
    const videos = modDetails.videoShowcase.videos || [];
    if (videos.length === 0 || layout === 'none') {
        const helpMessage = document.createElement('div');
        helpMessage.className = 'grid grid-cols-1 md:grid-cols-1 gap-8 my-8';
        helpMessage.innerHTML = `<div class="video-card"><div class="video-info text-center"><h4>Want to help improve this mod page?</h4><p class="video-description">Share videos from your favorite creators that showcase this mod, or send in your own! If you're a content creator and have featured this mod in your content, reach out to us or the mod's creator, we'd love to highlight your work here!</p></div></div>`;
        parentContainer.appendChild(helpMessage);
        return;
    }
    let videoHTML = '';
    switch (layout) {
        case 'single': videoHTML = generateSingleLayout(videos.slice(0, 1)); break;
        case 'two': videoHTML = generateTwoLayout(videos.slice(0, 2)); break;
        case 'heroPlusTwo': videoHTML = generateHeroPlusTwoLayout(videos.slice(0, 3)); break;
        case 'grid': videoHTML = generateGridLayout(videos.slice(0, 4)); break;
        default: videoHTML = generateGridLayout(videos.slice(0, 4));
    }
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = videoHTML;
    while (tempDiv.firstChild) {
        parentContainer.appendChild(tempDiv.firstChild);
    }
    const helpMessage = document.createElement('div');
    helpMessage.className = 'grid grid-cols-1 md:grid-cols-1 gap-8 my-8';
    helpMessage.innerHTML = `<div class="video-card"><div class="video-info text-center"><h4>Want to help improve this mod page?</h4><p class="video-description">Share videos from your favorite creators that showcase this mod, or send in your own! If you're a content creator and have featured this mod in your content, reach out to us or the mod's creator, we'd love to highlight your work here!</p></div></div>`;
    parentContainer.appendChild(helpMessage);
}

function generateVideoCard(video) {
    return `<div class="video-card"><div class="video-thumbnail"><iframe width="100%" height="100%" src="${video.url}" title="${video.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe></div><div class="video-info"><h4>${video.title}</h4><p class="video-author">by ${video.creator}</p></div></div>`;
}

function generateSingleLayout(videos) {
    if (videos.length === 0) return '';
    return `<div class="grid grid-cols-1 md:grid-cols-1 gap-8 my-8">${videos.map(v => generateVideoCard(v)).join('')}</div>`;
}

function generateTwoLayout(videos) {
    if (videos.length === 0) return '';
    return `<div class="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">${videos.map(v => generateVideoCard(v)).join('')}</div>`;
}

function generateHeroPlusTwoLayout(videos) {
    if (videos.length === 0) return '';
    let html = '';
    if (videos.length >= 1) {
        html += `<div class="grid grid-cols-1 md:grid-cols-1 gap-8 my-8">${generateVideoCard(videos[0])}</div>`;
    }
    if (videos.length >= 2) {
        const remainingVideos = videos.slice(1, 3);
        html += `<div class="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">${remainingVideos.map(v => generateVideoCard(v)).join('')}</div>`;
    }
    return html;
}

function generateGridLayout(videos) {
    if (videos.length === 0) return '';
    const colClass = videos.length <= 2 ? 'md:grid-cols-1' : 'md:grid-cols-2';
    return `<div class="grid grid-cols-1 ${colClass} gap-8 my-8">${videos.map(v => generateVideoCard(v)).join('')}</div>`;
}

// Function to fetch and display related mods
async function updateRelatedMods(currentMod) {
    try {
        const modsResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/mods.json');
        const modsData = await modsResponse.json();
        const relatedMods = modsData.filter(m =>
            m.id !== currentMod.id &&
            (m.creator === currentMod.creator || m.category === currentMod.category)
        ).slice(0, 3);
        const relatedGuidesContainer = document.querySelector('.sidebar-card .related-guide')?.parentElement;
        if (relatedGuidesContainer) {
            const existingGuides = relatedGuidesContainer.querySelectorAll('.related-guide');
            existingGuides.forEach(guide => guide.remove());
            if (relatedMods.length > 0) {
                for (const mod of relatedMods) {
                    let modVersion = mod.modVersion || '';
                    if (modVersion && modVersion.includes('github.com')) {
                        modVersion = await fetchGitHubVersion(modVersion);
                    }
                    const guideDiv = document.createElement('div');
                    guideDiv.className = 'related-guide';
                    guideDiv.innerHTML = `<h4><a href="../details/${mod.name.toLowerCase().replace(/\s+/g, '-')}">${mod.name}</a></h4><p>${mod.category} • by ${mod.creator}</p>${modVersion && modVersion !== mod.modVersion ? `<small>${modVersion}</small>` : ''}`;
                    relatedGuidesContainer.appendChild(guideDiv);
                }
            } else {
                const noModsDiv = document.createElement('div');
                noModsDiv.className = 'related-guide';
                noModsDiv.innerHTML = `<h4>No Related Mods Yet</h4><p>Mods from the same creator or similar mods will appear here.</p>`;
                relatedGuidesContainer.appendChild(noModsDiv);
            }
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
    initializeImageGallery();
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    });
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
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

    const galleryImages = [];
    document.querySelectorAll('.mod-image img').forEach(img => {
        galleryImages.push({
            src: img.src,
            alt: img.alt,
            caption: img.nextElementSibling?.textContent || ''
        });
    });
    document.querySelectorAll('.sidebar-card .gallery-thumbnail img').forEach(img => {
        galleryImages.push({
            src: img.parentElement.href,
            alt: img.alt,
            caption: img.alt
        });
    });
    if (galleryImages.length === 0) return;

    let currentImageIndex = 0;

    function openGallery(index) {
        if (index < 0 || index >= galleryImages.length) return;
        currentImageIndex = index;
        updateGalleryImage();
        galleryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function updateGalleryImage() {
        const currentImage = galleryImages[currentImageIndex];
        galleryMainImage.src = currentImage.src;
        galleryMainImage.alt = currentImage.alt;
        galleryImageCaption.textContent = currentImage.caption;
        document.querySelectorAll('.gallery-thumbnail-item').forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === currentImageIndex);
        });
        const activeThumb = document.querySelector('.gallery-thumbnail-item.active');
        if (activeThumb) {
            activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    function closeGallery() {
        galleryModal.classList.remove('active');
        document.body.style.overflow = '';
        galleryMainImage.classList.remove('zoomed');
    }

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

    createThumbnails();

    document.querySelectorAll('.mod-image img, .sidebar-card .gallery-thumbnail').forEach((element, index) => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            openGallery(index);
        });
    });

    galleryPrevBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
        updateGalleryImage();
    });
    galleryNextBtn.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
        updateGalleryImage();
    });
    galleryCloseBtn.addEventListener('click', closeGallery);
    galleryModal.addEventListener('click', (e) => {
        if (e.target === galleryModal) closeGallery();
    });
    galleryMainImage.addEventListener('click', () => {
        galleryMainImage.classList.toggle('zoomed');
    });

    document.addEventListener('keydown', (e) => {
        if (!galleryModal.classList.contains('active')) return;
        switch (e.key) {
            case 'Escape': closeGallery(); break;
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

    let touchStartX = 0;
    let touchEndX = 0;
    galleryMainImage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    galleryMainImage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
            updateGalleryImage();
        } else if (touchEndX - touchStartX > 50) {
            currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
            updateGalleryImage();
        }
    }, { passive: true });
}