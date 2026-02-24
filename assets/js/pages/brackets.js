// Tournament Bracket Page
document.addEventListener('DOMContentLoaded', function() {
    // Check for URL parameters first
    checkUrlParameters();

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
let isBracketLoaded = false;

// Function to check URL parameters
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');

    if (key) {
        // Parse the key (format: "TOURNAMENT-ID-winner" or "TOURNAMENT-ID-loser")
        const lastHyphenIndex = key.lastIndexOf('-');
        if (lastHyphenIndex !== -1) {
            const tournamentId = key.substring(0, lastHyphenIndex);
            const bracketType = key.substring(lastHyphenIndex + 1);

            // Validate bracket type
            if (bracketType === 'winner' || bracketType === 'loser') {
                // Store the requested tournament info to load after tournaments list is fetched
                sessionStorage.setItem('requestedTournament', JSON.stringify({
                    tournamentId: tournamentId,
                    bracketType: bracketType
                }));
            }
        }
    }
}

// Function to load tournament from URL parameter
async function loadTournamentFromParameter() {
    const requestedData = sessionStorage.getItem('requestedTournament');
    if (!requestedData || availableTournaments.length === 0) return;

    try {
        const {
            tournamentId,
            bracketType
        } = JSON.parse(requestedData);

        // Find the tournament with matching tournament-id
        const tournament = availableTournaments.find(t => t['tournament-id'] === tournamentId);

        if (tournament && tournament['tournament-brackets'] && tournament['tournament-brackets'][bracketType]) {
            const bracketUrl = tournament['tournament-brackets'][bracketType];

            // Find and select the corresponding dropdown item
            const items = document.querySelectorAll('.dropdown-item');
            let foundItem = null;

            items.forEach(item => {
                const itemUrl = item.dataset.url;
                if (itemUrl === bracketUrl) {
                    foundItem = item;
                }
            });

            if (foundItem) {
                // Simulate click on the dropdown item
                foundItem.click();

                // Update dropdown button text
                const selectedText = document.getElementById('selected-text');
                const itemContent = foundItem.querySelector('.dropdown-item-title').textContent;
                const itemSubtitle = foundItem.querySelector('.dropdown-item-subtitle').textContent;
                selectedText.textContent = `${itemContent} - ${itemSubtitle}`;

                // Clear the stored request
                sessionStorage.removeItem('requestedTournament');
            } else {
                console.error('Could not find matching dropdown item for bracket URL:', bracketUrl);
            }
        } else {
            console.error('Tournament or bracket not found:', tournamentId, bracketType);
        }
    } catch (error) {
        console.error('Error loading tournament from parameter:', error);
    }
}

// Function to fetch tournaments list from config
async function fetchTournamentsList() {
    try {
        // Uncomment the line below for production
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

        // After dropdown is populated, try to load tournament from URL parameter
        setTimeout(() => {
            loadTournamentFromParameter();
        }, 100); // Small delay to ensure dropdown is rendered

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
        const tournamentId = tournament['tournament-id'];

        // Add winners bracket option if available
        if (brackets.winner) {
            items.push({
                id: `${tournamentIndex}-winner`,
                url: brackets.winner,
                type: 'winner',
                tournamentId: tournamentId,
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
                tournamentId: tournamentId,
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
                    <div class="dropdown-item" data-id="${item.id}" data-url="${item.url}" data-type="${item.type}" data-tournament-id="${item.tournamentId}">
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
            const tournamentId = this.dataset.tournamentId;

            // Update URL with the key parameter without reloading
            const url = new URL(window.location);
            url.searchParams.set('key', `${tournamentId}-${itemType}`);
            window.history.replaceState({}, '', url);

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
    // Disable bracket interactions
    isBracketLoaded = false;
    resetZoom();
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
    // Disable bracket interactions
    isBracketLoaded = false;
    resetZoom();
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
    // Disable bracket interactions
    isBracketLoaded = false;
    resetZoom();
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
            if (isBracketLoaded) {
                zoom(0.1);
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (isBracketLoaded) {
                zoom(-0.1);
            }
        });
    }

    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            if (isBracketLoaded) {
                resetZoom();
            }
        });
    }

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Initially disable bracket interactions
    isBracketLoaded = false;
}

