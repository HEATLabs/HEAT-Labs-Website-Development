// Deny Mobile Modal functionality for HEAT Labs
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is on mobile/tablet device
    function isMobileDevice() {
        return (
            // Check screen width
            window.innerWidth <= 1024 ||

            // Check for touch device
            ('ontouchstart' in window || navigator.maxTouchPoints > 0) ||

            // Check user agent for mobile/tablet
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        );
    }

    // Create modal HTML structure
    const modalHTML = `
        <div class="deny-mobile-modal-overlay" id="denyMobileModalOverlay">
            <div class="deny-mobile-modal" id="denyMobileModal">
                <div class="deny-mobile-modal-icon">
                    <i class="fas fa-desktop"></i>
                </div>
                <h2 class="deny-mobile-modal-title" id="denyMobileModalTitle">Desktop Only</h2>
                <p class="deny-mobile-modal-message" id="denyMobileModalMessage">This feature is only available on desktop computers. Please visit this page on a computer with a larger screen.</p>
                <div class="deny-mobile-modal-buttons" id="denyMobileButtons">
                    <button class="deny-mobile-modal-button deny-mobile-modal-button-primary" id="denyMobileGotIt">Got it!</button>
                </div>
            </div>
        </div>
    `;

    // Add modal to the DOM immediately
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const denyMobileModalOverlay = document.getElementById('denyMobileModalOverlay');
    const denyMobileModal = document.getElementById('denyMobileModal');
    const denyMobileModalTitle = document.getElementById('denyMobileModalTitle');
    const denyMobileModalMessage = document.getElementById('denyMobileModalMessage');
    const denyMobileButtons = document.getElementById('denyMobileButtons');

    let isDenyMobileModalOpen = false;

    // Function to show the deny mobile modal
    function showDenyMobileModal(event, href) {
        // Prevent default action if event is provided
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }

        // Prevent multiple modals from opening
        if (isDenyMobileModalOpen) {
            return;
        }

        isDenyMobileModalOpen = true;

        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
            // Set modal content
            denyMobileModalTitle.textContent = 'Desktop Only';
            denyMobileModalMessage.textContent = 'This feature is only available on desktop computers. Please visit this page on a computer with a larger screen.';

            // Set up button - only "Got it!" button
            denyMobileButtons.innerHTML = `
                <button class="deny-mobile-modal-button deny-mobile-modal-button-primary" id="denyMobileGotIt">Got it!</button>
            `;

            // Add event listener for the button
            const gotItBtn = document.getElementById('denyMobileGotIt');

            // Remove any existing listeners to prevent duplicates
            gotItBtn.replaceWith(gotItBtn.cloneNode(true));

            // Add fresh event listener
            document.getElementById('denyMobileGotIt').addEventListener('click', closeDenyMobileModal, {
                once: true
            });

            // Show the modal
            denyMobileModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.body.classList.add('deny-mobile-restricted');
        });
    }

    // Function to close the deny mobile modal
    function closeDenyMobileModal() {
        isDenyMobileModalOpen = false;

        // Use requestAnimationFrame for smoother close animation
        requestAnimationFrame(() => {
            denyMobileModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
            document.body.classList.remove('deny-mobile-restricted');
        });
    }

    // Close modal when clicking on overlay (outside modal)
    denyMobileModalOverlay.addEventListener('click', function(e) {
        if (e.target === denyMobileModalOverlay) {
            closeDenyMobileModal();
        }
    });

    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isDenyMobileModalOpen) {
            closeDenyMobileModal();
        }
    });

    // Optimized function to handle deny-mobile element clicks on mobile
    function handleDenyMobileClick(e) {
        // Only show modal if on mobile device
        if (isMobileDevice()) {
            const href = this.getAttribute('href');
            showDenyMobileModal(e, href);
            return false; // Prevent default
        }
        // If not mobile, allow normal navigation
        return true;
    }

    // Find all elements with deny-mobile class and add click handlers
    function initializeDenyMobileElements() {
        const denyMobileElements = document.querySelectorAll('.deny-mobile');

        denyMobileElements.forEach(element => {
            // Remove existing listeners to prevent duplicates
            element.removeEventListener('click', handleDenyMobileClick);

            // Check if element is a link or has an href attribute
            if (element.tagName === 'A' && element.getAttribute('href')) {
                element.addEventListener('click', handleDenyMobileClick);
            }
            // Check if element is a button that might navigate
            else if (element.tagName === 'BUTTON' && (element.onclick || element.getAttribute('onclick'))) {
                element.addEventListener('click', function(e) {
                    if (isMobileDevice()) {
                        showDenyMobileModal(e, '');
                        return false;
                    }
                });
            }
            // For other elements, check if they have a data-href attribute
            else if (element.getAttribute('data-href')) {
                element.addEventListener('click', function(e) {
                    if (isMobileDevice()) {
                        const href = this.getAttribute('data-href');
                        showDenyMobileModal(e, href);
                        return false;
                    }
                });
            }
        });

        // Auto-show modal for pages that should be entirely restricted on mobile
        if (isMobileDevice() && document.body.classList.contains('deny-mobile')) {
            // Add small delay to ensure DOM is fully loaded
            setTimeout(() => {
                showDenyMobileModal(null, window.location.href);
            }, 500);
        }
    }

    // Initialize deny-mobile elements
    initializeDenyMobileElements();

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (isMobileDevice()) {
                // Re-initialize to ensure mobile restrictions are applied
                initializeDenyMobileElements();
            }
        }, 250);
    });

    // Throttled re-initialization when DOM changes
    let mutationTimeout;
    const observer = new MutationObserver(function(mutations) {
        // Clear any pending re-initialization
        clearTimeout(mutationTimeout);

        // Schedule re-initialization with a small delay
        mutationTimeout = setTimeout(() => {
            let shouldReinitialize = false;

            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    // Check if any added nodes contain deny-mobile elements
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (node.classList.contains('deny-mobile') || node.querySelector('.deny-mobile'))) {
                            shouldReinitialize = true;
                        }
                    });
                }
            });

            if (shouldReinitialize) {
                initializeDenyMobileElements();
            }
        }, 100);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Cleanup function to prevent memory leaks
    window.addEventListener('beforeunload', function() {
        observer.disconnect();
        window.removeEventListener('resize', resizeTimeout);
    });
});