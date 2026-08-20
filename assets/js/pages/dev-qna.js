// Dev Stream Q&A
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Q&A section
    initQnA();
});

// Main initialization function
async function initQnA() {
    const section = document.querySelector('.section.py-8');
    if (!section) return;

    try {
        // Show loading state
        showLoading(section);

        // Fetch data
        const response = await fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/questions-answers.json');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();

        // Build the content
        buildContent(section, data);
    } catch (error) {
        console.error('Error loading Q&A data:', error);
        showError(section, 'Failed to load Q&A data. Please try again later.');
    }
}

// Show loading state
function showLoading(container) {
    container.innerHTML = `
        <div class="container mx-auto px-4">
            <div class="qa-loading">
                <div class="qa-loading-spinner"></div>
                <p class="qa-loading-text">Loading Q&A content...</p>
            </div>
        </div>
    `;
}

// Show error state
function showError(container, message) {
    container.innerHTML = `
        <div class="container mx-auto px-4">
            <div class="qa-error">
                <div class="qa-error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p class="qa-error-text">${message}</p>
                <button onclick="location.reload()" class="qa-error-retry">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        </div>
    `;
}

// Format date to "20 August 2026" style
function formatDate(dateString) {
    if (!dateString || dateString === 'Unknown') return 'Unknown';

    try {
        // Try to parse the date - handles various formats
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            // If parsing fails, try to handle common formats manually
            // Try "YYYY-MM-DD" format
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const day = parseInt(parts[2]);
                const parsedDate = new Date(year, month, day);
                if (!isNaN(parsedDate.getTime())) {
                    return formatDateObject(parsedDate);
                }
            }
            // Try "DD-MM-YYYY" format
            const parts2 = dateString.split('-');
            if (parts2.length === 3) {
                const day = parseInt(parts2[0]);
                const month = parseInt(parts2[1]) - 1;
                const year = parseInt(parts2[2]);
                const parsedDate = new Date(year, month, day);
                if (!isNaN(parsedDate.getTime())) {
                    return formatDateObject(parsedDate);
                }
            }
            // Try "MM/DD/YYYY" format
            const parts3 = dateString.split('/');
            if (parts3.length === 3) {
                const month = parseInt(parts3[0]) - 1;
                const day = parseInt(parts3[1]);
                const year = parseInt(parts3[2]);
                const parsedDate = new Date(year, month, day);
                if (!isNaN(parsedDate.getTime())) {
                    return formatDateObject(parsedDate);
                }
            }
            return dateString; // Return original if we can't parse it
        }

        return formatDateObject(date);
    } catch (e) {
        return dateString; // Return original on error
    }
}

// Format a Date object to "20 August 2026" style
function formatDateObject(date) {
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}

// Build the full content
function buildContent(container, data) {
    // Get episode keys and sort them in reverse order (latest first)
    const episodeKeys = Object.keys(data.episodes).sort((a, b) => {
        // Extract episode numbers from filenames
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numB - numA; // Descending order (latest first)
    });

    const totalEpisodes = episodeKeys.length;

    // Create the main wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'container mx-auto px-4';

    // Build all sections
    wrapper.innerHTML = `
        <!-- Blog Content Wrapper -->
        <div class="qa-content-wrapper">
            <!-- Main Content -->
            <div class="blog-main-content">
                <div class="blog-text">
                    ${buildIntroduction(data)}
                    ${buildSearchBox()}
                    ${buildEpisodes(data, episodeKeys)}
                </div>
                <!-- Mobile Sidebar Content -->
                ${buildMobileSidebar(data, episodeKeys)}
            </div>
            <!-- Desktop Sidebar -->
            ${buildDesktopSidebar(data, episodeKeys)}
        </div>
    `;

    // Replace container content
    container.innerHTML = '';
    container.appendChild(wrapper);

    // Initialize search functionality
    initSearch(data, episodeKeys);
}

// Build introduction section
function buildIntroduction(data) {
    const totalQuestions = data.total_questions || 0;
    const totalEpisodes = data.episode_count || 0;

    return `
        <h2 id="introduction">Introduction</h2>
        <p>
            Welcome to the Stream Q&A archive. This page contains all questions and answers
            from the official HEAT developer streams. Daiske compiled ${totalQuestions} questions across ${totalEpisodes} episodes
            to help you stay informed about the latest developments in World of Tanks: HEAT.
        </p>
        <p>
            Below you'll find each episode's questions organized by date, with answers from the HEAT development team.
            Use the search box to quickly find topics that interest you.
        </p>
    `;
}

// Build search box
function buildSearchBox() {
    return `
        <div class="qa-search-container">
            <div class="relative">
                <i class="fas fa-search qa-search-icon"></i>
                <input
                    type="text"
                    id="qaSearchInput"
                    placeholder="Search all questions and answers..."
                    class="qa-search-input"
                    autocomplete="off"
                >
                <button id="qaSearchClear" class="qa-search-clear" aria-label="Clear search">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="qaSearchStats" class="qa-search-stats">
                <span id="qaSearchCount">0</span> matching questions
            </div>
        </div>
    `;
}

// Build all episode sections
function buildEpisodes(data, episodeKeys) {
    let html = '';

    episodeKeys.forEach((key, index) => {
        const episode = data.episodes[key];
        const episodeNum = episode.episode_number || (index + 1);
        const sectionId = `section-${episodeNum}`;
        // Format the date using the new function
        const formattedDate = formatDate(episode.date);

        html += `
            <h2 id="${sectionId}" class="qa-section-target">Episode #${episodeNum}</h2>
            <p class="qa-episode-date"><strong>Date:</strong> ${formattedDate}</p>
            <div class="qa-episode-tldr"><strong>TLDR:</strong> ${episode.tldr || 'No summary available'}</div>
            ${buildQuestions(episode.questions, episodeNum)}
        `;
    });

    return html;
}

