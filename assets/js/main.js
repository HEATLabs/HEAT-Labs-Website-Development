const FOOTER_CONFIG = {
    showGameVersion: true,
    showGameBuild: true,
    showWebsiteVersion: true,
    showWebsiteBuild: true,
    showChangelogLink: true
};

// Main JS for HEAT Labs
document.addEventListener('DOMContentLoaded', function() {
    // Check maintenance mode first
    fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/maintenance.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch maintenance data');
            }
            return response.json();
        })
        .then(data => {
            if (data.maintenance) {
                // Redirect to maintenance page
                if (window.location.hostname === 'localhost' || window.location.hostname === 'status' || window.location.hostname === 'changelog' || window.location.hostname === 'statistics') {
                    return;
                }
                window.location.href = 'https://dev.heatlabs.net/maintenance';
                return;
            }

            // Continue with normal execution if not in maintenance mode
            initNormalFunctions();
        })
        .catch(error => {
            console.error('Error checking maintenance status:', error);
            // Continue with normal execution if maintenance check fails
            initNormalFunctions();
        });

    function initNormalFunctions() {
        // Navbar scroll effect
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 10) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }

        // Initialize interactive elements
        initializeInteractiveElements();

        // Fetch website version data from GitHub
        fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/changelog.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch changelog data');
                }
                return response.json();
            })
            .then(data => {
                // Get website version data
                let websiteVersionData = null;
                if (data.updates && data.updates.length > 0) {
                    websiteVersionData = data.updates[0];
                }

                // Fetch game version data
                fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/game_builds.json')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to fetch game data');
                        }
                        return response.json();
                    })
                    .then(buildsData => {
                        // Process game version data
                        const gameVersionData = getLatestGameVersion(buildsData);

                        // Add website and game version info to footer
                        addVersionToFooter(websiteVersionData, gameVersionData, false, false);

                        // Add beta tag with website version
                        if (websiteVersionData) {
                            addVersionToBetaTag(websiteVersionData, false);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching game version information:', error);

                        // Use fallback for game data
                        const fallbackGameData = {
                            gameVersion: '0.0.0.0',
                            gameBuildDate: new Date().toISOString()
                        };

                        // Add versions with fallback game data
                        addVersionToFooter(websiteVersionData, fallbackGameData, true, false);

                        if (websiteVersionData) {
                            addVersionToBetaTag(websiteVersionData, false);
                        }
                    });
            })
            .catch(error => {
                console.error('Error fetching website version information:', error);

                // Fallback for both website and game
                const fallbackWebsiteData = {
                    version: '1.0.0',
                    date: new Date().toISOString().split('T')[0]
                };

                const fallbackGameData = {
                    gameVersion: '0.0.0.0',
                    gameBuildDate: new Date().toISOString()
                };

                addVersionToFooter(fallbackWebsiteData, fallbackGameData, true, true);
                addVersionToBetaTag(fallbackWebsiteData, true);
            });
    }
});

function getLatestGameVersion(buildsData) {
    try {
        // Extract builds from the data structure
        const builds = buildsData.builds;
        let highestVersion = null;
        let highestVersionObj = null;
        let lastUpdated = buildsData.last_updated || new Date().toISOString();

        // Helper function to compare version strings (handles different formats)
        function compareVersions(v1, v2) {
            if (!v1 || !v2) return 0;

            // Normalize version strings: remove leading 'v' and split by dots
            const parts1 = v1.replace(/^v/, '').split('.');
            const parts2 = v2.replace(/^v/, '').split('.');

            const maxLen = Math.max(parts1.length, parts2.length);

            for (let i = 0; i < maxLen; i++) {
                const num1 = parseInt(parts1[i] || '0', 10);
                const num2 = parseInt(parts2[i] || '0', 10);

                if (num1 > num2) return 1;
                if (num1 < num2) return -1;
            }

            return 0;
        }

        // Iterate through all game builds to find the highest version
        for (const gameName in builds) {
            const gameBuilds = builds[gameName];

            for (const buildHash in gameBuilds) {
                const build = gameBuilds[buildHash];
                let versionName = build.build_info.version_name;

                // If version_name is empty or just whitespace, try to get from patches
                if (!versionName || versionName.trim() === '') {
                    if (build.patches && build.patches.length > 0) {
                        for (const patch of build.patches) {
                            if (patch.version_to && patch.version_to.trim() !== '') {
                                versionName = patch.version_to;
                                break;
                            }
                        }
                    }
                }

                // If version_name is still empty, use the hash as identifier
                if (!versionName || versionName.trim() === '') {
                    versionName = '0.0.0.0';
                }

                // Compare and keep the highest version
                if (!highestVersion || compareVersions(versionName, highestVersion) > 0) {
                    highestVersion = versionName;
                    highestVersionObj = build;
                }
            }
        }

        if (highestVersionObj) {
            return {
                gameVersion: highestVersion || '0.0.0.0',
                gameBuildDate: lastUpdated // Use last_updated from the JSON
            };
        }
    } catch (error) {
        console.error('Error parsing game version data:', error);
    }

    // Return fallback if no valid data found
    return {
        gameVersion: '0.0.0.0',
        gameBuildDate: new Date().toISOString()
    };
}

