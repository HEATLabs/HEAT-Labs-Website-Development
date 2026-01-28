(function() {
    // Random texts
    const randomTexts = [
        "BEAM ME UP SCOTTY!",
        "Taking you somewhere else, hold on..",
        "Loading... please pretend this is impressive.",
        "This won't take long. Probably.",
        "Checking if this works.",
        "Ah, you're finally awake",
        "Hold on, I know a shortcut.",
        "This seemed faster in testing.",
        "Adjusting the timeline slightly.",
        "Why are you here?",
        "Remmy? is that you?",
        "A long time ago… just kidding",
        "Look, we don't know where you're going either.",
        "Padding our view stats.",
        "Searching for the holy grail.",
        "And now for something completely different.",
        "Putting far too much effort into what this is for.",
        "I have no memory of this place.",
        "One does not simply redirect.",
        "Trying to find which castle the princess is actually in.",
        "We checked. Twice. Still not here.",
        "Current Objective: Survive.",
        "Inserting disc two.",
        "We don't know how this works.",
        "Nothing is broken if we cant tell its broken.",
        "Why are you reading this?",
        "This is why we can't have nice things.",
        "Deploying optimism.",
        "Stand by for mild disappointment.",
        "Applying duct tape.",
        "Definitely doing something important.",
        "Please wait while we overthink this.",
        "Summoning ancient code.",
        "Just one more second. Promise.",
        "Please do not refresh. Or do. Rebel.",
        "Doing it live.",
        "Loading screen lore goes here.",
        "Initializing plot twist.",
        "Loading faster than your expectations.",
        "Convincing the server to cooperate.",
        "This is taking longer than it should.",
        "Please enjoy this brief moment of uncertainty.",
        "This worked yesterday.",
        "Turning it off and on again.",
        "Loading screen sponsored by patience.",
        "Performing unsafe operations safely.",
        "Trust the process.",
        "We regret nothing.",
        "This text exists to waste your time.",
        "This is where the app judges you.",
        "Imagine a progress bar here.",
        "This is why UX designers drink.",
        "Are you testing this or just bored?",
        "Blink. You missed it.",
        "This text was cheaper than a spinner.",
        "Somewhere, a developer is laughing.",
        "This is buying us milliseconds.",
        "This is the calm before mild disappointment.",
        "This is the part where you sigh.",
        "You're waiting. We're waiting. Now what?",
        "This message was written at 3 AM.",
        "We put this here because we could."
    ];

    // Update the h1 tag
    const h1 = document.querySelector('h1');
    if (h1) {
        const randomText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
        h1.textContent = randomText;
    }

    // Fetch and redirect
    fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/search-keywords.json')
        .then(res => res.json())
        .then(data => {
            if (!Array.isArray(data) || data.length === 0) return;

            const item = data[Math.floor(Math.random() * data.length)];
            if (item && item.path) {
                window.location.href = item.path;
            }
        })
        .catch(err => console.error('Redirect failed. Error:', err));
})();