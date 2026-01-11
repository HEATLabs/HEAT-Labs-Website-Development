// Tank Game JavaScript
class TankGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameRunning = false;
        this.gamePaused = false;
        this.lastTime = 0;
        this.enemies = [];
        this.particles = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.enemySpawnTimer = 0;
        this.wave = 1;
        this.score = 0;
        this.playerHealth = 100;
        this.gameOver = false;
        this.keys = {};
        this.totalKills = 0;
        this.healthPacksCollected = 0;
        this.isFullscreen = false;
        this.fullscreenControlsVisible = true;
        this.fullscreenControlsTimeout = null;
        this.survivalTime = 0;
        this.startTime = 0;

        // Auto-fire properties
        this.isMouseDown = false;
        this.autoFireTimer = 0;
        this.autoFireInterval = 0;

        // Wave system
        this.waveSystem = {
            currentWave: 1,
            waveEnemiesTarget: 0,
            waveEnemiesSpawned: 0,
            waveTimeLimit: 60000,
            waveTimer: 0,
            waveActive: false,
            waveStarting: false,
            waveStartCountdown: 5,
            waveStartTimer: 0,
            waveEnemyCounts: [0, 1, 2, 4, 6, 8, 10],
            baseEnemyIncrement: 2,
            scalingFactor: 1
        };

        // Camera system for centering player
        this.camera = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            offsetX: 0,
            offsetY: 0
        };

        // Game world dimensions
        this.world = {
            width: 5000,
            height: 5000
        };

        // Rocks/obstacles configuration
        this.rocks = [];
        this.rockSettings = {
            count: 60,
            minSize: 30,
            maxSize: 100,
            minPoints: 5,
            maxPoints: 12,
            irregularity: 0.3,
            spacing: 200,
            color: '#6B7280',
            colorVariation: 20
        };

        // Health packs configuration
        this.healthPacks = [];
        this.healthPackSettings = {
            count: 20,
            minSize: 50,
            maxSize: 55,
            healthAmount: 25,
            respawnTime: 30000,
            color: '#10B981',
            glowColor: '#34D399',
            spacing: 300,
            minDistanceFromPlayer: 400,
            pulseSpeed: 0.05,
            rotationSpeed: 0.02
        };

        // Track health pack respawn timers
        this.healthPackRespawnTimers = [];

        // Enemy indicators configuration
        this.enemyIndicators = {
            enabled: true,
            size: 24,
            margin: 20,
            color: '#F44336',
            dangerColor: '#8B0000',
            warningColor: '#FF3D00',
            safeColor: '#FFC107',
            pulseSpeed: 0.005,
            arrowLength: 15,
            arrowWidth: 10,
            maxDistanceForIndicator: 5000,
            glowIntensity: 0.2,
            innerGlowColor: '#FFFFFF',
            pulseScale: 0.1,
            dangerThreshold: 1000,
            warningThreshold: 2500
        };

        // Player tank configuration
        this.playerTank = {
            x: this.world.width / 2,
            y: this.world.height / 2,
            width: 80,
            height: 60,
            speed: 5,
            rotation: 0,
            turretRotation: 0,
            lastShot: 0,
            shootCooldown: 500,
            color: '#4CAF50',
            hullOffsetX: 0,
            hullOffsetY: 0,
            // Turret configuration
            turretWidth: 50,
            turretHeight: 40,
            turretOffsetX: 0,
            turretOffsetY: 0,
            // Gun barrel configuration
            barrelLength: 30,
            barrelWidth: 6,
            barrelOffsetX: 0,
            barrelOffsetY: -15,

            // Smooth movement properties
            velocityX: 0,
            velocityY: 0,
            targetRotation: 0,
            rotationSpeed: 0.08,
            acceleration: 0.2,
            deceleration: 0.15,
            maxSpeed: 5,
            currentSpeed: 0
        };

        // Enemy tank configuration
        this.enemyConfig = {
            width: 70,
            height: 50,
            speed: 2,
            shootCooldown: 500,
            color: '#F44336',
            hullOffsetX: 0,
            hullOffsetY: 0,
            // Turret configuration
            turretWidth: 45,
            turretHeight: 35,
            turretOffsetX: 0,
            turretOffsetY: 0,
            // Gun barrel configuration
            barrelLength: 25,
            barrelWidth: 5,
            barrelOffsetX: 0,
            barrelOffsetY: -12
        };

        // Game settings
        this.settings = {
            enemySpawnRate: 2000,
            maxEnemies: 100,
            bulletSpeed: 10,
            enemyBulletSpeed: 7,
            particleLifetime: 1000,
            debugMode: false,
            rapidFire: false,
            enemySpawnDistance: 400,
            enemyDespawnDistance: 800,
            enemyCollisionRepulsion: 0.5,
            enemySeparationDistance: 80,
            enemyObstacleDetectionRange: 200,
            enemyPathfindingAttempts: 5,
            enemySmoothMovement: true,
            enemyAvoidanceForce: 1.5,
            enemyPursuitForce: 1.0,
            enemyWanderForce: 0.3,
            enemyRotationSpeed: 0.05,
            enemyTurretTrackingSpeed: 0.1,
            enemyMemorySize: 10,
            enemyStuckThreshold: 60,
            enemyStuckEscapeForce: 2.0
        };

        // Score configuration
        this.scoreSystem = {
            enemyKill: 25,
            healthPack: 10,
            baseWaveComplete: 100,
            waveBonusIncrement: 50,
            waveBonusInterval: 10
        };

        // Button elements cache
        this.buttonElements = {
            pause: null,
            startOverlay: null,
            restartOverlay: null,
            fullscreen: null,
            exitFullscreen: null,
            fullscreenPause: null
        };

        // Wave timer element
        this.waveTimerElement = null;

        // Animation for indicators
        this.indicatorPhase = 0;

        // Notification system
        this.notifications = [];
        this.notificationSettings = {
            maxNotifications: 5,
            notificationDuration: 2000,
            verticalSpacing: 60,
            minTopPosition: 50,
            maxTopPosition: 250,
            initialTopPosition: 80
        };

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupCanvas();
            this.setupEventListeners();
            this.calculateOffsets();
            this.setupCamera();
            this.generateRocks();
            this.generateHealthPacks();
            this.createWaveTimerElement();
            this.createFullscreenControls();
            this.updateButtonStates();

            // Show start overlay by default
            const startOverlay = document.getElementById('startOverlay');
            if (startOverlay) {
                startOverlay.style.display = 'flex';
            }
        });
    }

    createFullscreenControls() {
        // Create fullscreen control bar
        const fullscreenBar = document.createElement('div');
        fullscreenBar.className = 'fullscreen-controls-bar';
        fullscreenBar.id = 'fullscreenControlsBar';

        // Create stats container
        const statsContainer = document.createElement('div');
        statsContainer.className = 'fullscreen-stats';

        // Create all stat items
        const statItems = [{
                id: 'fullscreenScore',
                label: 'Score',
                value: '0'
            },
            {
                id: 'fullscreenWave',
                label: 'Wave',
                value: '1'
            },
            {
                id: 'fullscreenHealth',
                label: 'Health',
                value: '100'
            },
            {
                id: 'fullscreenEnemies',
                label: 'Enemies',
                value: '0'
            },
            {
                id: 'fullscreenKills',
                label: 'Kills',
                value: '0'
            },
            {
                id: 'fullscreenHealthPacks',
                label: 'Health Packs',
                value: '0'
            },
            {
                id: 'fullscreenSurvivalTime',
                label: 'Survival Time',
                value: '00:00'
            }
        ];

        statItems.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'fullscreen-stat-item';

            const statValue = document.createElement('div');
            statValue.className = 'fullscreen-stat-value';
            statValue.id = stat.id;
            statValue.textContent = stat.value;

            const statLabel = document.createElement('div');
            statLabel.className = 'fullscreen-stat-label';
            statLabel.textContent = stat.label;

            statItem.appendChild(statValue);
            statItem.appendChild(statLabel);
            statsContainer.appendChild(statItem);
        });

        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'fullscreen-buttons';

        // Exit Fullscreen button
        const exitFullscreenBtn = document.createElement('button');
        exitFullscreenBtn.className = 'tank-game-btn secondary';
        exitFullscreenBtn.id = 'exitFullscreen';
        exitFullscreenBtn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';

        // Pause button
        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'tank-game-btn secondary';
        pauseBtn.id = 'fullscreenPause';
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';

        buttonsContainer.appendChild(exitFullscreenBtn);
        buttonsContainer.appendChild(pauseBtn);

        fullscreenBar.appendChild(statsContainer);
        fullscreenBar.appendChild(buttonsContainer);

        // Add to body
        document.body.appendChild(fullscreenBar);

        // Cache button elements
        this.buttonElements.exitFullscreen = exitFullscreenBtn;
        this.buttonElements.fullscreenPause = pauseBtn;

        // Add event listeners
        exitFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        pauseBtn.addEventListener('click', () => this.togglePause());
    }

    createWaveTimerElement() {
        // Create wave timer element
        this.waveTimerElement = document.createElement('div');
        this.waveTimerElement.className = 'wave-timer';
        this.waveTimerElement.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background-color: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            font-size: 16px;
            z-index: 100;
            pointer-events: none;
            border: 2px solid #4CAF50;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            display: none;
        `;
        this.canvas.parentElement.appendChild(this.waveTimerElement);
    }

    updateWaveTimerDisplay() {
        if (!this.waveTimerElement || !this.gameRunning) return;

        if (this.waveSystem.waveStarting) {
            const countdown = Math.ceil(this.waveSystem.waveStartCountdown - this.waveSystem.waveStartTimer / 1000);
            const formattedCountdown = countdown < 10 ? `0${countdown}` : countdown;
            this.waveTimerElement.textContent = `Wave ${this.waveSystem.currentWave} starts in ${formattedCountdown} seconds!`;
            this.waveTimerElement.style.display = 'block';
            this.waveTimerElement.style.borderColor = '#FF9800'; // Orange for countdown
        } else if (this.waveSystem.waveActive) {
            const timeLeft = Math.ceil(this.waveSystem.waveTimer / 1000);
            const formattedTimeLeft = timeLeft < 10 ? `0${timeLeft}` : timeLeft;
            this.waveTimerElement.textContent = `Wave ${this.waveSystem.currentWave} - ${formattedTimeLeft}s remaining`;
            this.waveTimerElement.style.display = 'block';
            this.waveTimerElement.style.borderColor = timeLeft < 10 ? '#F44336' : '#4CAF50'; // Red when under 10s
        } else {
            this.waveTimerElement.style.display = 'none';
        }
    }

    updateFullscreenStats() {
        if (!this.isFullscreen) return;

        const stats = {
            fullscreenScore: this.score,
            fullscreenWave: this.waveSystem.currentWave,
            fullscreenHealth: this.playerHealth,
            fullscreenEnemies: this.enemies.length,
            fullscreenKills: this.totalKills,
            fullscreenHealthPacks: this.healthPacksCollected,
            fullscreenSurvivalTime: this.formatTime(this.survivalTime)
        };

        for (const [id, value] of Object.entries(stats)) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }
    }

    updateButtonStates() {
        // Get button elements (if not already cached)
        if (!this.buttonElements.pause) {
            this.buttonElements.pause = document.getElementById('pauseGame');
        }
        if (!this.buttonElements.startOverlay) {
            this.buttonElements.startOverlay = document.getElementById('startGameFromOverlay');
        }
        if (!this.buttonElements.restartOverlay) {
            this.buttonElements.restartOverlay = document.getElementById('restartFromOverlay');
        }
        if (!this.buttonElements.fullscreen) {
            this.buttonElements.fullscreen = document.getElementById('fullscreenGame');
        }

        const {
            pause,
            fullscreen
        } = this.buttonElements;

        if (!pause || !fullscreen) return;

        // Update fullscreen button icon and state
        if (this.isFullscreen) {
            fullscreen.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
        } else {
            fullscreen.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
        }

        fullscreen.disabled = false;
        fullscreen.classList.remove('disabled');

        // Update button states based on game state
        if (this.gameOver) {
            // Game over state
            pause.disabled = true;
            pause.classList.add('disabled');
        } else if (!this.gameRunning) {
            // Game not started state
            pause.disabled = true;
            pause.classList.add('disabled');
        } else if (this.gamePaused) {
            // Game paused state
            pause.disabled = false;
            pause.classList.remove('disabled');

            // Change pause button to resume
            const pauseIcon = pause.querySelector('i');
            const pauseText = pause.lastChild;
            if (pauseIcon) pauseIcon.className = 'fas fa-play';
            if (pauseText && pauseText.nodeType === 3) {
                pauseText.textContent = ' Resume';
            } else {
                const span = pause.querySelector('span');
                if (span) span.textContent = 'Resume';
            }
        } else {
            // Game running state
            pause.disabled = false;
            pause.classList.remove('disabled');

            // Ensure pause button shows pause icon
            const pauseIcon = pause.querySelector('i');
            const pauseText = pause.lastChild;
            if (pauseIcon) pauseIcon.className = 'fas fa-pause';
            if (pauseText && pauseText.nodeType === 3) {
                pauseText.textContent = ' Pause';
            } else {
                const span = pause.querySelector('span');
                if (span) span.textContent = 'Pause';
            }
        }

        // Update fullscreen controls
        this.updateFullscreenControls();
    }

    updateFullscreenControls() {
        if (!this.isFullscreen) return;

        const fullscreenPauseBtn = this.buttonElements.fullscreenPause;
        if (fullscreenPauseBtn) {
            if (this.gamePaused) {
                fullscreenPauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            } else {
                fullscreenPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            }
        }
    }

    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;

        if (this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }

        this.updateButtonStates();
        this.setupCamera();
        this.resizeCanvas();
    }

    enterFullscreen() {
        const container = document.querySelector('.tank-game-section');
        const canvasContainer = document.querySelector('.tank-game-canvas-container');

        if (container && canvasContainer) {
            container.classList.add('tank-game-fullscreen');

            // Show fullscreen controls
            const controlsBar = document.getElementById('fullscreenControlsBar');
            if (controlsBar) {
                controlsBar.classList.add('visible');
                this.showFullscreenControls();
            }

            // Hide wave timer
            if (this.waveTimerElement) {
                this.waveTimerElement.style.display = 'none';
            }

            // Update stats
            this.updateFullscreenStats();
        }
    }

    exitFullscreen() {
        const container = document.querySelector('.tank-game-section');
        const canvasContainer = document.querySelector('.tank-game-canvas-container');

        if (container && canvasContainer) {
            container.classList.remove('tank-game-fullscreen');

            // Hide fullscreen controls
            const controlsBar = document.getElementById('fullscreenControlsBar');
            if (controlsBar) {
                controlsBar.classList.remove('visible');
            }

            // Show wave timer if game is running
            if (this.gameRunning && !this.gameOver) {
                this.updateWaveTimerDisplay();
            }
        }
    }

    showFullscreenControls() {
        const controlsBar = document.getElementById('fullscreenControlsBar');
        if (!controlsBar) return;

        controlsBar.classList.add('visible');

        // Clear previous timeout
        if (this.fullscreenControlsTimeout) {
            clearTimeout(this.fullscreenControlsTimeout);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('tankGameCanvas');
        if (!this.canvas) {
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.setupCamera();
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;

        if (this.isFullscreen) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }

        // Update camera when canvas resizes
        this.setupCamera();
    }

    // Calculate proper offsets for player tank
    calculateOffsets() {
        // Hull centered on tank position
        this.playerTank.hullOffsetX = -this.playerTank.width / 2;
        this.playerTank.hullOffsetY = -this.playerTank.height / 2;

        // Turret centered on hull
        this.playerTank.turretOffsetX = -this.playerTank.turretWidth / 2;
        this.playerTank.turretOffsetY = -this.playerTank.turretHeight / 2;

        // Calculate enemy tank offsets
        this.enemyConfig.hullOffsetX = -this.enemyConfig.width / 2;
        this.enemyConfig.hullOffsetY = -this.enemyConfig.height / 2;

        this.enemyConfig.turretOffsetX = -this.enemyConfig.turretWidth / 2;
        this.enemyConfig.turretOffsetY = -this.enemyConfig.turretHeight / 2;
    }

    setupCamera() {
        // Camera is centered on player
        this.camera.width = this.canvas.width;
        this.camera.height = this.canvas.height;
        this.camera.offsetX = this.canvas.width / 2;
        this.camera.offsetY = this.canvas.height / 2;

        // Initialize camera position to player position
        this.camera.x = this.playerTank.x - this.camera.offsetX;
        this.camera.y = this.playerTank.y - this.camera.offsetY;

        // Clamp camera to world bounds
        this.clampCamera();
    }

    clampCamera() {
        // Prevent camera from showing outside world bounds
        const maxX = this.world.width - this.camera.width;
        const maxY = this.world.height - this.camera.height;

        this.camera.x = Math.max(0, Math.min(this.camera.x, maxX));
        this.camera.y = Math.max(0, Math.min(this.camera.y, maxY));
    }

    updateCamera() {
        // Calculate desired camera position
        const targetX = this.playerTank.x - this.camera.offsetX;
        const targetY = this.playerTank.y - this.camera.offsetY;

        // Smooth camera movement
        const lerpFactor = 0.1;
        this.camera.x += (targetX - this.camera.x) * lerpFactor;
        this.camera.y += (targetY - this.camera.y) * lerpFactor;

        // Clamp camera to world bounds
        this.clampCamera();
    }

    setupEventListeners() {
        // Get button elements
        this.buttonElements.pause = document.getElementById('pauseGame');
        this.buttonElements.startOverlay = document.getElementById('startGameFromOverlay');
        this.buttonElements.restartOverlay = document.getElementById('restartFromOverlay');
        this.buttonElements.fullscreen = document.getElementById('fullscreenGame');

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameRunning || this.gameOver) {
                this.keys[e.key.toLowerCase()] = true;

                if (e.key === ' ') {
                    e.preventDefault();
                    if (!this.keys[' ']) {
                        this.shoot();
                    }
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // Mouse controls for turret
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameRunning && !this.gameOver) return;

            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + this.camera.x;
            const mouseY = e.clientY - rect.top + this.camera.y;

            // Calculate angle from tank to mouse
            const dx = mouseX - this.playerTank.x;
            const dy = mouseY - this.playerTank.y;
            this.playerTank.turretRotation = Math.atan2(dy, dx);
        });

        // Mouse click to shoot
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameRunning && !this.gameOver && !this.gamePaused) {
                e.preventDefault();
                this.isMouseDown = true;
                this.autoFireTimer = 0;
                // Fire immediately on click
                this.shoot();
            }
        });

        // Mouse up to stop auto-fire
        this.canvas.addEventListener('mouseup', (e) => {
            if (this.gameRunning && !this.gameOver && !this.gamePaused) {
                e.preventDefault();
                this.isMouseDown = false;
            }
        });

        // Mouse leave canvas, stop auto-fire
        this.canvas.addEventListener('mouseleave', (e) => {
            this.isMouseDown = false;
        });

        // Mouse click to shoot
        this.canvas.addEventListener('click', (e) => {
            if (this.gameRunning && !this.gameOver && !this.gamePaused) {
                e.preventDefault();
            }
        });

        // Game control buttons
        if (this.buttonElements.pause) {
            this.buttonElements.pause.addEventListener('click', () => {
                this.togglePause();
            });
        }

        // Fullscreen button
        if (this.buttonElements.fullscreen) {
            this.buttonElements.fullscreen.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }

        // Overlay buttons
        if (this.buttonElements.startOverlay) {
            this.buttonElements.startOverlay.addEventListener('click', () => {
                this.startGame();
            });
        }

        if (this.buttonElements.restartOverlay) {
            this.buttonElements.restartOverlay.addEventListener('click', () => {
                this.startGame();
            });
        }

        // Debug toggle (DEBUG)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.settings.debugMode = !this.settings.debugMode;
                this.showMessage(`Debug mode: ${this.settings.debugMode ? 'ON' : 'OFF'}`);
            }
        });

        // Toggle enemy indicators (DEBUG)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'i') {
                e.preventDefault();
                this.enemyIndicators.enabled = !this.enemyIndicators.enabled;
                this.showMessage(`Enemy indicators: ${this.enemyIndicators.enabled ? 'ON' : 'OFF'}`);
            }
        });

        // Regenerate rocks on R key (DEBUG)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.generateRocks();
                this.showMessage('Regenerated rocks');
            }
        });

        // Regenerate health packs on H key (DEBUG)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' && e.ctrlKey) {
                e.preventDefault();
                this.generateHealthPacks();
                this.showMessage('Regenerated health packs');
            }
        });

        // Pause with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.gameRunning && !this.gameOver) {
                e.preventDefault();
                this.togglePause();
            }
        });

        // Rapid Fire toggle (DEBUG CHEAT)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                this.settings.rapidFire = !this.settings.rapidFire;
                this.showMessage(`Rapid Fire: ${this.settings.rapidFire ? 'Enabled' : 'Disabled'}`);
                if (this.settings.rapidFire === true) {
                    this.playerTank.shootCooldown = 0;
                }
                if (this.settings.rapidFire === false) {
                    this.playerTank.shootCooldown = 500;
                }
            }
        });

        // Initial button state
        this.updateButtonStates();
    }

    // Generate random rocks with irregular shapes
    generateRocks() {
        this.rocks = [];
        const maxAttempts = this.rockSettings.count * 10;
        let attempts = 0;
        let rocksGenerated = 0;

        while (rocksGenerated < this.rockSettings.count && attempts < maxAttempts) {
            attempts++;

            // Generate random position
            const x = Math.random() * (this.world.width - 100) + 50;
            const y = Math.random() * (this.world.height - 100) + 50;

            // Avoid spawning rocks too close to player's starting position
            const dx = x - this.playerTank.x;
            const dy = y - this.playerTank.y;
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

            if (distanceToPlayer < 300) {
                continue; // Too close to player start
            }

            // Check minimum spacing from other rocks
            let tooClose = false;
            for (const rock of this.rocks) {
                const rockDx = x - rock.x;
                const rockDy = y - rock.y;
                const distance = Math.sqrt(rockDx * rockDx + rockDy * rockDy);

                if (distance < this.rockSettings.spacing) {
                    tooClose = true;
                    break;
                }
            }

            if (tooClose) {
                continue;
            }

            // Generate rock size
            const size = this.rockSettings.minSize + Math.random() *
                (this.rockSettings.maxSize - this.rockSettings.minSize);

            // Generate rock shape
            const points = this.generateRockShape(size);

            // Generate rock color with variation
            const color = this.getRandomRockColor();

            // Create rock
            this.rocks.push({
                x,
                y,
                size,
                points,
                color,
                radius: size / 2 * 1.2
            });

            rocksGenerated++;
        }
    }

    // Generate random health packs around the map
    generateHealthPacks() {
        this.healthPacks = [];
        this.healthPackRespawnTimers = [];

        const maxAttempts = this.healthPackSettings.count * 10;
        let attempts = 0;
        let packsGenerated = 0;

        while (packsGenerated < this.healthPackSettings.count && attempts < maxAttempts) {
            attempts++;

            // Generate random position
            const x = Math.random() * (this.world.width - 100) + 50;
            const y = Math.random() * (this.world.height - 100) + 50;

            // Avoid spawning health packs too close to player's starting position
            const dx = x - this.playerTank.x;
            const dy = y - this.playerTank.y;
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

            if (distanceToPlayer < this.healthPackSettings.minDistanceFromPlayer) {
                continue; // Too close to player start
            }

            // Check minimum spacing from other health packs
            let tooClose = false;
            for (const pack of this.healthPacks) {
                const packDx = x - pack.x;
                const packDy = y - pack.y;
                const distance = Math.sqrt(packDx * packDx + packDy * packDy);

                if (distance < this.healthPackSettings.spacing) {
                    tooClose = true;
                    break;
                }
            }

            if (tooClose) {
                continue;
            }

            // Check minimum spacing from rocks
            for (const rock of this.rocks) {
                const rockDx = x - rock.x;
                const rockDy = y - rock.y;
                const distance = Math.sqrt(rockDx * rockDx + rockDy * rockDy);

                if (distance < rock.radius + 50) {
                    tooClose = true;
                    break;
                }
            }

            if (tooClose) {
                continue;
            }

            // Generate health pack size
            const size = this.healthPackSettings.minSize + Math.random() *
                (this.healthPackSettings.maxSize - this.healthPackSettings.minSize);

            // Create health pack
            this.healthPacks.push({
                x,
                y,
                size,
                collected: false,
                pulsePhase: Math.random() * Math.PI * 2
            });

            packsGenerated++;
        }
    }

    // Generate irregular rock shape
    generateRockShape(baseSize) {
        const points = [];
        const numPoints = Math.floor(
            this.rockSettings.minPoints +
            Math.random() * (this.rockSettings.maxPoints - this.rockSettings.minPoints)
        );

        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;

            // Base radius with irregularity
            const irregularity = 1 + (Math.random() - 0.5) * 2 * this.rockSettings.irregularity;
            const radius = (baseSize / 2) * irregularity;

            // Add some randomness to angle
            const adjustedAngle = angle + (Math.random() - 0.5) * 0.5;

            points.push({
                x: Math.cos(adjustedAngle) * radius,
                y: Math.sin(adjustedAngle) * radius
            });
        }

        return points;
    }

    // Get random rock color with variation
    getRandomRockColor() {
        const baseColor = this.rockSettings.color;
        const variation = this.rockSettings.colorVariation;

        // Parse base color
        let r, g, b;
        if (baseColor.startsWith('#')) {
            const hex = baseColor.substring(1);
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else {
            // Default gray if parsing fails
            r = g = b = 107;
        }

        // Apply random variation
        const variationAmount = variation / 100;
        r = Math.max(0, Math.min(255, r + (Math.random() - 0.5) * 255 * variationAmount));
        g = Math.max(0, Math.min(255, g + (Math.random() - 0.5) * 255 * variationAmount));
        b = Math.max(0, Math.min(255, b + (Math.random() - 0.5) * 255 * variationAmount));

        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }

    startGame() {
        // If game is paused, resume it
        if (this.gamePaused) {
            this.togglePause();
            return;
        }

        this.resetGame();
        this.gameRunning = true;
        this.gamePaused = false;
        this.gameOver = false;

        // Start survival timer
        this.startTime = performance.now();
        this.survivalTime = 0;

        // Position player in center of world
        this.playerTank.x = this.world.width / 2;
        this.playerTank.y = this.world.height / 2;

        // Initialize camera
        this.setupCamera();

        // Hide start overlay
        const startOverlay = document.getElementById('startOverlay');
        const gameOverOverlay = document.getElementById('gameOverOverlay');

        if (startOverlay) {
            startOverlay.style.display = 'none';
        }
        if (gameOverOverlay) {
            gameOverOverlay.style.display = 'none';
        }

        // Start wave system
        this.startFirstWave();

        // Update button states
        this.updateButtonStates();

        // Start game loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    togglePause() {
        if (!this.gameRunning || this.gameOver) return;

        this.gamePaused = !this.gamePaused;

        if (!this.gamePaused) {
            // Resume game
            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.gameLoop(time));
        }

        this.updateButtonStates();
    }

    resetGame() {
        this.enemies = [];
        this.particles = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.enemySpawnTimer = 0;
        this.wave = 1;
        this.score = 0;
        this.playerHealth = 100;
        this.gameOver = false;
        this.gamePaused = false;
        this.keys = {};
        this.totalKills = 0;
        this.healthPacksCollected = 0;
        this.isMouseDown = false;
        this.autoFireTimer = 0;
        this.survivalTime = 0;
        this.startTime = 0;
        this.indicatorPhase = 0;

        // Reset wave system
        this.waveSystem.currentWave = 1;
        this.waveSystem.waveEnemiesTarget = 0;
        this.waveSystem.waveEnemiesSpawned = 0;
        this.waveSystem.waveTimer = 0;
        this.waveSystem.waveActive = false;
        this.waveSystem.waveStarting = false;
        this.waveSystem.waveStartTimer = 0;
        this.waveSystem.scalingFactor = 1;

        this.playerTank.x = this.world.width / 2;
        this.playerTank.y = this.world.height / 2;
        this.playerTank.rotation = 0;
        this.playerTank.turretRotation = 0;
        this.playerTank.velocityX = 0;
        this.playerTank.velocityY = 0;
        this.playerTank.targetRotation = 0;
        this.playerTank.currentSpeed = 0;

        // Regenerate rocks and health packs
        this.generateRocks();
        this.generateHealthPacks();

        // Clear respawn timers
        this.healthPackRespawnTimers = [];

        // Clear all notifications
        this.clearAllNotifications();

        // Hide wave timer
        if (this.waveTimerElement) {
            this.waveTimerElement.style.display = 'none';
        }

        // Don't exit fullscreen
        this.setupCamera();
        this.updateUI();
        this.updateButtonStates();
    }

    // Start first wave
    startFirstWave() {
        // Set wave 1 without incrementing
        this.waveSystem.currentWave = 1;
        this.waveSystem.scalingFactor = 1;
        this.waveSystem.waveEnemiesTarget = this.getEnemyCountForWave(this.waveSystem.currentWave);
        this.waveSystem.waveEnemiesSpawned = 0;
        this.waveSystem.waveTimer = this.waveSystem.waveTimeLimit;
        this.waveSystem.waveActive = false;
        this.waveSystem.waveStarting = true;
        this.waveSystem.waveStartTimer = 0;

        // Update UI
        this.wave = this.waveSystem.currentWave;
        this.updateUI();

        // Show wave start message
        const enemyCount = this.waveSystem.waveEnemiesTarget;
        const enemyText = enemyCount === 1 ? 'enemy' : 'enemies';
        this.showMessage(`Wave ${this.waveSystem.currentWave} - ${enemyCount} ${enemyText} incoming!`);
    }

    startNextWave() {
        this.waveSystem.currentWave++;
        const newScalingFactor = Math.pow(2, Math.floor((this.waveSystem.currentWave - 1) / 10));
        if (newScalingFactor !== this.waveSystem.scalingFactor) {
            this.waveSystem.scalingFactor = newScalingFactor;
            this.showMessage(`Wave ${this.waveSystem.currentWave}! Enemy count scaling doubled!`);
        }

        this.waveSystem.waveEnemiesTarget = this.getEnemyCountForWave(this.waveSystem.currentWave);
        this.waveSystem.waveEnemiesSpawned = 0;
        this.waveSystem.waveTimer = this.waveSystem.waveTimeLimit;
        this.waveSystem.waveActive = false;
        this.waveSystem.waveStarting = true;
        this.waveSystem.waveStartTimer = 0;

        // Update UI
        this.wave = this.waveSystem.currentWave;
        this.updateUI();

        // Show wave start message
        const enemyCount = this.waveSystem.waveEnemiesTarget;
        const enemyText = enemyCount === 1 ? 'enemy' : 'enemies';
        this.showMessage(`Wave ${this.waveSystem.currentWave} - ${enemyCount} ${enemyText} incoming!`);
    }

    // Wave scaling system
    getEnemyCountForWave(waveNumber) {
        // Handle early waves (1-6) using the predefined array
        if (waveNumber < this.waveSystem.waveEnemyCounts.length) {
            return this.waveSystem.waveEnemyCounts[waveNumber];
        }

        // For wave 7 and beyond, calculate using scaling system
        let baseWave = 7;
        let baseEnemies = 10;

        // Calculate which 10-wave block we're in
        const blockNumber = Math.floor((waveNumber - baseWave) / 10);

        // Calculate wave within current block (0-9)
        const waveInBlock = (waveNumber - baseWave) % 10;

        // Calculate scaling factor: doubles every 10 waves starting from wave 7
        const scalingFactor = Math.pow(2, blockNumber);

        // Calculate enemy count: base enemies + (2 * waveInBlock * scalingFactor)
        const additionalEnemies = this.waveSystem.baseEnemyIncrement * waveInBlock * scalingFactor;

        return baseEnemies * scalingFactor + additionalEnemies;
    }

    // Calculate wave completion reward
    getWaveReward(waveNumber) {
        // Calculate how many sets of 10 waves have been completed
        const waveSets = Math.floor((waveNumber - 1) / this.scoreSystem.waveBonusInterval);

        // Calculate reward: base + (bonus increment * waveSets)
        return this.scoreSystem.baseWaveComplete + (this.scoreSystem.waveBonusIncrement * waveSets);
    }

    startWave() {
        this.waveSystem.waveActive = true;
        this.waveSystem.waveStarting = false;

        // Get the number of enemies for this wave
        const enemiesThisWave = this.getEnemyCountForWave(this.waveSystem.currentWave);

        // Spawn ALL enemies for this wave
        for (let i = 0; i < enemiesThisWave; i++) {
            this.spawnEnemyRandomPosition();
        }

        // Update the spawned count
        this.waveSystem.waveEnemiesSpawned = enemiesThisWave;

        const enemyText = enemiesThisWave === 1 ? 'enemy' : 'enemies';
        this.showMessage(`Wave ${this.waveSystem.currentWave} has begun! ${enemiesThisWave} new ${enemyText} added!`);
    }

    // Spawn an enemy at a random position on the map
    spawnEnemyRandomPosition() {
        let attempts = 0;
        const maxAttempts = 50; // Limit attempts to prevent infinite loop

        while (attempts < maxAttempts) {
            attempts++;

            // Generate random position anywhere on the map
            const x = Math.random() * (this.world.width - 100) + 50;
            const y = Math.random() * (this.world.height - 100) + 50;

            // Don't spawn too close to player
            const dx = x - this.playerTank.x;
            const dy = y - this.playerTank.y;
            const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

            if (distanceToPlayer < 400) {
                continue; // Too close to player
            }

            // Don't spawn inside rocks
            let insideRock = false;
            for (const rock of this.rocks) {
                const rockDx = x - rock.x;
                const rockDy = y - rock.y;
                const distance = Math.sqrt(rockDx * rockDx + rockDy * rockDy);

                if (distance < rock.radius + this.enemyConfig.width / 2) {
                    insideRock = true;
                    break;
                }
            }

            if (insideRock) {
                continue; // Inside a rock
            }

            // Don't spawn too close to other enemies
            let tooCloseToEnemy = false;
            for (const enemy of this.enemies) {
                const enemyDx = x - enemy.x;
                const enemyDy = y - enemy.y;
                const distance = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);

                if (distance < 150) {
                    tooCloseToEnemy = true;
                    break;
                }
            }

            if (tooCloseToEnemy) {
                continue; // Too close to another enemy
            }

            // Don't spawn inside health packs
            let insideHealthPack = false;
            for (const pack of this.healthPacks) {
                if (!pack.collected) {
                    const packDx = x - pack.x;
                    const packDy = y - pack.y;
                    const distance = Math.sqrt(packDx * packDx + packDy * packDy);

                    if (distance < pack.size) {
                        insideHealthPack = true;
                        break;
                    }
                }
            }

            if (insideHealthPack) {
                continue; // Inside a health pack
            }

            // Found a good position, spawn enemy
            this.enemies.push({
                x: x,
                y: y,
                width: this.enemyConfig.width,
                height: this.enemyConfig.height,
                speed: this.enemyConfig.speed + Math.random() * 0.5,
                rotation: Math.random() * Math.PI * 2,
                turretRotation: Math.random() * Math.PI * 2,
                health: 100,
                lastShot: 0,
                shootCooldown: this.enemyConfig.shootCooldown + Math.random() * 1000,
                color: this.enemyConfig.color,
                hullOffsetX: this.enemyConfig.hullOffsetX,
                hullOffsetY: this.enemyConfig.hullOffsetY,
                turretWidth: this.enemyConfig.turretWidth,
                turretHeight: this.enemyConfig.turretHeight,
                turretOffsetX: this.enemyConfig.turretOffsetX,
                turretOffsetY: this.enemyConfig.turretOffsetY,
                barrelLength: this.enemyConfig.barrelLength,
                barrelWidth: this.enemyConfig.barrelWidth,
                barrelOffsetX: this.enemyConfig.barrelOffsetX,
                barrelOffsetY: this.enemyConfig.barrelOffsetY,
                // For obstacle avoidance
                avoidanceForceX: 0,
                avoidanceForceY: 0,
                // For movement
                desiredX: x,
                desiredY: y,
                // For wave system
                wave: this.waveSystem.currentWave,
                stuckTimer: 0,
                lastPositions: [],
                wanderAngle: Math.random() * Math.PI * 2,
                targetRotation: Math.random() * Math.PI * 2,
                rotationSpeed: this.settings.enemyRotationSpeed + Math.random() * 0.02
            });

            return; // Successfully spawned
        }

        // If we couldn't find a good position after max attempts, spawn anyway
        const fallbackX = Math.random() * (this.world.width - 100) + 50;
        const fallbackY = Math.random() * (this.world.height - 100) + 50;

        this.enemies.push({
            x: fallbackX,
            y: fallbackY,
            width: this.enemyConfig.width,
            height: this.enemyConfig.height,
            speed: this.enemyConfig.speed + Math.random() * 0.5,
            rotation: Math.random() * Math.PI * 2,
            turretRotation: Math.random() * Math.PI * 2,
            health: 100,
            lastShot: 0,
            shootCooldown: this.enemyConfig.shootCooldown + Math.random() * 1000,
            color: this.enemyConfig.color,
            hullOffsetX: this.enemyConfig.hullOffsetX,
            hullOffsetY: this.enemyConfig.hullOffsetY,
            turretWidth: this.enemyConfig.turretWidth,
            turretHeight: this.enemyConfig.turretHeight,
            turretOffsetX: this.enemyConfig.turretOffsetX,
            turretOffsetY: this.enemyConfig.turretOffsetY,
            barrelLength: this.enemyConfig.barrelLength,
            barrelWidth: this.enemyConfig.barrelWidth,
            barrelOffsetX: this.enemyConfig.barrelOffsetX,
            barrelOffsetY: this.enemyConfig.barrelOffsetY,
            avoidanceForceX: 0,
            avoidanceForceY: 0,
            desiredX: fallbackX,
            desiredY: fallbackY,
            wave: this.waveSystem.currentWave,
            stuckTimer: 0,
            lastPositions: [],
            wanderAngle: Math.random() * Math.PI * 2,
            targetRotation: Math.random() * Math.PI * 2,
            rotationSpeed: this.settings.enemyRotationSpeed + Math.random() * 0.02
        });
    }

    endWave() {
        this.waveSystem.waveActive = false;

        // Check if player completed the wave
        if (this.enemies.length === 0) {
            // Calculate wave reward based on the new system
            const waveReward = this.getWaveReward(this.waveSystem.currentWave);
            this.score += waveReward;

            // Show reward message with details
            this.showMessage(`Wave ${this.waveSystem.currentWave} completed! +${waveReward} points!`);

            // Show floating text for wave reward
            this.showFloatingText(`+${waveReward} Wave`,
                this.playerTank.x,
                this.playerTank.y - 50,
                '#FFD700');
        } else {
            // Keep current enemies for next wave
            const existingEnemies = this.enemies.length;
            const enemyText = existingEnemies === 1 ? 'enemy' : 'enemies';
            this.showMessage(`Wave ${this.waveSystem.currentWave} time's up! ${existingEnemies} ${enemyText} carry over to next wave.`);
        }

        // Start next wave after 3 seconds
        setTimeout(() => {
            if (this.gameRunning && !this.gameOver) {
                this.startNextWave();
            }
        }, 3000);
    }

    gameLoop(currentTime) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) {
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        if (this.gameRunning && !this.gamePaused && !this.gameOver) {
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    update(deltaTime) {
        // Update wave system
        this.updateWaveSystem(deltaTime);

        // Update survival timer
        this.updateSurvivalTimer(deltaTime);

        // Update indicator animation
        this.updateIndicatorAnimation(deltaTime);

        // Update player movement
        this.updatePlayer(deltaTime);

        // Update camera to follow player
        this.updateCamera();

        // Update enemies
        this.updateEnemies(deltaTime);

        // Update bullets
        this.updateBullets(deltaTime);

        // Update enemy bullets
        this.updateEnemyBullets(deltaTime);

        // Update particles
        this.updateParticles(deltaTime);

        // Update health packs
        this.updateHealthPacks(deltaTime);

        // Update health pack respawn timers
        this.updateHealthPackRespawnTimers(deltaTime);

        // Check collisions
        this.checkCollisions();

        // Check health pack collection
        this.checkHealthPackCollection();

        // Update UI
        this.updateUI();

        // Update fullscreen stats
        this.updateFullscreenStats();

        // Update wave timer display
        this.updateWaveTimerDisplay();

        // Update notifications
        this.updateNotifications(deltaTime);

        // Handle auto-fire
        this.handleAutoFire(deltaTime);
    }

    // Update survival timer
    updateSurvivalTimer(deltaTime) {
        if (this.gameRunning && !this.gamePaused && !this.gameOver) {
            this.survivalTime += deltaTime;
        }
    }

    // Update indicator animation
    updateIndicatorAnimation(deltaTime) {
        this.indicatorPhase += this.enemyIndicators.pulseSpeed * deltaTime;
        if (this.indicatorPhase > Math.PI * 2) {
            this.indicatorPhase -= Math.PI * 2;
        }
    }

    // Update notifications
    updateNotifications(deltaTime) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            notification.life -= deltaTime;

            if (notification.life <= 0) {
                // Remove notification element
                if (notification.element && notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
                // Remove from array
                this.notifications.splice(i, 1);
                // Recalculate positions for remaining notifications
                this.recalculateNotificationPositions();
                continue;
            }

            // Update opacity based on life
            notification.element.style.opacity = Math.min(notification.life / notification.maxLife, 1);
        }
    }

    // Recalculate positions for all notifications
    recalculateNotificationPositions() {
        let currentTop = this.notificationSettings.initialTopPosition;

        for (let i = 0; i < this.notifications.length; i++) {
            const notification = this.notifications[i];

            // Position the notification
            notification.element.style.top = `${currentTop}px`;
            notification.topPosition = currentTop;

            // Move to next position
            currentTop += this.notificationSettings.verticalSpacing;

            // Don't let notifications go too low
            if (currentTop > this.notificationSettings.maxTopPosition) {
                // If we run out of space, start removing oldest notifications
                for (let j = 0; j < i; j++) {
                    const oldNotification = this.notifications[j];
                    oldNotification.life = 0; // Mark for removal
                }
                break;
            }
        }
    }

    // Clear all notifications
    clearAllNotifications() {
        for (const notification of this.notifications) {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        }
        this.notifications = [];
    }

    // Format time in MM:SS format
    formatTime(timeInMilliseconds) {
        const totalSeconds = Math.floor(timeInMilliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Handle auto-fire when mouse is held down
    handleAutoFire(deltaTime) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;

        // Check if mouse button is held down
        if (this.isMouseDown) {
            this.autoFireTimer += deltaTime;

            // Check if it's time to fire again
            if (this.autoFireTimer >= this.autoFireInterval) {
                this.shoot();
                this.autoFireTimer = 0; // Reset timer
            }
        }

        // Check if space key is held down
        if (this.keys[' ']) {
            this.autoFireTimer += deltaTime;

            // Check if it's time to fire again
            if (this.autoFireTimer >= this.autoFireInterval) {
                this.shoot();
                this.autoFireTimer = 0; // Reset timer
            }
        }
    }

    updateWaveSystem(deltaTime) {
        if (this.waveSystem.waveStarting) {
            // Update wave start countdown
            this.waveSystem.waveStartTimer += deltaTime;

            if (this.waveSystem.waveStartTimer >= this.waveSystem.waveStartCountdown * 1000) {
                this.startWave();
            }
        } else if (this.waveSystem.waveActive) {
            // Update wave timer
            this.waveSystem.waveTimer -= deltaTime;

            // Check if wave time is up
            if (this.waveSystem.waveTimer <= 0) {
                this.endWave();
            }

            // Check if all enemies are killed
            if (this.enemies.length === 0) {
                this.endWave();
            }
        }
    }

    updatePlayer(deltaTime) {
        const deltaTimeNormalized = deltaTime / 16.67; // Normalize to 60fps, we gaming here

        // Get input direction
        let inputX = 0;
        let inputY = 0;

        if (this.keys['w'] || this.keys['arrowup']) inputY -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) inputY += 1;
        if (this.keys['a'] || this.keys['arrowleft']) inputX -= 1;
        if (this.keys['d'] || this.keys['arrowright']) inputX += 1;

        // Calculate target rotation based on input
        if (inputX !== 0 || inputY !== 0) {
            this.playerTank.targetRotation = Math.atan2(inputY, inputX);
        }

        // Smoothly rotate towards target rotation
        const angleDiff = this.normalizeAngle(this.playerTank.targetRotation - this.playerTank.rotation);
        this.playerTank.rotation += angleDiff * this.playerTank.rotationSpeed * deltaTimeNormalized;

        // Calculate movement direction based on current rotation
        const moveX = Math.cos(this.playerTank.rotation);
        const moveY = Math.sin(this.playerTank.rotation);

        // Calculate speed based on input magnitude
        const inputMagnitude = Math.sqrt(inputX * inputX + inputY * inputY);
        const targetSpeed = inputMagnitude > 0 ? this.playerTank.maxSpeed : 0;

        // Smoothly adjust current speed
        if (targetSpeed > this.playerTank.currentSpeed) {
            // Accelerate
            this.playerTank.currentSpeed = Math.min(
                targetSpeed,
                this.playerTank.currentSpeed + this.playerTank.acceleration * deltaTimeNormalized
            );
        } else if (targetSpeed < this.playerTank.currentSpeed) {
            // Decelerate
            this.playerTank.currentSpeed = Math.max(
                targetSpeed,
                this.playerTank.currentSpeed - this.playerTank.deceleration * deltaTimeNormalized
            );
        }

        // Calculate velocity based on current rotation and speed
        if (this.playerTank.currentSpeed > 0.1) {
            this.playerTank.velocityX = moveX * this.playerTank.currentSpeed;
            this.playerTank.velocityY = moveY * this.playerTank.currentSpeed;
        } else {
            // Apply friction when no input
            this.playerTank.velocityX *= 0.9;
            this.playerTank.velocityY *= 0.9;

            // Stop completely when velocity is very low
            if (Math.abs(this.playerTank.velocityX) < 0.1) this.playerTank.velocityX = 0;
            if (Math.abs(this.playerTank.velocityY) < 0.1) this.playerTank.velocityY = 0;
        }

        // Calculate new position
        let newX = this.playerTank.x + this.playerTank.velocityX;
        let newY = this.playerTank.y + this.playerTank.velocityY;

        // Check collision with rocks
        const playerRadius = this.playerTank.width / 2;
        for (const rock of this.rocks) {
            const dx = newX - rock.x;
            const dy = newY - rock.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = playerRadius + rock.radius;

            if (distance < minDistance) {
                // Collision detected - push player away
                const angle = Math.atan2(dy, dx);
                const overlap = minDistance - distance;

                newX += Math.cos(angle) * overlap;
                newY += Math.sin(angle) * overlap;

                // Reduce velocity when colliding with rock
                this.playerTank.velocityX *= 0.7;
                this.playerTank.velocityY *= 0.7;
            }
        }

        // Keep player in world bounds
        const margin = 50;
        if (newX > margin && newX < this.world.width - margin) {
            this.playerTank.x = newX;
        }
        if (newY > margin && newY < this.world.height - margin) {
            this.playerTank.y = newY;
        }
    }

    // Helper function to normalize angles
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }

    updateHealthPacks(deltaTime) {
        // Update animation for visible health packs
        for (const pack of this.healthPacks) {
            if (!pack.collected) {
                // Update pulsing animation
                pack.pulsePhase += this.healthPackSettings.pulseSpeed * deltaTime / 16.67;
                if (pack.pulsePhase > Math.PI * 2) {
                    pack.pulsePhase -= Math.PI * 2;
                }
            }
        }
    }

    updateHealthPackRespawnTimers(deltaTime) {
        // Update respawn timers for collected health packs
        for (let i = this.healthPackRespawnTimers.length - 1; i >= 0; i--) {
            const timer = this.healthPackRespawnTimers[i];
            timer.timeRemaining -= deltaTime;

            if (timer.timeRemaining <= 0) {
                // Respawn the health pack
                const packIndex = this.healthPacks.findIndex(p => p === timer.healthPack);
                if (packIndex !== -1) {
                    this.healthPacks[packIndex].collected = false;
                    this.healthPacks[packIndex].pulsePhase = Math.random() * Math.PI * 2;
                }

                // Remove the timer
                this.healthPackRespawnTimers.splice(i, 1);
            }
        }
    }

    updateEnemies(deltaTime) {
        const deltaTimeNormalized = deltaTime / 16.67; // Normalize to 60fps, ACTUAL GAMING

        // Calculate enemy movement toward player with obstacle avoidance
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];

            // Track position history for stuck detection
            enemy.lastPositions.push({
                x: enemy.x,
                y: enemy.y
            });
            if (enemy.lastPositions.length > this.settings.enemyMemorySize) {
                enemy.lastPositions.shift();
            }

            // Move toward player
            const dx = this.playerTank.x - enemy.x;
            const dy = this.playerTank.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Update turret rotation to track player
            if (distance > 0) {
                const targetTurretAngle = Math.atan2(dy, dx);
                const angleDiff = this.normalizeAngle(targetTurretAngle - enemy.turretRotation);
                enemy.turretRotation += angleDiff * this.settings.enemyTurretTrackingSpeed * deltaTimeNormalized;
            }

            // Calculate pursuit force
            let pursuitX = 0;
            let pursuitY = 0;
            if (distance > 0) {
                pursuitX = (dx / distance) * this.settings.enemyPursuitForce;
                pursuitY = (dy / distance) * this.settings.enemyPursuitForce;
            }

            // Calculate obstacle avoidance force
            let avoidanceX = 0;
            let avoidanceY = 0;

            // Avoid rocks
            for (const rock of this.rocks) {
                const rockDx = rock.x - enemy.x;
                const rockDy = rock.y - enemy.y;
                const rockDistance = Math.sqrt(rockDx * rockDx + rockDy * rockDy);
                const minDistance = enemy.width / 2 + rock.radius + 20;

                if (rockDistance < minDistance * 2) {
                    // Calculate repulsion force
                    const force = Math.max(0, 1 - (rockDistance / (minDistance * 2)));
                    avoidanceX -= (rockDx / rockDistance) * force * this.settings.enemyAvoidanceForce;
                    avoidanceY -= (rockDy / rockDistance) * force * this.settings.enemyAvoidanceForce;
                }
            }

            // Avoid other enemies
            for (let j = 0; j < this.enemies.length; j++) {
                if (i === j) continue;

                const otherEnemy = this.enemies[j];
                const enemyDx = otherEnemy.x - enemy.x;
                const enemyDy = otherEnemy.y - enemy.y;
                const enemyDistance = Math.sqrt(enemyDx * enemyDx + enemyDy * enemyDy);
                const minEnemyDistance = enemy.width + 30;

                if (enemyDistance < minEnemyDistance * 1.5) {
                    // Calculate repulsion force
                    const force = Math.max(0, 1 - (enemyDistance / (minEnemyDistance * 1.5)));
                    avoidanceX -= (enemyDx / enemyDistance) * force * this.settings.enemyAvoidanceForce * 0.7;
                    avoidanceY -= (enemyDy / enemyDistance) * force * this.settings.enemyAvoidanceForce * 0.7;
                }
            }

            // Add some wander behavior to prevent clustering
            enemy.wanderAngle += (Math.random() - 0.5) * 0.5;
            const wanderX = Math.cos(enemy.wanderAngle) * this.settings.enemyWanderForce;
            const wanderY = Math.sin(enemy.wanderAngle) * this.settings.enemyWanderForce;

            // Combine forces
            let desiredX = pursuitX + avoidanceX + wanderX;
            let desiredY = pursuitY + avoidanceY + wanderY;

            // Normalize desired direction
            const desiredLength = Math.sqrt(desiredX * desiredX + desiredY * desiredY);
            if (desiredLength > 0) {
                desiredX /= desiredLength;
                desiredY /= desiredLength;

                // Calculate target rotation
                enemy.targetRotation = Math.atan2(desiredY, desiredX);

                // Smoothly rotate toward target
                const angleDiff = this.normalizeAngle(enemy.targetRotation - enemy.rotation);
                enemy.rotation += angleDiff * enemy.rotationSpeed * deltaTimeNormalized;

                // Move in the direction enemy is facing
                enemy.desiredX = enemy.x + Math.cos(enemy.rotation) * enemy.speed;
                enemy.desiredY = enemy.y + Math.sin(enemy.rotation) * enemy.speed;
            }

            // Check if enemy is stuck
            if (enemy.lastPositions.length >= 5) {
                const recentPos = enemy.lastPositions[enemy.lastPositions.length - 1];
                const oldPos = enemy.lastPositions[0];
                const movedDistance = Math.sqrt(
                    Math.pow(recentPos.x - oldPos.x, 2) +
                    Math.pow(recentPos.y - oldPos.y, 2)
                );

                if (movedDistance < 10) {
                    enemy.stuckTimer++;
                    if (enemy.stuckTimer > this.settings.enemyStuckThreshold) {
                        // Apply escape force in random direction
                        const escapeAngle = Math.random() * Math.PI * 2;
                        enemy.desiredX = enemy.x + Math.cos(escapeAngle) * this.settings.enemyStuckEscapeForce;
                        enemy.desiredY = enemy.y + Math.sin(escapeAngle) * this.settings.enemyStuckEscapeForce;
                        enemy.stuckTimer = 0;
                        enemy.lastPositions = []; // Clear position history
                    }
                } else {
                    enemy.stuckTimer = Math.max(0, enemy.stuckTimer - 2);
                }
            }

            // Enemy shooting
            if (distance < 400) {
                enemy.lastShot += deltaTime;
                if (enemy.lastShot >= enemy.shootCooldown) {
                    this.enemyShoot(enemy);
                    enemy.lastShot = 0;
                }
            }
        }

        // Handle collisions with rocks after movement
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Check collision with rocks
            const enemyRadius = enemy.width / 2;
            let collisionDetected = false;

            for (const rock of this.rocks) {
                const dx = enemy.desiredX - rock.x;
                const dy = enemy.desiredY - rock.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = enemyRadius + rock.radius;

                if (distance < minDistance) {
                    // Push enemy away from rock
                    const angle = Math.atan2(dy, dx);
                    const overlap = minDistance - distance;

                    enemy.desiredX += Math.cos(angle) * overlap * 1.2;
                    enemy.desiredY += Math.sin(angle) * overlap * 1.2;
                    collisionDetected = true;
                }
            }

            // Apply movement if position changed
            const moveX = enemy.desiredX - enemy.x;
            const moveY = enemy.desiredY - enemy.y;
            const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);

            if (moveDistance > 0) {
                // Limit movement to avoid overshooting
                const maxMove = enemy.speed * 2;
                if (moveDistance > maxMove) {
                    enemy.desiredX = enemy.x + (moveX / moveDistance) * maxMove;
                    enemy.desiredY = enemy.y + (moveY / moveDistance) * maxMove;
                }

                enemy.x = enemy.desiredX;
                enemy.y = enemy.desiredY;
            }

            // Remove enemies that are out of world bounds
            const margin = 100;
            if (enemy.x < -margin || enemy.x > this.world.width + margin ||
                enemy.y < -margin || enemy.y > this.world.height + margin) {
                this.enemies.splice(i, 1);
            }
        }
    }

    enemyShoot(enemy) {
        // Calculate bullet spawn position at the end of the gun barrel
        const barrelEndX = Math.cos(enemy.turretRotation) * enemy.barrelLength;
        const barrelEndY = Math.sin(enemy.turretRotation) * enemy.barrelLength;

        const bullet = {
            x: enemy.x + barrelEndX,
            y: enemy.y + barrelEndY,
            rotation: enemy.turretRotation,
            speed: this.settings.enemyBulletSpeed,
            damage: 10
        };

        this.enemyBullets.push(bullet);

        // Muzzle flash at barrel end
        this.createParticles(bullet.x, bullet.y, 5, '#ff6b6b');
    }

    shoot() {
        const currentTime = performance.now();
        if (currentTime - this.playerTank.lastShot < this.playerTank.shootCooldown) {
            return;
        }

        this.playerTank.lastShot = currentTime;

        // Calculate bullet spawn position at the end of the gun barrel
        const barrelEndX = Math.cos(this.playerTank.turretRotation) * this.playerTank.barrelLength;
        const barrelEndY = Math.sin(this.playerTank.turretRotation) * this.playerTank.barrelLength;

        const bullet = {
            x: this.playerTank.x + barrelEndX,
            y: this.playerTank.y + barrelEndY,
            rotation: this.playerTank.turretRotation,
            speed: this.settings.bulletSpeed,
            damage: 50
        };

        this.bullets.push(bullet);

        // Muzzle flash at barrel end
        this.createParticles(bullet.x, bullet.y, 8, '#4CAF50');
    }

    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            bullet.x += Math.cos(bullet.rotation) * bullet.speed;
            bullet.y += Math.sin(bullet.rotation) * bullet.speed;

            // Check collision with rocks
            let hitRock = false;
            for (const rock of this.rocks) {
                const dx = bullet.x - rock.x;
                const dy = bullet.y - rock.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < rock.radius) {
                    // Hit rock
                    this.createParticles(bullet.x, bullet.y, 10, rock.color);
                    this.bullets.splice(i, 1);
                    hitRock = true;
                    break;
                }
            }

            if (hitRock) continue;

            // Remove bullets that are out of world bounds
            if (bullet.x < 0 || bullet.x > this.world.width ||
                bullet.y < 0 || bullet.y > this.world.height) {
                this.bullets.splice(i, 1);
            }
        }
    }

    updateEnemyBullets(deltaTime) {
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];

            bullet.x += Math.cos(bullet.rotation) * bullet.speed;
            bullet.y += Math.sin(bullet.rotation) * bullet.speed;

            // Check collision with rocks
            let hitRock = false;
            for (const rock of this.rocks) {
                const dx = bullet.x - rock.x;
                const dy = bullet.y - rock.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < rock.radius) {
                    // Hit rock - create particles and remove bullet
                    this.createParticles(bullet.x, bullet.y, 10, rock.color);
                    this.enemyBullets.splice(i, 1);
                    hitRock = true;
                    break;
                }
            }

            if (hitRock) continue;

            // Remove bullets that are out of world bounds
            if (bullet.x < 0 || bullet.x > this.world.width ||
                bullet.y < 0 || bullet.y > this.world.height) {
                this.enemyBullets.splice(i, 1);
            }
        }
    }

    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.life -= deltaTime;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.alpha = particle.life / particle.maxLife;
        }
    }

    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];

                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < enemy.width / 2) {
                    // Hit!
                    enemy.health -= bullet.damage;

                    // Create hit particles
                    this.createParticles(enemy.x, enemy.y, 15, enemy.color);

                    // Remove bullet
                    this.bullets.splice(i, 1);

                    // Check if enemy is dead
                    if (enemy.health <= 0) {
                        this.enemies.splice(j, 1);

                        // Add enemy kill points
                        this.score += this.scoreSystem.enemyKill;

                        // Increment total kills counter
                        this.totalKills++;

                        // Create particles and floating text for enemy kill
                        this.createParticles(enemy.x, enemy.y, 30, '#FFD700');
                        this.showFloatingText(`+${this.scoreSystem.enemyKill} Kill`, enemy.x, enemy.y, '#FFD700');
                    }

                    break;
                }
            }
        }

        // Enemy bullets vs player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const bullet = this.enemyBullets[i];

            const dx = bullet.x - this.playerTank.x;
            const dy = bullet.y - this.playerTank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.playerTank.width / 2) {
                // Hit player!
                this.playerHealth -= bullet.damage;

                // Create hit particles
                this.createParticles(this.playerTank.x, this.playerTank.y, 10, '#ff6b6b');

                // Remove bullet
                this.enemyBullets.splice(i, 1);

                // Screen shake effect
                this.screenShake(10);

                // Check game over
                if (this.playerHealth <= 0) {
                    this.playerHealth = 0;
                    this.gameOver = true;
                    this.gameRunning = false;
                    this.updateButtonStates();
                    this.showGameOver();
                }
            }
        }

        // Enemy vs player collision
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            const dx = enemy.x - this.playerTank.x;
            const dy = enemy.y - this.playerTank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (enemy.width / 2 + this.playerTank.width / 2)) {
                // RAM!
                this.playerHealth -= 5;

                // Push player away
                const angle = Math.atan2(dy, dx);
                this.playerTank.x -= Math.cos(angle) * 10;
                this.playerTank.y -= Math.sin(angle) * 10;

                // Reduce velocity when colliding
                this.playerTank.velocityX *= 0.5;
                this.playerTank.velocityY *= 0.5;

                // Push enemy away to prevent sticking
                enemy.x += Math.cos(angle) * 10;
                enemy.y += Math.sin(angle) * 10;

                // Screen shake
                this.screenShake(5);

                // Check game over
                if (this.playerHealth <= 0) {
                    this.playerHealth = 0;
                    this.gameOver = true;
                    this.gameRunning = false;
                    this.updateButtonStates();
                    this.showGameOver();
                }
            }
        }
    }

    // Check if player collects health packs
    checkHealthPackCollection() {
        const playerRadius = this.playerTank.width / 2;

        for (const pack of this.healthPacks) {
            if (!pack.collected) {
                // Calculate distance from player to health pack
                const dx = this.playerTank.x - pack.x;
                const dy = this.playerTank.y - pack.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = playerRadius + pack.size / 1;

                if (distance < minDistance) {
                    // Player is touching the health pack
                    if (this.playerHealth < 100) {
                        // Player needs health, collect the pack
                        this.collectHealthPack(pack);
                    }
                    // If player is at full health, do nothing, pack remains on ground
                }
            }
        }
    }

    // Collect a health pack
    collectHealthPack(pack) {
        // Mark pack as collected
        pack.collected = true;

        // Heal the player
        const oldHealth = this.playerHealth;
        this.playerHealth = Math.min(100, this.playerHealth + this.healthPackSettings.healthAmount);
        const healthGained = this.playerHealth - oldHealth;

        // Add health pack points
        this.score += this.scoreSystem.healthPack;

        // Increment health packs collected counter
        this.healthPacksCollected++;

        // Create healing particles
        this.createParticles(pack.x, pack.y, 20, this.healthPackSettings.color);

        // Add floating text showing health gained AND points
        this.showFloatingText(`+${this.scoreSystem.healthPack} HP`, pack.x, pack.y, this.healthPackSettings.color);
        this.showFloatingText(`+${healthGained} HP`, pack.x, pack.y - 20, '#10B981');

        // Show message in UI
        this.showMessage(`Health restored: +${healthGained} HP (+${this.scoreSystem.healthPack} points)`);

        // Start respawn timer
        this.healthPackRespawnTimers.push({
            healthPack: pack,
            timeRemaining: this.healthPackSettings.respawnTime
        });
    }

    // Show floating text at a position
    showFloatingText(text, x, y, color) {
        const floatingText = {
            text: text,
            x: x,
            y: y,
            color: color,
            life: 1000,
            maxLife: 1000,
            velocityY: -0.5
        };

        // Add to particles array for rendering
        this.particles.push(floatingText);
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;

            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: Math.random() * 500 + 500,
                maxLife: 1000,
                color: color,
                alpha: 1,
                size: Math.random() * 3 + 1
            });
        }
    }

    screenShake(intensity) {
        // PLACEHOLDER
        this.createParticles(this.playerTank.x, this.playerTank.y, 20, '#ffffff');
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context for camera transformation
        this.ctx.save();

        // Apply camera transformation
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Draw grid background
        this.drawGrid();

        // Draw rocks first
        this.drawRocks();

        // Draw health packs
        this.drawHealthPacks();

        // Draw all game objects
        this.drawEnemies();
        this.drawPlayer();
        this.drawBullets();
        this.drawEnemyBullets();
        this.drawParticles();

        // Restore context
        this.ctx.restore();

        // Draw enemy indicators
        if (this.enemyIndicators.enabled && this.gameRunning && !this.gamePaused && !this.gameOver) {
            this.drawEnemyIndicators();
        }

        // Draw debug info
        if (this.settings.debugMode) {
            this.drawDebugInfo();
        }
    }

    // Draw enemy indicators on screen edges
    drawEnemyIndicators() {
        if (this.enemies.length === 0) return;

        // Calculate pulsing effect
        const pulseScale = 1 + Math.sin(this.indicatorPhase) * this.enemyIndicators.pulseScale;
        const indicatorSize = this.enemyIndicators.size * pulseScale;
        const margin = this.enemyIndicators.margin;

        // Screen bounds
        const screenLeft = 0;
        const screenRight = this.canvas.width;
        const screenTop = 0;
        const screenBottom = this.canvas.height;

        // Calculate camera bounds in world space
        const cameraLeft = this.camera.x;
        const cameraRight = this.camera.x + this.canvas.width;
        const cameraTop = this.camera.y;
        const cameraBottom = this.camera.y + this.canvas.height;

        // Draw indicators for each enemy that's outside the camera view
        for (const enemy of this.enemies) {
            // Skip enemies that are very far away
            const dx = enemy.x - this.playerTank.x;
            const dy = enemy.y - this.playerTank.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > this.enemyIndicators.maxDistanceForIndicator) {
                continue;
            }

            // Check if enemy is on screen
            const enemyScreenX = enemy.x - this.camera.x;
            const enemyScreenY = enemy.y - this.camera.y;

            if (enemyScreenX >= 0 && enemyScreenX <= this.canvas.width &&
                enemyScreenY >= 0 && enemyScreenY <= this.canvas.height) {
                continue; // Enemy is on screen, no indicator needed
            }

            // Calculate direction from center of screen to enemy
            const screenCenterX = this.canvas.width / 2;
            const screenCenterY = this.canvas.height / 2;

            // Calculate vector from screen center to enemy position
            const vecX = enemyScreenX - screenCenterX;
            const vecY = enemyScreenY - screenCenterY;

            // Calculate angle
            const angle = Math.atan2(vecY, vecX);

            // Find intersection point with screen edge
            let indicatorX, indicatorY;

            // Calculate intersection with screen edges
            const slope = vecY / vecX;

            if (Math.abs(vecX) > Math.abs(vecY)) {
                // Intersect with left or right edge
                if (vecX > 0) {
                    // Right edge
                    indicatorX = screenRight - margin;
                    indicatorY = screenCenterY + slope * (indicatorX - screenCenterX);

                    // Clamp to top/bottom edges
                    if (indicatorY < screenTop + margin) {
                        indicatorY = screenTop + margin;
                        indicatorX = screenCenterX + (indicatorY - screenCenterY) / slope;
                    } else if (indicatorY > screenBottom - margin) {
                        indicatorY = screenBottom - margin;
                        indicatorX = screenCenterX + (indicatorY - screenCenterY) / slope;
                    }
                } else {
                    // Left edge
                    indicatorX = screenLeft + margin;
                    indicatorY = screenCenterY + slope * (indicatorX - screenCenterX);

                    // Clamp to top/bottom edges
                    if (indicatorY < screenTop + margin) {
                        indicatorY = screenTop + margin;
                        indicatorX = screenCenterX + (indicatorY - screenCenterY) / slope;
                    } else if (indicatorY > screenBottom - margin) {
                        indicatorY = screenBottom - margin;
                        indicatorX = screenCenterX + (indicatorY - screenCenterY) / slope;
                    }
                }
            } else {
                // Intersect with top or bottom edge
                if (vecY > 0) {
                    // Bottom edge
                    indicatorY = screenBottom - margin;
                    indicatorX = screenCenterX + (indicatorY - screenCenterY) / slope;

                    // Clamp to left/right edges
                    if (indicatorX < screenLeft + margin) {
                        indicatorX = screenLeft + margin;
                        indicatorY = screenCenterY + slope * (indicatorX - screenCenterX);
                    } else if (indicatorX > screenRight - margin) {
                        indicatorX = screenRight - margin;
                        indicatorY = screenCenterY + slope * (indicatorX - screenCenterX);
                    }
                } else {
                    // Top edge
                    indicatorY = screenTop + margin;
                    indicatorX = screenCenterX + (indicatorY - screenCenterY) / slope;

                    // Clamp to left/right edges
                    if (indicatorX < screenLeft + margin) {
                        indicatorX = screenLeft + margin;
                        indicatorY = screenCenterY + slope * (indicatorX - screenCenterX);
                    } else if (indicatorX > screenRight - margin) {
                        indicatorX = screenRight - margin;
                        indicatorY = screenCenterY + slope * (indicatorX - screenCenterX);
                    }
                }
            }

            // Determine indicator color based on distance
            let indicatorColor;
            if (distance < this.enemyIndicators.dangerThreshold) {
                indicatorColor = this.enemyIndicators.dangerColor;
            } else if (distance < this.enemyIndicators.warningThreshold) {
                indicatorColor = this.enemyIndicators.warningColor;
            } else {
                indicatorColor = this.enemyIndicators.safeColor;
            }

            // Draw indicator
            this.ctx.save();
            this.ctx.translate(indicatorX, indicatorY);
            this.ctx.rotate(angle);

            // Draw outer glow
            this.ctx.fillStyle = indicatorColor;
            this.ctx.globalAlpha = this.enemyIndicators.glowIntensity * pulseScale;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, indicatorSize * 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw main indicator circle with gradient
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, indicatorSize / 2);
            gradient.addColorStop(0, this.enemyIndicators.innerGlowColor);
            gradient.addColorStop(1, indicatorColor);

            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, indicatorSize / 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw pulsating ring
            this.ctx.strokeStyle = indicatorColor;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.6 * pulseScale;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, indicatorSize * 0.6, 0, Math.PI * 2);
            this.ctx.stroke();

            // Draw tank icon
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();

            // Draw triangle pointing outward
            const tankIconSize = indicatorSize * 0.4;
            this.ctx.moveTo(indicatorSize / 2 + 2, 0);
            this.ctx.lineTo(indicatorSize / 2 - tankIconSize, -tankIconSize / 2);
            this.ctx.lineTo(indicatorSize / 2 - tankIconSize, tankIconSize / 2);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw arrow pointing towards enemy
            this.ctx.fillStyle = indicatorColor;
            this.ctx.beginPath();
            this.ctx.moveTo(indicatorSize / 2 + this.enemyIndicators.arrowLength, 0);
            this.ctx.lineTo(indicatorSize / 2, -this.enemyIndicators.arrowWidth / 2);
            this.ctx.lineTo(indicatorSize / 2, this.enemyIndicators.arrowWidth / 2);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw small danger symbol for close enemies
            if (distance < this.enemyIndicators.dangerThreshold) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `bold ${indicatorSize * 0.3}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('!', 0, 0);
            }

            this.ctx.restore();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        // Calculate visible area for grid drawing
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = this.camera.x + this.canvas.width;
        const endY = this.camera.y + this.canvas.height;

        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, Math.max(0, this.camera.y));
            this.ctx.lineTo(x, Math.min(this.world.height, endY));
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(Math.max(0, this.camera.x), y);
            this.ctx.lineTo(Math.min(this.world.width, endX), y);
            this.ctx.stroke();
        }
    }

    // Draw rocks/obstacles
    drawRocks() {
        this.rocks.forEach(rock => {
            this.ctx.save();
            this.ctx.translate(rock.x, rock.y);

            // Draw rock shape
            this.ctx.fillStyle = rock.color;
            this.ctx.beginPath();

            // Move to first point
            this.ctx.moveTo(rock.points[0].x, rock.points[0].y);

            // Draw lines to all other points
            for (let i = 1; i < rock.points.length; i++) {
                this.ctx.lineTo(rock.points[i].x, rock.points[i].y);
            }

            // Close the shape
            this.ctx.closePath();
            this.ctx.fill();

            // Add some shading for 3D effect
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.beginPath();

            // Draw a shadow on one side
            for (let i = 0; i < rock.points.length; i++) {
                const point = rock.points[i];
                const shadowX = point.x * 0.9;
                const shadowY = point.y * 0.9;

                if (i === 0) {
                    this.ctx.moveTo(shadowX, shadowY);
                } else {
                    this.ctx.lineTo(shadowX, shadowY);
                }
            }

            this.ctx.closePath();
            this.ctx.fill();

            // Add highlight for texture
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();

            // Draw a highlight on opposite side
            for (let i = 0; i < rock.points.length; i++) {
                const point = rock.points[i];
                const highlightX = point.x * 1.1;
                const highlightY = point.y * 1.1;

                if (i === 0) {
                    this.ctx.moveTo(highlightX, highlightY);
                } else {
                    this.ctx.lineTo(highlightX, highlightY);
                }
            }

            this.ctx.closePath();
            this.ctx.fill();

            // Draw debug bounding circle
            if (this.settings.debugMode) {
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, rock.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    // Draw health packs
    drawHealthPacks() {
        this.healthPacks.forEach(pack => {
            if (!pack.collected) {
                this.ctx.save();
                this.ctx.translate(pack.x, pack.y);

                // Calculate pulsing effect
                const pulseScale = 0.8 + Math.sin(pack.pulsePhase) * 0.2;
                const currentSize = pack.size * pulseScale;

                // Draw outer glow
                this.ctx.fillStyle = this.healthPackSettings.glowColor;
                this.ctx.globalAlpha = 0.3 + Math.sin(pack.pulsePhase) * 0.2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, currentSize * 1.2, 0, Math.PI * 2);
                this.ctx.fill();

                // Reset alpha
                this.ctx.globalAlpha = 1;

                // Draw main health pack
                this.ctx.fillStyle = this.healthPackSettings.color;

                // Draw vertical part of cross
                this.ctx.fillRect(
                    -currentSize * 0.15,
                    -currentSize * 0.5,
                    currentSize * 0.3,
                    currentSize
                );

                // Draw horizontal part of cross
                this.ctx.fillRect(
                    -currentSize * 0.5,
                    -currentSize * 0.15,
                    currentSize,
                    currentSize * 0.3
                );

                // Draw inner highlight
                this.ctx.fillStyle = this.lightenColor(this.healthPackSettings.color, 30);

                // Vertical highlight
                this.ctx.fillRect(
                    -currentSize * 0.1,
                    -currentSize * 0.4,
                    currentSize * 0.2,
                    currentSize * 0.8
                );

                // Horizontal highlight
                this.ctx.fillRect(
                    -currentSize * 0.4,
                    -currentSize * 0.1,
                    currentSize * 0.8,
                    currentSize * 0.2
                );

                // Draw plus symbol in the center
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `bold ${currentSize * 0.4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('+', 0, 0);

                // Draw debug bounding circle
                if (this.settings.debugMode) {
                    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, pack.size / 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                this.ctx.restore();
            }
        });
    }

    drawPlayer() {
        // Save context
        this.ctx.save();

        // Move to player position
        this.ctx.translate(this.playerTank.x, this.playerTank.y);

        // Draw player health bar
        this.drawPlayerHealthBar();

        // Draw hull
        this.ctx.save();
        this.ctx.rotate(this.playerTank.rotation);
        this.drawTankHull(
            this.playerTank.hullOffsetX,
            this.playerTank.hullOffsetY,
            this.playerTank.width,
            this.playerTank.height,
            this.playerTank.color
        );
        this.ctx.restore();

        // Draw turret
        this.ctx.save();
        this.ctx.rotate(this.playerTank.turretRotation);
        this.drawTankTurret(this.playerTank);
        this.ctx.restore();

        // Draw tank details
        this.drawTankDetails(this.playerTank);

        // Draw movement direction indicator
        if (this.settings.debugMode) {
            this.drawMovementIndicator();
        }

        // Restore context
        this.ctx.restore();
    }

    // Draw player health bar
    drawPlayerHealthBar() {
        const barWidth = this.playerTank.width;
        const barHeight = 6;
        const barX = -barWidth / 2;
        const barY = -this.playerTank.height / 2 - 25;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        const healthWidth = (this.playerHealth / 100) * barWidth;
        this.ctx.fillStyle = this.playerHealth > 50 ? '#4CAF50' : this.playerHealth > 25 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(barX, barY, healthWidth, barHeight);

        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Health text
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${this.playerHealth}%`, 0, barY + barHeight / 2);
    }

    drawMovementIndicator() {
        // Draw a line showing the movement direction
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(
            Math.cos(this.playerTank.rotation) * 50,
            Math.sin(this.playerTank.rotation) * 50
        );
        this.ctx.stroke();

        // Draw a circle showing the current speed
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.playerTank.currentSpeed * 5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);

            // Draw hull
            this.ctx.save();
            this.ctx.rotate(enemy.rotation);
            this.drawTankHull(
                enemy.hullOffsetX,
                enemy.hullOffsetY,
                enemy.width,
                enemy.height,
                enemy.color
            );
            this.ctx.restore();

            // Draw turret
            this.ctx.save();
            this.ctx.rotate(enemy.turretRotation);
            this.drawTankTurret(enemy);
            this.ctx.restore();

            // Draw health bar
            this.drawHealthBar(enemy);

            // Draw debug info
            if (this.settings.debugMode) {
                // Draw avoidance force indicator
                if (enemy.avoidanceForceX !== 0 || enemy.avoidanceForceY !== 0) {
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(enemy.avoidanceForceX * 10, enemy.avoidanceForceY * 10);
                    this.ctx.stroke();
                }

                // Draw target rotation indicator
                this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(
                    Math.cos(enemy.targetRotation) * 30,
                    Math.sin(enemy.targetRotation) * 30
                );
                this.ctx.stroke();

                // Draw stuck timer
                if (enemy.stuckTimer > 0) {
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    this.ctx.font = 'bold 12px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`Stuck: ${enemy.stuckTimer}`, 0, -40);
                }
            }

            this.ctx.restore();
        });
    }

    drawTankHull(offsetX, offsetY, width, height, color) {
        // Main hull body
        this.ctx.fillStyle = color;
        this.ctx.fillRect(offsetX, offsetY, width, height);

        // Hull highlight
        this.ctx.fillStyle = this.lightenColor(color, 20);
        this.ctx.fillRect(offsetX + 5, offsetY + 5, width - 10, height / 3);

        // Hull details
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let i = 0; i < 3; i++) {
            const y = offsetY + 10 + i * 15;
            this.ctx.fillRect(offsetX + width - 20, y, 10, 10);
        }

        // Tracks
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(offsetX, offsetY - 5, width, 8);
        this.ctx.fillRect(offsetX, offsetY + height - 3, width, 8);

        // Track details
        this.ctx.fillStyle = '#444';
        for (let i = 0; i < 8; i++) {
            const x = offsetX + 5 + i * (width / 7);
            this.ctx.fillRect(x, offsetY - 3, 4, 5);
            this.ctx.fillRect(x, offsetY + height - 1, 4, 5);
        }
    }

    drawTankTurret(tank) {
        // Draw turret body
        this.ctx.fillStyle = tank.color;
        this.ctx.fillRect(
            tank.turretOffsetX,
            tank.turretOffsetY,
            tank.turretWidth,
            tank.turretHeight
        );

        // Turret highlight
        this.ctx.fillStyle = this.lightenColor(tank.color, 15);
        this.ctx.beginPath();
        this.ctx.roundRect(
            tank.turretOffsetX + tank.turretWidth - 10,
            tank.turretOffsetY + 2,
            8,
            tank.turretHeight - 4,
            4
        );
        this.ctx.fill();

        // Draw gun barrel
        this.ctx.save();

        // Position at front center of turret
        this.ctx.translate(tank.turretWidth / 2 + tank.turretOffsetX, tank.turretOffsetY + tank.turretHeight / 2);

        // Draw barrel extending forward from the front
        this.ctx.fillStyle = '#333';

        // Barrel extends forward
        this.ctx.fillRect(
            0,
            -tank.barrelWidth / 2,
            tank.barrelLength,
            tank.barrelWidth
        );

        // Barrel tip
        this.ctx.fillStyle = '#222';
        this.ctx.fillRect(
            tank.barrelLength,
            -tank.barrelWidth / 2 - 1,
            5,
            tank.barrelWidth + 2
        );

        this.ctx.restore();

        // Draw commander hatch
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(
            tank.turretOffsetX + tank.turretWidth / 2,
            tank.turretOffsetY + 8,
            6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    drawTankDetails(tank) {
        // Draw player name
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('', 0, -tank.height / 2 - 15);
    }

    drawHealthBar(enemy) {
        const barWidth = enemy.width;
        const barHeight = 5;
        const barX = -barWidth / 2;
        const barY = -enemy.height / 2 - 15;

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health
        const healthWidth = (enemy.health / 100) * barWidth;
        this.ctx.fillStyle = enemy.health > 50 ? '#4CAF50' : enemy.health > 25 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(barX, barY, healthWidth, barHeight);

        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    drawBullets() {
        this.bullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.translate(bullet.x, bullet.y);
            this.ctx.rotate(bullet.rotation);

            // Bullet body
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(-3, -2, 10, 4);

            // Bullet tip
            this.ctx.fillStyle = '#FFA500';
            this.ctx.beginPath();
            this.ctx.moveTo(7, -2);
            this.ctx.lineTo(12, 0);
            this.ctx.lineTo(7, 2);
            this.ctx.closePath();
            this.ctx.fill();

            // Glow effect
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
            this.ctx.fillRect(-4, -3, 14, 6);

            this.ctx.restore();
        });
    }

    drawEnemyBullets() {
        this.enemyBullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.translate(bullet.x, bullet.y);
            this.ctx.rotate(bullet.rotation);

            // Bullet body
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.fillRect(-2, -2, 8, 4);

            // Bullet tip
            this.ctx.fillStyle = '#FF4444';
            this.ctx.beginPath();
            this.ctx.moveTo(6, -2);
            this.ctx.lineTo(10, 0);
            this.ctx.lineTo(6, 2);
            this.ctx.closePath();
            this.ctx.fill();

            // Glow effect
            this.ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
            this.ctx.fillRect(-3, -3, 12, 6);

            this.ctx.restore();
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            // Check if this is a floating text particle
            if (particle.text) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life / particle.maxLife;
                this.ctx.fillStyle = particle.color;
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(particle.text, particle.x, particle.y);
                this.ctx.restore();
            } else {
                // Regular particle
                this.ctx.save();
                this.ctx.globalAlpha = particle.alpha;
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        });
    }

    lightenColor(color, percent) {
        // Helper function to lighten colors for highlights
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;

        return "#" + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    drawDebugInfo() {
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';

        // Draw in screen coordinates
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.ctx.fillText(`Player: ${this.playerTank.x.toFixed(1)}, ${this.playerTank.y.toFixed(1)}`, 10, 20);
        this.ctx.fillText(`Velocity: ${this.playerTank.velocityX.toFixed(2)}, ${this.playerTank.velocityY.toFixed(2)}`, 10, 40);
        this.ctx.fillText(`Speed: ${this.playerTank.currentSpeed.toFixed(2)}/${this.playerTank.maxSpeed}`, 10, 60);
        this.ctx.fillText(`Rotation: ${(this.playerTank.rotation * 180 / Math.PI).toFixed(1)}°`, 10, 80);
        this.ctx.fillText(`Target Rot: ${(this.playerTank.targetRotation * 180 / Math.PI).toFixed(1)}°`, 10, 100);
        this.ctx.fillText(`Camera: ${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)}`, 10, 120);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 140);
        this.ctx.fillText(`Bullets: ${this.bullets.length}`, 10, 160);
        this.ctx.fillText(`Wave: ${this.waveSystem.currentWave}`, 10, 180);
        this.ctx.fillText(`Wave Enemies: ${this.waveSystem.waveEnemiesSpawned}/${this.waveSystem.waveEnemiesTarget}`, 10, 200);
        this.ctx.fillText(`Wave Time: ${Math.ceil(this.waveSystem.waveTimer / 1000)}s`, 10, 220);
        this.ctx.fillText(`Rocks: ${this.rocks.length}`, 10, 240);
        this.ctx.fillText(`Health Packs: ${this.healthPacks.filter(p => !p.collected).length}/${this.healthPacks.length}`, 10, 260);
        this.ctx.fillText(`Scaling Factor: ${this.waveSystem.scalingFactor}`, 10, 280);
        this.ctx.fillText(`Score: ${this.score}`, 10, 300);
        this.ctx.fillText(`Total Kills: ${this.totalKills}`, 10, 320);
        this.ctx.fillText(`Health Packs Collected: ${this.healthPacksCollected}`, 10, 340);
        this.ctx.fillText(`Auto-fire: ${this.isMouseDown ? 'ACTIVE' : 'INACTIVE'}`, 10, 360);
        this.ctx.fillText(`Auto-fire Timer: ${this.autoFireTimer.toFixed(0)}ms`, 10, 380);
        this.ctx.fillText(`Survival Time: ${this.formatTime(this.survivalTime)}`, 10, 400);
        this.ctx.fillText(`Enemy Indicators: ${this.enemyIndicators.enabled ? 'ON' : 'OFF'}`, 10, 420);
        this.ctx.fillText(`Indicator Phase: ${this.indicatorPhase.toFixed(2)}`, 10, 440);
        this.ctx.fillText(`Enemy AI: Turret Tracking ON`, 10, 460);
        this.ctx.fillText(`Obstacle Avoidance: ON`, 10, 480);
        this.ctx.fillText(`Enemy-Enemy Avoidance: ON`, 10, 500);
        this.ctx.fillText(`Notifications: ${this.notifications.length}`, 10, 520);

        this.ctx.restore();
    }

    updateUI() {
        // Update score
        const scoreElement = document.getElementById('gameScore');
        if (scoreElement) {
            scoreElement.textContent = this.score;
        }

        // Update wave
        const waveElement = document.getElementById('gameWave');
        if (waveElement) {
            waveElement.textContent = this.waveSystem.currentWave;
        }

        // Update health
        const healthElement = document.getElementById('gameHealth');
        if (healthElement) {
            healthElement.textContent = this.playerHealth;
        }

        // Update enemies count
        const enemiesElement = document.getElementById('gameEnemies');
        if (enemiesElement) {
            enemiesElement.textContent = this.enemies.length;
        }

        // Update total kills
        const totalKillsElement = document.getElementById('totalKills');
        if (totalKillsElement) {
            totalKillsElement.textContent = this.totalKills;
        }

        // Update health packs collected
        const healthPacksElement = document.getElementById('healthPacksCollected');
        if (healthPacksElement) {
            healthPacksElement.textContent = this.healthPacksCollected;
        }

        // Update survival time
        const survivalTimeElement = document.getElementById('gameSurvivalTime');
        if (!survivalTimeElement) {
            // Create survival time element if it doesn't exist
            this.createSurvivalTimeElement();
        } else {
            survivalTimeElement.textContent = this.formatTime(this.survivalTime);
        }
    }

    createSurvivalTimeElement() {
        // Find the stats container
        const statsContainer = document.querySelector('.tank-game-stats');
        if (!statsContainer) return;

        // Check if survival time element already exists
        if (document.getElementById('gameSurvivalTime')) return;

        // Create survival time stat item
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';

        const statValue = document.createElement('div');
        statValue.className = 'stat-value';
        statValue.id = 'gameSurvivalTime';
        statValue.textContent = this.formatTime(this.survivalTime);

        const statLabel = document.createElement('div');
        statLabel.className = 'stat-label';
        statLabel.textContent = 'Survival Time';

        statItem.appendChild(statValue);
        statItem.appendChild(statLabel);

        // Insert after health packs collected stat
        const healthPacksElement = document.getElementById('healthPacksCollected');
        if (healthPacksElement && healthPacksElement.parentNode) {
            healthPacksElement.parentNode.parentNode.insertBefore(statItem, healthPacksElement.parentNode.nextSibling);
        } else {
            // If not found, append to the end
            statsContainer.appendChild(statItem);
        }
    }

    showGameOver() {
        const overlay = document.getElementById('gameOverOverlay');
        if (!overlay) return;

        overlay.style.display = 'flex';

        // Update final stats
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalWave').textContent = this.waveSystem.currentWave;
        document.getElementById('enemiesKilled').textContent = this.totalKills;

        // Add survival time to game over screen
        const survivalTimeElement = document.getElementById('finalSurvivalTime');
        if (!survivalTimeElement) {
            // Create the element if it doesn't exist
            const overlayStats = document.querySelector('.overlay-stats');
            if (overlayStats) {
                const survivalStat = document.createElement('div');
                survivalStat.className = 'overlay-stat';

                const statValue = document.createElement('div');
                statValue.className = 'overlay-stat-value';
                statValue.id = 'finalSurvivalTime';
                statValue.textContent = this.formatTime(this.survivalTime);

                const statLabel = document.createElement('div');
                statLabel.className = 'overlay-stat-label';
                statLabel.textContent = 'Survival Time';

                survivalStat.appendChild(statValue);
                survivalStat.appendChild(statLabel);
                overlayStats.appendChild(survivalStat);
            }
        } else {
            survivalTimeElement.textContent = this.formatTime(this.survivalTime);
        }

        // Hide wave timer
        if (this.waveTimerElement) {
            this.waveTimerElement.style.display = 'none';
        }
    }

    showMessage(text) {
        // Remove old notifications if we have too many
        if (this.notifications.length >= this.notificationSettings.maxNotifications) {
            const oldestNotification = this.notifications[0];
            if (oldestNotification.element && oldestNotification.element.parentNode) {
                oldestNotification.element.parentNode.removeChild(oldestNotification.element);
            }
            this.notifications.shift();
        }

        // Create notification element
        const message = document.createElement('div');
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            font-weight: bold;
            pointer-events: none;
            animation: fadeOut 2s forwards;
        `;

        // Add pulsing animation
        message.style.animation = 'pulse 2s ease-in-out infinite';

        // Add CSS for pulse animation
        if (!document.getElementById('notificationPulseStyle')) {
            const style = document.createElement('style');
            style.id = 'notificationPulseStyle';
            style.textContent = `
                @keyframes pulse {
                    0% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                                    0 0 0 1px rgba(255, 255, 255, 0.05),
                                    0 0 20px rgba(76, 175, 80, 0.2); }
                    50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                                    0 0 0 1px rgba(255, 255, 255, 0.1),
                                    0 0 30px rgba(76, 175, 80, 0.3); }
                    100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
                                    0 0 0 1px rgba(255, 255, 255, 0.05),
                                    0 0 20px rgba(76, 175, 80, 0.2); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(message);

        // Create notification object
        const notification = {
            element: message,
            life: this.notificationSettings.notificationDuration,
            maxLife: this.notificationSettings.notificationDuration,
            topPosition: this.notificationSettings.initialTopPosition
        };

        // Add to notifications array
        this.notifications.push(notification);

        // Calculate new position for this notification
        this.recalculateNotificationPositions();

        // Remove notification after duration
        setTimeout(() => {
            if (message.parentNode) {
                message.style.opacity = '0';
                message.style.transform = 'translateX(-50%) translateY(-10px)';

                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }

                    // Remove from array
                    const index = this.notifications.indexOf(notification);
                    if (index > -1) {
                        this.notifications.splice(index, 1);
                    }

                    // Recalculate positions for remaining notifications
                    this.recalculateNotificationPositions();
                }, 300);
            }
        }, this.notificationSettings.notificationDuration);
    }
}

// Initialize the game
const tankGame = new TankGame();

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        if (typeof radius === 'number') {
            radius = {
                tl: radius,
                tr: radius,
                br: radius,
                bl: radius
            };
        } else {
            radius = {
                ...{
                    tl: 0,
                    tr: 0,
                    br: 0,
                    bl: 0
                },
                ...radius
            };
        }

        this.beginPath();
        this.moveTo(x + radius.tl, y);
        this.lineTo(x + width - radius.tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        this.lineTo(x + width, y + height - radius.br);
        this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        this.lineTo(x + radius.bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        this.lineTo(x, y + radius.tl);
        this.quadraticCurveTo(x, y, x + radius.tl, y);
        this.closePath();
        return this;
    };
}