function initializeInteractiveElements() {
    // Add animation to feature cards and tank cards when they come into view
    const featureCards = document.querySelectorAll('.feature-card');
    const tankCards = document.querySelectorAll('.tank-card');

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

        featureCards.forEach(card => {
            observer.observe(card);
        });

        tankCards.forEach(card => {
            observer.observe(card);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        featureCards.forEach(card => {
            card.classList.add('animated');
        });
        tankCards.forEach(card => {
            card.classList.add('animated');
        });
    }
}

function addVersionToBetaTag(update, isFallback = false) {
    // Find the beta tag element in the header
    const betaTag = document.querySelector('.beta-tag');

    if (!betaTag) {
        console.warn('Could not find beta tag element');
        return;
    }

    // Set the version text and tooltip
    betaTag.textContent = `v${update.version}`;
    betaTag.title = `Version ${update.version} | Last Updated: ${isFallback ? formatDate(new Date().toISOString().split('T')[0]) : formatDate(update.date)}`;

    // Add class for styling if needed
    betaTag.classList.add('version-tag');
}

function addVersionToFooter(websiteUpdate, gameUpdate, isFallback = false, isWebsiteFallback = false) {
    // Find the footer disclaimer div (the one that contains the copyright info)
    const disclaimerDiv = document.querySelector('.footer .text-center.text-sm.text-gray-500');

    if (!disclaimerDiv) {
        console.warn('Could not find footer disclaimer div');
        return;
    }

    // Create a container for the version info
    const versionContainer = document.createElement('div');
    versionContainer.className = 'version-info-container';

    // Format dates
    let websiteBuildFormatted;
    if (isWebsiteFallback) {
        // Use current date for fallback
        websiteBuildFormatted = formatDate(new Date().toISOString().split('T')[0]);
    } else if (websiteUpdate && websiteUpdate.date) {
        // Add 1 day to the changelog date
        const websiteDate = new Date(websiteUpdate.date);
        websiteDate.setDate(websiteDate.getDate() + 1);
        websiteBuildFormatted = formatDate(websiteDate.toISOString());
    } else {
        // No website data available
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        websiteBuildFormatted = formatDate(currentDate.toISOString());
    }

    // Format current date for fallback scenarios
    const currentDate = formatDate(new Date().toISOString().split('T')[0]);

    // Format game build date using last_updated
    let gameBuildFormatted = 'Unknown';
    if (gameUpdate && gameUpdate.gameBuildDate) {
        try {
            // Use last_updated directly - it's already in ISO format
            gameBuildFormatted = formatDate(gameUpdate.gameBuildDate);
        } catch (error) {
            console.error('Error parsing game build date:', error);
            gameBuildFormatted = formatDate(new Date().toISOString());
        }
    } else {
        gameBuildFormatted = formatDate(new Date().toISOString());
    }

    // Track if we've added any items to know if we should show the container
    let hasVisibleItems = false;

    // Helper to create a version info element with conditional visibility
    function createVersionItem(show, html, className = '') {
        if (!show) return null;
        hasVisibleItems = true;
        const div = document.createElement('div');
        div.className = `version-info-item ${className}`.trim();
        div.innerHTML = html;
        return div;
    }

    // Create each version item based on config
    const gameVersionInfo = createVersionItem(
        FOOTER_CONFIG.showGameVersion,
        `
            <span class="version-label">Game Version:</span>
            <span class="version-value">v${gameUpdate ? gameUpdate.gameVersion : '0.0.0.0'}</span>
        `
    );

    const gameBuildInfo = createVersionItem(
        FOOTER_CONFIG.showGameBuild,
        `
            <span class="version-label">Game Build:</span>
            <span class="version-value">${gameBuildFormatted}</span>
        `
    );

    const websiteVersionInfo = createVersionItem(
        FOOTER_CONFIG.showWebsiteVersion,
        `
            <span class="version-label">Website Version:</span>
            <span class="version-value">v${websiteUpdate ? websiteUpdate.version : '1.0.0'}</span>
        `
    );

    const websiteBuildInfo = createVersionItem(
        FOOTER_CONFIG.showWebsiteBuild,
        `
            <span class="version-label">Website Build:</span>
            <span class="version-value">${isFallback ? currentDate : websiteBuildFormatted}</span>
        `
    );

    let changelogLink = null;
    if (FOOTER_CONFIG.showChangelogLink) {
        hasVisibleItems = true;
        changelogLink = document.createElement('a');
        changelogLink.className = 'version-info-item version-info-link';
        changelogLink.href = '//changelog.heatlabs.net';
        changelogLink.innerHTML = `
            <span>View Changelog</span>
            <i class="fas fa-external-link-alt"></i>
        `;
        changelogLink.title = 'View full changelog';
        changelogLink.target = '_blank';
        changelogLink.rel = 'noopener noreferrer';
    }

    // Only proceed if we have items to show
    if (!hasVisibleItems) {
        console.log('All footer version items are disabled in config');
        return;
    }

    // Append all non-null elements to container
    if (gameVersionInfo) versionContainer.appendChild(gameVersionInfo);
    if (gameBuildInfo) versionContainer.appendChild(gameBuildInfo);
    if (websiteVersionInfo) versionContainer.appendChild(websiteVersionInfo);
    if (websiteBuildInfo) versionContainer.appendChild(websiteBuildInfo);
    if (changelogLink) versionContainer.appendChild(changelogLink);

    // Insert after disclaimer
    disclaimerDiv.parentNode.insertBefore(versionContainer, disclaimerDiv.nextSibling);
}

function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    try {
        return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
        console.error('Error formatting date:', error, dateString);
        return 'Invalid Date';
    }
}