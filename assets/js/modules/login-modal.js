document.addEventListener('DOMContentLoaded', function() {
    // Prevent multi initialization
    if (document.getElementById('loginModal')) {
        return;
    }

    // Create login modal
    const loginModalHTML = `
        <div class="login-overlay" id="loginOverlay"></div>
        <div class="login-modal" id="loginModal">
            <div class="login-header">
                <h2 class="login-title">
                    Sign In
                </h2>
                <button class="login-close-btn" id="loginCloseBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form class="login-form" id="loginForm">
                <div class="login-input-group">
                    <label class="login-label" for="loginEmail">Email Address</label>
                    <input type="email"
                           class="login-input"
                           id="loginEmail"
                           placeholder="Enter your email"
                           required>
                </div>

                <div class="login-input-group">
                    <label class="login-label" for="loginPassword">Password</label>
                    <input type="password"
                           class="login-input"
                           id="loginPassword"
                           placeholder="Enter your password"
                           required>
                </div>

                <div class="login-options">
                    <label class="login-remember">
                        <input type="checkbox" id="rememberMe">
                        <span>Remember me</span>
                    </label>
                    <a href="#" class="login-forgot">Forgot password?</a>
                </div>

                <button type="submit" class="login-btn-primary">
                    <i class="fa-solid fa-right-to-bracket"></i>
                    Sign In
                </button>
            </form>

            <div class="login-divider">
                <span>Or continue with</span>
            </div>

            <button class="login-btn-secondary" id="wargamingLoginBtn">
                <span class="wargaming-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 661.738 678.039" width="16" height="16" fill="currentColor">
                        <path d="M319.897.18c70.85-2.403 142.426 19.221 200.312 61.374 69.892 49.891 119.485 128.508 135.234 214.438 12.797 62.188 5.505 127.694-16.608 186.736-28.96 77.272-86.567 142.571-158.455 179.95-46.465 23.923-98.503 38.125-150.748 34.909-43.543 2.581-86.982-7.487-127.017-24.698-80.896-34.623-147-103.878-178.984-187.688-25.074-64.344-30.719-136.705-14.414-204.05 18.541-82.043 68.615-155.817 136.577-202.813C196.905 22.475 258.091 2.406 319.897.18m-62.975 79.854c-69.372 20.633-129.461 71.975-161.618 138.435-25.006 50.21-32.882 108.649-24.521 164.232 1.374 6.711.755 14.34 4.988 20.104 26.342-60.419 57.919-121.124 108.611-163.808 48.603-39.396 107.276-69.5 170.286-70.667-12.761-15.581-25.59-31.093-38.691-46.394 45.19 13.074 90.247 26.678 134.995 41.305-30.716 31.624-61.356 63.354-93.349 93.601 1.035-19.47 2.479-38.974 2.96-58.479-22.048 3.958-42.578 14.842-59.639 29.54-37.214 32.261-59.124 79.182-72.744 126.354-14.033 48.479-19.877 99.532-17.436 150.023 34.875-4.096 68.684-16.394 99.154-34.13 37.183-21.696 68.653-56.077 81.311-98.688-16.028 2.649-31.919 6.258-47.671 10.245 25.452-33.211 51.485-65.965 76.872-99.249 21.839 37.101 44.159 73.949 63.281 112.644-16.987-6.749-32.982-15.898-50.316-21.662 17.78 72.861 13.86 151.581-14.446 221.081 76.08-27.168 138.021-92.5 162.34-171.4 21.668-69.007 15.548-147.27-18.397-211.044-28.723-55.649-77.248-99.995-134.104-123.385-54.204-22.473-115.769-25.053-171.866-8.658z"/>
                    </svg>
                </span>
                Login with Wargaming.net ID
            </button>

            <div class="login-footer">
                <p>Don't have an account? <a href="#" id="openSignupLink">Sign up here</a></p>
            </div>
        </div>

        <!-- Sign Up Modal -->
        <div class="login-modal" id="signupModal">
            <div class="login-header">
                <h2 class="login-title">
                    Create Account
                </h2>
                <button class="login-close-btn" id="signupCloseBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form class="login-form" id="signupForm">
                <div class="login-input-group">
                    <label class="login-label" for="signupEmail">Email Address</label>
                    <input type="email"
                           class="login-input"
                           id="signupEmail"
                           placeholder="Enter your email"
                           required>
                </div>

                <div class="login-input-group">
                    <label class="login-label" for="signupPassword">Password</label>
                    <input type="password"
                           class="login-input"
                           id="signupPassword"
                           placeholder="Create a password"
                           required>
                    <div class="password-requirements">
                        <small>Password must be at least 8 characters long</small>
                    </div>
                </div>

                <div class="login-input-group">
                    <label class="login-label" for="confirmPassword">Confirm Password</label>
                    <input type="password"
                           class="login-input"
                           id="confirmPassword"
                           placeholder="Confirm your password"
                           required>
                </div>

                <div class="login-options">
                    <label class="login-remember">
                        <input type="checkbox" id="termsAgreement">
                        <span>I agree to the <a href="legal/terms-of-service">Terms of Service</a> and <a href="legal/privacy-policy">Privacy Policy</a></span>
                    </label>
                </div>

                <button type="submit" class="login-btn-primary">
                    <i class="fa-solid fa-user-check"></i>
                    Create Account
                </button>
            </form>

            <div class="login-divider">
                <span>Already have an account?</span>
            </div>

            <button class="login-btn-secondary" id="backToLoginBtn">
                <i class="fa-solid fa-arrow-left"></i>
                Back to Sign In
            </button>

            <div class="login-footer">
                <p>By creating an account, you agree to our terms and privacy policy.</p>
            </div>
        </div>

        <!-- Toast Notification -->
        <div id="loginToast" class="login-toast">
            <i class="fas fa-info-circle"></i>
            <span id="loginToastMessage">This is a development placeholder</span>
        </div>
    `;

    // Insert the modal into DOM
    document.body.insertAdjacentHTML('beforeend', loginModalHTML);

    // Get DOM elements
    const loginModal = document.getElementById('loginModal');
    const signupModal = document.getElementById('signupModal');
    const loginOverlay = document.getElementById('loginOverlay');
    const loginCloseBtn = document.getElementById('loginCloseBtn');
    const signupCloseBtn = document.getElementById('signupCloseBtn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const wargamingLoginBtn = document.getElementById('wargamingLoginBtn');
    const openSignupLink = document.getElementById('openSignupLink');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const loginToast = document.getElementById('loginToast');
    const loginToastMessage = document.getElementById('loginToastMessage');

    // Open login modal when clicking login button
    const openLoginBtn = document.getElementById('openLogin');
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', openLoginModal);
    }

    // Show toast notification
    function showLoginToast(message, type = 'info') {
        loginToastMessage.textContent = message;
        loginToast.className = 'login-toast';
        loginToast.classList.add(type);
        loginToast.classList.add('show');
        loginToast.classList.remove('hide');

        // Hide after 3 seconds
        setTimeout(() => {
            loginToast.classList.remove('show');
            loginToast.classList.add('hide');

            // Remove hide class after animation completes
            setTimeout(() => {
                loginToast.classList.remove('hide');
            }, 300);
        }, 3000);
    }

    // Open login modal
    function openLoginModal() {
        closeSignupModal();
        loginModal.classList.add('active');
        loginOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus on email field
        setTimeout(() => {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) emailInput.focus();
        }, 300);
    }

    // Close login modal
    function closeLoginModal() {
        loginModal.classList.remove('active');
        loginOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Open signup modal
    function openSignupModal() {
        closeLoginModal();
        signupModal.classList.add('active');
        loginOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus on email field
        setTimeout(() => {
            const emailInput = document.getElementById('signupEmail');
            if (emailInput) emailInput.focus();
        }, 300);
    }

    // Close signup modal
    function closeSignupModal() {
        signupModal.classList.remove('active');
        loginOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Handle login form submission
    function handleLoginSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Basic validation
        if (!email || !password) {
            showLoginToast('Please fill in all fields', 'info');
            return;
        }

        // This is a placeholder
        showLoginToast('Login functionality is under development.', 'info');

        // Close the modal after showing message
        setTimeout(() => {
            closeLoginModal();
        }, 2000);
    }

    // Handle signup form submission
    function handleSignupSubmit(e) {
        e.preventDefault();

        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAgreement = document.getElementById('termsAgreement').checked;

        // Validation
        if (!email || !password || !confirmPassword) {
            showLoginToast('Please fill in all fields', 'info');
            return;
        }

        if (password !== confirmPassword) {
            showLoginToast('Passwords do not match', 'info');
            return;
        }

        if (password.length < 8) {
            showLoginToast('Password must be at least 8 characters long', 'info');
            return;
        }

        if (!termsAgreement) {
            showLoginToast('Please agree to the terms and privacy policy', 'info');
            return;
        }

        // This is a placeholder
        showLoginToast('Account creation is under development.', 'info');

        // Clear form
        document.getElementById('signupForm').reset();

        // Close the modal after showing message
        setTimeout(() => {
            closeSignupModal();
            openLoginModal();
        }, 2000);
    }

    // Handle Wargaming.net login
    function handleWargamingLogin() {
        // This is a placeholder
        showLoginToast('Wargaming.net ID login is under development.', 'info');
    }

    // Initialize login modal
    function initializeLoginModal() {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            document.getElementById('loginEmail').value = savedEmail;
            document.getElementById('rememberMe').checked = true;
        }
    }

    // Switch to signup modal
    function switchToSignup() {
        openSignupModal();
    }

    // Switch back to login modal
    function switchToLogin() {
        openLoginModal();
    }

    // Event listeners
    loginCloseBtn.addEventListener('click', closeLoginModal);
    signupCloseBtn.addEventListener('click', closeSignupModal);
    loginOverlay.addEventListener('click', () => {
        closeLoginModal();
        closeSignupModal();
    });
    loginForm.addEventListener('submit', handleLoginSubmit);
    signupForm.addEventListener('submit', handleSignupSubmit);
    wargamingLoginBtn.addEventListener('click', handleWargamingLogin);
    openSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchToSignup();
    });
    backToLoginBtn.addEventListener('click', switchToLogin);

    // Prevent modal from closing when clicking inside
    loginModal.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    signupModal.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Handle Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (loginModal.classList.contains('active')) {
                closeLoginModal();
            }
            if (signupModal.classList.contains('active')) {
                closeSignupModal();
            }
        }
    });

    // Remember email if checkbox is checked on form submit
    loginForm.addEventListener('submit', function(e) {
        const rememberMe = document.getElementById('rememberMe').checked;
        const email = document.getElementById('loginEmail').value;

        if (rememberMe && email) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    });

    // Initialize on page load
    initializeLoginModal();
});