// 3D Model Loader for HEAT Labs Tank Viewer
class ModelLoader {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Model container not found:', containerId);
            return;
        }

        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.model = null;

        // Prod Model
        this.modelPath = "https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Models/refs/heads/main/glb-test-models/trafficCone.glb";
        // Local model
        // this.modelPath = "../../../abrams.glb";

        this.tankId = document.querySelector('meta[name="tank-id"]').content;

        // Animation state (or just the helicopter mode)
        this.isRotating = false;
        this.rotationSpeed = 8; // degrees per second

        this.mixer = null;
        this.clock = new THREE.Clock();

        // Axis Arrows
        this.axisArrows = false;
        this.axisLength = 10;
        this.xAxis = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, .005, 0),
            this.axisLength,
            0xff0000
        );
        this.yAxis = new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, .005, 0),
            this.axisLength,
            0x00ff00
        );
        this.zAxis = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, .005, 0),
            this.axisLength,
            0x0000ff
        );

        // Toggle XRay
        this.xray = false;
        this.boundingBoxes = [];

        this.staticArmor = false;
        this.armorViewer = false;

        this.init();
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.setupGrid();
        this.createControlsUI();
        await this.fetchModel(this.tankId);
        this.loadModel();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 20, 100);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 15);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });

        // Store original dimensions
        this.originalWidth = this.container.clientWidth;
        this.originalHeight = this.container.clientHeight;

        this.renderer.setSize(this.originalWidth, this.originalHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        this.container.appendChild(this.renderer.domElement);
        this.renderer.domElement.className = 'model-viewer-canvas';
        this.renderer.domElement.style.position = 'relative';
        this.renderer.domElement.style.zIndex = '1';

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 0.1;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.target.set(0, 2, 0);
    }

    setupLighting() {
        // Store lighting references
        this.lights = {
            ambient: null,
            directional: null,
            fill: null
        };

        // Ambient light
        this.lights.ambient = new THREE.AmbientLight(0x404040, 0.6);

        this.scene.add(this.lights.ambient);

        // Directional light (main light)
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 1);
        this.lights.directional.position.set(10, 10, 5);
        this.lights.directional.castShadow = true;
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 50;
        this.lights.directional.shadow.camera.left = -20;
        this.lights.directional.shadow.camera.right = 20;
        this.lights.directional.shadow.camera.top = 20;
        this.lights.directional.shadow.camera.bottom = -20;
        this.scene.add(this.lights.directional);

        // Fill light
        this.lights.fill = new THREE.DirectionalLight(0xffffff, 0.3);
        this.lights.fill.position.set(-5, 5, -5);
        this.lights.fill.castShadow = false;
        this.scene.add(this.lights.fill);
    }

    setupGrid() {
        const gridHelper = new THREE.GridHelper(200, 200, 0x444444, 0x222222);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        // Add a ground plane for shadows
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.ShadowMaterial({
            opacity: 0.1,
            transparent: true
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createControlsUI() {
        // Create controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'model-viewer-controls';

        // Rotate toggle button
        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'model-control-btn';
        rotateBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        rotateBtn.title = 'Toggle Auto Rotation';
        rotateBtn.addEventListener('click', () => this.toggleRotation());

        // Reset view button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'model-control-btn';
        resetBtn.innerHTML = '<i class="fas fa-home"></i>';
        resetBtn.title = 'Reset View';
        resetBtn.addEventListener('click', () => this.resetView());

        // Shadow toggle button
        const shadowBtn = document.createElement('button');
        shadowBtn.className = 'model-control-btn';
        shadowBtn.innerHTML = '<i class="far fa-lightbulb"></i>';
        shadowBtn.title = 'Toggle Axes (Off)';
        shadowBtn.addEventListener('click', () => this.toggleAxisArrows());

        const xrayBtn = document.createElement('button');
        xrayBtn.className = 'model-control-btn';
        xrayBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        xrayBtn.title = 'Toggle X-Ray (On)';
        xrayBtn.addEventListener('click', () => this.toggleXRay());
        // Fullscreen button
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'model-control-btn';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Enter Fullscreen';
        fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        const staticArmorBtn = document.createElement('button');
        staticArmorBtn.className = 'model-control-btn';
        staticArmorBtn.innerHTML = '<i class="fa-brands fa-stack-overflow"></i>';
        staticArmorBtn.title = 'Static Armor';
        staticArmorBtn.addEventListener('click', () => this.toggleStaticArmor());

        controlsContainer.appendChild(rotateBtn);
        controlsContainer.appendChild(resetBtn);
        controlsContainer.appendChild(shadowBtn);
        controlsContainer.appendChild(xrayBtn);
        controlsContainer.appendChild(fullscreenBtn);
        controlsContainer.appendChild(staticArmorBtn);


        this.container.appendChild(controlsContainer);
    }

    async fetchModel(id) {
        try {
            const tanksResponse = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/tanks.json');
            const tanksData = await tanksResponse.json();

            try {
                const tank = tanksData.find(t => t.id.toString() === id.toString());
                if (tank) {
                    this.modelPath = tank.model;
                }
            } catch (error){
                console.error('Error in find ID: ',error);
            }

        } catch (error) {
            console.error('Could not fetch tank model with ID:', id);
            console.error('Fetch Error: ',error);

        }
    }

    async loadModel(){
        this.showLoadingState();
        try {
            const loader = new THREE.GLTFLoader();
            const glb = await new Promise((resolve, reject) => {
                loader.load(this.modelPath, resolve, undefined, reject);
            });
            console.log(glb.scene);
            this.model = this.centerModel(glb.scene);

            this.scene.add(this.model);
            this.hideLoadingState();
        } catch (error) {
            console.error('Error loading model:', error);
            this.showErrorState('Failed to load 3D model');
        }
    }

    centerModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // console.log('Old Position:', model.position);
        // console.log('Center:', center);


        // Center the model
        if (model.position.x !== 0 ) {
            model.position.x = -center.x;
        }
        if (model.position.y !== 0 ) {
            model.position.y = -center.y;
        }
        if (model.position.z !== 0 ) {
            model.position.z = -center.z;
        }
        // Scale the model to fit nicely in view
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 6 / maxDim;
        model.scale.setScalar(scale);

        // Position the model so it sits on the grid
        const boxAfterScale = new THREE.Box3().setFromObject(model);
        const minY = boxAfterScale.min.y;
        model.position.y -= minY;

        // model.position.z += 2.3;

        // console.log('New Position:', model.position);
        if (this.controls) {
            this.controls.target.set(0, model.position.y + 0.7, 0);
            this.controls.update();
        }
        return model;
    }

    toggleAxisArrows(){
        this.axisArrows = !this.axisArrows;

        if (this.axisArrows) {
            this.scene.add(this.xAxis);
            this.scene.add(this.yAxis);
            this.scene.add(this.zAxis);
        } else {
            this.scene.remove(this.xAxis);
            this.scene.remove(this.yAxis);
            this.scene.remove(this.zAxis);
        }

        const shadowBtn = this.container.querySelector('.model-control-btn:nth-child(3)');
        if (shadowBtn) {
            if (this.axisArrows) {
                shadowBtn.classList.add('active');
                shadowBtn.innerHTML = '<i class="fas fa-lightbulb"></i>';
                shadowBtn.title = 'Toggle Axes (On)';
            } else {
                shadowBtn.classList.remove('active');
                shadowBtn.innerHTML = '<i class="far fa-lightbulb"></i>';
                shadowBtn.title = 'Toggle Axes (Off)';
            }
        }
    }

    drawBoundingBox(child, mat){
        mat.transparent = true;
        mat.opacity = 0.3;
        mat.depthWrite = true;
        mat.depthTest = true;
        mat.renderOrder = 999;
        mat.needsUpdate = true;

        const hex = (() => {
            switch (mat.name?.toLowerCase()) {
                case "engine":
                    return "#FF4E17";
                case "fuel":
                    return "#F2C44B";
                case "crew":
                    return "#FFEFD0";
                case "ammo":
                    return "#6EFFCD";
                default:
                    return "#FFFFFF";
            }
        })();

       // Get size from geometry
        child.geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        child.geometry.boundingBox.getSize(size);

        // Apply mesh's local scale
        const localScale = new THREE.Vector3();
        child.getWorldScale(localScale);
        size.multiply(localScale);

        const geom = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
            color: hex
        }));

        child.getWorldPosition(line.position);
        const quat = new THREE.Quaternion();
        child.getWorldQuaternion(quat);
        line.setRotationFromQuaternion(quat);

        line.userData.child = child;
        this.scene.add(line);
        this.boundingBoxes.push(line);
    }

    removeBoundingBox(){
        this.boundingBoxes.forEach(box => {
            this.scene.remove(box);
            if (box.geometry) box.geometry.dispose();
            if (box.material) box.material.dispose();
        })
        this.boundingBoxes = [];
    }

    toggleXRay() {
        this.xray = !this.xray;

        const moduleNames = ["engine", "fuel", "crew", "ammo"];
        let moduleOpacity = this.armorViewer ? 0.6875 : 0.5625

        if (this.xray) {
            // this.staticArmor = true;
            // this.toggleStaticArmor();

            this.model.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {

                            if (moduleNames.includes(mat.name)) {
                                this.drawBoundingBox(child, mat);
                                mat.transparent = true;
                                mat.opacity = moduleOpacity;
                                mat.depthWrite = true;
                                mat.depthTest = true;
                                mat.renderOrder = 999;
                                mat.needsUpdate = true;
                                console.log(child)
                            }
                            if (!moduleNames.includes(mat.name)) {
                                    mat.transparent = true;
                                    mat.opacity = 0.25;
                                    mat.depthWrite = false;
                                    mat.depthTest = true;
                                    mat.renderOrder = -1;
                                    mat.needsUpdate = true;
                            }
                        })
                    }
            })

            this.renderer.sortObjects = true;
        } else {
            this.removeBoundingBox();
            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(mat => {

                        // DEV NOTE: Temporary fix. Storing/Returning original materials would be better
                        if (moduleNames.includes(mat.name)) {
                            mat.transparent = true;
                            mat.opacity = 0;
                        }
                        if (!moduleNames.includes(mat.name)) {
                            mat.opacity = 1;
                            mat.transparent = false;
                        }
                        mat.depthWrite = true;
                        mat.needsUpdate = true;

                    })
                }
            })
        }
        const shadowBtn = this.container.querySelector('.model-control-btn:nth-child(4)');
        if (shadowBtn) {
            if (this.xray) {
                shadowBtn.classList.add('active');
                shadowBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                shadowBtn.title = 'Toggle X-Ray (On)';
            } else {
                shadowBtn.classList.remove('active');
                shadowBtn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
                shadowBtn.title = 'Toggle X-Ray (Off)';
            }
        }
    }

    // DEV NOTE: function is not functional and incomplete
    toggleStaticArmor(){
        this.staticArmor = !this.staticArmor;

        const nonPen = new THREE.MeshBasicMaterial( { color: 0xff0000 });
        nonPen.map = this.model.children[50].material.map
        const partialPen = new THREE.MeshBasicMaterial( { color: 0xFFE200 } );
        partialPen.map = this.model.children[50].material.map
        const canPen = new THREE.MeshBasicMaterial( { color: 0x78E7BF } );
        canPen.map = this.model.children[50].material.map



        if (this.staticArmor) {
            this.xray = true;
            this.toggleXRay();
            this.originalMaterials = [];

            this.model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    const originalMats = [...materials];
                    const hasTexture = child.material.map ? true : false;


                    if (!child.name.toLowerCase().includes('chassis')) {
                        if (child.name.toLowerCase().includes('gun')) {

                            child.material = nonPen;
                        }
                        if (child.name.toLowerCase().includes('partial')) {
                            child.material = partialPen;
                        }
                        if (child.name.toLowerCase().includes('pen')) {
                            child.material = canPen;
                        }
                    }
                    // if (child.name.toLowerCase().includes('chassis')){
                    //     materials.forEach(mat => {
                    //         mat.transparent = true;
                    //         mat.opacity = 0;
                    //         mat.depthWrite = false;
                    //         mat.depthTest = true;
                    //         mat.renderOrder = -1;
                    //         mat.needsUpdate = true;
                    //     })
                    // }


                    this.originalMaterials.push({ mesh: child, materials: originalMats });
                }
            })
        }
        else {
            if (this.originalMaterials) {
                this.originalMaterials.forEach(item => {
                    item.mesh.material = item.materials[0];
                });
                this.originalMaterials = [];
            }
        }



    }


    toggleRotation() {
        this.isRotating = !this.isRotating;

        // Update button state
        const rotateBtn = this.container.querySelector('.model-control-btn:nth-child(1)');
        if (rotateBtn) {
            if (this.isRotating) {
                rotateBtn.classList.add('active');
            } else {
                rotateBtn.classList.remove('active');
            }
        }
    }

    resetView() {
        if (this.controls) {
            this.controls.reset();
        }

        // Stop auto rotation when resetting
        this.isRotating = false;
        const rotateBtn = this.container.querySelector('.model-control-btn:nth-child(1)');
        if (rotateBtn) {
            rotateBtn.classList.remove('active');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }

    enterFullscreen() {
        // Store current dimensions before entering fullscreen
        this.originalWidth = this.container.clientWidth;
        this.originalHeight = this.container.clientHeight;

        this.container.classList.add('fullscreen-model');

        if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
        } else if (this.container.webkitRequestFullscreen) {
            this.container.webkitRequestFullscreen();
        } else if (this.container.msRequestFullscreen) {
            this.container.msRequestFullscreen();
        }

        // Add close button for fullscreen
        const closeBtn = document.createElement('button');
        closeBtn.className = 'fullscreen-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', () => this.exitFullscreen());
        this.container.appendChild(closeBtn);

        // Force resize after a brief delay to ensure fullscreen is active
        setTimeout(() => {
            this.onWindowResize();
        }, 100);
    }

    exitFullscreen() {
        // Exit fullscreen first
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }

        // Remove fullscreen class
        this.container.classList.remove('fullscreen-model');

        // Remove close button
        const closeBtn = this.container.querySelector('.fullscreen-close');
        if (closeBtn) {
            closeBtn.remove();
        }

        // Restore original dimensions and trigger resize
        this.restoreOriginalSize();
    }

    restoreOriginalSize() {
        if (!this.camera || !this.renderer) return;

        // Use a small delay to ensure the DOM has updated
        setTimeout(() => {
            const width = this.originalWidth || this.container.clientWidth;
            const height = this.originalHeight || this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);

            // Force a render update
            if (this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
            }
        }, 50);
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        // Only update if we're not in fullscreen mode
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        } else {
            // In fullscreen, use the full container size
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;

            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    showLoadingState() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'model-loading';
        loadingDiv.innerHTML = `
            <div class="model-loading-spinner"></div>
            <p>Loading 3D Model...</p>
        `;

        // Make the loading state non-blocking
        loadingDiv.style.pointerEvents = 'none';
        loadingDiv.style.zIndex = '10';

        this.container.appendChild(loadingDiv);
        this.loadingElement = loadingDiv;

        // Allow user interaction with the rest of the page
        this.container.style.pointerEvents = 'auto';

        // Ensure the canvas itself wont block interactions during loading
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.pointerEvents = 'auto';
        }
    }

    hideLoadingState() {
        if (this.loadingElement) {
            this.loadingElement.remove();
            this.loadingElement = null;
        }

        // Restore normal pointer events for the container
        this.container.style.pointerEvents = '';

        // Ensure canvas has proper pointer events after loading
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.style.pointerEvents = 'auto';
        }
    }

    showErrorState(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'model-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Model Load Error</h3>
            <p>${message}</p>
            <button class="btn-accent mt-4" onclick="location.reload()">Retry</button>
        `;

        // Make error state non-blocking
        errorDiv.style.pointerEvents = 'auto';
        errorDiv.style.zIndex = '20';

        this.container.appendChild(errorDiv);

        // Ensure user can still interact with the page
        this.container.style.pointerEvents = 'auto';
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        // Handle auto rotation
        if (this.isRotating && this.model) {
            // Uncomment line below for fan meme
            // this.model.children[9].rotation.y -= THREE.MathUtils.degToRad(this.rotationSpeed) * delta;
            this.model.rotation.y += THREE.MathUtils.degToRad(this.rotationSpeed) * delta;
            this.boundingBoxes.forEach(line => {
                const child = line.userData.child;
                child.getWorldPosition(line.position);
                child.getWorldQuaternion(line.quaternion);
            })
        }

        if (this.controls) {
            this.controls.update();
        }

        // Update animations
        if (this.mixer) {
            this.mixer.update(delta);
        }

        // Render scene
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}



// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const modelViewer = document.getElementById('tank-model-viewer');
    if (modelViewer) {
        if (typeof THREE !== 'undefined') {
            window.modelLoaderInstance = new ModelLoader('tank-model-viewer');
        } else {
            console.error('Three.js is not loaded');
            modelViewer.innerHTML = `
                <div class="model-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>3D Engine Not Available</h3>
                    <p>Three.js library failed to load. Please refresh the page.</p>
                </div>
            `;
        }
    }
});

// Handle fullscreen changes globally
document.addEventListener('fullscreenchange', function() {
    const modelViewer = document.getElementById('tank-model-viewer');
    if (!document.fullscreenElement && modelViewer) {
        modelViewer.classList.remove('fullscreen-model');
        const closeBtn = modelViewer.querySelector('.fullscreen-close');
        if (closeBtn) {
            closeBtn.remove();
        }
        // Trigger size restoration when exiting via Escape key
        const modelLoader = window.modelLoaderInstance;
        if (modelLoader && modelLoader.restoreOriginalSize) {
            modelLoader.restoreOriginalSize();
        }
    }
});

document.addEventListener('webkitfullscreenchange', function() {
    const modelViewer = document.getElementById('tank-model-viewer');
    if (!document.webkitFullscreenElement && modelViewer) {
        modelViewer.classList.remove('fullscreen-model');
        const closeBtn = modelViewer.querySelector('.fullscreen-close');
        if (closeBtn) {
            closeBtn.remove();
        }
        // Trigger size restoration when exiting via Escape key
        const modelLoader = window.modelLoaderInstance;
        if (modelLoader && modelLoader.restoreOriginalSize) {
            modelLoader.restoreOriginalSize();
        }
    }
});