document.addEventListener('DOMContentLoaded', function() {
    // Set initial last updated time to current time
    const initialLastUpdated = new Date().toISOString();
    updateLastUpdatedTime(initialLastUpdated);

    // Fetch status data immediately
    fetchStatusData();

    // Set up auto-refresh every 5 minutes
    setInterval(fetchStatusData, 5 * 60 * 1000);

    // Initialize server monitoring
    initializeServerMonitoring();
});

// Server monitoring configuration
const SERVER_API_KEY = "ur2540855-8a25d33f16ec589715c9ab65";
const SERVER_API_URL = "https://api.uptimerobot.com/v2/getMonitors";
const SERVER_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Status mapping for servers
const SERVER_STATUS_MAP = {
    0: {
        text: "Paused",
        class: "status-paused"
    },
    1: {
        text: "Not checked yet",
        class: "status-unknown"
    },
    2: {
        text: "Up",
        class: "status-up"
    },
    8: {
        text: "Seems down",
        class: "status-down"
    },
    9: {
        text: "Down",
        class: "status-down"
    }
};

let serverRefreshTimer = null;
let serverChartInstances = {};

function fetchStatusData() {
    fetch('https://raw.githubusercontent.com/HEATLabs/HEAT-Labs-Configs/refs/heads/main/system-status.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Use current time as last updated time
            const currentTime = new Date().toISOString();
            data.last_updated = currentTime;

            // Add last_updated timestamp to each system if not present
            data.systems.forEach(system => {
                if (!system.last_updated) {
                    system.last_updated = currentTime;
                }
            });

            updateStatusPage(data);
        })
        .catch(error => {
            console.error('Error fetching status data:', error);
            showErrorState();
        });
}

function updateStatusPage(data) {
    // Update last updated time
    updateLastUpdatedTime(data.last_updated);

    // Determine overall status based on systems
    const overallStatus = determineOverallStatus(data.systems);

    // Update overall status
    updateOverallStatus(overallStatus);

    // Update systems status
    updateSystemsStatus(data.systems);

    // Update incidents if any
    if (data.incidents && data.incidents.length > 0) {
        updateIncidents(data.incidents);
    }
}

function updateLastUpdatedTime(timestamp) {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    const lastUpdated = new Date(timestamp);
    lastUpdatedElement.textContent = lastUpdated.toLocaleString();
}

function determineOverallStatus(systems) {
    const statusPriority = {
        'major_outage': 4,
        'partial_outage': 3,
        'degraded': 2,
        'maintenance': 1,
        'operational': 0
    };

    let highestStatus = 'operational';
    let maintenanceCount = 0;

    for (const system of systems) {
        if (system.status === 'maintenance') {
            maintenanceCount++;
        }
        if (statusPriority[system.status] > statusPriority[highestStatus]) {
            highestStatus = system.status;
        }
    }

    // Special case: if all systems are in maintenance, show maintenance status
    if (maintenanceCount === systems.length) {
        return 'maintenance';
    }

    return highestStatus;
}

