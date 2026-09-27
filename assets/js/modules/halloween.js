// Corner Cobwebs
(function() {
    'use strict';

    // Toggle Halloween Effects
    const COBWEBS_ENABLED = true;

    // Configuration
    const config = {
        // Available cobweb images
        images: {
            cobweb1: 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/seasonal/corner-cobweb-1.png',
            cobweb2: 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/seasonal/corner-cobweb-2.png',
            cobweb3: 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/seasonal/corner-cobweb-3.png',
            cobweb4: 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/seasonal/corner-cobweb-4.png'
        },
        // Assign which image goes to which corner
        cornerImages: {
            'top-left': 'cobweb3',
            'top-right': 'cobweb4',
            'bottom-left': 'cobweb2',
            'bottom-right': 'cobweb1'
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

    let cobwebElements = [];

    // Check if seasonal content is enabled in settings
    function isSeasonalContentEnabled() {
        // First check master toggle, if false, completely disable regardless of settings
        if (!COBWEBS_ENABLED) {
            return false;
        }

        // Then check user preference from localStorage
        const seasonalContent = localStorage.getItem('seasonalContent');
        return seasonalContent !== 'false'; // Default to true if not set
    }

    // Create cobweb element
    function createCobweb(corner) {
        const cobweb = document.createElement('div');
        cobweb.className = `cobweb-decoration cobweb-${corner}`;

        // Get size for this corner
        const size = config.sizes[corner];
        const opacity = config.opacities[corner];

        // Base styles for all cobwebs
        Object.assign(cobweb.style, {
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
                cobweb.style.top = `${offset.top}px`;
                cobweb.style.left = `${offset.left}px`;
                cobweb.style.backgroundImage = `url('${imageUrl}')`;
                cobweb.style.backgroundPosition = 'top left';
                cobweb.style.transform = transformStr;
                break;
            case 'top-right':
                cobweb.style.top = `${offset.top}px`;
                cobweb.style.right = `${offset.right}px`;
                cobweb.style.backgroundImage = `url('${imageUrl}')`;
                cobweb.style.backgroundPosition = 'top right';
                cobweb.style.transform = transformStr;
                break;
            case 'bottom-left':
                cobweb.style.bottom = `${offset.bottom}px`;
                cobweb.style.left = `${offset.left}px`;
                cobweb.style.backgroundImage = `url('${imageUrl}')`;
                cobweb.style.backgroundPosition = 'bottom left';
                cobweb.style.transform = transformStr;
                break;
            case 'bottom-right':
                cobweb.style.bottom = `${offset.bottom}px`;
                cobweb.style.right = `${offset.right}px`;
                cobweb.style.backgroundImage = `url('${imageUrl}')`;
                cobweb.style.backgroundPosition = 'bottom right';
                cobweb.style.transform = transformStr;
                break;
        }

        return cobweb;
    }

    // Add all cobwebs to the page
    function addCobwebs() {
        // Clear any existing cobwebs first
        removeCobwebs();

        if (!isSeasonalContentEnabled()) {
            return;
        }

        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

        corners.forEach(corner => {
            const cobweb = createCobweb(corner);
            document.body.appendChild(cobweb);
            cobwebElements.push(cobweb);
        });
    }

    // Remove all cobwebs from the page
    function removeCobwebs() {
        cobwebElements.forEach(cobweb => {
            if (cobweb && cobweb.parentNode) {
                cobweb.parentNode.removeChild(cobweb);
            }
        });
        cobwebElements = [];

        // Also remove any cobwebs that might have been added by previous versions
        const existingCobwebs = document.querySelectorAll('[class*="cobweb"]');
        existingCobwebs.forEach(cobweb => {
            if (cobweb.parentNode) {
                cobweb.parentNode.removeChild(cobweb);
            }
        });
    }

    // Update cobwebs based on current settings
    function updateCobwebs() {
        if (isSeasonalContentEnabled()) {
            addCobwebs();
        } else {
            removeCobwebs();
        }
    }

    // Initialize cobwebs
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                addCobwebs();
                setupSettingsListener();
            });
        } else {
            addCobwebs();
            setupSettingsListener();
        }
    }

    // Listen for settings changes
    function setupSettingsListener() {
        // Listen for the themeChanged event that settings.js dispatches
        document.addEventListener('themeChanged', updateCobwebs);

        // Also check for settings changes periodically (fallback)
        let lastSeasonalSetting = isSeasonalContentEnabled();
        setInterval(() => {
            const currentSeasonalSetting = isSeasonalContentEnabled();
            if (currentSeasonalSetting !== lastSeasonalSetting) {
                lastSeasonalSetting = currentSeasonalSetting;
                updateCobwebs();
            }
        }, 1000);
    }

    init();
})();

