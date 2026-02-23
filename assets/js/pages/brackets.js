// Tournament Bracket Page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch tournament data directly (for now)
    fetchTournamentData();

    // Initialize tournament bracket
    initializeTournamentBracket();
});

// Function to fetch tournament data
async function fetchTournamentData() {
    try {
        // Fetch the tournament data directly (for now (again))
        const tournamentDataResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Database/refs/heads/main/tournaments/brackets/OAT2-bracket-winners.json');
        if (!tournamentDataResponse.ok) {
            throw new Error(`Failed to fetch tournament data: ${tournamentDataResponse.status}`);
        }

        const tournamentData = await tournamentDataResponse.json();

        // Initialize bracket viewer with tournament data
        if (window.bracketsViewer && tournamentData) {
            initializeBracketsViewer(tournamentData);
        }

    } catch (error) {
        console.error('Error fetching tournament data:', error);

        // Show error message to user
        const bracketContainer = document.getElementById('brackets-viewer');
        if (bracketContainer) {
            bracketContainer.innerHTML = `
                <div class="tournament-bracket-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load tournament bracket data. Please try again later.</p>
                </div>
            `;
        }
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

function initializeBracketsViewer(tournamentData) {
    const bracketViewer = document.getElementById('brackets-viewer');

    if (!bracketViewer || !window.bracketsViewer) {
        console.error('Brackets viewer not available');
        return;
    }

    // Clear loading state
    bracketViewer.innerHTML = '';

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

    // Render the brackets
    window.bracketsViewer.render(data, config).catch(error => {
        console.error('Error rendering bracket:', error);
        bracketViewer.innerHTML = `
            <div class="tournament-bracket-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error rendering tournament bracket. Please try again later.</p>
            </div>
        `;
    });
}