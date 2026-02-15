document.addEventListener('DOMContentLoaded', function() {
    const targetDate = new Date(2026, 1, 15, 12, 0, 0); // February 15, 2026 at 12:00:00 UTC
    const GAME_RELEASED = false;

    // Initialize variables for DOM elements
    const countdownTitle = document.querySelector('.countdown-title');
    const countdownSubtitle = document.querySelector('.countdown-subtitle');
    const countdownTimer = document.querySelector('.countdown-timer');
    const countdownContainer = document.querySelector('.countdown-container');
    const speculationNotice = document.getElementById('speculationNotice');
    const closeNoticeBtn = document.getElementById('closeNotice');
    const disclaimerSection = document.querySelector('.footer .text-center.text-sm.text-gray-500.space-y-1');

    // State variables
    let simpleCountdownMode = true;
    let countdownInterval;
    let isPast = false;

    // Show notification popup
    function showNotification() {
        // Only show if not previously dismissed
        if (!localStorage.getItem('noticeDismissed')) {
            speculationNotice.style.display = 'flex';
        }
    }

    // Close notification popup
    function closeNotification() {
        speculationNotice.style.display = 'none';
        localStorage.setItem('noticeDismissed', 'true');
    }

    // Event listeners for notification
    closeNoticeBtn.addEventListener('click', closeNotification);

    // Track typed characters for "alpha3"
    let typedChars = [];
    document.addEventListener('keydown', function(e) {
        typedChars.push(e.key.toLowerCase());
        if (typedChars.length > 6) {
            typedChars.shift();
        }
        if (typedChars.join('').includes('alpha3')) {
            toggleCountdownMode();
            typedChars = [];
        }
    });

    // Function to toggle between simple and detailed countdown
    function toggleCountdownMode() {
        if (GAME_RELEASED) return;

        simpleCountdownMode = !simpleCountdownMode;

        if (simpleCountdownMode) {
            // Switch to simple mode
            countdownTitle.classList.add('hidden');
            countdownSubtitle.classList.add('hidden');
            countdownTimer.innerHTML = `
        <div class="countdown-item">
          <div class="countdown-value" id="seconds">00</div>
        </div>
      `;
        } else {
            // Switch to detailed mode
            countdownTitle.classList.remove('hidden');
            countdownSubtitle.classList.remove('hidden');
            countdownTimer.innerHTML = `
        <div class="countdown-item">
          <div class="countdown-value" id="months">00</div>
          <div class="countdown-label">Months</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value" id="days">00</div>
          <div class="countdown-label">Days</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value" id="hours">00</div>
          <div class="countdown-label">Hours</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value" id="minutes">00</div>
          <div class="countdown-label">Minutes</div>
        </div>
        <div class="countdown-item">
          <div class="countdown-value" id="seconds">00</div>
          <div class="countdown-label">Seconds</div>
        </div>
      `;
        }

        // Update immediately after toggle
        updateCountdown();
    }

    // Function to show prediction off message
    function showPredictionOffMessage() {
        // Check if message already exists
        if (document.querySelector('.prediction-off-message')) return;

        const messageHTML = `
            <div class="prediction-off-message">
                <h3>Looks like our prediction was a bit off...</h3>
                <p>Our prediction for the start time was February 15, 2026 at 12:00 UTC, we missed the mark and Alpha 3 hasn't started yet. We're still counting up until we get official news.</p>
            </div>
        `;

        countdownContainer.insertAdjacentHTML('afterbegin', messageHTML);
    }

    // Function to show released message
    function showReleasedMessage() {
        // Hide the countdown timer
        countdownTimer.classList.add('hidden');
        countdownTitle.classList.add('hidden');
        countdownSubtitle.classList.add('hidden');

        // Remove the notification popup if it exists
        if (speculationNotice) {
            speculationNotice.remove();
        }

        // Hide the disclaimer section at the bottom
        if (disclaimerSection) {
            disclaimerSection.style.display = 'none';
        }

        // Show the released message
        const releasedHTML = `
            <div class="released-message">
                <h2>World of Tanks: HEAT is here!</h2>
                <h3>The moment we've all been waiting for!</h3>
                <p>Dive in, explore new features, and help shape the future of World of Tanks: HEAT.</p>

                <div class="released-actions">
                    <a href="https://wotheat.com" target="_blank" class="released-btn primary">
                        <i class="fas fa-gamepad"></i>
                        Play Now
                    </a>
                    <a href="https://discord.com/invite/wot-heat" class="released-btn secondary">
                        <i class="fab fa-discord"></i>
                        Join Community
                    </a>
                    <a href="../news" class="released-btn secondary">
                        <i class="fas fa-newspaper"></i>
                        Latest News
                    </a>
                </div>
            </div>
        `;

        countdownContainer.insertAdjacentHTML('afterbegin', releasedHTML);
    }

    // Function to start countdown
    function startCountdown() {
        if (!countdownInterval) {
            countdownInterval = setInterval(updateCountdown, 1000);
            updateCountdown();
        }
    }

    // Main initialization function
    function initializeCountdown() {
        if (GAME_RELEASED) {
            // Game is released, show message and stop countdown
            showReleasedMessage();
            stopCountdown();
        } else {
            // Game is not released, start the countdown
            countdownInterval = setInterval(updateCountdown, 1000);
            updateCountdown();
            showNotification();
        }
    }

    function updateCountdown() {
        if (GAME_RELEASED) return;

        const now = new Date();
        let difference = targetDate - now;
        let wasPast = isPast;
        isPast = difference <= 0;

        // If the countdown is over, switch to counting up
        if (isPast) {
            difference = Math.abs(difference);

            // Show prediction off message if we just crossed the threshold
            if (!wasPast) {
                showPredictionOffMessage();
            }
        } else {
            // Remove prediction message if were back in the future
            const predictionMessage = document.querySelector('.prediction-off-message');
            if (predictionMessage) {
                predictionMessage.remove();
            }
        }

        if (simpleCountdownMode) {
            // Simple mode - just show total seconds
            const totalSeconds = Math.floor(difference / 1000);
            const secondsElement = document.getElementById('seconds');
            if (secondsElement) {
                secondsElement.textContent = totalSeconds.toString().padStart(2, '0');
            }
        } else {
            // Detailed mode - show all units
            const months = Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44));
            const days = Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Update the display
            const monthsElement = document.getElementById('months');
            const daysElement = document.getElementById('days');
            const hoursElement = document.getElementById('hours');
            const minutesElement = document.getElementById('minutes');
            const secondsElement = document.getElementById('seconds');

            if (monthsElement) monthsElement.textContent = months.toString().padStart(2, '0');
            if (daysElement) daysElement.textContent = days.toString().padStart(2, '0');
            if (hoursElement) hoursElement.textContent = hours.toString().padStart(2, '0');
            if (minutesElement) minutesElement.textContent = minutes.toString().padStart(2, '0');
            if (secondsElement) secondsElement.textContent = seconds.toString().padStart(2, '0');
        }
    }

    initializeCountdown();
});