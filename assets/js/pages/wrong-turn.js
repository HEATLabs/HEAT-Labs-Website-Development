// API Subdomain Redirect Page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize countdown timer
    initializeCountdown();

    // Setup automatic redirect
    setupAutomaticRedirect();

    // Add click event for immediate redirect
    setupImmediateRedirect();
});

function initializeCountdown() {
    let countdown = 5; // 5 seconds countdown
    const countdownElement = document.getElementById('countdown');
    const homeButton = document.getElementById('goHomeBtn');

    // Update countdown every second
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;

        // Update button text with countdown
        if (countdown > 0) {
            homeButton.innerHTML = `<i class="fas fa-home mr-2"></i> Take Me Home (${countdown})`;
        } else {
            homeButton.innerHTML = `<i class="fas fa-home mr-2"></i> Redirecting...`;
        }

        // Stop countdown when it reaches 0
        if (countdown <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function setupAutomaticRedirect() {
    // Redirect after 5 seconds
    setTimeout(() => {
        redirectToHome();
    }, 5000);
}

function setupImmediateRedirect() {
    const homeButton = document.getElementById('goHomeBtn');

    homeButton.addEventListener('click', function(e) {
        e.preventDefault();
        redirectToHome();
    });
}

function redirectToHome() {
    // Main site URL
    const homeUrl = 'https://heatlabs.net';

    // Try to open in a new tab first, then fallback to current window
    const newWindow = window.open(homeUrl, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // If popup blocked, redirect current page
        window.location.href = homeUrl;
    } else {
        // If new tab opened successfully, show a message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #FF6B6B 0%, var(--accent-color) 100%); color: white; text-align: center;">
                <div>
                    <i class="fas fa-home" style="font-size: 4rem; margin-bottom: 2rem;"></i>
                    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Taking you home!</h1>
                    <p style="font-size: 1.25rem; margin-bottom: 2rem;">You should be redirected to HEAT Labs shortly.</p>
                    <p style="opacity: 0.8;">If nothing happens, <a href="${homeUrl}" style="color: white; text-decoration: underline;">click here</a> to go home manually.</p>
                </div>
            </div>
        `;
    }
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    const apiIcon = document.querySelector('.api-icon');

    if (apiIcon) {
        apiIcon.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2) rotate(10deg)';
            this.style.transition = 'transform 0.3s ease';
        });

        apiIcon.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    // Add parallax effect to background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.api-hero');

        parallaxElements.forEach(function(el) {
            const speed = 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
});