document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const searchBox = document.getElementById('newTabSearch');
    const settingsBtn = document.getElementById('searchSettingsBtn');
    const settingsModalOverlay = document.getElementById('settingsModalOverlay');
    const closeSettingsBtn = document.getElementById('closeSettingsModal');
    const clearFrequentBtn = document.getElementById('clearFrequentSearchesBtn');
    const frequentSearchesTags = document.getElementById('frequentSearchesTags');
    const frequentSearchesSection = document.getElementById('frequentSearches');

    // Info Modal Elements
    const infoBtn = document.getElementById('searchInfoBtn');
    const infoModalOverlay = document.getElementById('infoModalOverlay');
    const closeInfoModalBtn = document.getElementById('closeInfoModal');
    const infoModalGotItBtn = document.getElementById('infoModalGotIt');

    // Clock Elements
    const clockElement = document.getElementById('liveClock');
    const clockToggle = document.getElementById('clockToggle');

    // Frequent Searches Toggle Element
    const frequentToggle = document.getElementById('frequentToggle');

    // Waves Toggle Element
    const wavesToggle = document.getElementById('wavesToggle');

    // Logo Toggle Element
    const logoToggle = document.getElementById('logoToggle');

    // Logo Image Element
    const logoImage = document.querySelector('.search-logo-img');

    // Waves Container
    const wavesContainer = document.querySelector('.waves-container');

    // Clear confirmation modal elements
    const clearConfirmOverlay = document.getElementById('clearConfirmOverlay');
    const clearConfirmCancel = document.getElementById('clearConfirmCancel');
    const clearConfirmProceed = document.getElementById('clearConfirmProceed');

    // Favorite Tools Elements
    const favoriteToolsBtn = document.getElementById('favoriteToolsBtn');
    const toolsModalOverlay = document.getElementById('toolsModalOverlay');
    const toolsModalClose = document.getElementById('toolsModalClose');
    const toolsModalSave = document.getElementById('toolsModalSave');
    const toolsGrid = document.getElementById('toolsGrid');
    const favoriteToolsSection = document.getElementById('favoriteToolsSection');
    const favoriteToolsGrid = document.getElementById('favoriteToolsGrid');
    const toolsToggle = document.getElementById('toolsToggle');

    // Maximum number of frequent searches and to store
    const MAX_FREQUENT_SEARCHES = 8;
    // Maximum length for frequent search display
    const MAX_SEARCH_LENGTH = 30;
    // Maximum number of favorite tools
    const MAX_FAVORITE_TOOLS = 5;

    // Check if we're on mobile
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Available tools with their icons and URLs
    const availableTools = [
        {
            id: 'tankStats',
            name: isMobile ? 'Tanks' : 'Tank Statistics',
            icon: 'fa-shield-alt',
            url: 'https://heatlabs.net/tanks'
        },
        {
            id: 'mapKnowledge',
            name: isMobile ? 'Maps' : 'Map Knowledge',
            icon: 'fa-map',
            url: 'https://heatlabs.net/maps'
        },
        {
            id: 'communityGuides',
            name: isMobile ? 'Guides' : 'Community Guides',
            icon: 'fa-book-open',
            url: 'https://heatlabs.net/guides'
        },
        {
            id: 'commonBuilds',
            name: isMobile ? 'Builds' : 'Common Builds',
            icon: 'fa-wrench',
            url: 'https://heatlabs.net/builds'
        },
        {
            id: 'playground',
            name: isMobile ? 'Playground' : 'Playground Features',
            icon: 'fa-gamepad',
            url: 'https://heatlabs.net/playground'
        },
        {
            id: 'news',
            name: isMobile ? 'News' : 'Latest Game News',
            icon: 'fa-newspaper',
            url: 'https://heatlabs.net/news'
        },
        {
            id: 'assetGallery',
            name: isMobile ? 'Assets' : 'Asset Gallery',
            icon: 'fa-database',
            url: 'https://heatlabs.net/asset-gallery'
        },
        {
            id: 'tournaments',
            name: isMobile ? 'Tournaments' : 'Tournaments',
            icon: 'fa-trophy',
            url: 'https://heatlabs.net/tournaments'
        }
    ];

    // Store waves cleanup function
    let wavesCleanup = null;

    // Flag to track if waves have been initialized
    let wavesInitialized = false;

    // Load saved search engine preference
    loadSearchEnginePreference();

    // Load clock preference and start clock
    loadClockPreference();
    startLiveClock();

    // Load frequent searches visibility preference
    loadFrequentSearchesPreference();

    // Load logo image visibility preference
    loadLogoPreference();

    // Load waves visibility preference
    loadWavesPreference();

    // Load favorite tools visibility preference
    loadToolsPreference();

    // Load and display frequent searches
    displayFrequentSearches();

    // Load and display favorite tools
    displayFavoriteTools();

    // Info Modal Logic
    infoBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // Close settings modal if it's open
        settingsModalOverlay.classList.remove('active');
        document.body.style.overflow = 'hidden';
        // Show info modal
        infoModalOverlay.classList.add('active');
    });

    function closeInfoModal() {
        infoModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Close info modal with close button
    if (closeInfoModalBtn) {
        closeInfoModalBtn.addEventListener('click', closeInfoModal);
    }

    infoModalGotItBtn.addEventListener('click', closeInfoModal);

    // Close info modal when clicking outside
    infoModalOverlay.addEventListener('click', function(e) {
        if (e.target === infoModalOverlay) {
            closeInfoModal();
        }
    });

    // Settings Modal Logic
    settingsBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        settingsModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close settings modal
    closeSettingsBtn.addEventListener('click', function() {
        settingsModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close settings modal when clicking outside
    settingsModalOverlay.addEventListener('click', function(e) {
        if (e.target === settingsModalOverlay) {
            settingsModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Show clear confirmation modal
    clearFrequentBtn.addEventListener('click', function() {
        // Close settings modal
        settingsModalOverlay.classList.remove('active');

        // Show confirmation modal
        clearConfirmOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Cancel clear - close modal
    clearConfirmCancel.addEventListener('click', function() {
        clearConfirmOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Proceed with clear
    clearConfirmProceed.addEventListener('click', function() {
        // Clear frequent searches
        localStorage.removeItem('frequentSearches');
        displayFrequentSearches();

        // Close modal
        clearConfirmOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Show success feedback on button
        const btn = clearFrequentBtn;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Cleared!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });

    // Close modal when clicking outside
    clearConfirmOverlay.addEventListener('click', function(e) {
        if (e.target === clearConfirmOverlay) {
            clearConfirmOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Save search engine preference when changed
    const radioButtons = document.querySelectorAll('input[name="searchEngine"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            localStorage.setItem('preferredSearchEngine', this.value);
        });
    });

    // Clock Toggle Logic
    clockToggle.addEventListener('change', function() {
        if (this.checked) {
            clockElement.classList.remove('hidden');
        } else {
            clockElement.classList.add('hidden');
        }
        // Save preference
        localStorage.setItem('showClock', this.checked);
    });

    // Frequent Searches Toggle Logic
    frequentToggle.addEventListener('change', function() {
        if (this.checked) {
            frequentSearchesSection.classList.remove('hidden');
        } else {
            frequentSearchesSection.classList.add('hidden');
        }
        // Save preference
        localStorage.setItem('showFrequentSearches', this.checked);
    });

    // Logo Image Toggle
    logoToggle.addEventListener('change', function() {
        if (this.checked) {
            logoImage.classList.remove('hidden');
        } else {
            logoImage.classList.add('hidden');
        }
        // Save preference
        localStorage.setItem('showLogo', this.checked);
    });

    // Waves Toggle Logic
    wavesToggle.addEventListener('change', function() {
        if (this.checked) {
            // Show waves
            if (wavesContainer) {
                wavesContainer.classList.remove('hidden');
            }
        } else {
            // Hide waves
            if (wavesContainer) {
                wavesContainer.classList.add('hidden');
                // Clean up waves to save resources
                if (wavesCleanup) {
                    wavesCleanup();
                    wavesCleanup = null;
                    wavesInitialized = false;
                }
            }
        }
        // Save preference
        localStorage.setItem('showWaves', this.checked);
    });

    // Favorite Tools Toggle
    toolsToggle.addEventListener('change', function() {
        if (this.checked) {
            favoriteToolsSection.classList.remove('hidden');
        } else {
            favoriteToolsSection.classList.add('hidden');
        }
        // Save preference
        localStorage.setItem('showFavoriteTools', this.checked);
    });

    // Open Tools Modal
    favoriteToolsBtn.addEventListener('click', function() {
        settingsModalOverlay.classList.remove('active');
        renderToolsModal();
        toolsModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Close Tools Modal
    toolsModalClose.addEventListener('click', function() {
        toolsModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Save Tools Selection
    toolsModalSave.addEventListener('click', function() {
        const selectedTools = [];
        const checkboxes = document.querySelectorAll('#toolsGrid input[type="checkbox"]:checked');

        checkboxes.forEach(checkbox => {
            const toolId = checkbox.value;
            const tool = availableTools.find(t => t.id === toolId);
            if (tool) {
                selectedTools.push(tool);
            }
        });

        // Limit to MAX_FAVORITE_TOOLS
        const toolsToSave = selectedTools.slice(0, MAX_FAVORITE_TOOLS);

        // Save to localStorage
        localStorage.setItem('favoriteTools', JSON.stringify(toolsToSave));

        // Update display
        displayFavoriteTools();

        // Close modal
        toolsModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close modal when clicking outside
    toolsModalOverlay.addEventListener('click', function(e) {
        if (e.target === toolsModalOverlay) {
            toolsModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Handle search on Enter key
    searchBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = searchBox.value.trim();
            if (!query) return;

            // Save to frequent searches
            saveFrequentSearch(query);

            // Get selected search engine
            const engine = document.querySelector('input[name="searchEngine"]:checked')?.value || 'google';

            // Search engine URLs
            const engines = {
                google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
                bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
                duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                brave: `https://search.brave.com/search?q=${encodeURIComponent(query)}`
            };

            // Redirect to search engine
            window.location.href = engines[engine] || engines.google;
        }
    });

    // Focus search box on page load
    searchBox.focus();

    // Handle keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+K or Cmd+K to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            searchBox.focus();
        }

        // Escape key handlers
        if (e.key === 'Escape') {
            // Close settings modal
            if (settingsModalOverlay.classList.contains('active')) {
                settingsModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            // Close info modal
            if (infoModalOverlay.classList.contains('active')) {
                closeInfoModal();
            }
            // Close clear confirmation modal
            if (clearConfirmOverlay.classList.contains('active')) {
                clearConfirmOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            // Close tools modal
            if (toolsModalOverlay.classList.contains('active')) {
                toolsModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    });

    // Listen for window resize to update mobile status
    window.addEventListener('resize', function() {
        const newIsMobile = window.matchMedia('(max-width: 768px)').matches;
        // If mobile status changed, update the news tool name
        if (newIsMobile !== isMobile) {
            // Update the availableTools array
            const newsTool = availableTools.find(t => t.id === 'news');
            if (newsTool) {
                newsTool.name = newIsMobile ? 'Game News' : 'Latest Game News';
            }
            // Re-render the tools modal if it's open
            if (toolsModalOverlay.classList.contains('active')) {
                renderToolsModal();
            }
            // Re-display favorite tools to update names
            displayFavoriteTools();
        }
    });

    // Load saved search engine preference
    function loadSearchEnginePreference() {
        const savedEngine = localStorage.getItem('preferredSearchEngine');
        if (savedEngine) {
            const radioToCheck = document.querySelector(`input[name="searchEngine"][value="${savedEngine}"]`);
            if (radioToCheck) {
                radioToCheck.checked = true;
            }
        }
    }

    // Load clock preference
    function loadClockPreference() {
        const showClock = localStorage.getItem('showClock');
        // Default to true if no preference is saved
        if (showClock === 'false') {
            clockToggle.checked = false;
            clockElement.classList.add('hidden');
        } else {
            clockToggle.checked = true;
            clockElement.classList.remove('hidden');
            // Ensure the default is saved if it doesn't exist
            if (showClock === null) {
                localStorage.setItem('showClock', 'true');
            }
        }
    }

    // Load frequent searches visibility preference
    function loadFrequentSearchesPreference() {
        const showFrequent = localStorage.getItem('showFrequentSearches');
        // Default to true if no preference is saved
        if (showFrequent === 'false') {
            frequentToggle.checked = false;
            frequentSearchesSection.classList.add('hidden');
        } else {
            frequentToggle.checked = true;
            frequentSearchesSection.classList.remove('hidden');
            // Ensure the default is saved if it doesn't exist
            if (showFrequent === null) {
                localStorage.setItem('showFrequentSearches', 'true');
            }
        }
    }

    // Load logo image visibility preference
    function loadLogoPreference() {
        const showLogo = localStorage.getItem('showLogo');
        // Default to true if no preference is saved
        if (showLogo === 'false') {
            logoToggle.checked = false;
            if (logoImage) {
                logoImage.classList.add('hidden');
            }
        } else {
            logoToggle.checked = true;
            if (logoImage) {
                logoImage.classList.remove('hidden');
            }
            // Ensure the default is saved if it doesn't exist
            if (showLogo === null) {
                localStorage.setItem('showLogo', 'true');
            }
        }
    }

    // Load waves visibility preference
    function loadWavesPreference() {
        const showWaves = localStorage.getItem('showWaves');

        if (showWaves === 'false') {
            // Waves should be hidden
            wavesToggle.checked = false;
            if (wavesContainer) {
                wavesContainer.classList.add('hidden');
            }
        } else {
            // Waves should be shown
            wavesToggle.checked = true;
            if (wavesContainer) {
                wavesContainer.classList.remove('hidden');
            }
            // Ensure the default is saved if it doesn't exist
            if (showWaves === null) {
                localStorage.setItem('showWaves', 'true');
            }
        }
    }

    // Load favorite tools visibility preference
    function loadToolsPreference() {
        const showTools = localStorage.getItem('showFavoriteTools');
        // Default to true if no preference is saved
        if (showTools === 'false') {
            toolsToggle.checked = false;
            favoriteToolsSection.classList.add('hidden');
        } else {
            toolsToggle.checked = true;
            favoriteToolsSection.classList.remove('hidden');
            // Ensure the default is saved if it doesn't exist
            if (showTools === null) {
                localStorage.setItem('showFavoriteTools', 'true');
            }
        }
    }

    // Live Clock Function
    function startLiveClock() {
        function updateClock() {
            const now = new Date();
            // Format: HH:MM:SS
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}:${seconds}`;
            clockElement.textContent = timeString;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Save frequent search
    function saveFrequentSearch(query) {
        let searches = getFrequentSearches();

        // Remove if already exists
        searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());

        // Add new search to beginning
        searches.unshift(query);

        // Limit number of searches
        if (searches.length > MAX_FREQUENT_SEARCHES) {
            searches = searches.slice(0, MAX_FREQUENT_SEARCHES);
        }

        // Save to localStorage
        localStorage.setItem('frequentSearches', JSON.stringify(searches));

        // Update display
        displayFrequentSearches();
    }

    // Get frequent searches from localStorage
    function getFrequentSearches() {
        const saved = localStorage.getItem('frequentSearches');
        return saved ? JSON.parse(saved) : [];
    }

    // Helper function to truncate text with ellipsis
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Display frequent searches
    function displayFrequentSearches() {
        const searches = getFrequentSearches();

        if (!frequentSearchesTags) return;

        if (searches.length === 0) {
            frequentSearchesTags.innerHTML = '<span class="empty-searches">No frequent searches yet</span>';
            return;
        }

        frequentSearchesTags.innerHTML = searches.map(query => {
            const displayQuery = truncateText(query, MAX_SEARCH_LENGTH);
            return `
                <span class="frequent-search-tag" data-query="${query}">
                    <i class="fas fa-history"></i>
                    ${displayQuery}
                </span>
            `;
        }).join('');

        // Add click handlers to tags
        document.querySelectorAll('.frequent-search-tag').forEach(tag => {
            tag.addEventListener('click', function() {
                const query = this.dataset.query;
                searchBox.value = query;
                searchBox.focus();
            });
        });
    }

    // Get favorite tools from localStorage
    function getFavoriteTools() {
        const saved = localStorage.getItem('favoriteTools');
        return saved ? JSON.parse(saved) : [];
    }

    // Display favorite tools
    function displayFavoriteTools() {
        const tools = getFavoriteTools();

        if (!favoriteToolsGrid) return;

        if (tools.length === 0) {
            favoriteToolsGrid.innerHTML = '<span class="empty-tools">Select your favorite tools in settings</span>';
            return;
        }

        favoriteToolsGrid.innerHTML = tools.map(tool => {
            // Check if this is the news tool and apply mobile name if needed
            const isMobileNow = window.matchMedia('(max-width: 768px)').matches;
            let displayName = tool.name;

            // If this is the news tool and we're on mobile, use the shorter name
            if (tool.id === 'news' && isMobileNow) {
                displayName = 'Game News';
            } else if (tool.id === 'news' && !isMobileNow) {
                displayName = 'Latest Game News';
            }

            return `
                <button class="favorite-tool-button" data-url="${tool.url}" data-tool-id="${tool.id}">
                    <i class="fas ${tool.icon}"></i>
                    <span>${displayName}</span>
                </button>
            `;
        }).join('');

        // Add click handlers to tool buttons
        document.querySelectorAll('.favorite-tool-button').forEach(button => {
            button.addEventListener('click', function() {
                const url = this.dataset.url;
                if (url) {
                    window.open(url, '_blank');
                }
            });
        });
    }

    // Render tools modal with checkboxes and disabled state when max reached
    function renderToolsModal() {
        const currentTools = getFavoriteTools();
        const currentToolIds = currentTools.map(t => t.id);
        const isMobileNow = window.matchMedia('(max-width: 768px)').matches;

        toolsGrid.innerHTML = availableTools.map(tool => {
            const isChecked = currentToolIds.includes(tool.id);
            // Check if this tool would be disabled
            const isDisabled = !isChecked && currentToolIds.length >= MAX_FAVORITE_TOOLS;

            // Use mobile-friendly name if needed
            let displayName = tool.name;
            if (tool.id === 'news' && isMobileNow) {
                displayName = 'Game News';
            } else if (tool.id === 'news' && !isMobileNow) {
                displayName = 'Latest Game News';
            }

            return `
                <label class="tool-checkbox-item ${isDisabled ? 'disabled' : ''}">
                    <input type="checkbox"
                           value="${tool.id}"
                           ${isChecked ? 'checked' : ''}
                           ${isDisabled ? 'disabled' : ''}>
                    <i class="fas ${tool.icon}"></i>
                    <span>${displayName}</span>
                </label>
            `;
        }).join('');

        // Add max selection warning
        const warningEl = document.createElement('p');
        warningEl.className = 'tools-warning';
        warningEl.innerHTML = `<i class="fas fa-info-circle"></i> You can select up to ${MAX_FAVORITE_TOOLS} favorite tools. Uncheck some to select others.`;

        // Remove existing warning if any
        const existingWarning = toolsGrid.parentNode.querySelector('.tools-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        toolsGrid.parentNode.appendChild(warningEl);

        // Add change event listeners to handle enabling/disabling based on count
        const checkboxes = toolsGrid.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const checkedCount = toolsGrid.querySelectorAll('input[type="checkbox"]:checked').length;

                // Update disabled state of all unchecked checkboxes
                checkboxes.forEach(cb => {
                    const label = cb.closest('.tool-checkbox-item');
                    if (!cb.checked) {
                        if (checkedCount >= MAX_FAVORITE_TOOLS) {
                            cb.disabled = true;
                            label.classList.add('disabled');
                        } else {
                            cb.disabled = false;
                            label.classList.remove('disabled');
                        }
                    }
                });
            });
        });
    }

    // Listen for waves initialization
    window.addEventListener('wavesInitialized', function(e) {
        wavesCleanup = e.detail.cleanup;
        wavesInitialized = true;
    });

    // Clean up waves when page unloads
    window.addEventListener('beforeunload', function() {
        if (wavesCleanup) {
            wavesCleanup();
        }
    });
});