// Halloween Rain Effect
(function() {
    'use strict';

    // Toggle Rain Effect
    const RAIN_ENABLED = true;

    // Toggle Lightning (only matters if RAIN_ENABLED is also true)
    const LIGHTNING_ENABLED = true;

    // Configuration
    const rainConfig = {
        color: '174, 194, 224',
        minSpeed: 4,
        maxSpeed: 10,
        minLength: 10,
        maxLength: 26,
        wind: 1.5,
        density: 0.00014,
        maxDrops: 250
    };

    // Rare Lightning
    const lightningConfig = {
        minIntervalMs: 15000,
        maxIntervalMs: 45000,
        flashDuration: 380,
        boltVisibleMs: 140,
        maxFlashOpacity: 0.35,
        boltColor: '235, 240, 255'
    };

    let canvas = null;
    let ctx = null;
    let drops = [];
    let animationId = null;
    let isRunning = false;

    // Lightning state
    let nextStrikeAt = null;
    let strikeStartTime = null;
    let boltPath = [];

    // Check if seasonal content is enabled in settings
    function isSeasonalContentEnabled() {
        // First check master toggle, if false, completely disable regardless of settings
        if (!RAIN_ENABLED) {
            return false;
        }

        // Then check user preference from localStorage
        const seasonalContent = localStorage.getItem('seasonalContent');
        return seasonalContent !== 'false'; // Default to true if not set
    }

    // Respect users who've asked for less motion on screen
    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // Pick a random point in time (relative to fromTime) for the next strike
    function scheduleNextStrike(fromTime) {
        const delay = lightningConfig.minIntervalMs +
            Math.random() * (lightningConfig.maxIntervalMs - lightningConfig.minIntervalMs);
        nextStrikeAt = fromTime + delay;
    }

    // Brightness envelope for a strike: a sharp flash plus a smaller flicker after it
    function flashIntensity(elapsedMs) {
        if (elapsedMs < 0) return 0;

        const mainPulse = elapsedMs < 30
            ? elapsedMs / 30
            : Math.max(0, 1 - (elapsedMs - 30) / 150);

        const flickerStart = 220;
        const flickerElapsed = elapsedMs - flickerStart;
        const flicker = (flickerElapsed >= 0 && flickerElapsed < 150)
            ? (1 - flickerElapsed / 150) * 0.45
            : 0;

        return Math.min(1, mainPulse + flicker);
    }

    // Build a jagged lightning bolt path from a random point along the top edge
    function generateBolt() {
        const points = [];
        let x = Math.random() * canvas.width;
        let y = 0;
        points.push({ x, y });

        const targetY = canvas.height * (0.35 + Math.random() * 0.45);

        while (y < targetY) {
            y += 18 + Math.random() * 14;
            x += (Math.random() - 0.5) * 70;
            points.push({ x, y });
        }

        return points;
    }

    // Draw the bolt path with a soft glow, faded by the current flash intensity
    function drawBolt(intensity) {
        if (boltPath.length < 2) return;

        ctx.save();
        ctx.strokeStyle = `rgba(${lightningConfig.boltColor}, ${intensity})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = `rgba(${lightningConfig.boltColor}, 0.9)`;
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.moveTo(boltPath[0].x, boltPath[0].y);
        for (let i = 1; i < boltPath.length; i++) {
            ctx.lineTo(boltPath[i].x, boltPath[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Create a single raindrop with randomized properties
    function createDrop(randomizeY) {
        return {
            x: Math.random() * (canvas.width + 200) - 100,
            y: randomizeY ? Math.random() * canvas.height : -rainConfig.maxLength,
            length: rainConfig.minLength + Math.random() * (rainConfig.maxLength - rainConfig.minLength),
            speed: rainConfig.minSpeed + Math.random() * (rainConfig.maxSpeed - rainConfig.minSpeed),
            opacity: 0.15 + Math.random() * 0.35
        };
    }

    // Resize canvas to fill viewport and rebalance drop count
    function resizeCanvas() {
        if (!canvas) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const area = canvas.width * canvas.height;
        const targetCount = Math.min(rainConfig.maxDrops, Math.round(area * rainConfig.density));

        if (drops.length < targetCount) {
            while (drops.length < targetCount) {
                drops.push(createDrop(true));
            }
        } else {
            drops.length = targetCount;
        }
    }

    // Create the fullscreen canvas used for rain
    function createCanvas() {
        const c = document.createElement('canvas');
        c.id = 'halloween-rain-canvas';
        Object.assign(c.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: '9990'
        });
        document.body.appendChild(c);
        return c;
    }

    // Draw and advance a single animation frame
    function drawFrame(timestamp) {
        if (!ctx || !canvas) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';

        for (let i = 0; i < drops.length; i++) {
            const drop = drops[i];

            ctx.strokeStyle = `rgba(${rainConfig.color}, ${drop.opacity})`;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x + rainConfig.wind, drop.y + drop.length);
            ctx.stroke();

            drop.x += rainConfig.wind;
            drop.y += drop.speed;

            // Recycle drops that fall off the bottom or drift off the right edge
            if (drop.y > canvas.height || drop.x > canvas.width + 100) {
                drop.x = Math.random() * (canvas.width + 200) - 100;
                drop.y = -drop.length;
                drop.speed = rainConfig.minSpeed + Math.random() * (rainConfig.maxSpeed - rainConfig.minSpeed);
                drop.length = rainConfig.minLength + Math.random() * (rainConfig.maxLength - rainConfig.minLength);
                drop.opacity = 0.15 + Math.random() * 0.35;
            }
        }

        // Lightning: rare, randomly-timed strikes
        if (LIGHTNING_ENABLED) {
            if (strikeStartTime === null && nextStrikeAt !== null && timestamp >= nextStrikeAt) {
                strikeStartTime = timestamp;
                boltPath = generateBolt();
            }

            if (strikeStartTime !== null) {
                const elapsed = timestamp - strikeStartTime;
                const intensity = flashIntensity(elapsed);

                if (intensity > 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${(intensity * lightningConfig.maxFlashOpacity).toFixed(3)})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    if (elapsed < lightningConfig.boltVisibleMs) {
                        drawBolt(intensity);
                    }
                }

                if (elapsed >= lightningConfig.flashDuration) {
                    strikeStartTime = null;
                    boltPath = [];
                    scheduleNextStrike(timestamp);
                }
            }
        }

        animationId = requestAnimationFrame(drawFrame);
    }

    // Start the rain effect
    function startRain() {
        if (isRunning || prefersReducedMotion()) {
            return;
        }

        if (!canvas) {
            canvas = createCanvas();
            ctx = canvas.getContext('2d');
        } else if (!canvas.parentNode) {
            document.body.appendChild(canvas);
        }

        resizeCanvas();
        isRunning = true;

        strikeStartTime = null;
        boltPath = [];
        if (LIGHTNING_ENABLED) {
            scheduleNextStrike(performance.now());
        }

        animationId = requestAnimationFrame(drawFrame);
    }

    // Stop the rain effect and remove the canvas
    function stopRain() {
        isRunning = false;

        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }

        nextStrikeAt = null;
        strikeStartTime = null;
        boltPath = [];
    }

    // Update rain based on current settings
    function updateRain() {
        if (isSeasonalContentEnabled()) {
            startRain();
        } else {
            stopRain();
        }
    }

    // Pause the animation loop while the tab is hidden, resume when visible
    function handleVisibilityChange() {
        if (document.hidden) {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else if (isRunning && isSeasonalContentEnabled()) {
            animationId = requestAnimationFrame(drawFrame);
        }
    }

    // Listen for settings and viewport changes
    function setupListeners() {
        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for the themeChanged event that settings.js dispatches
        document.addEventListener('themeChanged', updateRain);

        // Also check for settings changes periodically (fallback)
        let lastSeasonalSetting = isSeasonalContentEnabled();
        setInterval(() => {
            const currentSeasonalSetting = isSeasonalContentEnabled();
            if (currentSeasonalSetting !== lastSeasonalSetting) {
                lastSeasonalSetting = currentSeasonalSetting;
                updateRain();
            }
        }, 1000);
    }

    // Initialize rain
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                updateRain();
                setupListeners();
            });
        } else {
            updateRain();
            setupListeners();
        }
    }

    init();
})();

// Ambiance Radio Easter Egg
(() => {
    const STORAGE_PREFIX = 'heatlabs_radio_';
    let radioStations = [];
    let currentStationIndex = 0;
    let audioPlayer = null;
    let isPlaying = false;
    let currentVolume = 0.5;

    // Check if seasonal content is enabled in settings
    function isSeasonalContentEnabled() {
        const seasonalContent = localStorage.getItem('seasonalContent');
        return seasonalContent !== 'false'; // Default to true if not set
    }

    // Load persistent state from sessionStorage
    const loadRadioState = () => {
        try {
            const savedStations = sessionStorage.getItem(STORAGE_PREFIX + 'stations');
            const savedIndex = sessionStorage.getItem(STORAGE_PREFIX + 'currentIndex');
            const savedVolume = sessionStorage.getItem(STORAGE_PREFIX + 'volume');
            const savedIsPlaying = sessionStorage.getItem(STORAGE_PREFIX + 'isPlaying');
            const savedModalVisible = sessionStorage.getItem(STORAGE_PREFIX + 'modalVisible');

            if (savedStations) {
                radioStations = JSON.parse(savedStations);
            }
            if (savedIndex !== null) {
                currentStationIndex = parseInt(savedIndex, 10);
            }
            if (savedVolume !== null) {
                currentVolume = parseFloat(savedVolume);
            }
            if (savedIsPlaying === 'true') {
                isPlaying = true;
            }

            // Restore modal if it was visible and seasonal content is enabled
            if (savedModalVisible === 'true' && isSeasonalContentEnabled()) {
                setTimeout(() => {
                    showRadioModal();
                    if (isPlaying && radioStations.length > 0) {
                        setTimeout(() => playCurrentStation(), 100);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error loading radio state:', error);
        }
    };

    // Save persistent state to sessionStorage
    const saveRadioState = () => {
        try {
            sessionStorage.setItem(STORAGE_PREFIX + 'stations', JSON.stringify(radioStations));
            sessionStorage.setItem(STORAGE_PREFIX + 'currentIndex', currentStationIndex.toString());
            sessionStorage.setItem(STORAGE_PREFIX + 'volume', currentVolume.toString());
            sessionStorage.setItem(STORAGE_PREFIX + 'isPlaying', isPlaying.toString());
            const modalVisible = document.getElementById('arabicRadioModal')?.classList.contains('show') || false;
            sessionStorage.setItem(STORAGE_PREFIX + 'modalVisible', modalVisible.toString());
        } catch (error) {
            console.error('Error saving radio state:', error);
        }
    };

    // Save state before page unload
    window.addEventListener('beforeunload', saveRadioState);

    // Create and style the radio modal
    const createRadioModal = () => {
        const existingModal = document.getElementById('arabicRadioModal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'arabicRadioModal';
        modal.className = 'arabic-radio-modal';

        modal.innerHTML = `
            <div class="arabic-radio-header">
                <h3>HEAT Labs Radio Stations</h3>
                <button class="arabic-radio-close">&times;</button>
            </div>
            <div class="arabic-radio-body">
                <div class="arabic-radio-station-info">
                    <div class="arabic-radio-station-name">Loading stations...</div>
                </div>
                <div class="arabic-radio-controls">
                    <button class="arabic-radio-prev" title="Previous station">
                        <i class="fas fa-backward"></i>
                    </button>
                    <button class="arabic-radio-play" title="Play/Pause">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="arabic-radio-next" title="Next station">
                        <i class="fas fa-forward"></i>
                    </button>
                </div>
                <div class="arabic-radio-volume">
                    <input type="range" min="0" max="1" step="0.01" value="${currentVolume}" class="arabic-radio-volume-slider">
                    <i class="fas fa-volume-up"></i>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.arabic-radio-close').addEventListener('click', hideRadioModal);
        modal.querySelector('.arabic-radio-prev').addEventListener('click', playPreviousStation);
        modal.querySelector('.arabic-radio-play').addEventListener('click', togglePlayPause);
        modal.querySelector('.arabic-radio-next').addEventListener('click', playNextStation);
        modal.querySelector('.arabic-radio-volume-slider').addEventListener('input', adjustVolume);

        // Load stations when modal is first shown
        if (radioStations.length === 0) {
            loadRadioStations();
        } else {
            updateStationInfo();
        }
    };

    // Show the radio modal
    const showRadioModal = () => {
        // Only show if seasonal content is enabled
        if (!isSeasonalContentEnabled()) {
            return;
        }

        if (!document.getElementById('arabicRadioModal')) {
            createRadioModal();
        }
        document.getElementById('arabicRadioModal').classList.add('show');
        saveRadioState();
    };

    // Hide the radio modal
    const hideRadioModal = () => {
        const modal = document.getElementById('arabicRadioModal');
        if (modal) {
            modal.classList.remove('show');
            saveRadioState();
        }
    };

    // Load radio stations from API
    const loadRadioStations = async () => {
        const modal = document.getElementById('arabicRadioModal');

        try {
            // Halloween radio station URL
            const stationUrl = 'https://de1.api.radio-browser.info/json/stations/byuuid/ab98e449-edb9-4670-ba10-3fefd6011b9d';

            const response = await fetch(stationUrl);
            const stations = await response.json();

            // Handle both single station and array response
            if (Array.isArray(stations)) {
                radioStations = stations;
            } else {
                radioStations = [stations];
            }

            if (radioStations.length > 0) {
                if (currentStationIndex >= radioStations.length) {
                    currentStationIndex = 0;
                }
                updateStationInfo();
                saveRadioState();
            } else {
                if (modal) {
                    modal.querySelector('.arabic-radio-station-name').textContent = 'No stations found';
                }
            }
        } catch (error) {
            console.error('Error loading radio stations:', error);
            if (modal) {
                modal.querySelector('.arabic-radio-station-name').textContent = 'Error loading stations';
            }
        }
    };

    // Update station info in the modal
    const updateStationInfo = () => {
        const modal = document.getElementById('arabicRadioModal');
        if (!modal || radioStations.length === 0) return;

        const station = radioStations[currentStationIndex];
        modal.querySelector('.arabic-radio-station-name').textContent = station.name || 'Unknown Station';
        //modal.querySelector('.arabic-radio-station-country').textContent = station.country || '';

        // Play the station
        const playButton = modal.querySelector('.arabic-radio-play');
        if (playButton) {
            playButton.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
        }

        // Update volume slider
        const volumeSlider = modal.querySelector('.arabic-radio-volume-slider');
        if (volumeSlider) {
            volumeSlider.value = currentVolume;
        }
    };

    // Play the current station
    const playCurrentStation = () => {
        if (radioStations.length === 0) return;

        const station = radioStations[currentStationIndex];
        const playButton = document.querySelector('.arabic-radio-play');

        // Stop any currently playing audio
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer = null;
        }

        // Create new audio player
        const streamUrl = station.url_resolved || station.url;
        if (!streamUrl) return;

        audioPlayer = new Audio(streamUrl);
        audioPlayer.volume = currentVolume;
        audioPlayer.crossOrigin = "anonymous";

        // Update play button to pause icon
        if (playButton) {
            playButton.innerHTML = '<i class="fas fa-pause"></i>';
        }

        // Play the station
        audioPlayer.play().then(() => {
            isPlaying = true;
            saveRadioState();
        }).catch(error => {
            console.error('Error playing station:', error);
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            }
            isPlaying = false;
            saveRadioState();
        });

        // Handle audio end/error events
        audioPlayer.addEventListener('ended', () => {
            isPlaying = false;
            saveRadioState();
        });

        audioPlayer.addEventListener('error', () => {
            isPlaying = false;
            saveRadioState();
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
    };

    // Toggle play/pause
    const togglePlayPause = () => {
        const playButton = document.querySelector('.arabic-radio-play');

        if (!audioPlayer && radioStations.length > 0) {
            playCurrentStation();
            return;
        }

        if (!audioPlayer) return;

        if (audioPlayer.paused) {
            audioPlayer.play().then(() => {
                if (playButton) {
                    playButton.innerHTML = '<i class="fas fa-pause"></i>';
                }
                isPlaying = true;
                saveRadioState();
            }).catch(error => {
                console.error('Error playing station:', error);
                isPlaying = false;
                saveRadioState();
            });
        } else {
            audioPlayer.pause();
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            }
            isPlaying = false;
            saveRadioState();
        }
    };

    // Play next station
    const playNextStation = () => {
        if (radioStations.length === 0) return;

        currentStationIndex = (currentStationIndex + 1) % radioStations.length;
        updateStationInfo();
        if (isPlaying) {
            playCurrentStation();
        }
        saveRadioState();
    };

    // Play previous station
    const playPreviousStation = () => {
        if (radioStations.length === 0) return;

        currentStationIndex = (currentStationIndex - 1 + radioStations.length) % radioStations.length;
        updateStationInfo();
        if (isPlaying) {
            playCurrentStation();
        }
        saveRadioState();
    };

    // Adjust volume
    const adjustVolume = (event) => {
        currentVolume = parseFloat(event.target.value);
        if (audioPlayer) {
            audioPlayer.volume = currentVolume;
        }
        saveRadioState();
    };

    // Add CSS to the document head
    const addRadioStyles = () => {
        // Remove existing styles if they exist
        const existingStyle = document.getElementById('arabicRadioStyles');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'arabicRadioStyles';
        style.textContent = `
            .arabic-radio-modal {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #444;
                border-radius: 8px;
                color: white;
                font-family: inherit;
                z-index: 9999;
                transform: translateY(120%);
                transition: transform 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            }

            .arabic-radio-modal.show {
                transform: translateY(0);
            }

            .arabic-radio-header {
                padding: 12px 15px;
                background: #141312;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #333;
            }

            .arabic-radio-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }

            .arabic-radio-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0 5px;
            }

            .arabic-radio-close:hover {
                color: #ccc;
            }

            .arabic-radio-body {
                padding: 15px;
            }

            .arabic-radio-station-info {
                margin-bottom: 15px;
            }

            .arabic-radio-station-name {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 3px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .arabic-radio-station-country {
                font-size: 12px;
                color: #aaa;
            }

            .arabic-radio-controls {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 15px;
            }

            .arabic-radio-controls button {
                background: #333;
                border: none;
                color: white;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s;
            }

            .arabic-radio-controls button:hover {
                background: #444;
            }

            .arabic-radio-volume {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .arabic-radio-volume-slider {
                flex-grow: 1;
                cursor: pointer;
            }

            @media (max-width: 400px) {
                .arabic-radio-modal {
                    width: calc(100% - 40px);
                    right: 10px;
                    bottom: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    };

    // Update radio based on seasonal content setting
    function updateRadio() {
        if (!isSeasonalContentEnabled()) {
            // Hide radio modal and stop playback if seasonal content is disabled
            hideRadioModal();
            if (audioPlayer) {
                audioPlayer.pause();
                isPlaying = false;
                saveRadioState();
            }
        }
    }

    // Initialize the radio system
    const initRadio = () => {
        addRadioStyles();
        loadRadioState();

        // Listen for settings changes
        document.addEventListener('themeChanged', updateRadio);

        // Check for settings changes periodically (fallback)
        let lastSeasonalSetting = isSeasonalContentEnabled();
        setInterval(() => {
            const currentSeasonalSetting = isSeasonalContentEnabled();
            if (currentSeasonalSetting !== lastSeasonalSetting) {
                lastSeasonalSetting = currentSeasonalSetting;
                updateRadio();
            }
        }, 1000);

        setTimeout(() => {
            if (isSeasonalContentEnabled()) {
                const cobwebElements = document.querySelectorAll('[class*="cobweb"]');
                if (cobwebElements.length > 0) {
                    // Cobwebs are enabled, show the radio modal
                    showRadioModal();
                }
            }
        }, 1000);
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRadio);
    } else {
        initRadio();
    }
})();