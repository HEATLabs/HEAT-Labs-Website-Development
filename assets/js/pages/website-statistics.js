document.addEventListener('DOMContentLoaded', function() {
    // API endpoints
    const STATS_API_URL = 'https://views.heatlabs.net/api/stats';
    const PIXEL_MAPPING_URL = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/tracking-pixel.json';
    const GSC_INDEX_URL = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/gsc-index.json';
    const PAGE_DATA_URL = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/page-data.json';

    // DOM elements
    const totalViewsEl = document.getElementById('totalViews');
    const todaysViewsEl = document.getElementById('todaysViews');
    const trackedPagesEl = document.getElementById('trackedPages');
    const mostPopularViewsEl = document.getElementById('mostPopularViews');
    const mostPopularPageEl = document.getElementById('mostPopularPage');
    const dailyViewsChartEl = document.getElementById('dailyViewsChart');
    const topPagesChartEl = document.getElementById('topPagesChart');
    const viewsByTimeChartEl = document.getElementById('viewsByTimeChart');
    const indexedPagesChartEl = document.getElementById('indexedPagesChart');
    const viewsByCategoryChartEl = document.getElementById('viewsByCategoryChart');
    const googleIndexChartEl = document.getElementById('googleIndexChart');
    const googleApiChartEl = document.getElementById('googleApiChart');
    const httpsStatusChartEl = document.getElementById('httpsStatusChart');
    const breadcrumbChartEl = document.getElementById('breadcrumbChart');
    const statsTableBody = document.getElementById('statsTableBody');
    const pageSearch = document.getElementById('pageSearch');
    const sortBy = document.getElementById('sortBy');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    // Loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loader-spinner"></div>
        <div class="loading-text">Loading Website Statistics</div>
        <div class="loading-subtext">Fetching and processing data...</div>
        <div class="loading-progress">
            <div class="loading-progress-bar" id="loadingProgressBar"></div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
    const loadingProgressBar = document.getElementById('loadingProgressBar');

    // Modal elements
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Page Statistics</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="modal-stats-grid" id="modalStatsGrid"></div>
      </div>
    </div>
  `;
    document.body.appendChild(modalOverlay);
    const modalTitle = modalOverlay.querySelector('.modal-title');
    const modalStatsGrid = modalOverlay.querySelector('#modalStatsGrid');
    const modalClose = modalOverlay.querySelector('.modal-close');

    // Global variables
    let statsData = {};
    let pixelMapping = {};
    let gscIndexData = {};
    let pageData = {};
    let processedData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredData = [];
    let dataLoadFailed = false;

    // Initialize the page
    async function init() {
        try {
            showLoading();
            updateLoadingProgress(10);

            // Load main stats
            await loadMainStats();

            updateLoadingProgress(90);
            setupEventListeners();
            updateLoadingProgress(100);

            // Small delay before hiding to ensure everything is rendered
            setTimeout(hideLoading, 300);
        } catch (error) {
            console.error('Error loading data:', error);
            dataLoadFailed = true;
            showErrorState();
            hideLoading();
        }
    }

    async function loadMainStats() {
        updateLoadingProgress(20);

        const [statsResponse, mappingResponse, gscResponse, pageDataResponse] = await Promise.all([
            fetch(STATS_API_URL).catch(error => {
                console.warn('Stats API failed:', error);
                return {
                    ok: false
                };
            }),
            fetch(PIXEL_MAPPING_URL).catch(error => {
                console.warn('Pixel mapping API failed:', error);
                return {
                    ok: false
                };
            }),
            fetch(GSC_INDEX_URL).catch(error => {
                console.warn('GSC index API failed:', error);
                return {
                    ok: false
                };
            }),
            fetch(PAGE_DATA_URL).catch(error => {
                console.warn('Page data API failed:', error);
                return {
                    ok: false
                };
            })
        ]);

        // Check if any critical API failed
        if (!statsResponse.ok || !mappingResponse.ok) {
            throw new Error('Critical APIs failed to load');
        }

        updateLoadingProgress(40);
        statsData = await statsResponse.json();
        updateLoadingProgress(50);
        pixelMapping = await mappingResponse.json();
        updateLoadingProgress(60);

        // GSC data is optional, so handle gracefully
        if (gscResponse.ok) {
            gscIndexData = await gscResponse.json();
        } else {
            gscIndexData = {
                data: {
                    pages: []
                }
            };
            console.warn('GSC index data not available, using fallback');
        }

        // Page data is optional
        if (pageDataResponse.ok) {
            pageData = await pageDataResponse.json();
        } else {
            pageData = {
                statistics: {
                    google_index_data: {
                        pending: 0,
                        not_indexed: 0,
                        indexed: 0
                    },
                    google_api_status: {
                        pending: 0,
                        not_indexed: 0,
                        indexed: 0
                    },
                    https_page_status: {
                        unknown: 0,
                        not_https: 0,
                        https: 0
                    },
                    breadcrumb_status: {
                        unknown: 0,
                        invalid: 0,
                        valid: 0
                    }
                }
            };
            console.warn('Page data not available, using fallback to 0');
        }

        updateLoadingProgress(70);
        processData();
        updateLoadingProgress(75);
        updateSummaryCards();
        updateLoadingProgress(80);
        renderCharts();
        updateLoadingProgress(85);
        renderTable();
    }

    function showErrorState() {
        // Add error state to summary cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach(card => card.classList.add('error-state'));

        // Update summary cards with error state
        totalViewsEl.textContent = 'N/A';
        todaysViewsEl.textContent = 'N/A';
        trackedPagesEl.textContent = 'N/A';
        mostPopularViewsEl.textContent = 'N/A';
        mostPopularPageEl.textContent = 'Data unavailable';

        // Render error placeholders for charts
        renderErrorCharts();

        // Clear table and show message
        statsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-message-cell">
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Failed to load statistics data</span>
                        <small>The statistics API is currently unavailable. Please try again later.</small>
                    </div>
                </td>
            </tr>
        `;

        // Disable controls
        pageSearch.disabled = true;
        sortBy.disabled = true;
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
    }

    function renderErrorCharts() {
        const chartContainers = [{
                element: dailyViewsChartEl,
                title: 'Daily Views (Last 30 Days)'
            },
            {
                element: topPagesChartEl,
                title: 'Top Pages by Views'
            },
            {
                element: viewsByTimeChartEl,
                title: 'Views by Time Period'
            },
            {
                element: indexedPagesChartEl,
                title: 'Indexed vs Tracked Pages'
            },
            {
                element: viewsByCategoryChartEl,
                title: 'Views by Category (Last 30 Days)'
            },
            {
                element: googleIndexChartEl,
                title: 'Google Index Data'
            },
            {
                element: googleApiChartEl,
                title: 'Google API Status'
            },
            {
                element: httpsStatusChartEl,
                title: 'HTTPS Page Status'
            },
            {
                element: breadcrumbChartEl,
                title: 'Breadcrumb Validation Status'
            }
        ];

        chartContainers.forEach(({
            element,
            title
        }) => {
            if (element && element.parentNode) {
                const container = element.parentNode;
                container.innerHTML = `
                    <h3>${title}</h3>
                    <div class="chart-error-placeholder">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load chart data</p>
                        <small>Statistics API is currently unavailable</small>
                    </div>
                `;
            }
        });
    }

    function processData() {
        processedData = [];
        const today = new Date().toISOString().split('T')[0];

        for (const [pixelFilename, pixelStats] of Object.entries(statsData)) {
            const pageInfo = pixelMapping.pixels.find(p => p.pixel_filename === pixelFilename);

            if (pageInfo) {
                const last7DaysViews = calculateLastNDaysViews(pixelStats.dailyViews, 7);
                const last30DaysViews = calculateLastNDaysViews(pixelStats.dailyViews, 30);

                // Determine if page is a main page
                const isMainPage = [
                    'tournaments.html',
                    'tanks.html',
                    'asset-gallery.html',
                    'agents.html',
                    'strategy-planner.html',
                    'news.html',
                    'maps.html',
                    'legal.html',
                    'index.html',
                    'guides.html',
                    'game-data.html',
                    'check-compare.html',
                    'builds.html',
                    'bug-hunting.html',
                    'blog.html',
                    '404.html',
                ].some(mainPage => pageInfo.html_file.includes(mainPage));

                processedData.push({
                    pixelFilename,
                    pageName: pageInfo.page_name,
                    htmlFile: pageInfo.html_file,
                    totalViews: pixelStats.totalViews,
                    todaysViews: pixelStats.dailyViews[today] || 0,
                    last7DaysViews,
                    last30DaysViews,
                    dailyViews: pixelStats.dailyViews,
                    category: isMainPage ? 'Main Pages' : getCategoryFromPath(pageInfo.html_file),
                    isIndexed: isPageIndexed(pageInfo.html_file)
                });
            }
        }

        filteredData = [...processedData];
    }

    function isPageIndexed(htmlFile) {
        if (!gscIndexData?.data?.pages) return false;

        const pageUrl = `https://heatlabs.net/${htmlFile}`;
        return gscIndexData.data.pages.some(page =>
            page.url === pageUrl &&
            page.indexing_state === 'INDEXED' &&
            page.coverage_state === 'VALID'
        );
    }

    function calculateLastNDaysViews(dailyViews, days) {
        const dates = Object.keys(dailyViews).sort().reverse();
        let sum = 0;
        let count = 0;

        for (const date of dates) {
            if (count >= days) break;
            sum += dailyViews[date];
            count++;
        }

        return sum;
    }

    function getCategoryFromPath(path) {
        if (path.includes('announcements/')) return 'Announcements';
        if (path.includes('steam-news/')) return 'Steam News';
        if (path.includes('blog/')) return 'Blog';
        if (path.includes('bug-hunting/')) return 'Bug Hunting';
        if (path.includes('guides/')) return 'Guides';
        if (path.includes('legal/')) return 'Legal';
        if (path.includes('maps/')) return 'Maps';
        if (path.includes('news/')) return 'News';
        if (path.includes('tanks/')) return 'Tanks';
        if (path.includes('tournaments/')) return 'Tournaments';
        if (path.includes('resources/')) return 'Resources';
        if (path.includes('easter-eggs/')) return 'Easter Eggs';
        if (path.includes('playground/')) return 'Playground';
        if (path.includes('agents/')) return 'Agents';
        return 'Other';
    }

    function updateSummaryCards() {
        if (dataLoadFailed) {
            totalViewsEl.textContent = 'N/A';
            todaysViewsEl.textContent = 'N/A';
            trackedPagesEl.textContent = 'N/A';
            mostPopularViewsEl.textContent = 'N/A';
            mostPopularPageEl.textContent = 'Data unavailable';
            return;
        }

        const totalViews = processedData.reduce((sum, page) => sum + page.totalViews, 0);
        const todaysViews = processedData.reduce((sum, page) => sum + page.todaysViews, 0);

        let mostPopular = {
            totalViews: 0,
            pageName: ''
        };
        for (const page of processedData) {
            if (page.totalViews > mostPopular.totalViews) {
                mostPopular = {
                    totalViews: page.totalViews,
                    pageName: page.pageName
                };
            }
        }

        totalViewsEl.textContent = totalViews.toLocaleString();
        todaysViewsEl.textContent = todaysViews.toLocaleString();
        trackedPagesEl.textContent = processedData.length.toLocaleString();
        mostPopularViewsEl.textContent = mostPopular.totalViews.toLocaleString();
        mostPopularPageEl.textContent = mostPopular.pageName;
    }

    function renderCharts() {
        if (dataLoadFailed) {
            renderErrorCharts();
            return;
        }

        renderDailyViewsChart();
        renderTopPagesChart();
        renderViewsByTimeChart();
        renderIndexedPagesChart();
        renderViewsByCategoryChart();
        renderGoogleIndexChart();
        renderGoogleApiChart();
        renderHttpsStatusChart();
        renderBreadcrumbChart();
    }

    function renderDailyViewsChart() {
        const dates = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        const dailyViewsData = dates.map(date => {
            let sum = 0;
            for (const page of processedData) {
                sum += page.dailyViews[date] || 0;
            }
            return sum;
        });

        const displayDates = dates.map(date => {
            const [year, month, day] = date.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
        });

        new Chart(dailyViewsChartEl, {
            type: 'line',
            data: {
                labels: displayDates,
                datasets: [{
                    label: 'Daily Views',
                    data: dailyViewsData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    function renderTopPagesChart() {
        const topPages = [...processedData]
            .sort((a, b) => b.totalViews - a.totalViews)
            .slice(0, 10);

        const pageNames = topPages.map(page => page.pageName);
        const views = topPages.map(page => page.totalViews);

        new Chart(topPagesChartEl, {
            type: 'bar',
            data: {
                labels: pageNames,
                datasets: [{
                    label: 'Total Views',
                    data: views,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'nearest',
                        intersect: true,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                indexAxis: 'y'
            }
        });
    }

    function renderViewsByTimeChart() {
        const timePeriods = ['Today', 'Last 7 Days', 'Last 30 Days', 'All Time'];
        const viewsData = [
            processedData.reduce((sum, page) => sum + page.todaysViews, 0),
            processedData.reduce((sum, page) => sum + page.last7DaysViews, 0),
            processedData.reduce((sum, page) => sum + page.last30DaysViews, 0),
            processedData.reduce((sum, page) => sum + page.totalViews, 0)
        ];

        new Chart(viewsByTimeChartEl, {
            type: 'bar',
            data: {
                labels: timePeriods,
                datasets: [{
                    label: 'Views',
                    data: viewsData,
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    function renderIndexedPagesChart() {
        const indexedCount = processedData.filter(page => page.isIndexed).length;
        const notIndexedCount = processedData.filter(page => !page.isIndexed).length;

        new Chart(indexedPagesChartEl, {
            type: 'pie',
            data: {
                labels: ['Indexed & Tracked', 'Tracked Not Indexed'],
                datasets: [{
                    data: [indexedCount, notIndexedCount],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderViewsByCategoryChart() {
        const categories = {};
        const today = new Date();

        // Calculate views by category for last 30 days
        processedData.forEach(page => {
            if (!categories[page.category]) {
                categories[page.category] = 0;
            }

            // Sum views for last 30 days
            for (let i = 0; i < 30; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                categories[page.category] += page.dailyViews[dateStr] || 0;
            }
        });

        const sortedCategories = Object.entries(categories)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8);

        const categoryNames = sortedCategories.map(([name]) => name);
        const categoryViews = sortedCategories.map(([, views]) => views);

        new Chart(viewsByCategoryChartEl, {
            type: 'doughnut',
            data: {
                labels: categoryNames,
                datasets: [{
                    data: categoryViews,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 205, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(199, 199, 199, 0.7)',
                        'rgba(83, 102, 255, 0.7)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                        'rgba(83, 102, 255, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderGoogleIndexChart() {
        const googleIndexData = pageData.statistics.google_index_data;
        const labels = ['Pending', 'Not Indexed', 'Indexed'];
        const data = [googleIndexData.pending, googleIndexData.not_indexed, googleIndexData.indexed];
        const colors = ['rgba(255, 205, 86, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'];
        const borderColors = ['rgba(255, 205, 86, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'];

        new Chart(googleIndexChartEl, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderGoogleApiChart() {
        const googleApiData = pageData.statistics.google_api_status;
        const labels = ['Pending', 'Not Indexed', 'Indexed'];
        const data = [googleApiData.pending, googleApiData.not_indexed, googleApiData.indexed];
        const colors = ['rgba(255, 205, 86, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'];
        const borderColors = ['rgba(255, 205, 86, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'];

        new Chart(googleApiChartEl, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderHttpsStatusChart() {
        const httpsData = pageData.statistics.https_page_status;
        const labels = ['Unknown', 'Not HTTPS', 'HTTPS'];
        const data = [httpsData.unknown, httpsData.not_https, httpsData.https];
        const colors = ['rgba(199, 199, 199, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'];
        const borderColors = ['rgba(199, 199, 199, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'];

        new Chart(httpsStatusChartEl, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderBreadcrumbChart() {
        const breadcrumbData = pageData.statistics.breadcrumb_status;
        const labels = ['Unknown', 'Invalid', 'Valid'];
        const data = [breadcrumbData.unknown, breadcrumbData.invalid, breadcrumbData.valid];
        const colors = ['rgba(199, 199, 199, 0.7)', 'rgba(255, 99, 132, 0.7)', 'rgba(75, 192, 192, 0.7)'];
        const borderColors = ['rgba(199, 199, 199, 1)', 'rgba(255, 99, 132, 1)', 'rgba(75, 192, 192, 1)'];

        new Chart(breadcrumbChartEl, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderTable() {
        if (dataLoadFailed) {
            return;
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);

        statsTableBody.innerHTML = '';

        if (pageData.length === 0) {
            statsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        No pages found matching your search criteria.
                    </td>
                </tr>
            `;
            return;
        }

        pageData.forEach(page => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${page.pageName}</td>
                <td>${page.category}</td>
                <td>${page.totalViews.toLocaleString()}</td>
                <td>${page.todaysViews.toLocaleString()}</td>
                <td>${page.last7DaysViews.toLocaleString()}</td>
                <td>
                    <button class="view-details-btn" data-page='${JSON.stringify(page).replace(/'/g, "\\'")}'>
                        View Details
                    </button>
                </td>
            `;
            statsTableBody.appendChild(row);
        });

        updatePagination();
    }

    function updatePagination() {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    function setupEventListeners() {
        // Search functionality
        pageSearch.addEventListener('input', debounce(() => {
            const searchTerm = pageSearch.value.toLowerCase().trim();
            filterData(searchTerm);
            currentPage = 1;
            renderTable();
        }, 300));

        // Sort functionality
        sortBy.addEventListener('change', () => {
            sortData();
            currentPage = 1;
            renderTable();
        });

        // Pagination
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });

        // Modal functionality
        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        // View details buttons (delegated)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-details-btn')) {
                const pageData = JSON.parse(e.target.getAttribute('data-page'));
                openModal(pageData);
            }
        });
    }

    function filterData(searchTerm) {
        if (!searchTerm) {
            filteredData = [...processedData];
        } else {
            filteredData = processedData.filter(page =>
                page.pageName.toLowerCase().includes(searchTerm) ||
                page.category.toLowerCase().includes(searchTerm) ||
                page.htmlFile.toLowerCase().includes(searchTerm)
            );
        }
        sortData(); // Re-sort after filtering
    }

    function sortData() {
        const sortValue = sortBy.value;
        filteredData.sort((a, b) => {
            switch (sortValue) {
                case 'name-asc':
                    return a.pageName.localeCompare(b.pageName);
                case 'name-desc':
                    return b.pageName.localeCompare(a.pageName);
                case 'views-asc':
                    return a.totalViews - b.totalViews;
                case 'views-desc':
                    return b.totalViews - a.totalViews;
                case 'today-asc':
                    return a.todaysViews - b.todaysViews;
                case 'today-desc':
                    return b.todaysViews - a.todaysViews;
                case 'category-asc':
                    return a.category.localeCompare(b.category);
                case 'category-desc':
                    return b.category.localeCompare(a.category);
                default:
                    return 0;
            }
        });
    }

    function openModal(pageData) {
        modalTitle.textContent = pageData.pageName;

        // Calculate additional stats
        const last7DaysViews = pageData.last7DaysViews;
        const last30DaysViews = pageData.last30DaysViews;
        const averageDailyViews = Math.round(pageData.totalViews / Object.keys(pageData.dailyViews).length);

        modalStatsGrid.innerHTML = `
            <div class="modal-stat-item">
                <div class="modal-stat-label">Total Views</div>
                <div class="modal-stat-value">${pageData.totalViews.toLocaleString()}</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-label">Today's Views</div>
                <div class="modal-stat-value">${pageData.todaysViews.toLocaleString()}</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-label">Last 7 Days</div>
                <div class="modal-stat-value">${last7DaysViews.toLocaleString()}</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-label">Last 30 Days</div>
                <div class="modal-stat-value">${last30DaysViews.toLocaleString()}</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-label">Average Daily Views</div>
                <div class="modal-stat-value">${averageDailyViews.toLocaleString()}</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-label">Category</div>
                <div class="modal-stat-value">${pageData.category}</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-label">Indexed in Google</div>
                <div class="modal-stat-value">${pageData.isIndexed ? 'Yes' : 'No'}</div>
            </div>
            <div class="modal-stat-item">
                <div class="modal-stat-label">HTML File</div>
                <div class="modal-stat-value" style="font-size: 0.9rem;">${pageData.htmlFile}</div>
            </div>
        `;

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showLoading() {
        loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
    }

    function updateLoadingProgress(percent) {
        loadingProgressBar.style.width = `${percent}%`;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    init();
});