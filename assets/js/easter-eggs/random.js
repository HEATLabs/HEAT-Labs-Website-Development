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
        "Searching for the holy grail.",
        "And now for something completely different.",
        "Putting far too much effort into what this is for."
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