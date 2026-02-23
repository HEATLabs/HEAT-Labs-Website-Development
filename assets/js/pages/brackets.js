// Tournament Bracket Page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch tournaments list and initialize
    fetchTournamentsList();

    // Initialize tournament bracket controls
    initializeTournamentBracket();

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        const dropdown = document.querySelector('.custom-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
            closeDropdown();
        }
    });
});

// Store available tournaments data
let availableTournaments = [];
let currentBracketData = null;
let selectedItem = null;

// Pan and zoom variables
let currentZoom = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let startX, startY;
let dragWrapper = null;
let bracketsViewer = null;
let panIndicator = null;

// Function to fetch tournaments list from config
async function fetchTournamentsList() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/tournaments-dev.json');
        // const response = await fetch('../HEAT-Labs-Configs/tournaments-dev-local.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch tournaments list: ${response.status}`);
        }

        const tournaments = await response.json();

        // Filter tournaments that have valid bracket data
        availableTournaments = tournaments.filter(tournament =>
            tournament.publish &&
            tournament['tournament-brackets'] &&
            (tournament['tournament-brackets'].winner || tournament['tournament-brackets'].loser)
        );

        // Populate dropdown
        populateTournamentDropdown(availableTournaments);

    } catch (error) {
        console.error('Error fetching tournaments list:', error);
        showError('Failed to load tournaments list. Please try again later.');
    }
}

// Function to populate tournament dropdown with custom dropdown
function populateTournamentDropdown(tournaments) {
    const dropdownContainer = document.getElementById('tournament-dropdown-container');
    if (!dropdownContainer) return;

    if (tournaments.length === 0) {
        dropdownContainer.innerHTML = `
            <div class="custom-dropdown">
                <button class="dropdown-button" disabled>
                    <span>No tournaments available</span>
                    <span class="dropdown-arrow">
                        <svg viewBox="0 0 24 24">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </span>
                </button>
            </div>
        `;
        return;
    }

    // Build dropdown items
    let items = [];
    tournaments.forEach((tournament, tournamentIndex) => {
        const brackets = tournament['tournament-brackets'];

        // Add winners bracket option if available
        if (brackets.winner) {
            items.push({
                id: `${tournamentIndex}-winner`,
                url: brackets.winner,
                type: 'winner',
                tournamentName: tournament.name,
                bracketType: 'Winners Bracket',
                displayText: `${tournament.name} - Winners Bracket`
            });
        }

        // Add losers bracket option if available
        if (brackets.loser) {
            items.push({
                id: `${tournamentIndex}-loser`,
                url: brackets.loser,
                type: 'loser',
                tournamentName: tournament.name,
                bracketType: 'Losers Bracket',
                displayText: `${tournament.name} - Losers Bracket`
            });
        }
    });

    // Create custom dropdown HTML
    dropdownContainer.innerHTML = `
        <div class="custom-dropdown" id="custom-dropdown">
            <button class="dropdown-button" id="dropdown-button">
                <span id="selected-text">Select a tournament...</span>
                <span class="dropdown-arrow">
                    <svg viewBox="0 0 24 24">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
            </button>
            <div class="dropdown-menu" id="dropdown-menu">
                ${items.map(item => `
                    <div class="dropdown-item" data-id="${item.id}" data-url="${item.url}" data-type="${item.type}">
                        <div class="dropdown-item-content">
                            <span class="dropdown-item-title">${item.tournamentName}</span>
                            <span class="dropdown-item-subtitle">${item.bracketType}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Add event listeners for custom dropdown
    initializeCustomDropdown(items);
}

