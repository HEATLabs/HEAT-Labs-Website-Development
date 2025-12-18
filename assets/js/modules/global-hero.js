document.addEventListener('DOMContentLoaded', function() {
    // Get all elements with hero classes
    const heroes = document.querySelectorAll('.hero, .home-hero');

    // Only proceed if we found hero elements
    if (heroes.length > 0) {
        // Generate a random number between 1 and 61
        const randomImageNumber = Math.floor(Math.random() * 61) + 1;

        // Construct the new image URL
        const newImageUrl = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://cdn.jsdelivr.net/gh/HEATLabs/HEAT-Labs-Images-Features@main/hero-background/${randomImageNumber}.webp')`;

        // Apply the new background image to all hero elements
        heroes.forEach(hero => {
            hero.style.backgroundImage = newImageUrl;

            // Find the <p> element within the hero-content
            const heroContent = hero.querySelector('.hero-content');
            if (heroContent) {
                const paragraph = heroContent.querySelector('p');

                // Hide paragraph on mobile
                if (paragraph && window.innerWidth < 768) {
                    paragraph.style.display = 'none';
                }
            }
        });
    }

    // Resize listener to handle orientation changes
    window.addEventListener('resize', function() {
        heroes.forEach(hero => {
            const heroContent = hero.querySelector('.hero-content');
            if (heroContent) {
                const paragraph = heroContent.querySelector('p');
                if (paragraph) {
                    // Show/hide based on current screen width
                    paragraph.style.display = window.innerWidth < 768 ? 'none' : '';
                }
            }
        });
    });
});