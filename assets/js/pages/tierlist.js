document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const selectionScreen = document.getElementById('selectionScreen');
    const tierListCreator = document.getElementById('tierListCreator');
    const tierListTitle = document.getElementById('tierListTitle');
    const backButton = document.getElementById('backButton');
    const unrankedItems = document.getElementById('unrankedItems');
    const resetButton = document.getElementById('resetTierList');
    const saveButton = document.getElementById('saveTierList');
    const shareButton = document.getElementById('shareTierList');
    const loadTierListInput = document.getElementById('loadTierListInput');
    const loadTierListButton = document.getElementById('loadTierListButton');

    // Modal elements
    const resetModal = document.createElement('div');
    resetModal.className = 'reset-modal hidden';
    resetModal.innerHTML = `
        <div class="reset-modal-content">
            <h3>Reset Tier List</h3>
            <p>Are you sure you want to reset this tier list? All your rankings will be lost.</p>
            <div class="reset-modal-buttons">
                <button class="reset-modal-cancel">Cancel</button>
                <button class="reset-modal-confirm">Reset</button>
            </div>
        </div>
    `;

    const shareModal = document.createElement('div');
    shareModal.className = 'share-modal hidden';
    shareModal.innerHTML = `
        <div class="share-modal-content">
            <h3>Share Your Tier List</h3>
            <p>Your <span class="share-category"></span> tier list has been saved and is ready to be shared!</p>
            <div class="share-url-container">
                <input type="text" class="share-url-input" readonly>
                <button class="copy-url-button">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
            <button class="share-modal-close">Close</button>
        </div>
    `;

    document.body.appendChild(resetModal);
    document.body.appendChild(shareModal);

    // Tier list data
    let currentType = '';
    let items = [];
    const tierLists = {
        tanks: null,
        maps: null,
        agents: null
    };

    // Touch drag variables
    let touchStartX = 0;
    let touchStartY = 0;
    let draggedItem = null;
    let draggedItemOriginalParent = null;
    let draggedItemOriginalIndex = 0;
    let draggedItemClone = null;
    let isDragging = false;
    let dragData = null;

    // Initialize the tier list creator
    function init() {
        // Add event listeners to tier options
        document.querySelectorAll('.tier-option').forEach(option => {
            option.addEventListener('click', function() {
                currentType = this.dataset.type;
                loadTierList(currentType);
            });
        });

        // Back button
        backButton.addEventListener('click', () => {
            tierListCreator.classList.add('hidden');
            selectionScreen.classList.remove('hidden');
        });

        // Reset button
        resetButton.addEventListener('click', showResetModal);

        // Save button
        saveButton.addEventListener('click', saveCurrentTierList);

        // Share button
        shareButton.addEventListener('click', shareCurrentTierList);

        // Load tier list button
        loadTierListButton.addEventListener('click', loadSharedTierList);

        // Modal event listeners
        resetModal.querySelector('.reset-modal-cancel').addEventListener('click', hideResetModal);
        resetModal.querySelector('.reset-modal-confirm').addEventListener('click', confirmReset);

        shareModal.querySelector('.share-modal-close').addEventListener('click', hideShareModal);
        shareModal.querySelector('.copy-url-button').addEventListener('click', copyShareUrl);

        // Check for shared tier list in URL
        checkForSharedTierList();
    }

    // Check URL for shared tier list
    function checkForSharedTierList() {
        const params = new URLSearchParams(window.location.search);
        const sharedData = params.get('tierlist');

        if (sharedData) {
            try {
                // Decompress the URL using LZString
                const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
                if (!decompressed) throw new Error('Invalid compressed data');

                const parsedData = JSON.parse(decompressed);
                const {
                    t: type,
                    i: itemData
                } = parsedData;

                // Set the current type and load the tier list
                currentType = type;
                loadTierList(type).then(() => {
                    // Apply the shared tier list
                    applySavedTierList(itemData);

                    // Show a message that a shared tier list was loaded
                    showNotification(`Loaded shared ${type} tier list`);
                });
            } catch (e) {
                console.error('Error loading shared tier list:', e);
                showNotification('Invalid shared tier list URL', 'error');
            }
        }
    }

    // Show reset confirmation modal
    function showResetModal() {
        resetModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    // Hide reset confirmation modal
    function hideResetModal() {
        resetModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    // Show share modal
    function showShareModal() {
        shareModal.querySelector('.share-category').textContent = currentType;
        shareModal.classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    // Hide share modal
    function hideShareModal() {
        shareModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    // Copy share URL to clipboard
    function copyShareUrl() {
        const urlInput = shareModal.querySelector('.share-url-input');
        urlInput.select();
        document.execCommand('copy');
        hideShareModal();
        showNotification('URL copied to clipboard!');
    }

    // Confirm reset and execute
    function confirmReset() {
        hideResetModal();
        // Clear saved data for current type
        localStorage.removeItem(`tierList_${currentType}`);
        renderTierList();
        initDragAndDrop();
    }

    // Save the current tier list to localStorage
    function saveCurrentTierList() {
        if (!currentType) return;

        const tierListData = getCurrentTierListData();
        localStorage.setItem(`tierList_${currentType}`, JSON.stringify(tierListData));
        showNotification('Tier list saved successfully!');
    }

    // Share the current tier list
    function shareCurrentTierList() {
        if (!currentType) return;

        // First save the tier list
        saveCurrentTierList();

        // Get current tier list data
        const tierListData = getCurrentTierListData();

        // Create a minimal shareable data structure
        const shareData = {
            t: currentType, // Shortened property name
            i: tierListData.items // Shortened property name
        };

        // Compress the data using LZString
        const compressedData = LZString.compressToEncodedURIComponent(JSON.stringify(shareData));
        const shareUrl = `${window.location.origin}${window.location.pathname}?tierlist=${compressedData}`;

        // Show the share modal with the URL
        const urlInput = shareModal.querySelector('.share-url-input');
        urlInput.value = shareUrl;
        showShareModal();
    }

    // Get current tier list data
    function getCurrentTierListData() {
        const tierListData = {
            items: {},
            timestamp: new Date().toISOString()
        };

        // Get all tier containers (including unranked)
        const allContainers = document.querySelectorAll('.tier-items, .unranked-items');

        allContainers.forEach(container => {
            const tier = container.dataset.tier || 'unranked';
            const itemElements = container.querySelectorAll('.tier-item');

            itemElements.forEach(item => {
                tierListData.items[item.dataset.id] = tier;
            });
        });

        return tierListData;
    }

    // Load a shared tier list
    function loadSharedTierList() {
        const url = loadTierListInput.value.trim();

        if (!url) {
            showNotification('Please enter a valid URL', 'error');
            return;
        }

        try {
            // Extract the tierlist parameter from the URL
            const urlObj = new URL(url);
            const sharedData = urlObj.searchParams.get('tierlist');

            if (!sharedData) {
                throw new Error('No tier list data found in URL');
            }

            // Decompress the URL using LZString
            const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
            if (!decompressed) throw new Error('Invalid compressed data');

            const parsedData = JSON.parse(decompressed);
            const {
                t: type,
                i: itemData
            } = parsedData;

            // Set the current type and load the tier list
            currentType = type;
            loadTierList(type).then(() => {
                // Apply the shared tier list
                applySavedTierList(itemData);

                // Show a message that a shared tier list was loaded
                showNotification(`Loaded shared ${type} tier list`);

                // Clear the input
                loadTierListInput.value = '';
            });
        } catch (e) {
            console.error('Error loading shared tier list:', e);
            showNotification('Invalid shared tier list URL', 'error');
        }
    }

    // Show notification
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `save-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 2000);
    }

    // Load saved tier list data
    function loadSavedTierList(type) {
        const savedData = localStorage.getItem(`tierList_${type}`);
        if (savedData) {
            return JSON.parse(savedData);
        }
        return null;
    }

    // Load the appropriate tier list based on type
    async function loadTierList(type) {
        // Show loading state
        tierListTitle.textContent = `Loading ${type} data...`;
        selectionScreen.classList.add('hidden');
        tierListCreator.classList.remove('hidden');

        try {
            // Load data based on type
            switch (type) {
                case 'tanks':
                    items = await loadTanks();
                    break;
                case 'maps':
                    items = await loadMaps();
                    break;
                case 'agents':
                    items = await loadAgents();
                    break;
                default:
                    throw new Error('Invalid tier list type');
            }

            // Update UI
            tierListTitle.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Tier List`;
            renderTierList();

            // Load saved data if exists
            const savedData = loadSavedTierList(type);
            if (savedData) {
                applySavedTierList(savedData.items);
            }

            // Initialize drag and drop
            initDragAndDrop();

        } catch (error) {
            console.error('Error loading tier list data:', error);
            tierListTitle.textContent = 'Error loading data';
            showNotification('Error loading data', 'error');
        }
    }

    // Apply saved tier list data to the UI
    function applySavedTierList(itemData) {
        Object.entries(itemData).forEach(([itemId, tier]) => {
            const itemElement = document.querySelector(`.tier-item[data-id="${itemId}"]`);
            if (itemElement) {
                const container = tier === 'unranked' ?
                    unrankedItems :
                    document.querySelector(`.tier-items[data-tier="${tier}"]`);
                if (container) {
                    container.appendChild(itemElement);
                }
            }
        });
    }

    // Load tanks data
    async function loadTanks() {
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/tanks.json');
        const data = await response.json();
        return data
            .filter(tank => tank.class === "Available Now")
            .map(tank => ({
                id: tank.id.toString(),
                name: tank.name,
                image: tank.image,
                type: 'tank'
            }));
    }

    // Load maps data
    async function loadMaps() {
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/maps.json');
        const data = await response.json();
        return data.maps
            .filter(map => map.status === "Available Now")
            .map(map => ({
                id: map.id.toString(),
                name: map.name,
                image: map.image,
                type: 'map'
            }));
    }

    // Load agents data
    async function loadAgents() {
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/agents.json');
        const data = await response.json();
        return data.agents
            .filter(agent => agent.status === "Available Now")
            .map(agent => ({
                id: agent.id.toString(),
                name: agent.name,
                image: agent.image,
                type: 'agent'
            }));
    }

    // Render the tier list with items
    function renderTierList() {
        // Clear existing items
        unrankedItems.innerHTML = '';
        document.querySelectorAll('.tier-items').forEach(el => el.innerHTML = '');

        // Create draggable items for each item
        items.forEach(item => {
            const itemElement = createItemElement(item);
            unrankedItems.appendChild(itemElement);
        });
    }

    // Create a draggable item element
    function createItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'tier-item';
        itemElement.dataset.id = item.id;
        itemElement.dataset.type = item.type;

        // Use img tag with draggable false - this is the simplest approach
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" draggable="false" class="item-image">
            <div class="item-name">${item.name}</div>
        `;

        return itemElement;
    }

    // Initialize drag and drop functionality
    function initDragAndDrop() {
        const items = document.querySelectorAll('.tier-item');
        const containers = document.querySelectorAll('.tier-items, .unranked-items');

        // Remove all existing event listeners first
        items.forEach(item => {
            item.removeEventListener('mousedown', handleMouseDown);
            item.removeEventListener('touchstart', handleTouchStart);
            item.removeEventListener('touchmove', handleTouchMove);
            item.removeEventListener('touchend', handleTouchEnd);
        });

        containers.forEach(container => {
            container.removeEventListener('mouseup', handleContainerMouseUp);
            container.removeEventListener('mouseover', handleContainerMouseOver);
            container.removeEventListener('mouseout', handleContainerMouseOut);
            container.removeEventListener('touchmove', handleContainerTouchMove);
            container.removeEventListener('touchend', handleContainerTouchEnd);
        });

        // Add new event listeners
        items.forEach(item => {
            // Mouse events
            item.addEventListener('mousedown', handleMouseDown);

            // Touch events
            item.addEventListener('touchstart', handleTouchStart, {
                passive: false
            });
            item.addEventListener('touchmove', handleTouchMove, {
                passive: false
            });
            item.addEventListener('touchend', handleTouchEnd);
        });

        containers.forEach(container => {
            // Mouse events for hover effects
            container.addEventListener('mouseup', handleContainerMouseUp);
            container.addEventListener('mouseover', handleContainerMouseOver);
            container.addEventListener('mouseout', handleContainerMouseOut);

            // Touch events
            container.addEventListener('touchmove', handleContainerTouchMove, {
                passive: false
            });
            container.addEventListener('touchend', handleContainerTouchEnd);
        });

        // Global mouse up to clean up
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    // Mouse drag handlers
    function handleMouseDown(e) {
        // Prevent text selection during drag
        e.preventDefault();

        // Only handle left click
        if (e.button !== 0) return;

        const item = this;

        // Store the drag data
        dragData = {
            item: item,
            originalParent: item.parentNode,
            originalIndex: Array.from(item.parentNode.children).indexOf(item),
            offsetX: e.offsetX || (e.clientX - item.getBoundingClientRect().left),
            offsetY: e.offsetY || (e.clientY - item.getBoundingClientRect().top)
        };

        // Create a clone for visual feedback
        const clone = item.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.zIndex = '1000';
        clone.style.pointerEvents = 'none';
        clone.style.width = item.offsetWidth + 'px';
        clone.style.left = (e.clientX - dragData.offsetX) + 'px';
        clone.style.top = (e.clientY - dragData.offsetY) + 'px';
        clone.classList.add('dragging');
        document.body.appendChild(clone);

        dragData.clone = clone;

        // Hide original
        item.style.opacity = '0.3';
        item.style.transform = 'scale(0.95)';

        isDragging = true;

        // Add mousemove handler
        document.addEventListener('mousemove', handleMouseMove);
    }

    function handleMouseMove(e) {
        if (!isDragging || !dragData) return;

        // Move the clone
        const clone = dragData.clone;
        clone.style.left = (e.clientX - dragData.offsetX) + 'px';
        clone.style.top = (e.clientY - dragData.offsetY) + 'px';

        // Find the container under the cursor
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        const container = elementUnderCursor ? elementUnderCursor.closest('.tier-items, .unranked-items') : null;

        // Highlight potential drop target
        document.querySelectorAll('.tier-items, .unranked-items').forEach(el => {
            el.classList.remove('drag-over');
        });

        if (container) {
            container.classList.add('drag-over');
            dragData.currentContainer = container;
        } else {
            dragData.currentContainer = null;
        }
    }

    function handleGlobalMouseUp(e) {
        if (!isDragging || !dragData) return;

        // Remove mousemove handler
        document.removeEventListener('mousemove', handleMouseMove);

        // Find the container under the cursor
        const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
        const container = elementUnderCursor ? elementUnderCursor.closest('.tier-items, .unranked-items') : null;

        // Remove highlight from all containers
        document.querySelectorAll('.tier-items, .unranked-items').forEach(el => {
            el.classList.remove('drag-over');
        });

        // Move the item to the new container if valid
        const item = dragData.item;
        if (container && container !== item.parentNode) {
            // Insert at the correct position based on mouse location
            const itemsInContainer = [...container.querySelectorAll('.tier-item')];
            let inserted = false;

            for (let i = 0; i < itemsInContainer.length; i++) {
                const rect = itemsInContainer[i].getBoundingClientRect();
                if (e.clientY < rect.top + rect.height / 2) {
                    container.insertBefore(item, itemsInContainer[i]);
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                container.appendChild(item);
            }
        } else if (container && container === item.parentNode) {
            // Reorder within the same container
            const itemsInContainer = [...container.querySelectorAll('.tier-item')];
            let inserted = false;

            // Remove the item from its current position
            const currentIndex = itemsInContainer.indexOf(item);
            if (currentIndex !== -1) {
                itemsInContainer.splice(currentIndex, 1);
            }

            // Find where to insert
            for (let i = 0; i < itemsInContainer.length; i++) {
                const rect = itemsInContainer[i].getBoundingClientRect();
                if (e.clientY < rect.top + rect.height / 2) {
                    container.insertBefore(item, itemsInContainer[i]);
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                container.appendChild(item);
            }
        }

        // Clean up
        item.style.opacity = '';
        item.style.transform = '';
        dragData.clone.remove();
        dragData = null;
        isDragging = false;
    }

    function handleContainerMouseUp() {
        // This is handled by global mouse up
    }

    function handleContainerMouseOver(e) {
        if (!isDragging) return;
        this.classList.add('drag-over');
    }

    function handleContainerMouseOut() {
        if (!isDragging) return;
        this.classList.remove('drag-over');
    }

    // Touch event handlers
    function handleTouchStart(e) {
        if (isDragging) return;

        const touch = e.touches[0];
        const item = this;

        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        draggedItem = item;
        draggedItemOriginalParent = item.parentNode;
        draggedItemOriginalIndex = Array.from(item.parentNode.children).indexOf(item);

        // Create a clone for visual feedback
        draggedItemClone = item.cloneNode(true);
        draggedItemClone.style.position = 'fixed';
        draggedItemClone.style.zIndex = '1000';
        draggedItemClone.style.width = item.offsetWidth + 'px';
        draggedItemClone.style.left = (touch.clientX - 50) + 'px';
        draggedItemClone.style.top = (touch.clientY - 30) + 'px';
        draggedItemClone.style.pointerEvents = 'none';
        draggedItemClone.style.transform = 'scale(0.95)';
        draggedItemClone.classList.add('dragging');
        document.body.appendChild(draggedItemClone);

        // Hide original while dragging
        item.style.opacity = '0.3';

        isDragging = true;
        e.preventDefault();
    }

    function handleTouchMove(e) {
        if (!isDragging) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        // Move the clone
        if (draggedItemClone) {
            draggedItemClone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.95)`;
        }

        // Find the container under the touch point
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        const container = elementUnderTouch ? elementUnderTouch.closest('.tier-items, .unranked-items') : null;

        // Highlight potential drop target
        document.querySelectorAll('.tier-items, .unranked-items').forEach(el => {
            el.classList.remove('drag-over');
        });

        if (container) {
            container.classList.add('drag-over');
        }

        e.preventDefault();
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;

        // Find the container under the touch point
        const touch = e.changedTouches[0];
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        const container = elementUnderTouch ? elementUnderTouch.closest('.tier-items, .unranked-items') : null;

        // Remove highlight from all containers
        document.querySelectorAll('.tier-items, .unranked-items').forEach(el => {
            el.classList.remove('drag-over');
        });

        // Move the item to the new container if valid
        if (container && draggedItem) {
            // Find the correct position within the container
            const itemsInContainer = [...container.querySelectorAll('.tier-item')];
            let inserted = false;

            for (let i = 0; i < itemsInContainer.length; i++) {
                const rect = itemsInContainer[i].getBoundingClientRect();
                if (touch.clientY < rect.top + rect.height / 2) {
                    container.insertBefore(draggedItem, itemsInContainer[i]);
                    inserted = true;
                    break;
                }
            }

            if (!inserted) {
                container.appendChild(draggedItem);
            }
        } else if (!container && draggedItem && draggedItemOriginalParent) {
            // Return to original position if no valid container
            if (draggedItemOriginalParent.children[draggedItemOriginalIndex]) {
                draggedItemOriginalParent.insertBefore(draggedItem, draggedItemOriginalParent.children[draggedItemOriginalIndex]);
            } else {
                draggedItemOriginalParent.appendChild(draggedItem);
            }
        }

        // Clean up
        if (draggedItem) {
            draggedItem.style.opacity = '';
            draggedItem.style.transform = '';
        }
        if (draggedItemClone) {
            draggedItemClone.remove();
        }

        draggedItem = null;
        draggedItemClone = null;
        isDragging = false;
    }

    function handleContainerTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
    }

    function handleContainerTouchEnd(e) {
        if (!isDragging) return;
        e.preventDefault();
    }

    // Initialize the app
    init();
});