// Initialize custom dropdown functionality
function initializeCustomDropdown(items) {
    const dropdownButton = document.getElementById('dropdown-button');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const selectedText = document.getElementById('selected-text');
    const dropdownItems = document.querySelectorAll('.dropdown-item');

    if (!dropdownButton || !dropdownMenu) return;

    // Toggle dropdown on button click
    dropdownButton.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        dropdownMenu.classList.toggle('show');
    });

    // Handle item selection
    dropdownItems.forEach(item => {
        item.addEventListener('click', async function(e) {
            e.stopPropagation();

            // Update selected state
            dropdownItems.forEach(i => i.classList.remove('selected'));
            this.classList.add('selected');

            // Update button text
            const itemContent = this.querySelector('.dropdown-item-title').textContent;
            const itemSubtitle = this.querySelector('.dropdown-item-subtitle').textContent;
            selectedText.textContent = `${itemContent} - ${itemSubtitle}`;

            // Close dropdown
            dropdownButton.classList.remove('active');
            dropdownMenu.classList.remove('show');

            // Get item data
            const itemId = this.dataset.id;
            const itemUrl = this.dataset.url;
            const itemType = this.dataset.type;

            // Show loading state
            showLoading('Loading tournament bracket...');

            try {
                await fetchBracketData(itemUrl);
            } catch (error) {
                console.error('Error loading bracket:', error);
                showError('Failed to load bracket data. Please try again.');
            }
        });
    });
}

// Function to close dropdown
function closeDropdown() {
    const dropdownButton = document.getElementById('dropdown-button');
    const dropdownMenu = document.getElementById('dropdown-menu');

    if (dropdownButton && dropdownMenu) {
        dropdownButton.classList.remove('active');
        dropdownMenu.classList.remove('show');
    }
}

// Function to handle tournament selection (backward compatibility)
async function handleTournamentSelection(event) {
    const selectedValue = event.target.value;

    if (!selectedValue) {
        // Clear the bracket view
        clearBracketView();
        return;
    }

    // Parse the selected value to get tournament index and bracket type
    const [tournamentIndex, bracketType] = selectedValue.split('-');

    // Get the selected option element to access data attributes
    const selectedOption = event.target.options[event.target.selectedIndex];
    const bracketUrl = selectedOption.dataset.url;

    if (!bracketUrl) {
        showError('No bracket URL available for this selection.');
        return;
    }

    // Show loading state
    showLoading('Loading tournament bracket...');

    try {
        await fetchBracketData(bracketUrl);
        // Loading state will be cleared by fetchBracketData when successful
    } catch (error) {
        console.error('Error loading bracket:', error);
        showError('Failed to load bracket data. Please try again.');
    }
}

