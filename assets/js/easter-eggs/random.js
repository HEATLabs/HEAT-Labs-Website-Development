(function () {
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