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

    if (!bracketContainer || !bracketViewer) return;

    // Zoom controls
    let zoomLevel = 1;
    const maxZoom = 2;
    const minZoom = 0.5;

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (zoomLevel < maxZoom) {
                zoomLevel += 0.1;
                bracketViewer.style.transform = `scale(${zoomLevel})`;
                bracketViewer.style.transformOrigin = 'top left';
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (zoomLevel > minZoom) {
                zoomLevel -= 0.1;
                bracketViewer.style.transform = `scale(${zoomLevel})`;
                bracketViewer.style.transformOrigin = 'top left';
            }
        });
    }

    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', () => {
            zoomLevel = 1;
            bracketViewer.style.transform = 'scale(1)';
            bracketViewer.style.transformOrigin = 'top left';
        });
    }
}

async function initializeBracketsViewer(tournamentData) {
    const bracketViewer = document.getElementById('brackets-viewer');

    if (!bracketViewer || !window.bracketsViewer) {
        console.error('Brackets viewer not available');
        return;
    }

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

        // Render the brackets
        await window.bracketsViewer.render(data, config);
    } catch (error) {
        console.error('Error rendering bracket:', error);
        showError('Error rendering tournament bracket. Please try again later.');
    }
}