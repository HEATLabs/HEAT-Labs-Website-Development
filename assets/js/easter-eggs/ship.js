document.addEventListener('DOMContentLoaded', function() {
    // easter egg configuration
    const wordCodes = ['matcha', 'moonlight'];
    let inputBuffer = '';
    let isActive = false;
    let originalTexts = {};
    let shipElements = {};

    // Store original texts
    function storeOriginalTexts() {
        originalTexts = {
            title: document.querySelector('.hero-text h1')?.textContent || '',
            subtitle1: document.querySelectorAll('.hero-subtitle')[0]?.textContent || '',
            subtitle2: document.querySelectorAll('.hero-subtitle')[1]?.textContent || '',
            agentsLabel: document.querySelector('.hero-counter:nth-child(1) .hero-counter-label')?.textContent || '',
            agentsCount: document.querySelector('.hero-counter:nth-child(1) .hero-counter-number')?.textContent || '',
            mapsLabel: document.querySelector('.hero-counter:nth-child(2) .hero-counter-label')?.textContent || '',
            mapsCount: document.querySelector('.hero-counter:nth-child(2) .hero-counter-number')?.textContent || '',
            tanksLabel: document.querySelector('.hero-counter:nth-child(3) .hero-counter-label')?.textContent || '',
            tanksCount: document.querySelector('.hero-counter:nth-child(3) .hero-counter-number')?.textContent || ''
        };
    }

    // Create ship-themed elements
    function createShipElements() {
        // Main title
        const titleElement = document.querySelector('.hero-text h1');
        if (titleElement) {
            shipElements.title = titleElement;
        }

        // Subtitles
        const subtitleElements = document.querySelectorAll('.hero-subtitle');
        if (subtitleElements.length >= 2) {
            shipElements.subtitle1 = subtitleElements[0];
            shipElements.subtitle2 = subtitleElements[1];
        }

        // Counters
        const counterElements = document.querySelectorAll('.hero-counter');
        if (counterElements.length >= 3) {
            shipElements.agentsCounter = counterElements[0].querySelector('.hero-counter-number');
            shipElements.agentsLabel = counterElements[0].querySelector('.hero-counter-label');
            shipElements.mapsCounter = counterElements[1].querySelector('.hero-counter-number');
            shipElements.mapsLabel = counterElements[1].querySelector('.hero-counter-label');
            shipElements.tanksCounter = counterElements[2].querySelector('.hero-counter-number');
            shipElements.tanksLabel = counterElements[2].querySelector('.hero-counter-label');
        }
    }

    // Transform to ship theme
    function transformToShip() {
        if (isActive) return;

        isActive = true;

        // Update main title
        if (shipElements.title) {
            shipElements.title.textContent = "MoonMatcha Labs";
        }

        // Update subtitles
        if (shipElements.subtitle1) {
            shipElements.subtitle1.textContent = "Mr.Matcha + Moonlight";
        }

        if (shipElements.subtitle2) {
            shipElements.subtitle2.textContent = "Your one-stop solution for shipping Mr.Matcha and Moonlight in World of Tanks: HEAT";
        }

        // Update counters
        if (shipElements.agentsLabel) {
            shipElements.agentsLabel.textContent = "POTENTIAL KISSES";
        }

        if (shipElements.agentsCounter) {
            shipElements.agentsCounter.textContent = "16";
        }

        if (shipElements.mapsLabel) {
            shipElements.mapsLabel.textContent = "FRIENDZONE ATTEMPTS";
        }

        if (shipElements.mapsCounter) {
            shipElements.mapsCounter.textContent = "13";
        }

        if (shipElements.tanksLabel) {
            shipElements.tanksLabel.textContent = "CONFIRMED HUGS";
        }

        if (shipElements.tanksCounter) {
            shipElements.tanksCounter.textContent = "29";
        }

        const counters = document.querySelectorAll('.hero-counter-number');
        counters.forEach(counter => {
            counter.style.transition = 'all 0.5s ease';
        });

    }

    // Restore original theme
    function restoreOriginal() {
        if (!isActive) return;

        isActive = false;

        // Restore main title
        if (shipElements.title && originalTexts.title) {
            shipElements.title.textContent = originalTexts.title;
        }

        // Restore subtitles
        if (shipElements.subtitle1 && originalTexts.subtitle1) {
            shipElements.subtitle1.textContent = originalTexts.subtitle1;
        }

        if (shipElements.subtitle2 && originalTexts.subtitle2) {
            shipElements.subtitle2.textContent = originalTexts.subtitle2;
        }

        // Restore counters
        if (shipElements.agentsLabel && originalTexts.agentsLabel) {
            shipElements.agentsLabel.textContent = originalTexts.agentsLabel;
        }

        if (shipElements.agentsCounter && originalTexts.agentsCount) {
            shipElements.agentsCounter.textContent = originalTexts.agentsCount;
        }

        if (shipElements.mapsLabel && originalTexts.mapsLabel) {
            shipElements.mapsLabel.textContent = originalTexts.mapsLabel;
        }

        if (shipElements.mapsCounter && originalTexts.mapsCount) {
            shipElements.mapsCounter.textContent = originalTexts.mapsCount;
        }

        if (shipElements.tanksLabel && originalTexts.tanksLabel) {
            shipElements.tanksLabel.textContent = originalTexts.tanksLabel;
        }

        if (shipElements.tanksCounter && originalTexts.tanksCount) {
            shipElements.tanksCounter.textContent = originalTexts.tanksCount;
        }
    }

    // Initialize
    function init() {
        storeOriginalTexts();
        createShipElements();

        // Listen for key presses
        document.addEventListener('keydown', function(event) {
            // Check if the pressed key matches the current position in sequence
            const key = event.key.toLowerCase();

            // Only consider a-z characters
            if (key.length === 1 && key.match(/[a-z]/)) {
                inputBuffer += key;

                // Keep buffer length within the longest code
                const maxLength = Math.max(...wordCodes.map(code => code.length));
                if (inputBuffer.length > maxLength) {
                    inputBuffer = inputBuffer.slice(-maxLength);
                }

                // Check if buffer matches any of the secret words
                if (wordCodes.includes(inputBuffer)) {
                    if (isActive) {
                        restoreOriginal();
                    } else {
                        transformToShip();
                    }

                    // Reset for next time
                    inputBuffer = '';
                }
            }
        });
    }

    // Start the easter egg
    init();
});