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
            "MAIN SHELL TYPE": "Main Shell Type",
            "SECONDARY SHELL DAMAGE": "Secondary Damage",
            "SECONDARY SHELL PENETRATION": "Secondary Penetration",
            "SECONDARY SHELL VELOCITY": "Secondary Velocity",
            "SECONDARY SHELL EXPLOSION RADIUS": "Secondary Explosion Radius",
            "SECONDARY SHELL TYPE": "Secondary Shell Type",
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
            "ACCURACY DURING TURRET TRAVERSE": "Turret Traverse Accuracy",
            "OPTIMAL RANGE": "Optimal Range",
            "DAMAGE REDUCTION BEYOND OPTIMAL": "Damage Reduction Beyond Optimal",
            "FALLOFF DISTANCE": "Falloff Distance",
            "INTERNAL MODULE HIT": "Internal Module Hit Chance",
            "AMMO CRIT MODIFIER": "Ammo Rack Crit Modifier",
            "ENGINE CRIT MODIFIER": "Engine Crit Modifier",
            "FUEL CRIT MODIFIER": "Fuel Tank Crit Modifier",
            "RAMMING DAMAGE MULTIPLIER": "Ramming Damage Bonus",

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
            "RAMMING DAMAGE RESISTANCE FRONT": "Ramming Damage Resistance",
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

    // Check if a value should be considered for comparison
    function isValidStatValue(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === "" || trimmed === "N/A" || trimmed === "0" || trimmed === "0.0") return false;
            // Check if it's a number string that equals 0
            const num = parseFloat(trimmed);
            if (!isNaN(num) && num === 0) return false;
            // If it's a string with content, show it
            return true;
        }
        if (typeof value === 'number' && value === 0) return false;
        return true;
    }

    // Parse value to number if possible
    function parseNumericValue(value) {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const trimmed = value.trim();
            const num = parseFloat(trimmed);
            return isNaN(num) ? null : num;
        }
        return null;
    }

    // Format stat name for display
    function formatStatName(stat) {
        // If it has underscores, replace with spaces
        let formatted = stat.replace(/_/g, ' ');
        // Convert from ALL CAPS to Title Case
        return formatted.toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Get the appropriate unit for a stat
    function getStatUnit(statKey) {
        // Speed stats (km/h)
        if (statKey === 'FORWARD SPEED' || statKey === 'REVERSE SPEED') {
            return 'km/h';
        }
        // Traverse stats (degrees per second)
        if (statKey === 'HULL TRAVERSE' || statKey === 'TURRET TRAVERSE SPEED') {
            return '°/s';
        }
        // Time stats (seconds)
        if (statKey.includes('TIME') || statKey.includes('RELOAD') ||
            statKey.includes('COOLDOWN') || statKey.includes('DURATION') ||
            statKey.includes('INTERVAL')) {
            return 's';
        }
        // Range stats (meters)
        if (statKey.includes('RANGE') || statKey.includes('RADIUS') ||
            statKey.includes('DISTANCE') || statKey.includes('FALLOFF')) {
            return 'm';
        }
        // Speed/velocity stats (m/s)
        if (statKey.includes('VELOCITY')) {
            return 'm/s';
        }
        // Damage and HP stats
        if (statKey.includes('DAMAGE') || statKey.includes('HP') ||
            statKey.includes('HIT POINTS') || statKey.includes('PENETRATION')) {
            return '';
        }
        // Armor stats
        if (statKey.includes('ARMOR') || statKey.includes('ARMOUR')) {
            return 'mm';
        }
        return '';
    }

    // Format value with appropriate unit
    function formatValueWithUnit(value, statKey) {
        const unit = getStatUnit(statKey);
        let formattedValue = value;

        // Round appropriately
        if (typeof value === 'number') {
            if (statKey.includes('TIME') || statKey.includes('RELOAD') ||
                statKey.includes('COOLDOWN') || statKey.includes('DURATION') ||
                statKey.includes('INTERVAL')) {
                formattedValue = value.toFixed(2);
            } else if (statKey.includes('DAMAGE') || statKey.includes('HP') ||
                       statKey.includes('HIT POINTS') || statKey.includes('PENETRATION') ||
                       statKey.includes('ARMOR') || statKey.includes('ARMOUR') ||
                       statKey.includes('RANGE') || statKey.includes('RADIUS') ||
                       statKey.includes('DISTANCE') || statKey.includes('FALLOFF')) {
                formattedValue = Math.round(value);
            } else if (!Number.isInteger(value)) {
                formattedValue = value.toFixed(2);
            }
        }

        return unit ? `${formattedValue}${unit}` : formattedValue;
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
            'AIMING SPEED',
            'RELOAD TIME',
            'TIME BETWEEN SHOTS',
            'SHELL LOADING TIME BETWEEN SHOTS',
            'RETICLE SIZE MOVING',
            'RETICLE SIZE STATIONARY',
            'ACCURACY AFTER SHOT',
            'ACCURACY MAX',
            'ACCURACY DURING TURRET TRAVERSE',
            'DAMAGE REDUCTION BEYOND OPTIMAL',
            'FALLOFF DISTANCE',
            'VEHICLE LATERAL FRICTION',
            'SHOT NOISE VALUE',
            'MOVING NOISE INTEL',
            'TRACK REPAIR TIME',
            'RECOVERY TIME',
            'RADAR UPDATE INTERVAL',
            'ENERGY REGENERATION',
            'MAIN ABILITY COOLDOWN',
            'SECOND ABILITY COOLDOWN',
            'MAIN ABILITY ENERGY COST',
            'SECOND ABILITY ENERGY COST'
        ]);

        // Get all categories from all tanks
        const allCategories = new Set();
        validTanks.forEach(tank => {
            if (tank.stats) {
                Object.keys(tank.stats).forEach(category => allCategories.add(category));
            }
        });

        // Sort categories with preferred order
        const categoryOrder = ['FIREPOWER', 'MOBILITY', 'SURVIVABILITY', 'RECON', 'UTILITY'];
        const sortedCategories = Array.from(allCategories).sort((a, b) => {
            const indexA = categoryOrder.indexOf(a);
            const indexB = categoryOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        for (const category of sortedCategories) {
            // Check if any tank has this category with valid data
            const hasData = validTanks.some(tank => {
                const catData = tank.stats[category];
                if (!catData) return false;
                return Object.keys(catData).some(key => isValidStatValue(catData[key]));
            });
            if (!hasData) continue;

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

                // Skip if all values are null (no numeric data to compare)
                const validValues = values.filter(v => v !== null);
                if (validValues.length === 0) continue;

                // Get display name for stat
                const displayName = statMapping[statKey] || formatStatName(statKey);
                const unit = getStatUnit(statKey);
                const displayNameWithUnit = unit ? `${displayName} (${unit})` : displayName;

                // Calculate best and worst based on stat type
                let maxValue = Math.max(...validValues);
                let minValue = Math.min(...validValues);
                const isLowerBetter = lowerIsBetter.has(statKey);

                let valueRange = maxValue - minValue;

                // Handle case where all values are the same
                if (valueRange === 0) valueRange = 1;

                tableHTML += `<tr><td>${displayNameWithUnit}</td>`;

                values.forEach((value, i) => {
                    let cellClass = '';
                    let displayValue = value;

                    if (value !== null) {
                        let stepIndex;
                        if (isLowerBetter) {
                            // For lower is better stats, lowest value = best (green)
                            // Calculate position from 0 (best) to 6 (worst)
                            stepIndex = Math.round(((value - minValue) / valueRange) * 6);
                            // Clamp stepIndex to 0-6
                            stepIndex = Math.max(0, Math.min(6, stepIndex));
                            // Map: 0->stat-1 (best/green), 6->stat-7 (worst/red)
                            cellClass = `stat-${stepIndex + 1}`;
                        } else {
                            // For higher is better stats, highest value = best (green)
                            // Calculate position from 0 (best) to 6 (worst)
                            stepIndex = Math.round(((maxValue - value) / valueRange) * 6);
                            // Clamp stepIndex to 0-6
                            stepIndex = Math.max(0, Math.min(6, stepIndex));
                            // Map: 0->stat-1 (best/green), 6->stat-7 (worst/red)
                            cellClass = `stat-${stepIndex + 1}`;
                        }

                        // Format value with proper unit
                        displayValue = formatValueWithUnit(value, statKey);
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