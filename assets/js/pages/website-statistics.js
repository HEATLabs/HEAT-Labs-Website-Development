document.addEventListener('DOMContentLoaded', function() {
    // API endpoints
    const STATS_API_URL = 'https://views.heatlabs.net/api/stats';
    const PIXEL_MAPPING_URL = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/tracking-pixel.json';
    const GSC_INDEX_URL = 'https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/gsc-index.json';

    // CDN API endpoints
    const CDN_CONFIGS_URL = 'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Configs';
    const CDN_IMAGES_URLS = [
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-Tanks',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-Maps',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-News',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-Features',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-Guides',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-Blogs',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-Gallery',
        'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Images-Tournaments'
    ];
    const CDN_DATABASE_URL = 'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Database';
    const CDN_SOUNDS_URL = 'https://data.jsdelivr.com/v1/stats/packages/gh/heatlabs/HEAT-Labs-Sounds';

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
    const statsTableBody = document.getElementById('statsTableBody');
    const pageSearch = document.getElementById('pageSearch');
    const sortBy = document.getElementById('sortBy');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    // CDN DOM elements
    const configsRequestsEl = document.getElementById('configsRequests');
    const imagesRequestsEl = document.getElementById('imagesRequests');
    const databaseRequestsEl = document.getElementById('databaseRequests');
    const soundsRequestsEl = document.getElementById('soundsRequests');
    const configsBandwidthEl = document.getElementById('configsBandwidth');
    const imagesBandwidthEl = document.getElementById('imagesBandwidth');
    const databaseBandwidthEl = document.getElementById('databaseBandwidth');
    const soundsBandwidthEl = document.getElementById('soundsBandwidth');
    const configsCdnChartEl = document.getElementById('configsCdnChart');
    const imagesCdnChartEl = document.getElementById('imagesCdnChart');
    const databaseCdnChartEl = document.getElementById('databaseCdnChart');
    const soundsCdnChartEl = document.getElementById('soundsCdnChart');

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
    let cdnData = {
        configs: null,
        images: null,
        database: null,
        sounds: null
    };
    let processedData = [];
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredData = [];
    let dataLoadFailed = false;
    let cdnDataLoadFailed = false;

    // Format bytes to human readable
    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Initialize the page
    async function init() {
        try {
            showLoading();
            updateLoadingProgress(10);

            // Load main stats and CDN stats in parallel
            const [mainStatsResult, cdnStatsResult] = await Promise.allSettled([
                loadMainStats(),
                loadCdnStats()
            ]);

            updateLoadingProgress(90);

            // Handle main stats result
            if (mainStatsResult.status === 'fulfilled') {
                dataLoadFailed = false;
            } else {
                console.error('Main stats failed:', mainStatsResult.reason);
                dataLoadFailed = true;
                showErrorState();
            }

            // Handle CDN stats result
            if (cdnStatsResult.status === 'fulfilled') {
                cdnDataLoadFailed = false;
            } else {
                console.error('CDN stats failed:', cdnStatsResult.reason);
                cdnDataLoadFailed = true;
                showCdnErrorState();
            }

            updateLoadingProgress(95);
            setupEventListeners();
            updateLoadingProgress(100);

            // Small delay before hiding to ensure everything is rendered
            setTimeout(hideLoading, 300);
        } catch (error) {
            console.error('Error loading data:', error);
            dataLoadFailed = true;
            cdnDataLoadFailed = true;
            showErrorState();
            showCdnErrorState();
            hideLoading();
        }
    }

    async function loadMainStats() {
        updateLoadingProgress(20);

        const [statsResponse, mappingResponse, gscResponse] = await Promise.all([
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

        updateLoadingProgress(70);
        processData();
        updateLoadingProgress(75);
        updateSummaryCards();
        updateLoadingProgress(80);
        renderCharts();
        updateLoadingProgress(85);
        renderTable();
    }

    async function loadCdnStats() {
        updateLoadingProgress(25);

        // Fetch all image repos
        const imagePromises = CDN_IMAGES_URLS.map(url =>
            fetch(url).catch(error => {
                console.warn('Image CDN API failed:', error);
                return { ok: false };
            })
        );

        const [configsResponse, ...imageResponses] = await Promise.all([
            fetch(CDN_CONFIGS_URL).catch(error => {
                console.warn('Config CDN API failed:', error);
                return { ok: false };
            }),
            ...imagePromises,
            fetch(CDN_DATABASE_URL).catch(error => {
                console.warn('Database CDN API failed:', error);
                return { ok: false };
            }),
            fetch(CDN_SOUNDS_URL).catch(error => {
                console.warn('Sound CDN API failed:', error);
                return { ok: false };
            })
        ]);

        const databaseResponse = imageResponses.pop();
        const soundsResponse = imageResponses.pop();

        // Handle configs
        if (configsResponse.ok) {
            cdnData.configs = await configsResponse.json();
        } else {
            console.warn('Config CDN data not available');
            cdnData.configs = null;
        }

        // Handle images, aggregate all repos
        const imageDataArray = [];
        for (const response of imageResponses) {
            if (response.ok) {
                imageDataArray.push(await response.json());
            }
        }

        if (imageDataArray.length > 0) {
            cdnData.images = aggregateImageData(imageDataArray);
        } else {
            console.warn('No Image CDN data available');
            cdnData.images = null;
        }

        // Handle database
        if (databaseResponse.ok) {
            cdnData.database = await databaseResponse.json();
        } else {
            console.warn('Database CDN data not available');
            cdnData.database = null;
        }

        // Handle sounds
        if (soundsResponse.ok) {
            cdnData.sounds = await soundsResponse.json();
        } else {
            console.warn('Sound CDN data not available');
            cdnData.sounds = null;
        }

        updateLoadingProgress(65);
        updateCdnSummaryCards();
        updateLoadingProgress(75);
        renderCdnCharts();
    }

    function aggregateImageData(imageDataArray) {
        // Initialize aggregated structure
        const aggregated = {
            hits: {
                rank: null,
                typeRank: null,
                total: 0,
                dates: {},
                prev: {
                    rank: null,
                    typeRank: null,
                    total: 0
                }
            },
            bandwidth: {
                rank: null,
                typeRank: null,
                total: 0,
                dates: {},
                prev: {
                    rank: null,
                    typeRank: null,
                    total: 0
                }
            }
        };

        // Aggregate data from all repos
        for (const data of imageDataArray) {
            // Aggregate hits totals
            aggregated.hits.total += data.hits?.total || 0;
            aggregated.hits.prev.total += data.hits?.prev?.total || 0;

            // Aggregate bandwidth totals
            aggregated.bandwidth.total += data.bandwidth?.total || 0;
            aggregated.bandwidth.prev.total += data.bandwidth?.prev?.total || 0;

            // Aggregate hits by date
            if (data.hits?.dates) {
                for (const [date, value] of Object.entries(data.hits.dates)) {
                    aggregated.hits.dates[date] = (aggregated.hits.dates[date] || 0) + (value || 0);
                }
            }

            // Aggregate bandwidth by date
            if (data.bandwidth?.dates) {
                for (const [date, value] of Object.entries(data.bandwidth.dates)) {
                    aggregated.bandwidth.dates[date] = (aggregated.bandwidth.dates[date] || 0) + (value || 0);
                }
            }
        }

        return aggregated;
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

    function showCdnErrorState() {
        // Update CDN summary cards with error state
        configsRequestsEl.textContent = 'N/A';
        imagesRequestsEl.textContent = 'N/A';
        databaseRequestsEl.textContent = 'N/A';
        soundsRequestsEl.textContent = 'N/A';
        configsBandwidthEl.textContent = 'N/A';
        imagesBandwidthEl.textContent = 'N/A';
        databaseBandwidthEl.textContent = 'N/A';
        soundsBandwidthEl.textContent = 'N/A';

        // Render error placeholders for CDN charts
        renderCdnErrorCharts();
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

    function renderCdnErrorCharts() {
        const cdnChartContainers = [{
                element: configsCdnChartEl,
                title: 'Config CDN Stats (Last 30 Days)'
            },
            {
                element: imagesCdnChartEl,
                title: 'Image CDN Stats (Last 30 Days)'
            },
            {
                element: databaseCdnChartEl,
                title: 'Database CDN Stats (Last 30 Days)'
            },
            {
                element: soundsCdnChartEl,
                title: 'Sound CDN Stats (Last 30 Days)'
            }
        ];

        cdnChartContainers.forEach(({
            element,
            title
        }) => {
            if (element && element.parentNode) {
                const container = element.parentNode;
                container.innerHTML = `
                    <h3>${title}</h3>
                    <div class="chart-error-placeholder">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load CDN data</p>
                        <small>CDN API is currently unavailable</small>
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

    function updateCdnSummaryCards() {
        if (cdnDataLoadFailed) return;

        // Update configs
        if (cdnData.configs) {
            configsRequestsEl.textContent = cdnData.configs.hits.total.toLocaleString();
            configsBandwidthEl.textContent = formatBytes(cdnData.configs.bandwidth.total);
        } else {
            configsRequestsEl.textContent = 'N/A';
            configsBandwidthEl.textContent = 'N/A';
        }

        // Update images
        if (cdnData.images) {
            imagesRequestsEl.textContent = cdnData.images.hits.total.toLocaleString();
            imagesBandwidthEl.textContent = formatBytes(cdnData.images.bandwidth.total);
        } else {
            imagesRequestsEl.textContent = 'N/A';
            imagesBandwidthEl.textContent = 'N/A';
        }

        // Update database
        if (cdnData.database) {
            databaseRequestsEl.textContent = cdnData.database.hits.total.toLocaleString();
            databaseBandwidthEl.textContent = formatBytes(cdnData.database.bandwidth.total);
        } else {
            databaseRequestsEl.textContent = 'N/A';
            databaseBandwidthEl.textContent = 'N/A';
        }

        // Update sounds
        if (cdnData.sounds) {
            soundsRequestsEl.textContent = cdnData.sounds.hits.total.toLocaleString();
            soundsBandwidthEl.textContent = formatBytes(cdnData.sounds.bandwidth.total);
        } else {
            soundsRequestsEl.textContent = 'N/A';
            soundsBandwidthEl.textContent = 'N/A';
        }
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
    }

    function renderCdnCharts() {
        if (cdnDataLoadFailed) {
            renderCdnErrorCharts();
            return;
        }

        renderCdnChart('configs', configsCdnChartEl, 'Config CDN Stats');
        renderCdnChart('images', imagesCdnChartEl, 'Image CDN Stats');
        renderCdnChart('database', databaseCdnChartEl, 'Database CDN Stats');
        renderCdnChart('sounds', soundsCdnChartEl, 'Sound CDN Stats');
    }

    function renderCdnChart(type, chartElement, title) {
        const data = cdnData[type];
        if (!data) {
            if (chartElement && chartElement.parentNode) {
                const container = chartElement.parentNode;
                container.innerHTML = `
                    <h3>${title} (Last 30 Days)</h3>
                    <div class="chart-error-placeholder">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Failed to load CDN data</p>
                        <small>${type} CDN data is unavailable</small>
                    </div>
                `;
            }
            return;
        }

        const dates = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        const hitsData = dates.map(date => data.hits.dates[date] || 0);
        const bandwidthData = dates.map(date => data.bandwidth.dates[date] || 0);

        const displayDates = dates.map(date => {
            const [year, month, day] = date.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`;
        });

        new Chart(chartElement, {
            type: 'line',
            data: {
                labels: displayDates,
                datasets: [{
                        label: 'Requests',
                        data: hitsData,
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Bandwidth',
                        data: bandwidthData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.3,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.datasetIndex === 0) {
                                    label += context.raw.toLocaleString() + ' requests';
                                } else {
                                    label += formatBytes(context.raw);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Requests'
                        },
                        ticks: {
                            precision: 0
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Bandwidth'
                        },
                        ticks: {
                            callback: function(value) {
                                return formatBytes(value);
                            }
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
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
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Limit to top 10 categories

        new Chart(viewsByCategoryChartEl, {
            type: 'bar',
            data: {
                labels: sortedCategories.map(item => item[0]),
                datasets: [{
                    label: 'Views',
                    data: sortedCategories.map(item => item[1]),
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

    function renderTable() {
        if (dataLoadFailed) {
            return;
        }

        applySorting();
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
        const pageData = filteredData.slice(startIndex, endIndex);

        statsTableBody.innerHTML = '';

        for (const page of pageData) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${page.pageName}</td>
                <td>${page.todaysViews.toLocaleString()}</td>
                <td>${page.totalViews.toLocaleString()}</td>
                <td>${page.last7DaysViews.toLocaleString()}</td>
                <td>${page.last30DaysViews.toLocaleString()}</td>
                <td>
                    <button class="view-details-btn" data-page="${page.pageName}">
                        <i class="fas fa-chart-line mr-1"></i>Details
                    </button>
                </td>
            `;
            statsTableBody.appendChild(row);
        }

        updatePaginationControls(totalPages);
    }

    function applySorting() {
        const [sortKey, sortDir] = sortBy.value.split('-');
        filteredData.sort((a, b) => {
            let comparison = 0;
            if (sortKey === 'total') {
                comparison = a.totalViews - b.totalViews;
            } else if (sortKey === 'name') {
                comparison = a.pageName.localeCompare(b.pageName);
            }
            return sortDir === 'desc' ? -comparison : comparison;
        });
    }

    function updatePaginationControls(totalPages) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }

    function setupEventListeners() {
        pageSearch.addEventListener('input', () => {
            if (dataLoadFailed) return;

            const searchTerm = pageSearch.value.toLowerCase();
            filteredData = searchTerm ?
                processedData.filter(page =>
                    page.pageName.toLowerCase().includes(searchTerm) ||
                    page.htmlFile.toLowerCase().includes(searchTerm)
                ) : [...processedData];
            currentPage = 1;
            renderTable();
        });

        sortBy.addEventListener('change', () => {
            if (dataLoadFailed) return;
            currentPage = 1;
            renderTable();
        });

        prevPageBtn.addEventListener('click', () => {
            if (dataLoadFailed) return;
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (dataLoadFailed) return;
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
            }
        });

        statsTableBody.addEventListener('click', (e) => {
            if (dataLoadFailed) return;
            if (e.target.closest('.view-details-btn')) {
                const pageName = e.target.closest('.view-details-btn').dataset.page;
                viewPageDetails(pageName);
            }
        });

        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }

    function viewPageDetails(pageName) {
        const page = processedData.find(p => p.pageName === pageName);
        if (!page) return;

        modalTitle.textContent = page.pageName;

        modalStatsGrid.innerHTML = `
      <div class="modal-stat-item">
        <div class="modal-stat-label">Total Views</div>
        <div class="modal-stat-value">${page.totalViews.toLocaleString()}</div>
      </div>
      <div class="modal-stat-item">
        <div class="modal-stat-label">Today's Views</div>
        <div class="modal-stat-value">${page.todaysViews.toLocaleString()}</div>
      </div>
      <div class="modal-stat-item">
        <div class="modal-stat-label">Last 7 Days</div>
        <div class="modal-stat-value">${page.last7DaysViews.toLocaleString()}</div>
      </div>
      <div class="modal-stat-item">
        <div class="modal-stat-label">Last 30 Days</div>
        <div class="modal-stat-value">${page.last30DaysViews.toLocaleString()}</div>
      </div>
      <div class="modal-stat-item">
        <div class="modal-stat-label">Category</div>
        <div class="modal-stat-value">${page.category}</div>
      </div>
      <div class="modal-stat-item">
        <div class="modal-stat-label">Page URL</div>
        <div class="modal-stat-value" style="word-break: break-all;">${page.htmlFile}</div>
      </div>
      <div class="modal-stat-item">
        <div class="modal-stat-label">Indexed Status</div>
        <div class="modal-stat-value">${page.isIndexed ? 'Indexed' : 'Not Indexed'}</div>
      </div>
    `;

        openModal();
    }

    function openModal() {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showLoading() {
        loadingOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        updateLoadingProgress(10);
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
        document.body.style.overflow = '';
    }

    function updateLoadingProgress(percent) {
        loadingProgressBar.style.width = `${percent}%`;
    }

    init();
});