// Build questions for an episode
function buildQuestions(questions, episodeNum) {
    if (!questions || questions.length === 0) {
        return `
            <div class="qa-empty-state">
                No questions available for this episode.
            </div>
        `;
    }

    let html = '';

    questions.forEach((q, index) => {
        const qNumber = index + 1;
        const qId = `q-${episodeNum}-${qNumber}`;

        html += `
            <div class="qa-item" data-episode="${episodeNum}" data-question-number="${qNumber}" data-question-text="${escapeHtml(q.question.toLowerCase())}">
                <div class="highlight-takeaways">
                    <p class="title">Q${qNumber}: ${escapeHtml(q.question)}</p>
                    ${buildAnswers(q.answers, q.notes)}
                </div>
            </div>
        `;
    });

    return html;
}

// Build answers for a question
function buildAnswers(answers, notes) {
    if (!answers || answers.length === 0) {
        return `
            <ul class="list-disc">
                <li><em>No answer available</em></li>
            </ul>
        `;
    }

    let html = '<ul class="list-disc">';

    answers.forEach(answer => {
        const speaker = escapeHtml(answer.speaker || 'Unknown');
        const text = escapeHtml(answer.text || 'No response');

        // Process newlines in the text
        const formattedText = formatTextWithNewlines(text);

        html += `
            <li>
                <strong>${speaker}:</strong> ${formattedText}
            </li>
        `;
    });

    html += '</ul>';

    // Add notes if present
    if (notes && notes.length > 0) {
        html += `
            <div class="qa-notes">
                <strong>Notes from Daiske:</strong>
                <ul class="list-disc">
                    ${notes.map(note => `<li>${formatTextWithNewlines(escapeHtml(note))}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    return html;
}

// Format text with newlines into HTML paragraphs
function formatTextWithNewlines(text) {
    if (!text) return '';

    // Split by double newlines first (paragraphs), then single newlines
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

    if (paragraphs.length > 1) {
        // Multiple paragraphs
        return paragraphs.map(p =>
            `<p class="qa-answer-paragraph">${p.replace(/\n/g, '<br>')}</p>`
        ).join('');
    } else {
        // Single paragraph with line breaks
        return text.replace(/\n/g, '<br>');
    }
}

// Escape HTML entities to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Build mobile sidebar
function buildMobileSidebar(data, episodeKeys) {
    return `
        <div class="qa-mobile-sidebar">
            ${buildAuthorCard()}
            ${buildTableOfContents(episodeKeys)}
        </div>
    `;
}

// Build desktop sidebar
function buildDesktopSidebar(data, episodeKeys) {
    return `
        <div class="qa-desktop-sidebar">
            ${buildAuthorCard()}
            ${buildTableOfContents(episodeKeys)}
        </div>
    `;
}

// Build author card
function buildAuthorCard() {
    return `
        <div class="sidebar-card qa-author-card">
            <h3>About the Author</h3>
            <div class="author-info">
                <img src="https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Images/refs/heads/main/contributors/Daiske.webp" alt="Author">
                <div>
                    <h4>Daiske</h4>
                    <p>Q&A Writer</p>
                </div>
            </div>
        </div>
    `;
}

// Build table of contents
function buildTableOfContents(episodeKeys) {
    let tocHtml = `
        <div class="sidebar-card">
            <h3>Table of Contents</h3>
            <ul class="qa-toc-list">
                <li>
                    <a href="#introduction" class="qa-toc-link">Introduction</a>
                </li>
    `;

    episodeKeys.forEach((key) => {
        const episode = key.episode_number || parseInt(key.match(/\d+/)?.[0] || 0);
        tocHtml += `
            <li>
                <a href="#section-${episode}" class="qa-toc-link">Episode #${episode}</a>
            </li>
        `;
    });

    tocHtml += `
            </ul>
        </div>
    `;

    return tocHtml;
}

// Initialize search functionality
function initSearch(data, episodeKeys) {
    const searchInput = document.getElementById('qaSearchInput');
    const searchClear = document.getElementById('qaSearchClear');
    const searchStats = document.getElementById('qaSearchStats');
    const searchCount = document.getElementById('qaSearchCount');
    const qaItems = document.querySelectorAll('.qa-item');

    if (!searchInput) return;

    // Handle search input
    searchInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        let matchCount = 0;

        // Show/hide clear button
        if (query.length > 0) {
            searchClear.classList.add('visible');
        } else {
            searchClear.classList.remove('visible');
        }

        // Filter questions
        qaItems.forEach(item => {
            const questionText = item.dataset.questionText || '';
            const answerText = item.textContent.toLowerCase();
            const isMatch = query === '' || questionText.includes(query) || answerText.includes(query);

            if (isMatch) {
                item.classList.remove('hidden');
                matchCount++;
            } else {
                item.classList.add('hidden');
            }
        });

        // Update stats
        if (query.length > 0) {
            searchStats.classList.add('visible');
            searchCount.textContent = matchCount;
        } else {
            searchStats.classList.remove('visible');
        }
    });

    // Handle clear button
    searchClear.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
    });

    // Handle escape key
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.blur();
        }
    });
}

// Export for debugging if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initQnA
    };
}