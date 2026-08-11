// assets/js/pages/about-creators.js
document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch and display creators from videos.json
    function loadCreatorsFromJSON() {
        const creatorsUrl = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/videos.json';

        fetch(creatorsUrl)
            .then(response => response.json())
            .then(data => {
                if (data.creators && data.creators.length > 0) {
                    // Count videos per creator
                    const videoCounts = {};
                    if (data.videos) {
                        data.videos.forEach(video => {
                            if (video.author) {
                                videoCounts[video.author] = (videoCounts[video.author] || 0) + 1;
                            }
                        });
                    }

                    // Build the creators HTML
                    let creatorsHTML = '';
                    data.creators.forEach(creator => {
                        const count = videoCounts[creator.name] || 0;
                        const countText = count === 1 ? '1 featured video' : `${count} featured videos`;
                        creatorsHTML += `
                            <div class="contributor-item">
                                <span class="name"><a href="${creator.url}" target="_blank" rel="noopener noreferrer">${creator.name}</a></span>
                                <span class="contribution">Created ${countText}</span>
                            </div>
                        `;
                    });

                    // Find the Content Creators section by looking for the heading
                    const allSections = document.querySelectorAll('.about-section');
                    let contentCreatorsSection = null;

                    allSections.forEach(section => {
                        const heading = section.querySelector('h2');
                        if (heading && heading.textContent.trim() === 'Content Creators') {
                            contentCreatorsSection = section;
                        }
                    });

                    if (contentCreatorsSection) {
                        // Find or create the contributors list container
                        let contributorsList = contentCreatorsSection.querySelector('.contributors-list');
                        if (!contributorsList) {
                            // Create container if it doesn't exist
                            contributorsList = document.createElement('div');
                            contributorsList.className = 'contributors-list';
                            contentCreatorsSection.appendChild(contributorsList);
                        }

                        // Get existing hardcoded items
                        const existingItems = contributorsList.querySelectorAll('.contributor-item');

                        // Clear the container
                        contributorsList.innerHTML = '';

                        // Add back existing hardcoded items
                        existingItems.forEach(item => {
                            contributorsList.appendChild(item.cloneNode(true));
                        });

                        // Add the dynamic creators
                        contributorsList.insertAdjacentHTML('beforeend', creatorsHTML);
                    }
                }
            })
            .catch(error => {
                console.error('Error loading creators data:', error);
                // Silently fail - the page will still work with hardcoded creators
            });
    }

    // Only run if we're on the about page
    if (document.querySelector('.about-content')) {
        loadCreatorsFromJSON();
    }
});