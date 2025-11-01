document.addEventListener('DOMContentLoaded', function() {
    // Fetch changelog data from GitHub
    fetchChangelogData();
});

function fetchChangelogData() {
    const changelogUrl = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/changelog.json';
    const changelogContainer = document.getElementById('changelogContainer');

    // Show loading state
    changelogContainer.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading changelog...</p>
        </div>
    `;

    fetch(changelogUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            renderChangelog(data.updates);
        })
        .catch(error => {
            console.error('Error fetching changelog:', error);
            changelogContainer.innerHTML = `
                <div class="error-message text-center py-10">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Failed to load changelog</h3>
                    <p class="text-gray-500">We couldn't load the changelog data. Please try again later.</p>
                    <button onclick="fetchChangelogData()" class="btn-accent mt-4">
                        <i class="fas fa-sync-alt mr-2"></i>Retry
                    </button>
                </div>
            `;
        });
}

function renderChangelog(updates) {
    const changelogContainer = document.getElementById('changelogContainer');

    if (!updates || updates.length === 0) {
        changelogContainer.innerHTML = `
            <div class="empty-state text-center py-10">
                <i class="fas fa-clipboard-list text-3xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-semibold mb-2">No updates yet</h3>
                <p class="text-gray-500">Check back later for updates to the project.</p>
            </div>
        `;
        return;
    }

    // Sort updates by date (newest first)
    updates.sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = `
        <div class="latest-update-section">
            <h3 class="section-title">
                <i class="fas fa-star"></i> Latest Update
            </h3>
            ${renderUpdateCard(updates[0], true)}
        </div>
    `;

    // Group older updates by month/year
    if (updates.length > 1) {
        const olderUpdates = updates.slice(1);
        const groupedUpdates = groupUpdatesByMonth(olderUpdates);

        html += `
            <div class="older-updates-section">
                <h3 class="section-title">
                    <i class="fas fa-history"></i> Past Updates
                    <span class="update-count">(${olderUpdates.length} total)</span>
                </h3>
                <div class="older-updates-container">
                    ${renderGroupedUpdates(groupedUpdates)}
                </div>
            </div>
        `;
    }

    changelogContainer.innerHTML = html;

    // Set up expand/collapse function
    setupExpandableCards();
}

function groupUpdatesByMonth(updates) {
    const groups = {};

    updates.forEach(update => {
        const date = new Date(update.date);
        const monthYear = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });

        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }

        groups[monthYear].push(update);
    });

    return groups;
}

function renderGroupedUpdates(groupedUpdates) {
    let html = '';

    // Sort months in descending order
    const sortedMonths = Object.keys(groupedUpdates).sort((a, b) => {
        return new Date(b) - new Date(a);
    });

    sortedMonths.forEach(monthYear => {
        const updates = groupedUpdates[monthYear];

        html += `
            <div class="month-group">
                <h4 class="month-title">
                    <i class="fas fa-calendar-alt"></i>
                    ${monthYear}
                    <span class="month-count">(${updates.length} update${updates.length > 1 ? 's' : ''})</span>
                </h4>
                <div class="month-updates">
                    ${updates.map(update => renderUpdateCard(update, false)).join('')}
                </div>
            </div>
        `;
    });

    return html;
}

function renderUpdateCard(update, isExpanded = false) {
    const hasAdded = update.added && update.added.length > 0;
    const hasChanged = update.changed && update.changed.length > 0;
    const hasFixed = update.fixed && update.fixed.length > 0;
    const hasRemoved = update.removed && update.removed.length > 0;

    return `
        <div class="update-card ${isExpanded ? 'expanded' : 'collapsed'}" data-expanded="${isExpanded}">
            <div class="update-header">
                <div class="update-header-main">
                    <h3 class="update-title">${update.title}</h3>
                    <div class="update-meta">
                        <span class="update-version">v${update.version}</span>
                        <span class="update-date">${formatDate(update.date)}</span>
                        <span class="update-author">
                            <i class="fas fa-user"></i>
                            ${update.author}
                        </span>
                    </div>
                </div>
                <button class="expand-toggle-btn" type="button" aria-label="${isExpanded ? 'Collapse' : 'Expand'} update details">
                    <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}"></i>
                </button>
            </div>

            <div class="update-content" style="${isExpanded ? '' : 'display: none;'}">
                <p class="update-description">${update.description}</p>

                <div class="update-details">
                    ${hasAdded ? `
                        <div class="update-section added">
                            <h4><i class="fas fa-plus-circle"></i> Added</h4>
                            <ul class="update-list">
                                ${update.added.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${hasChanged ? `
                        <div class="update-section changed">
                            <h4><i class="fas fa-exchange-alt"></i> Changed</h4>
                            <ul class="update-list">
                                ${update.changed.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${hasFixed ? `
                        <div class="update-section fixed">
                            <h4><i class="fas fa-bug"></i> Fixed</h4>
                            <ul class="update-list">
                                ${update.fixed.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${hasRemoved ? `
                        <div class="update-section removed">
                            <h4><i class="fas fa-minus-circle"></i> Removed</h4>
                            <ul class="update-list">
                                ${update.removed.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function setupExpandableCards() {
    const cards = document.querySelectorAll('.update-card.collapsed, .update-card.expanded');

    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.expand-toggle-btn')) {
                return;
            }

            const content = this.querySelector('.update-content');
            const icon = this.querySelector('.expand-toggle-btn i');
            const isExpanded = content.style.display !== 'none';

            if (isExpanded) {
                content.style.display = 'none';
                icon.className = 'fas fa-chevron-down';
                this.classList.remove('expanded');
                this.classList.add('collapsed');
                this.setAttribute('data-expanded', 'false');
            } else {
                content.style.display = 'block';
                icon.className = 'fas fa-chevron-up';
                this.classList.remove('collapsed');
                this.classList.add('expanded');
                this.setAttribute('data-expanded', 'true');
            }
        });

        const button = card.querySelector('.expand-toggle-btn');
        if (button) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();

                const card = this.closest('.update-card');
                const content = card.querySelector('.update-content');
                const icon = this.querySelector('i');
                const isExpanded = content.style.display !== 'none';

                if (isExpanded) {
                    content.style.display = 'none';
                    icon.className = 'fas fa-chevron-down';
                    card.classList.remove('expanded');
                    card.classList.add('collapsed');
                    card.setAttribute('data-expanded', 'false');
                } else {
                    content.style.display = 'block';
                    icon.className = 'fas fa-chevron-up';
                    card.classList.remove('collapsed');
                    card.classList.add('expanded');
                    card.setAttribute('data-expanded', 'true');
                }
            });
        }
    });
}

function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Make fetchChangelogData available globally for retry button
window.fetchChangelogData = fetchChangelogData;