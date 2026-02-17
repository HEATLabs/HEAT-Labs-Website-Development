// Hearts and Petals Effect
(function() {
    'use strict';

    // Toggle Valentine's Effects
    const VALENTINES_ENABLED = false;

    // Configuration
    const config = {
        // Particle properties
        particles: {
            count: 50, // Number of particles
            speed: 0.8, // Base falling speed (pixels per frame)
            speedVariation: 0.6, // Speed variation between particles
            heartSize: 1, // Base size for hearts (px)
            petalSize: 8, // Base size for petals (px)
            sizeVariation: 5, // Size variation (px)
            wind: 0.1, // Wind effect strength
            windVariation: 0.25, // Wind variation between particles
            opacity: 0.9, // Base opacity
            opacityVariation: 0.2, // Opacity variation
            sway: 0.8, // Horizontal sway amount
            swirl: 0.4, // Swirl/spiral effect
            heartRatio: 0.6, // 60% hearts, 40% petals
        },
        // Performance settings
        performance: {
            reduceOnMobile: true, // Reduce count on mobile devices
            mobileMultiplier: 0.6 // Particle count multiplier for mobile
        },
        // Visual settings
        visual: {
            heartColor: '#ff3366', // Red-pink for hearts
            petalColor: '#ff99cc', // Pink for petals
            twinkle: true // Gentle shimmer effect
        },
        zIndex: '9998'
    };

    let particles = [];
    let canvas = null;
    let ctx = null;
    let animationId = null;
    let lastTime = 0;
    let windDirection = 1;
    let windChangeTime = 0;
    let resizeTimeout = null;
    let isInitialized = false;

    // SVG Heart data
    const HEART_PATH = new Path2D('M237.376,436.245l0.774,0.976c210.94-85.154,292.221-282.553,199.331-367.706c-92.899-85.154-199.331,30.953-199.331,30.953h-0.774c0,0-106.44-116.107-199.331-30.953C-54.844,154.658,26.437,351.092,237.376,436.245z');

    // Check if seasonal content is enabled in settings
    function isSeasonalContentEnabled() {
        // First check master toggle
        if (!VALENTINES_ENABLED) {
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
        canvas.className = 'valentines-canvas';
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
                // Reposition particles
                repositionParticles();
            }
        }, 100);
    }

    // Draw a heart shape using SVG path
    function drawHeart(ctx, size) {
        ctx.save();
        // Scale the path to desired size
        ctx.scale(size / 200, size / 200);
        ctx.translate(50, 50);
        ctx.fill(HEART_PATH);
        ctx.restore();
    }

    // Draw a petal shape
    function drawPetal(ctx, size) {
        const width = size * 0.8;
        const height = size * 1.2;

        ctx.save();
        ctx.beginPath();

        // Draw teardrop/almond shape
        ctx.moveTo(0, -height * 0.5);

        // Right curve
        ctx.quadraticCurveTo(
            width * 0.8, -height * 0.1,
            width * 0.3, height * 0.4
        );

        // Bottom curve
        ctx.quadraticCurveTo(
            0, height * 0.5,
            -width * 0.3, height * 0.4
        );

        // Left curve back to top
        ctx.quadraticCurveTo(
            -width * 0.8, -height * 0.1,
            0, -height * 0.5
        );

        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // Create particle object (heart or petal)
    function createParticle(id, reposition = false) {
        const width = canvas ? canvas.width : window.innerWidth;
        const height = canvas ? canvas.height : window.innerHeight;

        const speed = config.particles.speed +
            (Math.random() * 2 - 1) * config.particles.speedVariation;

        // Determine if heart or petal and set size accordingly
        const isHeart = Math.random() < config.particles.heartRatio;
        const baseSize = isHeart ? config.particles.heartSize : config.particles.petalSize;
        const size = Math.max(5, baseSize +
            Math.random() * config.particles.sizeVariation);

        const opacity = Math.max(0.4, Math.min(1,
            config.particles.opacity +
            (Math.random() * 2 - 1) * config.particles.opacityVariation));

        const color = isHeart ? config.visual.heartColor : config.visual.petalColor;

        // Random start position
        let x, y;

        if (reposition && id < particles.length) {
            // When repositioning, try to maintain position
            const existingParticle = particles[id];
            if (existingParticle) {
                x = Math.min(width - size, Math.max(0, existingParticle.x * (width / existingParticle.lastWidth || 1)));
                y = Math.min(height - size, Math.max(0, existingParticle.y * (height / existingParticle.lastHeight || 1)));
            } else {
                x = Math.random() * width;
                y = Math.random() * height;
            }
        } else {
            // Initial creation, random position
            x = Math.random() * width;
            // Start at random heights above screen
            y = -size - Math.random() * height * 0.5;
        }

        return {
            id: id,
            x: x,
            y: y,
            size: size,
            baseSize: baseSize,
            speed: speed,
            opacity: opacity,
            originalSpeed: speed,
            originalOpacity: opacity,
            color: color,
            isHeart: isHeart,
            sway: (Math.random() * 2 - 1) * config.particles.sway,
            swirl: Math.random() * config.particles.swirl,
            windEffect: config.particles.wind +
                (Math.random() * 2 - 1) * config.particles.windVariation,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() * 0.04 - 0.02),
            twinkleSpeed: 0.3 + Math.random() * 1.2,
            twinklePhase: Math.random() * Math.PI * 2,
            createdAt: Date.now(),
            startDelay: Math.random() * 1500,
            hasStarted: reposition,
            lastWidth: width,
            lastHeight: height,
            // Petals flutter more
            flutterFactor: isHeart ? 1 : 1.5
        };
    }

    // Reposition particles after resize
    function repositionParticles() {
        if (!canvas) return;

        const width = canvas.width;
        const height = canvas.height;

        particles = particles.map((particle, index) => {
            const newParticle = createParticle(index, true);
            // Preserve timing properties
            newParticle.createdAt = particle.createdAt;
            newParticle.startDelay = particle.startDelay;
            newParticle.hasStarted = particle.hasStarted || Date.now() - particle.createdAt > particle.startDelay;
            return newParticle;
        });
    }

    // Initialize particles
    function initParticles() {
        particles = [];
        const count = isMobile() && config.performance.reduceOnMobile ?
            Math.floor(config.particles.count * config.performance.mobileMultiplier) :
            config.particles.count;

        for (let i = 0; i < count; i++) {
            particles.push(createParticle(i));
        }
    }

    // Check if device is mobile
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768;
    }

    // Draw a particle with fresh context state
    function drawParticle(particle, time) {
        if (!particle.hasStarted) {
            if (Date.now() - particle.createdAt > particle.startDelay) {
                particle.hasStarted = true;
            } else {
                return;
            }
        }

        // Update particle position
        const deltaTime = time - lastTime;
        const deltaSeconds = Math.min(deltaTime / 16, 2);

        // Calculate wind effect with occasional direction changes
        if (time - windChangeTime > 8000 + Math.random() * 8000) {
            windDirection = Math.random() > 0.5 ? 1 : -1;
            windChangeTime = time;
        }

        const wind = particle.windEffect * windDirection * particle.flutterFactor;

        // Apply movement with more flutter for petals
        particle.y += particle.speed * deltaSeconds * (particle.isHeart ? 1 : 0.9);
        particle.x += (wind + particle.sway * particle.flutterFactor * Math.sin(time * 0.001 * particle.swirl)) * deltaSeconds;
        particle.rotation += particle.rotationSpeed * deltaSeconds * (particle.isHeart ? 1 : 1.3);

        // Apply twinkle effect if enabled
        if (config.visual.twinkle) {
            const twinkle = Math.sin(time * 0.001 * particle.twinkleSpeed + particle.twinklePhase) * 0.15 + 0.85;
            particle.opacity = particle.originalOpacity * twinkle;
        }

        // Reset if particle goes off screen
        const width = canvas.width;
        const height = canvas.height;

        if (particle.y > height + particle.size * 2 ||
            particle.x < -particle.size * 2 ||
            particle.x > width + particle.size * 2) {

            // Reset to top with some randomness
            particle.y = -particle.size - Math.random() * 100;
            particle.x = Math.random() * width;
            particle.hasStarted = true;
            particle.lastWidth = width;
            particle.lastHeight = height;
            // Give it a fresh rotation
            particle.rotation = Math.random() * Math.PI * 2;
        }

        // Draw the particle with fresh context state
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
        ctx.setTransform(1, 0, 0, 1, particle.x, particle.y);
        ctx.rotate(particle.rotation);

        // Set opacity and color
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;

        // Draw the appropriate shape
        if (particle.isHeart) {
            drawHeart(ctx, particle.size);
        } else {
            drawPetal(ctx, particle.size);
        }

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

        // Draw all particles
        for (let i = 0; i < particles.length; i++) {
            drawParticle(particles[i], time);
        }

        lastTime = time;
        animationId = requestAnimationFrame(animate);
    }

    // Start Valentine's effect
    function startValentines() {
        if (!isSeasonalContentEnabled()) return;

        stopValentines();
        initCanvas();
        initParticles();

        lastTime = performance.now();
        windChangeTime = lastTime;
        isInitialized = true;

        // Start animation
        animate(lastTime);
    }

    // Stop Valentine's effect
    function stopValentines() {
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

        particles = [];
        isInitialized = false;
    }

    // Update based on current settings
    function updateValentines() {
        if (isSeasonalContentEnabled()) {
            startValentines();
        } else {
            stopValentines();
        }
    }

    // Initialize effect
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                updateValentines();
                setupSettingsListener();
            });
        } else {
            updateValentines();
            setupSettingsListener();
        }
    }

    // Listen for settings changes
    function setupSettingsListener() {
        // Listen for the themeChanged event that settings.js dispatches
        document.addEventListener('themeChanged', updateValentines);

        // Also check for settings changes periodically (fallback)
        let lastSeasonalSetting = isSeasonalContentEnabled();
        setInterval(() => {
            const currentSeasonalSetting = isSeasonalContentEnabled();
            if (currentSeasonalSetting !== lastSeasonalSetting) {
                lastSeasonalSetting = currentSeasonalSetting;
                updateValentines();
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
                repositionParticles();
            }
        }
    }

    // Check for zoom more frequently
    setInterval(checkForZoom, 50);

    init();
})();