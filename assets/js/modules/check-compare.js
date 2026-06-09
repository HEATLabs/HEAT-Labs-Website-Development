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

            // Find the stats using tank slug or ID
            let tankStats = stockData[tankInfo.slug] || stockData[tankInfo.id] || Object.values(stockData)[0];

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
            "TURRET TRAVERSE SPEED": "Turret Traverse Speed, Degrees/Second",
            "GUN DEPRESSION, FRONT": "Gun Depression (Front)",
            "GUN DEPRESSION, SIDE": "Gun Depression (Side)",
            "GUN DEPRESSION, REAR": "Gun Depression (Rear)",
            "GUN ELEVATION, FRONT": "Gun Elevation (Front)",
            "GUN ELEVATION, SIDE": "Gun Elevation (Side)",
            "GUN ELEVATION, REAR": "Gun Elevation (Rear)",

            // Survivability stats
            "HIT POINTS": "Hit Points",
            "TRACK REPAIR TIME": "Track Repair Time, Seconds",
            "TRACK HP": "Track Hit Points",
            "ENGINE HP": "Engine Hit Points",
            "RECOVERY TIME": "Crew Recovery Time, Seconds",
            "AMMO CRIT MODIFIER": "Incoming Crit Damage, Ammo Rack",
            "ENGINE CRIT MODIFIER": "Incoming Crit Damage, Engine",
            "FUEL CRIT MODIFIER": "Incoming Crit Damage, Fuel Tank",
            "RAMMING DAMAGE RESISTANCE FRONT": "Ramming Damage Resistance, Front",
            "RAMMING DAMAGE MULTIPLIER": "Ramming Damage Bonus",
            "SPACED ARMOR HP": "Spaced Armor HP",
            "FIRE RESISTANCE": "Fire Resistance",
            "RADIATION RESISTANCE": "Radiation Resistance",
            "SHOCK RESISTANCE": "Shock Resistance",
            "SLOW RESISTANCE": "Slow Resistance",

            // Mobility stats
            "FORWARD SPEED": "Forward Speed, km/h",
            "REVERSE SPEED": "Reverse Speed, km/h",
            "HULL TRAVERSE": "Traverse Speed",
            "ENGINE POWER": "Engine Power",
            "HANDBRAKE FORCE": "Handbrake Force",
            "VEHICLE LATERAL FRICTION": "Vehicle Lateral Friction",
            "BOOST MODE ENERGY COST": "Sprint Energy Cost",
            "BOOST MODE ENERGY VOLUME": "Sprint Energy Volume",
            "BOOST MODE ACCELERATION": "Base Acceleration",
            "BOOST MODE REGENERATION RATE": "Sprint Regen Rate",

            // Recon stats
            "SPOTTING RANGE": "Spotting Range, Meters",
            "BATTLE COMMUINICATION RANGE": "Signal Range, Meters",
            "ENEMY VISIBILITY SHARE DURATION": "Spotting Duration, Seconds",
            "VEHICLE CAMOUFLAGE": "Vehicle Camouflage",
            "VEHICLE OPTICS": "Vehicle Optics",

            // Utility stats
            "MAX ENERGY": "Energy Points",
            "ENERGY REGENERATION": "Energy Regeneration"
        };
    }

    // Render the comparison table
    async function renderComparisonTable() {
        if (comparisonData.length === 0) {
            comparisonTable.innerHTML = `
                <tr>
                    <td colspan="100" class="comparison-empty py-10">
                        No tanks selected for comparison.<br>
                        <a href="tanks">Browse tanks to compare</a>
                    </td>
                </tr>
            `;
            return;
        }

        // Get all tank details
        const tanks = await Promise.all(comparisonData.map(id => fetchTankDetails(id)));
        const validTanks = tanks.filter(tank => tank !== null);

        if (validTanks.length === 0) {
            comparisonTable.innerHTML = `
                <tr>
                    <td colspan="100" class="comparison-empty py-10">
                        Failed to load tank data. Please try again later.
                    </td>
                </tr>
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

        // Add stats rows for each category
        const statCategories = ['FIREPOWER', 'MOBILITY', 'SURVIVABILITY', 'RECON', 'UTILITY'];

        for (const category of statCategories) {
            // Check if all tanks have this category
            if (!validTanks[0].stats[category]) continue;

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
                // Skip stats that are all zero
                const values = validTanks.map(tank => {
                    const rawValue = tank.stats[category]?.[statKey];
                    if (rawValue === undefined) return null;
                    const num = parseFloat(rawValue);
                    return isNaN(num) ? rawValue : num;
                });

                // Skip if all values are null/undefined or all zero
                const validValues = values.filter(v => v !== null && v !== 0);
                if (validValues.length === 0) continue;

                // Determine if stat is numeric
                const isNumeric = validValues.every(v => typeof v === 'number');

                // Get display name for stat
                const displayName = statMapping[statKey] || formatStatName(statKey);

                if (isNumeric) {
                    // Check if this is a depression/elevation stat
                    const isDepression = statKey.includes('DEPRESSION');
                    const isElevation = statKey.includes('ELEVATION') && !statKey.includes('DEGREES/SECOND');

                    let numericValues = values.filter(v => typeof v === 'number');
                    let maxValue, minValue;

                    if (isDepression) {
                        // For depression, lower (more negative) is better
                        maxValue = Math.min(...numericValues);
                        minValue = Math.max(...numericValues);
                    } else if (isElevation) {
                        // For elevation, higher (more positive) is better
                        maxValue = Math.max(...numericValues);
                        minValue = Math.min(...numericValues);
                    } else {
                        // For all other stats, higher is better
                        maxValue = Math.max(...numericValues);
                        minValue = Math.min(...numericValues);
                    }

                    const valueRange = maxValue - minValue;

                    tableHTML += `<tr><td>${displayName}</td>`;

                    values.forEach((value, i) => {
                        let cellClass = '';
                        let displayValue = value;

                        if (typeof value === 'number' && valueRange > 0) {
                            let stepIndex;
                            if (isDepression) {
                                stepIndex = Math.floor((maxValue - value) / (valueRange / 6));
                                cellClass = `stat-${Math.min(6, stepIndex) + 1}`;
                            } else if (isElevation) {
                                stepIndex = Math.floor((value - minValue) / (valueRange / 6));
                                cellClass = `stat-${7 - Math.min(6, stepIndex)}`;
                            } else {
                                stepIndex = Math.floor((value - minValue) / (valueRange / 6));
                                cellClass = `stat-${7 - Math.min(6, stepIndex)}`;
                            }

                            // Add degree symbol for angle stats
                            if (statKey.includes('DEPRESSION') || statKey.includes('ELEVATION')) {
                                displayValue = value >= 0 ? `+${value}` : value.toString();
                            }
                        } else if (valueRange === 0 && typeof value === 'number') {
                            cellClass = 'stat-4';
                        }

                        let formattedValue = displayValue;
                        if (typeof displayValue === 'number') {
                            if (statKey.includes('DAMAGE') || statKey.includes('HIT POINTS') || statKey.includes('HP')) {
                                formattedValue = Math.round(displayValue);
                            } else if (statKey.includes('TIME') || statKey.includes('RELOAD')) {
                                formattedValue = `${displayValue}s`;
                            } else if (statKey.includes('SPEED') && !statKey.includes('AIMING')) {
                                formattedValue = `${displayValue} km/h`;
                            } else if (statKey.includes('RANGE') || statKey.includes('RADIUS')) {
                                formattedValue = `${displayValue}m`;
                            }
                        }

                        tableHTML += `<td class="${cellClass}">${formattedValue !== null ? formattedValue : '-'}</td>`;
                    });
                } else {
                    // Non-numeric values
                    tableHTML += `<tr><td>${displayName}</td>`;
                    values.forEach(value => {
                        tableHTML += `<td>${value !== null ? value : '-'}</td>`;
                    });
                }
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