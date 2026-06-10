document.addEventListener('DOMContentLoaded', function() {
    const comparisonTable = document.getElementById('comparisonTable');
    const clearAllBtn = document.getElementById('clearAllComparison');
    let comparisonData = [];
    let tankDetails = {};

    // Load comparison data from localStorage
    function loadComparison() {
        const savedComparison = localStorage.getItem('tankComparison');
        if (savedComparison) {
            comparisonData = JSON.parse(savedComparison);
            // Fetch details for all tanks in comparison
            Promise.all(comparisonData.map(id => fetchTankDetails(id)))
                .then(() => renderComparisonTable());
        }
    }

    // Save comparison data to localStorage
    function saveComparison() {
        localStorage.setItem('tankComparison', JSON.stringify(comparisonData));
        renderComparisonTable();
    }

    // Fetch tank details
    async function fetchTankDetails(tankId) {
        if (tankDetails[tankId]) return tankDetails[tankId];

        try {
            // First get the tank info from tanks.json
            const tanksResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/tanks.json');
            const tanksData = await tanksResponse.json();
            const tankInfo = tanksData.find(tank => tank.id == tankId);

            if (!tankInfo) return null;

            // Then get the stock stats
            const stockResponse = await fetch(tankInfo.stock);
            const stockData = await stockResponse.json();

            // Find the stats using tank slug
            let tankStats = stockData[tankInfo.slug] || stockData[tankInfo.id] || null;

            // Combine the data
            const fullData = {
                ...tankInfo,
                stats: tankStats || {}
            };

            tankDetails[tankId] = fullData;
            return fullData;
        } catch (error) {
            console.error('Error fetching tank details:', error);
            return null;
        }
    }

    // Map stat names to readable names
    function getStatMapping() {
        return {
            // Firepower stats
            "MAIN SHELL DAMAGE": "Damage",
            "MAIN SHELL PENETRATION": "Penetration",
            "MAIN SHELL VELOCITY": "Shell Velocity",
            "MAIN SHELL EXPLOSION RADIUS": "Explosion Radius",
            "SECONDARY SHELL DAMAGE": "Secondary Damage",
            "SECONDARY SHELL PENETRATION": "Secondary Penetration",
            "SECONDARY SHELL VELOCITY": "Secondary Velocity",
            "SECONDARY SHELL EXPLOSION RADIUS": "Secondary Explosion Radius",
            "AIMING SPEED": "Aiming Speed",
            "RELOAD TIME": "Reload Time",
            "TIME BETWEEN SHOTS": "Time Between Shots",
            "MAGAZINE SHELL COUNT": "Shells in Magazine",
            "MAGAZINE COUNT": "Magazine Count",
            "SHELL LOADING TIME BETWEEN SHOTS": "Time to Load Next Magazine",
            "RETICLE SIZE MOVING": "Reticle Size, Moving",
            "RETICLE SIZE STATIONARY": "Reticle Size, Standing",
            "ACCURACY AFTER SHOT": "Reticle Size, After Shot",
            "ACCURACY MAX": "Reticle Size, Max",
            "OPTIMAL RANGE": "Optimal Range",
            "DAMAGE REDUCTION BEYOND OPTIMAL": "Damage Reduction Beyond Optimal",
            "FALLOFF DISTANCE": "Falloff Distance",
            "INTERNAL MODULE HIT": "Internal Module Hit Chance",

            // Survivability stats
            "HIT POINTS": "Hit Points",
            "TRACK REPAIR TIME": "Track Repair Time",
            "TRACK HP": "Track Hit Points",
            "ENGINE HP": "Engine Hit Points",
            "FRONTAL HULL ARMOR": "Frontal Hull Armor",
            "TURRET FRONTAL ARMOR": "Turret Frontal Armor",
            "SIDE TURRET ARMOUR": "Side Turret Armor",
            "TURRET RING ARMOR": "Turret Ring Armor",
            "HULL SIDE ARMOR": "Hull Side Armor",
            "RECOVERY TIME": "Crew Recovery Time",
            "AMMO CRIT MODIFIER": "Ammo Rack Crit Modifier",
            "ENGINE CRIT MODIFIER": "Engine Crit Modifier",
            "FUEL CRIT MODIFIER": "Fuel Tank Crit Modifier",
            "RAMMING DAMAGE RESISTANCE FRONT": "Ramming Damage Resistance",
            "RAMMING DAMAGE MULTIPLIER": "Ramming Damage Bonus",
            "SPACED ARMOR HP": "Spaced Armor HP",
            "FIRE RESISTANCE": "Fire Resistance",
            "RADIATION RESISTANCE": "Radiation Resistance",
            "SHOCK RESISTANCE": "Shock Resistance",
            "SLOW RESISTANCE": "Slow Resistance",
            "INCOMING DAMAGE MITIGATED BY ERA": "ERA Damage Mitigation",

            // Mobility stats
            "FORWARD SPEED": "Forward Speed",
            "REVERSE SPEED": "Reverse Speed",
            "HULL TRAVERSE": "Hull Traverse",
            "TURRET TRAVERSE SPEED": "Turret Traverse Speed",
            "ENGINE POWER": "Engine Power",
            "HANDBRAKE FORCE": "Handbrake Force",
            "VEHICLE LATERAL FRICTION": "Lateral Friction",
            "BOOST MODE ENERGY COST": "Sprint Energy Cost",
            "BOOST MODE ENERGY VOLUME": "Sprint Energy Volume",
            "BOOST MODE ACCELERATION": "Base Acceleration",
            "BOOST MODE REGENERATION RATE": "Sprint Regen Rate",

            // Recon stats
            "SPOTTING RANGE": "Spotting Range",
            "BATTLE COMMUINICATION RANGE": "Signal Range",
            "ENEMY VISIBILITY SHARE DURATION": "Spotting Duration",
            "VEHICLE CAMOUFLAGE": "Vehicle Camouflage",
            "VEHICLE OPTICS": "Vehicle Optics",
            "AIM INTEL VALUE": "Aim Intel",
            "HIT INTEL VALUE": "Hit Intel",
            "PERIPHERY INTEL VALUE": "Periphery Intel",
            "MOVING NOISE INTEL": "Moving Noise Intel",
            "SHOT NOISE VALUE": "Shot Noise",
            "RADAR UPDATE INTERVAL": "Radar Update Interval",
            "SECOND ZOOM MAGNIFICATION": "Second Zoom",
            "THIRD ZOOM MAGNIFICATION": "Third Zoom",

            // Utility stats
            "MAX ENERGY": "Max Energy",
            "ENERGY REGENERATION": "Energy Regen",
            "MAIN ABILITY ENERGY COST": "Main Ability Cost",
            "MAIN ABILITY COOLDOWN": "Main Ability Cooldown",
            "MAIN ABILITY DURATION": "Main Ability Duration",
            "MAIN ABILITY HP": "Main Ability HP",
            "SECOND ABILITY ENERGY COST": "Second Ability Cost",
            "SECOND ABILITY COOLDOWN": "Second Ability Cooldown",
            "SECOND ABILITY DURATION": "Second Ability Duration",
            "SECOND ABILITY HP": "Second Ability HP"
        };
    }

    // Check if a value should be considered for comparison (not zero/empty)
    function isValidStatValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') {
            if (value === "" || value === "N/A" || value === "0") return false;
            // Check if it's a number string that equals 0
            const num = parseFloat(value);
            if (!isNaN(num) && num === 0) return false;
        }
        if (typeof value === 'number' && value === 0) return false;
        return true;
    }

    // Parse value to number if possible
    function parseNumericValue(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
        }
        return null;
    }

    // Render the comparison table
    async function renderComparisonTable() {
        if (comparisonData.length === 0) {
            comparisonTable.innerHTML = `
                <tbody>
                    <tr>
                        <td colspan="100" class="comparison-empty py-10">
                            No tanks selected for comparison.<br>
                            <a href="tanks">Browse tanks to compare</a>
                        </td>
                    </tr>
                </tbody>
            `;
            return;
        }

        // Get all tank details
        const tanks = await Promise.all(comparisonData.map(id => fetchTankDetails(id)));
        const validTanks = tanks.filter(tank => tank !== null && tank.stats && Object.keys(tank.stats).length > 0);

        if (validTanks.length === 0) {
            comparisonTable.innerHTML = `
                <tbody>
                    <tr>
                        <td colspan="100" class="comparison-empty py-10">
                            Failed to load tank data. Please try again later.
                        </td>
                    </tr>
                </tbody>
            `;
            return;
        }

        const statMapping = getStatMapping();

        // Generate table HTML
        let tableHTML = `
            <thead>
                <tr>
                    <th colspan="${validTanks.length + 1}">
                        <div class="comparison-legend">
                            <div class="comparison-legend-item">
                                <div class="comparison-legend-color" style="background-color: rgba(76, 175, 80, 0.3)"></div>
                                <span>Best</span>
                            </div>
                            <div class="comparison-legend-item">
                                <div class="comparison-legend-color" style="background-color: rgba(76, 175, 80, 0.25)"></div>
                            </div>
                            <div class="comparison-legend-item">
                                <div class="comparison-legend-color" style="background-color: rgba(76, 175, 80, 0.2)"></div>
                            </div>
                            <div class="comparison-legend-item">
                                <div class="comparison-legend-color" style="background-color: rgba(255, 235, 59, 0.2)"></div>
                                <span>Middle</span>
                            </div>
                            <div class="comparison-legend-item">
                                <div class="comparison-legend-color" style="background-color: rgba(244, 67, 54, 0.2)"></div>
                            </div>
                            <div class="comparison-legend-item">
                                <div class="comparison-legend-color" style="background-color: rgba(244, 67, 54, 0.25)"></div>
                            </div>
                            <div class="comparison-legend-item">
                                <div class="comparison-legend-color" style="background-color: rgba(244, 67, 54, 0.3)"></div>
                                <span>Worst</span>
                            </div>
                        </div>
                    </th>
                </tr>
                <tr>
                    <th>Stat</th>
        `;

        // Add tank headers
        validTanks.forEach(tank => {
            tableHTML += `
                <th>
                    <div class="tank-header">
                        <img src="${tank.image}" alt="${tank.name}" onerror="this.src='https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/placeholder/imagefailedtoload.webp'">
                        <div class="tank-name">${tank.name}</div>
                        <div class="tank-meta">
                            <span><i class="fas fa-flag"></i> ${tank.nation}</span>
                            <span><i class="fas fa-layer-group"></i> ${tank.type}</span>
                        </div>
                        <button class="remove-tank" data-tank-id="${tank.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </th>
            `;
        });
        tableHTML += '</tr></thead><tbody>';

        // Define stat categories and the stats that should be "lower is better"
        const lowerIsBetter = new Set([
            'RELOAD TIME', 'TIME BETWEEN SHOTS', 'SHELL LOADING TIME BETWEEN SHOTS',
            'TRACK REPAIR TIME', 'RECOVERY TIME', 'AIMING SPEED', 'RETICLE SIZE MOVING',
            'RETICLE SIZE STATIONARY', 'ACCURACY AFTER SHOT', 'ACCURACY MAX',
            'DAMAGE REDUCTION BEYOND OPTIMAL', 'FALLOFF DISTANCE', 'ENERGY REGENERATION',
            'MAIN ABILITY COOLDOWN', 'SECOND ABILITY COOLDOWN', 'MAIN ABILITY ENERGY COST',
            'SECOND ABILITY ENERGY COST', 'RADAR UPDATE INTERVAL'
        ]);

        // Add stats rows for each category
        const statCategories = ['FIREPOWER', 'MOBILITY', 'SURVIVABILITY', 'RECON', 'UTILITY'];

        for (const category of statCategories) {
            // Check if any tank has this category
            const hasCategory = validTanks.some(tank => tank.stats[category]);
            if (!hasCategory) continue;

            tableHTML += `<tr class="stat-category"><td colspan="${validTanks.length + 1}">${category}</td></tr>`;

            // Get all unique stat keys from all tanks in this category
            const allStatKeys = new Set();
            validTanks.forEach(tank => {
                if (tank.stats[category]) {
                    Object.keys(tank.stats[category]).forEach(key => allStatKeys.add(key));
                }
            });

            // Sort stat keys
            const sortedStatKeys = Array.from(allStatKeys).sort();

            for (const statKey of sortedStatKeys) {
                // Get values for all tanks
                const values = validTanks.map(tank => {
                    const rawValue = tank.stats[category]?.[statKey];
                    if (!isValidStatValue(rawValue)) return null;
                    return parseNumericValue(rawValue);
                });

                // Skip if all values are null
                const validValues = values.filter(v => v !== null);
                if (validValues.length === 0) continue;

                // Get display name for stat
                const displayName = statMapping[statKey] || formatStatName(statKey);

                // Determine if we should show units
                const shouldShowUnits = statKey.includes('TIME') || statKey.includes('RELOAD') ||
                                       statKey.includes('SPEED') || statKey.includes('RANGE') ||
                                       statKey.includes('RADIUS') || statKey.includes('HP');

                // Calculate best and worst based on stat type
                let maxValue = Math.max(...validValues);
                let minValue = Math.min(...validValues);
                const isLowerBetter = lowerIsBetter.has(statKey);

                let valueRange = maxValue - minValue;

                // Handle case where all values are the same
                if (valueRange === 0) valueRange = 1;

                tableHTML += `<tr><td>${displayName}</td>`;

                values.forEach((value, i) => {
                    let cellClass = '';
                    let displayValue = value;

                    if (value !== null) {
                        let stepIndex;
                        if (isLowerBetter) {
                            // For lower is better stats, lowest value gets best score
                            stepIndex = Math.floor((value - minValue) / (valueRange / 6));
                            cellClass = `stat-${6 - Math.min(5, stepIndex)}`;
                        } else {
                            // For higher is better stats, highest value gets best score
                            stepIndex = Math.floor((maxValue - value) / (valueRange / 6));
                            cellClass = `stat-${Math.min(6, stepIndex)}`;
                        }

                        // Ensure cellClass is between 1-7
                        const classNum = parseInt(cellClass.split('-')[1]);
                        if (isNaN(classNum)) {
                            cellClass = 'stat-4';
                        } else if (classNum < 1) {
                            cellClass = 'stat-1';
                        } else if (classNum > 7) {
                            cellClass = 'stat-7';
                        }

                        // Format value with units
                        if (shouldShowUnits) {
                            if (statKey.includes('TIME') || statKey.includes('RELOAD') || statKey.includes('COOLDOWN')) {
                                displayValue = `${value}s`;
                            } else if (statKey.includes('SPEED') && !statKey.includes('AIMING')) {
                                displayValue = `${value} km/h`;
                            } else if (statKey.includes('RANGE') || statKey.includes('RADIUS')) {
                                displayValue = `${value}m`;
                            } else if (statKey.includes('HP') || statKey.includes('HIT POINTS') || statKey.includes('DAMAGE')) {
                                displayValue = Math.round(value);
                            }
                        } else if (typeof value === 'number' && !Number.isInteger(value)) {
                            displayValue = value.toFixed(2);
                        }
                    } else {
                        displayValue = '-';
                        cellClass = '';
                    }

                    tableHTML += `<td class="${cellClass}">${displayValue}</td>`;
                });
                tableHTML += '</tr>';
            }
        }

        tableHTML += '</tbody>';
        comparisonTable.innerHTML = tableHTML;

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-tank').forEach(button => {
            button.addEventListener('click', function() {
                const tankId = this.getAttribute('data-tank-id');
                removeTankFromComparison(tankId);
            });
        });
    }

    // Format stat names for display
    function formatStatName(stat) {
        // Convert from ALL CAPS to Title Case
        return stat.toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Remove tank from comparison
    function removeTankFromComparison(tankId) {
        comparisonData = comparisonData.filter(id => id != tankId);
        delete tankDetails[tankId];
        saveComparison();
        renderComparisonTable();
    }

    // Clear all comparison
    function clearAllComparison() {
        comparisonData = [];
        tankDetails = {};
        saveComparison();
        renderComparisonTable();
    }

    // Initialize
    loadComparison();

    // Event listener for clear all button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllComparison);
    }
});