// Corner Decorations
(function() {
    'use strict';

    // Toggle Halloween Effects
    const DECORATIONS_ENABLED = false;

    // Configuration
    const config = {
        // Available decorations images
        images: {
            decoration1: 'https://cdn5.heatlabs.net/miscellaneous/corner-decorations-1.png',
            decoration2: 'https://cdn5.heatlabs.net/miscellaneous/corner-decorations-2.png',
            decoration3: 'https://cdn5.heatlabs.net/miscellaneous/corner-decorations-3.png',
            decoration4: 'https://cdn5.heatlabs.net/miscellaneous/corner-decorations-4.png'
        },
        // Assign which image goes to which corner
        cornerImages: {
            'top-left': 'decoration3',
            'top-right': 'decoration4',
            'bottom-left': 'decoration2',
            'bottom-right': 'decoration1'
        },
        // Flip settings for each corner
        flips: {
            'top-left': {
                horizontal: false,
                vertical: false
            },
            'top-right': {
                horizontal: true,
                vertical: false
            },
            'bottom-left': {
                horizontal: true,
                vertical: true
            },
            'bottom-right': {
                horizontal: true,
                vertical: true
            }
        },
        // Size for each corner
        sizes: {
            'top-left': 200,
            'top-right': 300,
            'bottom-left': 200,
            'bottom-right': 200
        },
        // Opacity for each corner
        opacities: {
            'top-left': 0.6,
            'top-right': 0.4,
            'bottom-left': 0.6,
            'bottom-right': 0.4
        },
        // Position offsets for each corner
        offsets: {
            'top-left': {
                top: 0,
                left: 0
            },
            'top-right': {
                top: 0,
                right: 0
            },
            'bottom-left': {
                bottom: -10,
                left: 0
            },
            'bottom-right': {
                bottom: 0,
                right: 0
            }
        }
    };

    let decorationElements = [];

    // Check if seasonal content is enabled in settings
    function isSeasonalContentEnabled() {
        // First check master toggle, if false, completely disable regardless of settings
        if (!DECORATIONS_ENABLED) {
            return false;
        }

        // Then check user preference from localStorage
        const seasonalContent = localStorage.getItem('seasonalContent');
        return seasonalContent !== 'false'; // Default to true if not set
    }

    // Create decoration element
    function createDecoration(corner) {
        const decoration = document.createElement('div');
        decoration.className = `decoration-decoration decoration-${corner}`;

        // Get size for this corner
        const size = config.sizes[corner];
        const opacity = config.opacities[corner];

        // Base styles for all decorations
        Object.assign(decoration.style, {
            position: 'fixed',
            width: `${size}px`,
            height: `${size}px`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            opacity: opacity,
            pointerEvents: 'none',
            zIndex: '9999',
            transition: 'opacity 0.3s ease'
        });

        // Position based on corner
        const offset = config.offsets[corner];
        const imageKey = config.cornerImages[corner];
        const imageUrl = config.images[imageKey];
        const flip = config.flips[corner];

        // Build transform string for flips
        const transforms = [];
        if (flip.horizontal) transforms.push('scaleX(-1)');
        if (flip.vertical) transforms.push('scaleY(-1)');
        const transformStr = transforms.length > 0 ? transforms.join(' ') : 'none';

        switch (corner) {
            case 'top-left':
                decoration.style.top = `${offset.top}px`;
                decoration.style.left = `${offset.left}px`;
                decoration.style.backgroundImage = `url('${imageUrl}')`;
                decoration.style.backgroundPosition = 'top left';
                decoration.style.transform = transformStr;
                break;
            case 'top-right':
                decoration.style.top = `${offset.top}px`;
                decoration.style.right = `${offset.right}px`;
                decoration.style.backgroundImage = `url('${imageUrl}')`;
                decoration.style.backgroundPosition = 'top right';
                decoration.style.transform = transformStr;
                break;
            case 'bottom-left':
                decoration.style.bottom = `${offset.bottom}px`;
                decoration.style.left = `${offset.left}px`;
                decoration.style.backgroundImage = `url('${imageUrl}')`;
                decoration.style.backgroundPosition = 'bottom left';
                decoration.style.transform = transformStr;
                break;
            case 'bottom-right':
                decoration.style.bottom = `${offset.bottom}px`;
                decoration.style.right = `${offset.right}px`;
                decoration.style.backgroundImage = `url('${imageUrl}')`;
                decoration.style.backgroundPosition = 'bottom right';
                decoration.style.transform = transformStr;
                break;
        }

        return decoration;
    }

    // Add all decorations to the page
    function addDecorations() {
        // Clear any existing decorations first
        removeDecorations();

        if (!isSeasonalContentEnabled()) {
            return;
        }

        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

        corners.forEach(corner => {
            const decoration = createDecoration(corner);
            document.body.appendChild(decoration);
            decorationElements.push(decoration);
        });
    }

    // Remove all decorations from the page
    function removeDecorations() {
        decorationElements.forEach(decoration => {
            if (decoration && decoration.parentNode) {
                decoration.parentNode.removeChild(decoration);
            }
        });
        decorationElements = [];

        // Also remove any decorations that might have been added by previous versions
        const existingDecorations = document.querySelectorAll('[class*="decoration"]');
        existingDecorations.forEach(decoration => {
            if (decoration.parentNode) {
                decoration.parentNode.removeChild(decoration);
            }
        });
    }

    // Update decorations based on current settings
    function updateDecorations() {
        if (isSeasonalContentEnabled()) {
            addDecorations();
        } else {
            removeDecorations();
        }
    }

    // Initialize decorations
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                addDecorations();
                setupSettingsListener();
            });
        } else {
            addDecorations();
            setupSettingsListener();
        }
    }

    // Listen for settings changes
    function setupSettingsListener() {
        // Listen for the themeChanged event that settings.js dispatches
        document.addEventListener('themeChanged', updateDecorations);

        // Also check for settings changes periodically (fallback)
        let lastSeasonalSetting = isSeasonalContentEnabled();
        setInterval(() => {
            const currentSeasonalSetting = isSeasonalContentEnabled();
            if (currentSeasonalSetting !== lastSeasonalSetting) {
                lastSeasonalSetting = currentSeasonalSetting;
                updateDecorations();
            }
        }, 1000);
    }

    init();
})();