// Function to fetch bracket data
async function fetchBracketData(bracketUrl) {
    if (!bracketUrl) {
        throw new Error('No bracket URL provided');
    }

    const response = await fetch(bracketUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch bracket data: ${response.status}`);
    }

    const tournamentData = await response.json();
    currentBracketData = tournamentData;

    // Initialize bracket viewer with tournament data
    if (window.bracketsViewer && tournamentData) {
        await initializeBracketsViewer(tournamentData);
    }
}

// Function to clear bracket view
function clearBracketView() {
    const bracketViewer = document.getElementById('brackets-viewer');
    if (bracketViewer) {
        bracketViewer.innerHTML = `
            <div class="tournament-bracket-loading">
                <i class="fas fa-trophy"></i>
                <p>Select a tournament from the dropdown above</p>
            </div>
        `;
    }
}

// Function to show loading state
function showLoading(message) {
    const bracketViewer = document.getElementById('brackets-viewer');
    if (bracketViewer) {
        bracketViewer.innerHTML = `
            <div class="tournament-bracket-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Function to show error
function showError(message) {
    const bracketViewer = document.getElementById('brackets-viewer');
    if (bracketViewer) {
        bracketViewer.innerHTML = `
            <div class="tournament-bracket-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Tournament Bracket Functions
function initializeTournamentBracket() {
    const bracketContainer = document.getElementById('tournament-bracket-container');
    const bracketViewer = document.getElementById('brackets-viewer');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const resetZoomBtn = document.getElementById('reset-zoom');
    const themeToggle = document.getElementById('theme-toggle');

    if (!bracketContainer || !bracketViewer) return;

    // Store references
    bracketsViewer = bracketViewer;

    // Initialize drag functionality
    initDragPan(bracketViewer, bracketContainer);

    // Zoom controls
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            zoom(0.1);
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoom(-0.1);
        });
    }

    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            resetZoom();
        });
    }

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Initialize drag to pan functionality
function initDragPan(element, container) {
    if (!element) return;

    // Set initial transform
    updateTransform(element);

    // Mouse down handler
    element.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Left click only

        isDragging = true;
        startX = e.clientX - currentX;
        startY = e.clientY - currentY;

        element.style.cursor = 'grabbing';
        element.classList.add('dragging');

        // Show pan indicator
        if (panIndicator) {
            panIndicator.classList.add('visible');
            setTimeout(() => {
                panIndicator.classList.remove('visible');
            }, 2000);
        }

        e.preventDefault();
    });

    // Mouse move handler
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        currentX = e.clientX - startX;
        currentY = e.clientY - startY;

        // Add boundaries to prevent dragging too far
        const bounds = getDragBounds(element);
        currentX = Math.min(Math.max(currentX, bounds.minX), bounds.maxX);
        currentY = Math.min(Math.max(currentY, bounds.minY), bounds.maxY);

        updateTransform(element);
    });

    // Mouse up handler
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'grab';
            element.classList.remove('dragging');
        }
    });

    // Mouse leave handler
    element.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = 'grab';
            element.classList.remove('dragging');
        }
    });

    // Wheel zoom handler
    element.addEventListener('wheel', (e) => {
        e.preventDefault();

        // Get mouse position relative to element
        const rect = element.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom delta
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(Math.max(currentZoom + delta, 0.3), 3);

        if (newZoom !== currentZoom) {
            // Adjust position to zoom towards mouse
            const scale = newZoom / currentZoom;
            currentX = mouseX - (mouseX - currentX) * scale;
            currentY = mouseY - (mouseY - currentY) * scale;
            currentZoom = newZoom;

            // Add boundaries
            const bounds = getDragBounds(element);
            currentX = Math.min(Math.max(currentX, bounds.minX), bounds.maxX);
            currentY = Math.min(Math.max(currentY, bounds.minY), bounds.maxY);

            updateTransform(element);
        }
    }, {
        passive: false
    });
}

// Calculate drag boundaries
function getDragBounds(element) {
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement.getBoundingClientRect();

    // Calculate bounds based on zoom level
    const contentWidth = element.scrollWidth * currentZoom;
    const contentHeight = element.scrollHeight * currentZoom;
    const viewportWidth = parentRect.width;
    const viewportHeight = parentRect.height;

    return {
        minX: Math.min(0, viewportWidth - contentWidth),
        maxX: Math.max(0, viewportWidth - contentWidth),
        minY: Math.min(0, viewportHeight - contentHeight),
        maxY: Math.max(0, viewportHeight - contentHeight)
    };
}

// Update transform for element
function updateTransform(element) {
    element.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentZoom})`;
}

// Zoom function
function zoom(delta) {
    const newZoom = Math.min(Math.max(currentZoom + delta, 0.3), 3);

    if (newZoom !== currentZoom) {
        // Zoom towards center of viewport
        const element = bracketsViewer;
        const rect = element.getBoundingClientRect();
        const viewportWidth = element.parentElement.clientWidth;
        const viewportHeight = element.parentElement.clientHeight;

        const centerX = viewportWidth / 2 - rect.left;
        const centerY = viewportHeight / 2 - rect.top;

        const scale = newZoom / currentZoom;
        currentX = centerX - (centerX - currentX) * scale;
        currentY = centerY - (centerY - currentY) * scale;
        currentZoom = newZoom;

        // Add boundaries
        const bounds = getDragBounds(element);
        currentX = Math.min(Math.max(currentX, bounds.minX), bounds.maxX);
        currentY = Math.min(Math.max(currentY, bounds.minY), bounds.maxY);

        updateTransform(element);
    }
}

// Reset zoom function
function resetZoom() {
    currentZoom = 1;
    currentX = 0;
    currentY = 0;

    if (bracketsViewer) {
        updateTransform(bracketsViewer);
    }
}

// Toggle theme
function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    if (html.classList.contains('dark-theme')) {
        html.classList.remove('dark-theme');
        html.classList.add('light-theme');
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'light-theme');
    } else {
        html.classList.remove('light-theme');
        html.classList.add('dark-theme');
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'dark-theme');
    }
}

