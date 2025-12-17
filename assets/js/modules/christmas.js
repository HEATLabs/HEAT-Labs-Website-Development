// Snow Effect
(function() {
    'use strict';

    // Toggle Snow Effects
    const SNOW_ENABLED = true;

    // Configuration
    const config = {
        // Snowflake properties
        snowflakes: {
            count: 100, // Number of snowflakes
            speed: 1, // Base falling speed (pixels per frame)
            speedVariation: 0.5, // Speed variation between flakes
            size: 3, // Base size (px)
            sizeVariation: 3, // Size variation (px)
            wind: 0.2, // Wind effect strength
            windVariation: 0.2, // Wind variation between flakes
            opacity: 0.8, // Base opacity
            opacityVariation: 0.3, // Opacity variation
            sway: 0.5, // Horizontal sway amount
            swirl: 0.3, // Swirl/spiral effect
        },
        // Performance settings
        performance: {
            reduceOnMobile: true, // Reduce count on mobile devices
            mobileMultiplier: 0.6 // Snowflake count multiplier for mobile
        },
        // Visual settings
        visual: {
            color: '#ffffff', // Snowflake color
            twinkle: true // Random twinkle effect
        },
        zIndex: '9998'
    };

    let snowflakes = [];
    let canvas = null;
    let ctx = null;
    let animationId = null;
    let lastTime = 0;
    let windDirection = 1;
    let windChangeTime = 0;
    let resizeTimeout = null;
    let isInitialized = false;

    // Check if seasonal content is enabled in settings
    function isSeasonalContentEnabled() {
        // First check master toggle, if false, completely disable regardless of settings
        if (!SNOW_ENABLED) {
            return false;
        }

        // Then check user preference from localStorage
        const seasonalContent = localStorage.getItem('seasonalContent');
        return seasonalContent !== 'false'; // Default to true if not set
    }

    // Simple canvas initialization
    function initCanvas() {
        // Remove existing canvas if present
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
            canvas = null;
            ctx = null;
        }

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.className = 'snow-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${config.zIndex};
        `;

        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        // Set initial canvas size
        updateCanvasSize();

        // Handle window resize with debounce
        window.addEventListener('resize', handleResize);
    }

    // Update canvas size without DPR scaling
    function updateCanvasSize() {
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    // Handle window resize with debounce
    function handleResize() {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }

        resizeTimeout = setTimeout(() => {
            if (canvas) {
                updateCanvasSize();
                // Clear any streaks immediately
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                // Reposition snowflakes
                repositionSnowflakes();
            }
        }, 100);
    }

    // Create snowflake object
    function createSnowflake(id, reposition = false) {
        const width = canvas ? canvas.width : window.innerWidth;
        const height = canvas ? canvas.height : window.innerHeight;

        const speed = config.snowflakes.speed +
            (Math.random() * 2 - 1) * config.snowflakes.speedVariation;
        const size = Math.max(1, config.snowflakes.size +
            Math.random() * config.snowflakes.sizeVariation);
        const opacity = Math.max(0.2, Math.min(1,
            config.snowflakes.opacity +
            (Math.random() * 2 - 1) * config.snowflakes.opacityVariation));

        // Random start position
        let x, y;

        if (reposition && id < snowflakes.length) {
            // When repositioning, try to maintain position
            const existingFlake = snowflakes[id];
            if (existingFlake) {
                x = Math.min(width - size, Math.max(0, existingFlake.x * (width / existingFlake.lastWidth || 1)));
                y = Math.min(height - size, Math.max(0, existingFlake.y * (height / existingFlake.lastHeight || 1)));
            } else {
                x = Math.random() * width;
                y = Math.random() * height;
            }
        } else {
            // Initial creation, random position
            x = Math.random() * width;
            // Start at random heights
            y = -size - Math.random() * height * 0.5;
        }

        return {
            id: id,
            x: x,
            y: y,
            size: size,
            speed: speed,
            opacity: opacity,
            originalSpeed: speed,
            originalOpacity: opacity,
            sway: (Math.random() * 2 - 1) * config.snowflakes.sway,
            swirl: Math.random() * config.snowflakes.swirl,
            windEffect: config.snowflakes.wind +
                (Math.random() * 2 - 1) * config.snowflakes.windVariation,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() * 0.05 - 0.025),
            twinkleSpeed: 0.5 + Math.random() * 1.5,
            twinklePhase: Math.random() * Math.PI * 2,
            createdAt: Date.now(),
            startDelay: Math.random() * 2000,
            hasStarted: reposition,
            lastWidth: width,
            lastHeight: height
        };
    }

    // Reposition snowflakes after resize
    function repositionSnowflakes() {
        if (!canvas) return;

        const width = canvas.width;
        const height = canvas.height;

        snowflakes = snowflakes.map((flake, index) => {
            const newFlake = createSnowflake(index, true);
            // Preserve timing properties
            newFlake.createdAt = flake.createdAt;
            newFlake.startDelay = flake.startDelay;
            newFlake.hasStarted = flake.hasStarted || Date.now() - flake.createdAt > flake.startDelay;
            return newFlake;
        });
    }

    // Initialize snowflakes
    function initSnowflakes() {
        snowflakes = [];
        const count = isMobile() && config.performance.reduceOnMobile ?
            Math.floor(config.snowflakes.count * config.performance.mobileMultiplier) :
            config.snowflakes.count;

        for (let i = 0; i < count; i++) {
            snowflakes.push(createSnowflake(i));
        }
    }

    // Check if device is mobile
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768;
    }

    // Draw a snowflake with fresh context state
    function drawSnowflake(flake, time) {
        if (!flake.hasStarted) {
            if (Date.now() - flake.createdAt > flake.startDelay) {
                flake.hasStarted = true;
            } else {
                return;
            }
        }

        // Update snowflake position
        const deltaTime = time - lastTime;
        const deltaSeconds = Math.min(deltaTime / 16, 2);

        // Calculate wind effect with occasional direction changes
        if (time - windChangeTime > 10000 + Math.random() * 10000) {
            windDirection = Math.random() > 0.5 ? 1 : -1;
            windChangeTime = time;
        }

        const wind = flake.windEffect * windDirection;

        // Apply movement
        flake.y += flake.speed * deltaSeconds;
        flake.x += (wind + flake.sway * Math.sin(time * 0.001 * flake.swirl)) * deltaSeconds;
        flake.rotation += flake.rotationSpeed * deltaSeconds;

        // Apply twinkle effect if enabled
        if (config.visual.twinkle) {
            const twinkle = Math.sin(time * 0.001 * flake.twinkleSpeed + flake.twinklePhase) * 0.2 + 0.8;
            flake.opacity = flake.originalOpacity * twinkle;
            flake.speed = flake.originalSpeed * (0.8 + twinkle * 0.4);
        }

        // Reset if snowflake goes off screen
        const width = canvas.width;
        const height = canvas.height;

        if (flake.y > height + flake.size ||
            flake.x < -flake.size ||
            flake.x > width + flake.size) {

            // Reset to top with some randomness
            flake.y = -flake.size - Math.random() * 50;
            flake.x = Math.random() * width;
            flake.hasStarted = true;
            flake.lastWidth = width;
            flake.lastHeight = height;
        }

        // Draw the snowflake with fresh context state
        ctx.save();

        // Reset all context properties to defaults
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.filter = 'none';

        // Set transform
        ctx.setTransform(1, 0, 0, 1, flake.x, flake.y);
        ctx.rotate(flake.rotation);

        // Set opacity
        ctx.globalAlpha = flake.opacity;

        // Draw simple circle
        ctx.fillStyle = config.visual.color;
        ctx.beginPath();
        ctx.arc(0, 0, flake.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Animation loop
    function animate(time) {
        if (!canvas || !ctx || !isSeasonalContentEnabled()) {
            animationId = null;
            return;
        }

        // Skip frames if needed for performance
        if (time - lastTime < 16) {
            animationId = requestAnimationFrame(animate);
            return;
        }

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw all snowflakes
        for (let i = 0; i < snowflakes.length; i++) {
            drawSnowflake(snowflakes[i], time);
        }

        lastTime = time;
        animationId = requestAnimationFrame(animate);
    }

    // Start snow effect
    function startSnow() {
        if (!isSeasonalContentEnabled()) return;

        stopSnow();
        initCanvas();
        initSnowflakes();

        lastTime = performance.now();
        windChangeTime = lastTime;
        isInitialized = true;

        // Start animation
        animate(lastTime);
    }

    // Stop snow effect
    function stopSnow() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
            canvas = null;
            ctx = null;
        }

        window.removeEventListener('resize', handleResize);

        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
            resizeTimeout = null;
        }

        snowflakes = [];
        isInitialized = false;
    }

    // Update snow based on current settings
    function updateSnow() {
        if (isSeasonalContentEnabled()) {
            startSnow();
        } else {
            stopSnow();
        }
    }

    // Initialize snow effect
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                updateSnow();
                setupSettingsListener();
            });
        } else {
            updateSnow();
            setupSettingsListener();
        }
    }

    // Listen for settings changes
    function setupSettingsListener() {
        // Listen for the themeChanged event that settings.js dispatches
        document.addEventListener('themeChanged', updateSnow);

        // Also check for settings changes periodically (fallback)
        let lastSeasonalSetting = isSeasonalContentEnabled();
        setInterval(() => {
            const currentSeasonalSetting = isSeasonalContentEnabled();
            if (currentSeasonalSetting !== lastSeasonalSetting) {
                lastSeasonalSetting = currentSeasonalSetting;
                updateSnow();
            }
        }, 1000);
    }

    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        } else if (isSeasonalContentEnabled() && !animationId && isInitialized) {
            lastTime = performance.now();
            animate(lastTime);
        }
    });

    // Monitor for zoom changes
    let lastInnerWidth = window.innerWidth;
    let lastInnerHeight = window.innerHeight;

    function checkForZoom() {
        // Zoom often changes innerWidth/height without resize event
        if (Math.abs(window.innerWidth - lastInnerWidth) > 10 ||
            Math.abs(window.innerHeight - lastInnerHeight) > 10) {

            lastInnerWidth = window.innerWidth;
            lastInnerHeight = window.innerHeight;

            if (canvas && ctx && isInitialized) {
                // Force complete canvas reset on zoom
                updateCanvasSize();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                repositionSnowflakes();
            }
        }
    }

    // Check for zoom more frequently
    setInterval(checkForZoom, 50);

    init();
})();