function updateOverallStatus(status) {
    // Remove active class from all summary items first
    document.querySelectorAll('.status-summary-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to the appropriate summary item
    let summaryItem;
    switch (status) {
        case 'operational':
            summaryItem = document.querySelector('.status-summary-item.all-operational');
            break;
        case 'degraded':
        case 'partial_outage':
            summaryItem = document.querySelector('.status-summary-item.some-issues');
            break;
        case 'major_outage':
            summaryItem = document.querySelector('.status-summary-item.major-outage');
            break;
        case 'maintenance':
            summaryItem = document.querySelector('.status-summary-item.maintenance');
            break;
        default:
            summaryItem = document.querySelector('.status-summary-item.some-issues');
    }

    if (summaryItem) {
        summaryItem.classList.add('active');
    }
}

function updateSystemsStatus(systems) {
    const statusGrid = document.getElementById('statusGrid');

    // Clear loading state
    statusGrid.innerHTML = '';

    // Create cards for each system
    systems.forEach(system => {
        const systemCard = document.createElement('div');
        systemCard.className = 'status-card';

        systemCard.innerHTML = `
            <div class="status-card-header">
                <h3 class="status-card-title">${system.name}</h3>
                <span class="status-indicator ${formatStatusClass(system.status)}">
                    <span class="status-dot ${formatStatusClass(system.status)}"></span>
                    ${formatStatusText(system.status)}
                </span>
            </div>
            <div class="status-card-body">
                <p class="status-message">${system.message || 'No issues reported'}</p>
            </div>
        `;

        statusGrid.appendChild(systemCard);
    });
}

function formatStatusClass(status) {
    return status.replace(/_/g, '-');
}

function updateIncidents(incidents) {
    const incidentsSection = document.getElementById('incidentsSection');
    const incidentsList = document.getElementById('incidentsList');

    // Show incidents section
    incidentsSection.classList.remove('hidden');

    // Clear existing incidents
    incidentsList.innerHTML = '';

    // Add each incident
    incidents.forEach(incident => {
        const incidentItem = document.createElement('div');
        incidentItem.className = `incident-item ${incident.severity}`;

        const statusText = incident.status === 'ended' ? 'Resolved' :
            incident.status === 'started' ? 'Started' :
            formatStatusText(incident.status);

        const endTimeText = incident.end_time ?
            `Ended: ${new Date(incident.end_time).toLocaleString()}` :
            'Ongoing';

        let updatesHtml = '';
        if (incident.updates && incident.updates.length > 0) {
            // Sort updates by time (newest first)
            const sortedUpdates = [...incident.updates].sort((a, b) =>
                new Date(b.time) - new Date(a.time));

            updatesHtml = '<div class="incident-updates">';
            updatesHtml += '<h4 class="updates-title">Updates Timeline</h4>';

            sortedUpdates.forEach(update => {
                const updateStatus = update.status === 'ended' ? 'Ended' :
                    update.status === 'started' ? 'Started' :
                    formatStatusText(update.status);

                updatesHtml += `
                    <div class="incident-update">
                        <div class="update-header">
                            <span class="update-status ${formatStatusClass(update.status)}">
                                ${updateStatus}
                            </span>
                            <span class="update-time">${new Date(update.time).toLocaleString()}</span>
                        </div>
                        <p class="update-content">${update.message}</p>
                    </div>
                `;
            });
            updatesHtml += '</div>';
        }

        incidentItem.innerHTML = `
            <div class="incident-header">
                <div>
                    <h3 class="incident-title">${incident.title}</h3>
                    <div class="incident-meta">
                        <span class="incident-status ${formatStatusClass(incident.status)}">
                            ${statusText}
                        </span>
                        <span class="incident-date">Started: ${new Date(incident.start_time).toLocaleString()}</span>
                        <span class="incident-date">${endTimeText}</span>
                    </div>
                </div>
            </div>
            <div class="incident-body">
                <p>${incident.description}</p>
            </div>
            ${updatesHtml}
        `;

        incidentsList.appendChild(incidentItem);
    });
}

function formatStatusText(status) {
    switch (status) {
        case 'operational':
            return 'Operational';
        case 'degraded':
            return 'Degraded';
        case 'partial_outage':
            return 'Partial Outage';
        case 'major_outage':
            return 'Major Outage';
        case 'maintenance':
            return 'Maintenance';
        case 'started':
            return 'Started';
        case 'ended':
            return 'Resolved';
        default:
            return status;
    }
}

function showErrorState() {
    const statusGrid = document.getElementById('statusGrid');
    statusGrid.innerHTML = `
        <div class="status-error" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem;"></i>
            <h3>Unable to load status data</h3>
            <p>We're having trouble loading the current system status. Please try again later.</p>
            <button onclick="fetchStatusData()" class="btn-accent mt-4">
                <i class="fas fa-sync-alt mr-2"></i>Retry
            </button>
        </div>
    `;
}

// Server Monitoring Functions
function initializeServerMonitoring() {
    // Load data initially
    loadServerData();

    // Set up refresh interval (auto-refresh is always enabled now)
    serverRefreshTimer = setInterval(loadServerData, SERVER_REFRESH_INTERVAL);
}

// Fetch monitors from Uptime Robot API using form data
async function fetchServerMonitors() {
    try {
        // Create form data instead of using headers
        const formData = new URLSearchParams();
        formData.append('api_key', SERVER_API_KEY);
        formData.append('format', 'json');
        formData.append('logs', '1');
        formData.append('response_times', '1');
        formData.append('custom_uptime_ratios', '1-7-30');
        formData.append('response_times_limit', '24'); // Get 24 hours of data for charts

        const response = await fetch(SERVER_API_URL, {
            method: 'POST',
            body: formData
            // Avoid CORS preflight
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.stat !== 'ok') {
            throw new Error(`API error: ${data.error?.message || 'Unknown error'}`);
        }

        return data;
    } catch (error) {
        console.error('Error fetching monitors:', error);
        throw error;
    }
}

// Format uptime ratio with appropriate color
function formatServerUptime(uptimeRatio) {
    if (!uptimeRatio || uptimeRatio === "" || uptimeRatio === "0") return "N/A";

    const uptimePercent = parseFloat(uptimeRatio);
    let uptimeClass = "uptime-low";

    if (uptimePercent >= 99.5) {
        uptimeClass = "uptime-high";
    } else if (uptimePercent >= 95.0) {
        uptimeClass = "uptime-medium";
    }

    return `<span class="uptime-value ${uptimeClass}">${uptimePercent.toFixed(2)}%</span>`;
}

// Format response time with appropriate color
function formatServerResponseTime(responseTime) {
    if (!responseTime) {
        return `<span class="response-value response-na">N/A</span>`;
    }

    let responseClass = "response-slow";

    if (responseTime < 100) {
        responseClass = "response-fast";
    } else if (responseTime < 500) {
        responseClass = "response-medium";
    }

    return `<span class="response-value ${responseClass}">${responseTime}ms</span>`;
}

// Format last check timestamp using the most recent log entry
function formatServerLastCheck(monitor) {
    // Check if we have logs and get the most recent one
    if (monitor.logs && monitor.logs.length > 0) {
        // Sort logs by datetime (newest first)
        const sortedLogs = [...monitor.logs].sort((a, b) => b.datetime - a.datetime);
        const lastLog = sortedLogs[0];

        if (lastLog && lastLog.datetime) {
            // Convert to milliseconds
            const timestampMs = lastLog.datetime < 10000000000 ? lastLog.datetime * 1000 : lastLog.datetime;
            const dt = new Date(timestampMs);

            // Check if date is valid
            if (isNaN(dt.getTime())) return "Never";

            return dt.toLocaleString();
        }
    }

    // Fallback to last_heartbeat if no logs available
    const timestamp = monitor.last_heartbeat || monitor.create_datetime;
    if (!timestamp || timestamp === 0) return "Never";

    // Convert to milliseconds
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const dt = new Date(timestampMs);

    // Check if date is valid
    if (isNaN(dt.getTime())) return "Never";

    return dt.toLocaleString();
}

// Format monitoring since date (when the monitor was created)
function formatServerMonitoringSince(timestamp) {
    if (!timestamp || timestamp === 0) return "Unknown";

    // Convert to milliseconds
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    const dt = new Date(timestampMs);

    // Check if date is valid
    if (isNaN(dt.getTime())) return "Unknown";

    return dt.toLocaleDateString();
}

// Get theme colors for charts
function getServerChartColors() {
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');

    return {
        gridColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        tickColor: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
    };
}

// Create response time chart for a monitor
function createServerChart(monitorId, monitorData) {
    const container = document.getElementById(`chart-${monitorId}`);
    if (!container) return null;

    // Clear previous content
    container.innerHTML = '';

    // Check if we have response time data
    const hasResponseTimeData = monitorData.response_times && monitorData.response_times.length > 0;

    // Show placeholder if no data available
    if (!hasResponseTimeData) {
        container.innerHTML = `
            <div class="chart-placeholder">
                <div class="chart-placeholder-icon">📊</div>
                <p class="chart-placeholder-text">No response time data available</p>
            </div>
        `;
        return null;
    }

    // Create response time chart
    const responseTimes = monitorData.response_times || [];
    const last24hResponses = responseTimes
        .filter(rt => {
            const responseTime = new Date(rt.datetime * 1000);
            const now = new Date();
            return (now - responseTime) <= 24 * 60 * 60 * 1000;
        })
        .sort((a, b) => a.datetime - b.datetime);

    // Check if we have any response times after filtering
    if (last24hResponses.length === 0) {
        container.innerHTML = `
            <div class="chart-placeholder">
                <div class="chart-placeholder-icon">📊</div>
                <p class="chart-placeholder-text">No response time data available for the last 24 hours</p>
            </div>
        `;
        return null;
    }

    const data = last24hResponses.map(rt => rt.value);

    // Get canvas element
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Get theme colors
    const colors = getServerChartColors();

    // Create chart
    const ctx = canvas.getContext('2d');
    serverChartInstances[monitorId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(last24hResponses.length).fill(''),
            datasets: [{
                label: 'Response Time (ms)',
                data: data,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + 'ms';
                        },
                        color: colors.tickColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                x: {
                    ticks: {
                        display: false,
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    return serverChartInstances[monitorId];
}

// Load server data from Uptime Robot
async function loadServerData() {
    const serversGrid = document.getElementById('serversGrid');

    try {
        // Show loading state
        serversGrid.innerHTML = `
            <div class="server-loading-overlay">
                <div class="server-loader"></div>
                <p>Loading server status...</p>
            </div>
        `;

        // Fetch data from Uptime Robot
        const data = await fetchServerMonitors();

        // Clear existing server cards
        serversGrid.innerHTML = '';

        // Check if we have monitors
        if (!data.monitors || data.monitors.length === 0) {
            serversGrid.innerHTML = `
                <div class="server-error-message">
                    <i class="fas fa-info-circle"></i>
                    <span>No servers configured for monitoring</span>
                </div>
            `;
            return;
        }

        // Create a card for each monitor
        data.monitors.forEach((monitor, index) => {
            const statusInfo = SERVER_STATUS_MAP[monitor.status] || SERVER_STATUS_MAP[1];
            const uptimeRatios = monitor.custom_uptime_ratio ? monitor.custom_uptime_ratio.split('-') : [];

            const serverCard = document.createElement('div');
            serverCard.className = 'server-card';
            serverCard.innerHTML = `
                <div class="server-header">
                    <h3 class="server-name">${monitor.friendly_name}</h3>
                    <span class="server-status ${statusInfo.class}">
                        ${statusInfo.text}
                    </span>
                </div>
                <div class="server-details">
                    <div class="server-detail">
                        <span class="detail-label">Uptime (24h):</span>
                        <span class="detail-value">${formatServerUptime(uptimeRatios[0])}</span>
                    </div>
                    <div class="server-detail">
                        <span class="detail-label">Uptime (7d):</span>
                        <span class="detail-value">${formatServerUptime(uptimeRatios[1])}</span>
                    </div>
                    <div class="server-detail">
                        <span class="detail-label">Uptime (30d):</span>
                        <span class="detail-value">${formatServerUptime(uptimeRatios[2])}</span>
                    </div>
                    <div class="server-detail">
                        <span class="detail-label">Avg. Response:</span>
                        <span class="detail-value">${formatServerResponseTime(monitor.average_response_time)}</span>
                    </div>
                    <div class="server-detail">
                        <span class="detail-label">Last Check:</span>
                        <span class="detail-value">${formatServerLastCheck(monitor)}</span>
                    </div>
                    <div class="server-detail">
                        <span class="detail-label">Monitoring Since:</span>
                        <span class="detail-value">${formatServerMonitoringSince(monitor.create_datetime)}</span>
                    </div>
                </div>
                <div class="chart-section">
                    <div class="chart-container" id="chart-${monitor.id}">
                        <div class="chart-placeholder">
                            <div class="chart-placeholder-icon">📊</div>
                            <p class="chart-placeholder-text">Loading chart...</p>
                        </div>
                    </div>
                </div>
            `;

            serversGrid.appendChild(serverCard);

            // Create chart after DOM is updated
            setTimeout(() => {
                createServerChart(monitor.id, monitor);
            }, 100);
        });

    } catch (error) {
        console.error('Error loading server data:', error);
        serversGrid.innerHTML = `
            <div class="server-error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Failed to load server status: ${error.message}</span>
            </div>
        `;
    }
}