async function initializeBracketsViewer(tournamentData) {
    const bracketViewer = document.getElementById('brackets-viewer');

    if (!bracketViewer || !window.bracketsViewer) {
        console.error('Brackets viewer not available');
        return;
    }

    // Reset pan and zoom
    resetZoom();

    // Prepare data for brackets viewer
    const stages = tournamentData.stages || [];
    const matches = tournamentData.matches || [];
    const participants = tournamentData.participants || [];
    const matchGames = tournamentData.match_games || [];

    // Map participants
    const mappedParticipants = participants.map(p => ({
        id: p.id,
        name: p.name
    }));

    // Map matches
    const mappedMatches = matches.map(m => ({
        id: m.id,
        number: m.number,
        stage_id: m.stage_id,
        group_id: m.group_id,
        round_id: m.round_id,
        child_count: m.child_count || 1,
        status: m.status || 2,
        opponent1: m.opponent1 ? {
            id: m.opponent1.id,
            score: m.opponent1.score,
            result: m.opponent1.result,
            forfeit: m.opponent1.forfeit
        } : null,
        opponent2: m.opponent2 ? {
            id: m.opponent2.id,
            score: m.opponent2.score,
            result: m.opponent2.result,
            forfeit: m.opponent2.forfeit
        } : null
    }));

    // Map match games
    const mappedMatchGames = matchGames.map(mg => ({
        id: mg.id,
        number: mg.number,
        parent_id: mg.parent_id,
        status: mg.status || 2,
        opponent1: mg.opponent1 ? {
            id: mg.opponent1.id,
            score: mg.opponent1.score
        } : null,
        opponent2: mg.opponent2 ? {
            id: mg.opponent2.id,
            score: mg.opponent2.score
        } : null
    }));

    const data = {
        stages: stages,
        matches: mappedMatches,
        matchGames: mappedMatchGames,
        participants: mappedParticipants
    };

    // Configuration
    const config = {
        participantOriginPlacement: 'before',
        showSlotsOrigin: true,
        showLowerBracketSlotsOrigin: true,
        highlightParticipantOnHover: true,
        onMatchClick: (match) => {
            console.log('Match clicked:', match);
            // placeholder for details
        }
    };

    try {
        // Clear the bracket viewer first to remove loading state
        bracketViewer.innerHTML = '';

        // Set cursor to grab
        bracketViewer.style.cursor = 'grab';

        // Render the brackets
        await window.bracketsViewer.render(data, config);

        // Ensure bracket connections aligned
        setTimeout(fixBracketConnections, 100);
    } catch (error) {
        console.error('Error rendering bracket:', error);
        showError('Error rendering tournament bracket. Please try again later.');
    }
}

// Fix bracket connection lines
function fixBracketConnections() {
    const brackets = document.querySelectorAll('.brackets-viewer .bracket');

    brackets.forEach(bracket => {
        const rounds = bracket.querySelectorAll('.round');

        rounds.forEach((round, roundIndex) => {
            if (roundIndex === rounds.length - 1) return; // Skip last round

            const matches = round.querySelectorAll('.match');
            const nextRound = rounds[roundIndex + 1];
            const nextMatches = nextRound.querySelectorAll('.match');

            matches.forEach((match, matchIndex) => {
                // Ensure connection classes are properly set
                if (nextMatches[matchIndex * 2] || nextMatches[matchIndex * 2 + 1]) {
                    match.classList.add('connect-next');

                    // Add straight class for finals
                    if (rounds.length - roundIndex <= 2) {
                        match.classList.add('straight');
                    }
                }
            });
        });
    });
}