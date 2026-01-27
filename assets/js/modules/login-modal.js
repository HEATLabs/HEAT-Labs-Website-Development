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
                <i class="fa-solid fa-shield"></i>
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