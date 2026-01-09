// External Link Warning
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const CONFIG = {
        enabled: true,
        excludeDomains: [
            'heatlabs.net',
            'dev.heatlabs.net',
            'changelog.heatlabs.net',
            'statistics.heatlabs.net',
            'status.heatlabs.net',
            'social.heatlabs.net',
            'discord.heatlabs.net',
            'store.heatlabs.net',
            'mods.heatlabs.net',
            'app.heatlabs.net',
            'bot.heatlabs.net'
        ],
        excludeClasses: [
            'wip',
            'sidebar-close-btn',
            'search-button',
            'settings-button',
            'hamburger-menu',
            'no-external-warning',
            'brand-logo',
            'system-status'
        ],
        rememberChoiceKey: 'heatlabs_external_links',
        maxRememberedChoices: 50,
        cookieExpiryDays: 30
    };

    // Don't run if disabled
    if (!CONFIG.enabled) return;

    // DOM Elements
    let externalWarningOverlay;
    let externalWarningModal;
    let currentLink = null;
    let currentEvent = null;

    // Remembered choices cache
    let rememberedChoices = {};

    // Check if we're in a mobile app or Electron app
    function isInApp() {
        // Check for mobile app
        if (window.cordova || window.Capacitor || window.PhoneGap) {
            return true;
        }

        // Check for Electron
        if (window.electron || window.require && window.require('electron')) {
            return true;
        }

        // Check for custom user agent patterns
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('heatlabs-app') ||
            userAgent.includes('heatlabs-mobile') ||
            userAgent.includes('electron') ||
            userAgent.includes('cordova') ||
            userAgent.includes('capacitor') ||
            userAgent.includes('phonegap')) {
            return true;
        }

        // Check for custom window properties
        if (window.HEATLabsApp || window.isHEATLabsApp) {
            return true;
        }

        return false;
    }

    // Initialize the system
    function init() {
        createModal();
        loadRememberedChoices();
        attachEventListeners();
        setupMutationObserver();
    }

    // Create modal HTML
    function createModal() {
        const inApp = isInApp();
        const externalText = inApp ? 'external browser' : 'new tab';

        const modalHTML = `
            <div class="external-warning-overlay" id="externalWarningOverlay">
                <div class="external-warning-modal" id="externalWarningModal">
                    <div class="external-warning-icon">
                        <i class="fas fa-external-link-alt"></i>
                    </div>
                    <h2 class="external-warning-title">Leaving HEAT Labs</h2>
                    <p class="external-warning-subtitle">You are about to visit an external website. This link will take you to a website that is not part of HEAT Labs.</p>
                    <div class="external-warning-domain" id="externalWarningDomain">
                        <i class="fas fa-globe"></i>
                        <span id="externalWarningDomainText">example.com</span>
                    </div>
                    <p class="external-warning-message" id="externalWarningMessage">
                        HEAT Labs is not responsible for external websites.
                        <br><br>
                        <i class="fas fa-external-link-alt"></i> This link will open in a ${externalText}.
                    </p>
                    <div class="external-warning-buttons" id="externalWarningButtons">
                        <button class="external-warning-button external-warning-button-secondary" id="externalWarningCancel">
                            <i class="fas fa-times"></i>
                            Stay Here
                        </button>
                        <button class="external-warning-button external-warning-button-primary" id="externalWarningProceed">
                            <i class="fas fa-external-link-alt"></i>
                            Continue to External Site
                        </button>
                    </div>
                    <div class="external-warning-remember">
                        <input type="checkbox" id="externalWarningRemember">
                        <label for="externalWarningRemember">Remember my choice for this website</label>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        externalWarningOverlay = document.getElementById('externalWarningOverlay');
        externalWarningModal = document.getElementById('externalWarningModal');

        // Add event listeners to modal buttons
        document.getElementById('externalWarningCancel').addEventListener('click', cancelNavigation);
        document.getElementById('externalWarningProceed').addEventListener('click', proceedToLink);

        // Close modal when clicking outside
        externalWarningOverlay.addEventListener('click', function(e) {
            if (e.target === externalWarningOverlay) {
                cancelNavigation();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && externalWarningOverlay.classList.contains('active')) {
                cancelNavigation();
            }
        });
    }

    // Load remembered choice
    function loadRememberedChoices() {
        try {
            const saved = localStorage.getItem(CONFIG.rememberChoiceKey);
            if (saved) {
                rememberedChoices = JSON.parse(saved);

                // Clean up old entries
                const cutoff = Date.now() - (CONFIG.cookieExpiryDays * 24 * 60 * 60 * 1000);
                for (const domain in rememberedChoices) {
                    if (rememberedChoices[domain].timestamp < cutoff) {
                        delete rememberedChoices[domain];
                    }
                }
            }
        } catch (e) {
            console.warn('Could not load remembered external link choices:', e);
            rememberedChoices = {};
        }
    }

    // Save remembered choice
    function saveRememberedChoices() {
        try {
            // Limit number of remembered choices
            const domains = Object.keys(rememberedChoices);
            if (domains.length > CONFIG.maxRememberedChoices) {
                // Remove oldest entries
                const sorted = domains.sort((a, b) =>
                    rememberedChoices[a].timestamp - rememberedChoices[b].timestamp
                );
                const toRemove = sorted.slice(0, domains.length - CONFIG.maxRememberedChoices);
                toRemove.forEach(domain => delete rememberedChoices[domain]);
            }

            localStorage.setItem(CONFIG.rememberChoiceKey, JSON.stringify(rememberedChoices));
        } catch (e) {
            console.warn('Could not save remembered external link choices:', e);
        }
    }

    // Check if URL is external
    function isExternalUrl(url) {
        if (!url) return false;

        try {
            const currentHost = window.location.hostname;
            const targetUrl = new URL(url, window.location.href);
            const targetHost = targetUrl.hostname;

            // Check if it's the same domain or subdomain
            if (targetHost === currentHost || targetHost.endsWith('.' + currentHost)) {
                return false;
            }

            // Check against exclude list
            for (const domain of CONFIG.excludeDomains) {
                if (targetHost === domain || targetHost.endsWith('.' + domain)) {
                    return false;
                }
            }

            return true;
        } catch (e) {
            // Invalid URL or relative URL
            return false;
        }
    }

    // Extract domain from URL
    function extractDomain(url) {
        try {
            const parsedUrl = new URL(url, window.location.href);
            return parsedUrl.hostname.replace('www.', '');
        } catch (e) {
            return url;
        }
    }

    // Check if element should be excluded
    function shouldExcludeElement(element) {
        // Check for excluded classes
        for (const className of CONFIG.excludeClasses) {
            if (element.classList.contains(className)) {
                return true;
            }
        }

        // Check for excluded parent elements
        let parent = element.parentElement;
        while (parent) {
            for (const className of CONFIG.excludeClasses) {
                if (parent.classList.contains(className)) {
                    return true;
                }
            }
            parent = parent.parentElement;
        }

        return false;
    }

    // Show warning modal
    function showWarning(event, href) {
        // Prevent default action
        if (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }

        // Store current link and event
        currentLink = href;
        currentEvent = event;

        // Extract domain
        const domain = extractDomain(href);

        // Check if we should remember the choice
        const rememberCheckbox = document.getElementById('externalWarningRemember');
        rememberCheckbox.checked = false;

        // Update modal content
        document.getElementById('externalWarningDomainText').textContent = domain;

        // Update message based on app context
        const inApp = isInApp();
        const externalText = inApp ? 'external browser' : 'new tab';
        const messageElement = document.getElementById('externalWarningMessage');
        messageElement.innerHTML = `
            HEAT Labs is not responsible for external websites.
            <br><br>
            <i class="fas fa-external-link-alt"></i> This link will open in a ${externalText}.
        `;

        // Check if user already made a choice for this domain
        const remembered = rememberedChoices[domain];
        if (remembered && remembered.choice === 'allow') {
            // Auto-proceed after a short delay
            setTimeout(() => {
                proceedToLink();
            }, 100);
            return;
        }

        // Show modal
        externalWarningOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Cancel navigation
    function cancelNavigation() {
        externalWarningOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Check if we should remember this choice
        const rememberCheckbox = document.getElementById('externalWarningRemember');
        if (rememberCheckbox.checked && currentLink) {
            const domain = extractDomain(currentLink);
            rememberedChoices[domain] = {
                choice: 'deny',
                timestamp: Date.now()
            };
            saveRememberedChoices();
        }

        currentLink = null;
        currentEvent = null;
    }

    // Proceed to external link
    function proceedToLink() {
        if (!currentLink) {
            cancelNavigation();
            return;
        }

        // Check if we should remember this choice
        const rememberCheckbox = document.getElementById('externalWarningRemember');
        if (rememberCheckbox.checked) {
            const domain = extractDomain(currentLink);
            rememberedChoices[domain] = {
                choice: 'allow',
                timestamp: Date.now()
            };
            saveRememberedChoices();
        }

        // Always open external links in a new tab/window
        const inApp = isInApp();

        if (inApp) {
            // For mobile/Electron apps, open in system browser with special handling
            openInSystemBrowser(currentLink);
        } else {
            // For regular web, open in new tab
            openInNewTab(currentLink);
        }

        // Clean up
        externalWarningOverlay.classList.remove('active');
        document.body.style.overflow = '';
        currentLink = null;
        currentEvent = null;
    }

    // Open URL in new tab with proper security attributes
    function openInNewTab(url) {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

        // Ensure noopener is set for security
        if (newWindow) {
            newWindow.opener = null;
        }
    }

    // Open URL in system browser (for mobile/Electron apps)
    function openInSystemBrowser(url) {
        // Check for Cordova/PhoneGap InAppBrowser
        if (window.cordova && cordova.InAppBrowser) {
            cordova.InAppBrowser.open(url, '_system', 'location=yes');
            return;
        }

        // Check for Capacitor Browser
        if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Browser) {
            Capacitor.Plugins.Browser.open({
                url: url
            });
            return;
        }

        // Check for Electron shell
        if (window.electron) {
            window.electron.openExternal(url);
            return;
        }

        // Check for require('electron') in renderer process
        if (window.require) {
            try {
                const {
                    shell
                } = window.require('electron');
                shell.openExternal(url);
                return;
            } catch (e) {
                // Not in Electron or require not available
            }
        }

        // Fallback for mobile web views
        if (navigator.userAgent.includes('iPhone') ||
            navigator.userAgent.includes('iPad') ||
            navigator.userAgent.includes('Android')) {
            // Try to use standard window.open for mobile web views
            const newWindow = window.open(url, '_system');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                // Fallback to regular new tab
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        // Ultimate fallback - open in new tab
        openInNewTab(url);
    }

    // Handle link clicks
    function handleLinkClick(event) {
        // Check if we should process this element
        if (shouldExcludeElement(this)) {
            return true;
        }

        // Get the href
        let href = this.getAttribute('href');
        if (!href && this.tagName === 'A') {
            href = this.href;
        }

        // Check if it's an external URL
        if (href && isExternalUrl(href)) {
            showWarning(event, href);
            return false;
        }

        return true;
    }

    // Attach event listeners to existing links
    function attachEventListeners() {
        // Find all links
        const links = document.querySelectorAll('a[href]');

        links.forEach(link => {
            // Skip if already has listener or should be excluded
            if (link.hasAttribute('data-external-warning-listener') || shouldExcludeElement(link)) {
                return;
            }

            link.setAttribute('data-external-warning-listener', 'true');
            link.addEventListener('click', handleLinkClick);
        });

        // Also check for elements with data-href attributes
        const elementsWithHref = document.querySelectorAll('[data-href]');
        elementsWithHref.forEach(element => {
            if (shouldExcludeElement(element)) return;

            element.addEventListener('click', function(e) {
                const href = this.getAttribute('data-href');
                if (href && isExternalUrl(href)) {
                    showWarning(e, href);
                }
            });
        });
    }

    // Set up observer to detect dynamically added links
    function setupMutationObserver() {
        const observer = new MutationObserver(function(mutations) {
            let shouldReattach = false;

            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            // Check if node contains links
                            if (node.querySelectorAll) {
                                const links = node.querySelectorAll('a[href]');
                                if (links.length > 0) {
                                    shouldReattach = true;
                                }
                            }

                            // Check if node itself is a link
                            if (node.tagName === 'A' && node.getAttribute('href')) {
                                shouldReattach = true;
                            }
                        }
                    });
                }
            });

            if (shouldReattach) {
                // Debounce reattachment
                clearTimeout(window.externalWarningReattachTimeout);
                window.externalWarningReattachTimeout = setTimeout(attachEventListeners, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Public API
    window.HEATLabsExternalWarning = {
        showWarning: showWarning,
        isExternalUrl: isExternalUrl,
        isInApp: isInApp,
        disable: function() {
            CONFIG.enabled = false;
        },
        enable: function() {
            CONFIG.enabled = true;
        },
        addExcludedDomain: function(domain) {
            if (!CONFIG.excludeDomains.includes(domain)) {
                CONFIG.excludeDomains.push(domain);
            }
        },
        clearRememberedChoices: function() {
            rememberedChoices = {};
            localStorage.removeItem(CONFIG.rememberChoiceKey);
        }
    };

    init();
});