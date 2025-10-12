// Discord Redirect Page
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
    const joinButton = document.getElementById('joinDiscordBtn');

    // Update countdown every second
    const countdownInterval = setInterval(() => {
        countdown--;
        countdownElement.textContent = countdown;

        // Update button text with countdown
        if (countdown > 0) {
            joinButton.innerHTML = `<i class="fab fa-discord mr-2"></i> Join Discord Server (${countdown})`;
        } else {
            joinButton.innerHTML = `<i class="fab fa-discord mr-2"></i> Redirecting...`;
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
        redirectToDiscord();
    }, 5000);
}

function setupImmediateRedirect() {
    const joinButton = document.getElementById('joinDiscordBtn');

    joinButton.addEventListener('click', function(e) {
        e.preventDefault();
        redirectToDiscord();
    });
}

function redirectToDiscord() {
    // Discord invite URL
    const discordUrl = 'https://discord.com/invite/caEFCA9ScF';

    // Try to open in a new tab first, then fallback to current window
    const newWindow = window.open(discordUrl, '_blank');

    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // If popup blocked, redirect current page
        window.location.href = discordUrl;
    } else {
        // If new tab opened successfully, show a message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #5865F2 0%, var(--accent-color) 100%); color: white; text-align: center;">
                <div>
                    <i class="fab fa-discord" style="font-size: 4rem; margin-bottom: 2rem;"></i>
                    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Welcome to Discord!</h1>
                    <p style="font-size: 1.25rem; margin-bottom: 2rem;">You should be redirected to our Discord server shortly.</p>
                    <p style="opacity: 0.8;">If nothing happens, <a href="${discordUrl}" style="color: white; text-decoration: underline;">click here</a> to join manually.</p>
                </div>
            </div>
        `;
    }
}

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    const discordLogo = document.querySelector('.discord-logo');

    if (discordLogo) {
        discordLogo.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.2)';
            this.style.transition = 'transform 0.3s ease';
        });

        discordLogo.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }

    // Add parallax effect to background
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.discord-hero');

        parallaxElements.forEach(function(el) {
            const speed = 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
});