// Initialize drag to pan functionality
function initDragPan(element, container) {
    if (!element) return;

    // Set initial transform
    updateTransform(element);

    // Mouse down handler
    element.addEventListener('mousedown', (e) => {
        // Only enable dragging if bracket is loaded
        if (!isBracketLoaded) return;
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
        if (!isDragging || !isBracketLoaded) return;

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
            element.style.cursor = isBracketLoaded ? 'grab' : 'default';
            element.classList.remove('dragging');
        }
    });

    // Mouse leave handler
    element.addEventListener('mouseleave', () => {
        if (isDragging) {
            isDragging = false;
            element.style.cursor = isBracketLoaded ? 'grab' : 'default';
            element.classList.remove('dragging');
        }
    });

    // Wheel zoom handler
    element.addEventListener('wheel', (e) => {
        // Only enable zoom if bracket is loaded
        if (!isBracketLoaded) return;

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

    // Set initial cursor
    element.style.cursor = 'default';
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

// Function to show match details in a beautiful popup
function showMatchDetails(match, participants) {
    // Remove any existing match details popup
    const existingPopup = document.querySelector('.match-details-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // Get participant names
    const getParticipantName = (id) => {
        const participant = participants.find(p => p.id === id);
        return participant ? participant.name : 'TBD';
    };

    // Format result text
    const getResultText = (result) => {
        if (!result) return '';
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    // Get match description or create a default one
    const matchDescription = match.description && match.description !== 'DESCRIPTION PLACEHOLDER' ?
        match.description :
        'No additional match details available.';

    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'match-details-popup';

    // Determine winner for styling
    const winner1 = match.opponent1?.result === 'win';
    const winner2 = match.opponent2?.result === 'win';

    popup.innerHTML = `
        <div class="match-details-content">
            <div class="match-details-header">
                <h3>Match Details</h3>
                <button class="match-details-close">&times;</button>
            </div>
            <div class="match-teams">
                <div class="match-team ${winner1 ? 'winner' : ''} ${match.opponent1?.result === 'loss' ? 'loser' : ''}">
                    <div class="team-info">
                        <span class="team-name">${getParticipantName(match.opponent1?.id)}</span>
                    </div>
                    <div class="team-score-container">
                        <span class="team-score">${match.opponent1?.score || 0}</span>
                        ${match.opponent1?.result ? `<span class="team-result ${match.opponent1.result}">${getResultText(match.opponent1.result)}</span>` : ''}
                    </div>
                </div>
                <div class="match-vs">VS</div>
                <div class="match-team ${winner2 ? 'winner' : ''} ${match.opponent2?.result === 'loss' ? 'loser' : ''}">
                    <div class="team-info">
                        <span class="team-name">${getParticipantName(match.opponent2?.id)}</span>
                    </div>
                    <div class="team-score-container">
                        <span class="team-score">${match.opponent2?.score || 0}</span>
                        ${match.opponent2?.result ? `<span class="team-result ${match.opponent2.result}">${getResultText(match.opponent2.result)}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="match-info">
                <div class="match-info-item">
                    <span class="info-label">Match Number:</span>
                    <span class="info-value">#${match.id}</span>
                </div>
                <div class="match-info-item">
                    <span class="info-label">Round:</span>
                    <span class="info-value">Round ${match.round_id || 'N/A'}</span>
                </div>
                <div class="match-info-item">
                    <span class="info-label">Status:</span>
                    <span class="info-value status-${match.status}">${getMatchStatus(match.status)}</span>
                </div>
            </div>

            <div class="match-description">
                <h4>Match Description</h4>
                <p>${matchDescription}</p>
            </div>
        </div>
    `;

    // Add close functionality
    popup.querySelector('.match-details-close').addEventListener('click', () => {
        popup.remove();
    });

    // Close when clicking outside
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.remove();
        }
    });

    // Append to body
    document.body.appendChild(popup);
}

// Helper function to get match status text
function getMatchStatus(status) {
    const statusMap = {
        0: 'Pending',
        1: 'In Progress',
        2: 'Completed',
        3: 'Walkover',
        4: 'Completed',
        5: 'No Show',
        6: 'Disqualified'
    };
    return statusMap[status] || 'Unknown';
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
        description: m.description,
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
            // Find the full match data with description
            const fullMatch = matches.find(m => m.id === match.id);
            if (fullMatch) {
                showMatchDetails(fullMatch, participants);
            } else {
                showMatchDetails(match, participants);
            }
        }
    };

    try {
        // Clear the bracket viewer first to remove loading state
        bracketViewer.innerHTML = '';

        // Set cursor to grab
        bracketViewer.style.cursor = 'grab';
        isBracketLoaded = true;

        // Render the brackets
        await window.bracketsViewer.render(data, config);

        // Ensure bracket connections aligned
        setTimeout(fixBracketConnections, 100);
    } catch (error) {
        console.error('Error rendering bracket:', error);
        showError('Error rendering tournament bracket. Please try again later.');
        isBracketLoaded = false;
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