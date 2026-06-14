document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const fileInputBtn = document.getElementById('fileInputBtn');
    const dropZone = document.getElementById('dropZone');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const resetFile = document.getElementById('resetFile');
    const configSections = document.getElementById('configSections');
    const saveConfig = document.getElementById('saveConfig');
    const downloadConfig = document.getElementById('downloadConfig');
    const resetAll = document.getElementById('resetAll');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Current config data
    let configData = null;
    let originalFileContent = null;
    let originalSettings = null;
    let fileNameValue = '';
    let currentFile = null;

    // Default values for each settings section
    const defaultValues = {
        aiming: {
            "aimAssistSensitivityMultiplierAt500M": 0.5,
            "aimAssistSensitivityMultiplierAtZeroM": 0.5,
            "aimAssistTargetLockOnTime": 0.0,
            "cqcAimPointAngleThreshold": 30.0,
            "cqcAimPointDepth": 0.35,
            "cqcAimPointDistanceThreshold": 10.0,
            "distanceUpdateSpeed": 600.0,
            "maxAimingAngleError": 25.0,
            "maxDistance": 2000.0,
            "minDistance": 35.0,
            "stopType": "StopByRotation",
            "useLocalAimPoint": true,
            "useLocalDispersion": true
        },
        followAim: {
            "followAimAccMagnetMin": 0.1,
            "followAimAccMagnetMult": 0.2,
            "followAimCentringTime": 0.3,
            "followAimDecMagnetMin": 0.1,
            "followAimDecMagnetMult": 0.2,
            "followAimMaxMagnetPower": 0.2,
            "followAimMaxTargetDistance": 500.0,
            "followAimMinMagnetDistanceFromCenterPower": 0.3,
            "followAimMinRadiusScalingDistance": 200.0,
            "followAimRotationPullFactor": 0.1,
            "followAimSelectorCenterCoef": 1.5,
            "followAimSelectorCenterMin": 0.5,
            "followAimSelectorDistanceCoef": 0.3,
            "followAimSensitivityFactor": 0.55,
            "followAimTankCentringSize": 40.0,
            "followInnerRadius": 3.5,
            "followRadius": 4.3
        },
        armorOutliner: {
            "Default Mode": "Full",
            "Is Enabled": true,
            "Max Distance": 500.0
        },
        haptics: {
            "heavyRumbleDurationMS": 500,
            "heavyRumbleHighFrequency": 0.8,
            "heavyRumbleLowFrequency": 0.8,
            "lightRumbleDurationMS": 300,
            "lightRumbleHighFrequency": 0.3,
            "lightRumbleLowFrequency": 0.3,
            "mediumRumbleDurationMS": 400,
            "mediumRumbleHighFrequency": 0.5,
            "mediumRumbleLowFrequency": 0.5
        },
        window: {
            "minSize": {
                "height": 720,
                "width": 1280
            }
        },
        frameLimiter: {
            "client": {
                "carriedOverspent": 0.4,
                "frequency": 1000.0
            },
            "inactive client": {
                "carriedOverspent": 0.4,
                "frequency": 30.0
            }
        },
        markers: {
            "ally": {
                "InDirectVisible": {
                    "opacity": 1.0,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": true,
                    "isDistanceEnabled": true
                },
                "Dead": {
                    "opacity": 0.5,
                    "isEnabled": true,
                    "isNameEnabled": false,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "DeadHotKey": {
                    "opacity": 0.7,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "DeadInAiming": {
                    "opacity": 0.3,
                    "isEnabled": false,
                    "isNameEnabled": false,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "InDirectInvisible": {
                    "opacity": 0.8,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": true,
                    "isDistanceEnabled": true
                }
            },
            "enemy": {
                "InDirectVisible": {
                    "opacity": 1.0,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": true,
                    "isDistanceEnabled": true
                },
                "Dead": {
                    "opacity": 0.5,
                    "isEnabled": true,
                    "isNameEnabled": false,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "DeadHotKey": {
                    "opacity": 0.7,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "DeadInAiming": {
                    "opacity": 0.3,
                    "isEnabled": false,
                    "isNameEnabled": false,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "InDirectInvisible": {
                    "opacity": 0.8,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": true,
                    "isDistanceEnabled": true
                }
            },
            "platoon": {
                "InDirectVisible": {
                    "opacity": 1.0,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": true,
                    "isDistanceEnabled": true
                },
                "Dead": {
                    "opacity": 0.5,
                    "isEnabled": true,
                    "isNameEnabled": false,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "DeadHotKey": {
                    "opacity": 0.7,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "DeadInAiming": {
                    "opacity": 0.3,
                    "isEnabled": false,
                    "isNameEnabled": false,
                    "isHealthBarEnabled": false,
                    "isDistanceEnabled": false
                },
                "InDirectInvisible": {
                    "opacity": 0.8,
                    "isEnabled": true,
                    "isNameEnabled": true,
                    "isHealthBarEnabled": true,
                    "isDistanceEnabled": true
                }
            }
        },
        resolutionPresets: [{
                "key": "Full HD Fullscreen",
                "value": {
                    "resolution fullscreen": {
                        "height": 1080,
                        "width": 1920
                    }
                }
            },
            {
                "key": "WQ HD Fullscreen",
                "value": {
                    "resolution fullscreen": {
                        "height": 1440,
                        "width": 2560
                    }
                }
            },
            {
                "key": "4K Fullscreen",
                "value": {
                    "resolution fullscreen": {
                        "height": 2160,
                        "width": 3840
                    }
                }
            }
        ],
        breakpoints: [{
                "Height": 0,
                "Scale": 0.6,
                "Width": 0
            },
            {
                "Height": 700,
                "Scale": 0.7,
                "Width": 1200
            },
            {
                "Height": 855,
                "Scale": 0.8,
                "Width": 1600
            },
            {
                "Height": 1035,
                "Scale": 1.0,
                "Width": 1920
            },
            {
                "Height": 1155,
                "Scale": 1.05,
                "Width": 2200
            },
            {
                "Height": 1395,
                "Scale": 1.335,
                "Width": 2560
            },
            {
                "Height": 1395,
                "Scale": 1.2,
                "Width": 3440
            },
            {
                "Height": 2115,
                "Scale": 2.0,
                "Width": 3840
            }
        ]
    };

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            const targetTab = document.getElementById(`${tabId}-tab`);
            if (targetTab) targetTab.classList.add('active');
            localStorage.setItem('activeConfigTab', tabId);
        });
    });

    const savedTab = localStorage.getItem('activeConfigTab');
    if (savedTab) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${savedTab}"]`);
        if (tabBtn) tabBtn.click();
    }

    // File input button click
    fileInputBtn.addEventListener('click', () => fileInput.click());

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('drag-over');
    }

    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) handleFile(file);
    });

    // Reset file button
    resetFile.addEventListener('click', () => {
        fileInput.value = '';
        configData = null;
        originalFileContent = null;
        originalSettings = null;
        currentFile = null;
        fileInfo.style.display = 'none';
        configSections.style.display = 'none';
        dropZone.style.display = 'flex';
        localStorage.removeItem('cwConfigData');
        localStorage.removeItem('cwConfigFileName');
    });

    // Save config button (saves modified settings back to the file - preserves all other content)
    saveConfig.addEventListener('click', () => {
        if (configData && currentFile) {
            // Build the updated settings object
            const updatedSettings = buildUpdatedSettingsObject();

            // Create the full file content with original structure
            let fullParsed;
            try {
                fullParsed = JSON.parse(originalFileContent);
            } catch (e) {
                showToast('Error parsing original file structure', 'error');
                return;
            }

            // Ensure settings object exists
            if (!fullParsed.settings) fullParsed.settings = {};

            // Update only the settings we manage
            for (const [sectionKey, sectionData] of Object.entries(updatedSettings)) {
                if (sectionData !== undefined && sectionData !== null) {
                    fullParsed.settings[sectionKey] = sectionData;
                }
            }

            // Create download of the modified file
            const blob = new Blob([JSON.stringify(fullParsed, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileNameValue;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Update local storage with new settings
            localStorage.setItem('cwConfigData', JSON.stringify(updatedSettings));
            localStorage.setItem('cwConfigFileName', fileNameValue);

            // Update our stored content
            originalFileContent = JSON.stringify(fullParsed, null, 2);
            originalSettings = JSON.parse(JSON.stringify(configData));

            showToast('Configuration saved and downloaded successfully!');
        } else if (!currentFile) {
            showToast('No file loaded', 'error');
        }
    });

    // Download config button (exports modified config)
    downloadConfig.addEventListener('click', () => {
        if (configData) {
            const updatedSettings = buildUpdatedSettingsObject();

            let fullParsed;
            try {
                fullParsed = originalFileContent ? JSON.parse(originalFileContent) : {
                    settings: {}
                };
            } catch (e) {
                fullParsed = {
                    settings: {}
                };
            }

            if (!fullParsed.settings) fullParsed.settings = {};

            for (const [sectionKey, sectionData] of Object.entries(updatedSettings)) {
                if (sectionData !== undefined && sectionData !== null) {
                    fullParsed.settings[sectionKey] = sectionData;
                }
            }

            const blob = new Blob([JSON.stringify(fullParsed, null, 2)], {
                type: 'application/json'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileNameValue || 'modified_coldwar.project';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Configuration exported!');
        }
    });

    // Reset all button
    resetAll.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            resetAllSettings();
        }
    });

    // Build the updated settings object from current configData
    function buildUpdatedSettingsObject() {
        const updated = {};
        if (configData['cw::AimingProjectSettings']) updated['cw::AimingProjectSettings'] = configData['cw::AimingProjectSettings'];
        if (configData['cw::FollowAimSettings']) updated['cw::FollowAimSettings'] = configData['cw::FollowAimSettings'];
        if (configData['cw::ArmorOutlinerProjectSettings']) updated['cw::ArmorOutlinerProjectSettings'] = configData['cw::ArmorOutlinerProjectSettings'];
        if (configData['cw::HapticsProjectSettings']) updated['cw::HapticsProjectSettings'] = configData['cw::HapticsProjectSettings'];
        if (configData['engine::WindowProjectSettings']) updated['engine::WindowProjectSettings'] = configData['engine::WindowProjectSettings'];
        if (configData['FrameLimiterSettings']) updated['FrameLimiterSettings'] = configData['FrameLimiterSettings'];
        if (configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']) {
            updated['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'];
        }
        return updated;
    }

    // Handle file upload
    function handleFile(file) {
        if (!file.name.endsWith('.project')) {
            showToast('Please upload a valid .project file', 'error');
            return;
        }

        fileNameValue = file.name;
        fileName.textContent = file.name;
        fileInfo.style.display = 'flex';
        dropZone.style.display = 'none';
        currentFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                originalFileContent = e.target.result;
                let parsed = JSON.parse(originalFileContent);

                // Extract settings from the parsed file
                if (parsed.settings) {
                    configData = parsed.settings;
                } else {
                    // If no settings wrapper, assume the whole file is settings
                    configData = parsed;
                }

                originalSettings = JSON.parse(JSON.stringify(configData));

                // Load saved settings from localStorage if available
                const savedConfig = localStorage.getItem('cwConfigData');
                const savedFileName = localStorage.getItem('cwConfigFileName');

                if (savedConfig && savedFileName === fileNameValue) {
                    try {
                        const parsedSavedConfig = JSON.parse(savedConfig);
                        // Merge saved settings with loaded config
                        for (const [sectionKey, sectionData] of Object.entries(parsedSavedConfig)) {
                            if (configData[sectionKey] && sectionData) {
                                Object.assign(configData[sectionKey], sectionData);
                            } else if (sectionData) {
                                configData[sectionKey] = sectionData;
                            }
                        }
                        showToast('Previous settings loaded from browser storage');
                    } catch (e) {
                        console.error('Error loading saved config:', e);
                    }
                }

                renderSettings();
                configSections.style.display = 'block';
                showToast('File loaded successfully!');
            } catch (e) {
                console.error('Error parsing file:', e);
                showToast('Error parsing file. Please make sure it\'s a valid JSON file.', 'error');
                resetFile.click();
            }
        };
        reader.readAsText(file);
    }

    // Render all settings
    function renderSettings() {
        if (!configData) return;
        renderAimingSettings();
        renderFollowAimSettings();
        renderArmorOutlinerSettings();
        renderHapticsSettings();
        renderMarkerSettings();
        renderWindowSettings();
        renderFrameLimiterSettings();
    }

    function renderAimingSettings() {
        const tab = document.getElementById('aiming-tab');
        tab.innerHTML = '';
        const aimingSettings = configData['cw::AimingProjectSettings'] || {};

        const group = createSettingsGroup('Aiming Settings');
        tab.appendChild(group);

        createRangeInput(group, 'Aim Assist Sensitivity at 500m', 'aimAssistSensitivityMultiplierAt500M', aimingSettings, 0, 1, 0.01);
        createRangeInput(group, 'Aim Assist Sensitivity at 0m', 'aimAssistSensitivityMultiplierAtZeroM', aimingSettings, 0, 1, 0.01);
        createRangeInput(group, 'Aim Assist Target Lock On Time', 'aimAssistTargetLockOnTime', aimingSettings, 0, 5, 0.1);
        createRangeInput(group, 'Distance Update Speed', 'distanceUpdateSpeed', aimingSettings, 1, 1000, 10);
        createRangeInput(group, 'Max Aiming Angle Error', 'maxAimingAngleError', aimingSettings, 1, 90, 1);
        createRangeInput(group, 'Max Distance', 'maxDistance', aimingSettings, 100, 5000, 10);
        createRangeInput(group, 'Min Distance', 'minDistance', aimingSettings, 1, 100, 1);
        createRangeInput(group, 'CQC Aim Point Angle Threshold', 'cqcAimPointAngleThreshold', aimingSettings, 0, 90, 1);
        createRangeInput(group, 'CQC Aim Point Depth', 'cqcAimPointDepth', aimingSettings, 0, 1, 0.05);
        createRangeInput(group, 'CQC Aim Point Distance Threshold', 'cqcAimPointDistanceThreshold', aimingSettings, 0, 50, 1);

        const stopTypeOptions = ['StopByRotation', 'StopByDistance', 'StopByTime'];
        createDropdown(group, 'Stop Type', 'stopType', aimingSettings, stopTypeOptions);

        createCheckbox(group, 'Use Local Aim Point', 'useLocalAimPoint', aimingSettings);
        createCheckbox(group, 'Use Local Dispersion', 'useLocalDispersion', aimingSettings);
    }

    function renderFollowAimSettings() {
        const tab = document.getElementById('aim-assist-tab');
        tab.innerHTML = '';
        const followAimSettings = configData['cw::FollowAimSettings'] || {};

        const group = createSettingsGroup('Aim Assist Settings');
        tab.appendChild(group);

        createRangeInput(group, 'Acceleration Magnet Min', 'followAimAccMagnetMin', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Acceleration Magnet Multiplier', 'followAimAccMagnetMult', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Centring Time', 'followAimCentringTime', followAimSettings, 0, 5, 0.1);
        createRangeInput(group, 'Deceleration Magnet Min', 'followAimDecMagnetMin', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Deceleration Magnet Multiplier', 'followAimDecMagnetMult', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Max Magnet Power', 'followAimMaxMagnetPower', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Max Target Distance', 'followAimMaxTargetDistance', followAimSettings, 100, 1000, 10);
        createRangeInput(group, 'Min Magnet Distance From Center Power', 'followAimMinMagnetDistanceFromCenterPower', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Min Radius Scaling Distance', 'followAimMinRadiusScalingDistance', followAimSettings, 100, 500, 10);
        createRangeInput(group, 'Rotation Pull Factor', 'followAimRotationPullFactor', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Selector Center Coefficient', 'followAimSelectorCenterCoef', followAimSettings, 0, 3, 0.1);
        createRangeInput(group, 'Selector Center Min', 'followAimSelectorCenterMin', followAimSettings, 0, 1, 0.1);
        createRangeInput(group, 'Selector Distance Coefficient', 'followAimSelectorDistanceCoef', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Sensitivity Factor', 'followAimSensitivityFactor', followAimSettings, 0, 1, 0.01);
        createRangeInput(group, 'Tank Centring Size', 'followAimTankCentringSize', followAimSettings, 10, 100, 1);
        createRangeInput(group, 'Follow Inner Radius', 'followInnerRadius', followAimSettings, 1, 10, 0.1);
        createRangeInput(group, 'Follow Radius', 'followRadius', followAimSettings, 1, 10, 0.1);
    }

    function renderArmorOutlinerSettings() {
        const tab = document.getElementById('armor-tab');
        tab.innerHTML = '';
        const armorSettings = configData['cw::ArmorOutlinerProjectSettings'] || {};

        const group = createSettingsGroup('Armor Outliner Settings');
        tab.appendChild(group);

        createRangeInput(group, 'Max Distance', 'Max Distance', armorSettings, 100, 1000, 10);

        const modeOptions = ['Full', 'Partial', 'Off'];
        createDropdown(group, 'Default Mode', 'Default Mode', armorSettings, modeOptions);

        createCheckbox(group, 'Enabled', 'Is Enabled', armorSettings);
    }

    function renderHapticsSettings() {
        const tab = document.getElementById('controller-tab');
        tab.innerHTML = '';
        const hapticsSettings = configData['cw::HapticsProjectSettings'] || {};

        const group = createSettingsGroup('Controller Haptics Settings');
        tab.appendChild(group);

        createRangeInput(group, 'Heavy Rumble Duration (ms)', 'heavyRumbleDurationMS', hapticsSettings, 100, 1000, 10);
        createRangeInput(group, 'Heavy Rumble High Frequency', 'heavyRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
        createRangeInput(group, 'Heavy Rumble Low Frequency', 'heavyRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);
        createRangeInput(group, 'Medium Rumble Duration (ms)', 'mediumRumbleDurationMS', hapticsSettings, 100, 1000, 10);
        createRangeInput(group, 'Medium Rumble High Frequency', 'mediumRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
        createRangeInput(group, 'Medium Rumble Low Frequency', 'mediumRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);
        createRangeInput(group, 'Light Rumble Duration (ms)', 'lightRumbleDurationMS', hapticsSettings, 100, 1000, 10);
        createRangeInput(group, 'Light Rumble High Frequency', 'lightRumbleHighFrequency', hapticsSettings, 0, 1, 0.05);
        createRangeInput(group, 'Light Rumble Low Frequency', 'lightRumbleLowFrequency', hapticsSettings, 0, 1, 0.05);
    }

    function renderMarkerSettings() {
        const tab = document.getElementById('markers-tab');
        tab.innerHTML = '';

        const markerSettings = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] || {};
        const vehicleMarkerSettings = markerSettings['Vehicle Marker Settings'] || {};

        // Helper to get settings with fallback to defaults
        function getMarkerSettings(type) {
            const typeKey = `${type}MarkerSettings`;
            if (vehicleMarkerSettings.markerSettings &&
                vehicleMarkerSettings.markerSettings[typeKey] &&
                vehicleMarkerSettings.markerSettings[typeKey].markerSettings) {
                return vehicleMarkerSettings.markerSettings[typeKey].markerSettings;
            }
            return JSON.parse(JSON.stringify(defaultValues.markers[type]));
        }

        const allySettings = getMarkerSettings('ally');
        const enemySettings = getMarkerSettings('enemy');
        const platoonSettings = getMarkerSettings('platoon');

        const group = createSettingsGroup('Marker Visibility Settings');
        tab.appendChild(group);

        // Create tab system for marker types
        const markerTypeTabs = document.createElement('div');
        markerTypeTabs.className = 'marker-type-tabs';
        markerTypeTabs.style.display = 'flex';
        markerTypeTabs.style.gap = '0.5rem';
        markerTypeTabs.style.marginBottom = '1rem';
        markerTypeTabs.style.borderBottom = '1px solid var(--border-color)';
        markerTypeTabs.style.paddingBottom = '0.5rem';

        const allyTab = document.createElement('button');
        allyTab.className = 'marker-tab-btn active';
        allyTab.textContent = 'Allies';
        allyTab.setAttribute('data-marker-type', 'ally');

        const enemyTab = document.createElement('button');
        enemyTab.className = 'marker-tab-btn';
        enemyTab.textContent = 'Enemies';
        enemyTab.setAttribute('data-marker-type', 'enemy');

        const platoonTab = document.createElement('button');
        platoonTab.className = 'marker-tab-btn';
        platoonTab.textContent = 'Platoon';
        platoonTab.setAttribute('data-marker-type', 'platoon');

        // Style the tab buttons
        [allyTab, enemyTab, platoonTab].forEach(btn => {
            btn.style.background = 'none';
            btn.style.border = 'none';
            btn.style.padding = '0.5rem 1rem';
            btn.style.cursor = 'pointer';
            btn.style.color = 'var(--text-secondary)';
            btn.style.borderRadius = '4px';
            btn.style.transition = 'all 0.2s';
        });
        allyTab.style.color = 'var(--accent-color)';
        allyTab.style.borderBottom = '2px solid var(--accent-color)';

        markerTypeTabs.append(allyTab, enemyTab, platoonTab);
        group.appendChild(markerTypeTabs);

        const markerTypeContent = document.createElement('div');
        markerTypeContent.className = 'marker-type-content';
        group.appendChild(markerTypeContent);

        function renderMarkerType(type, settings) {
            markerTypeContent.innerHTML = '';
            const states = Object.keys(settings);

            states.forEach(state => {
                const stateSettings = settings[state];
                const stateGroup = document.createElement('div');
                stateGroup.className = 'marker-state-group';
                stateGroup.style.marginBottom = '1.5rem';
                stateGroup.style.padding = '1rem';
                stateGroup.style.background = 'var(--bg-secondary)';
                stateGroup.style.borderRadius = '8px';
                stateGroup.style.border = '1px solid var(--border-color)';

                const stateHeader = document.createElement('h4');
                stateHeader.textContent = state.replace(/([A-Z])/g, ' $1').trim();
                stateHeader.style.margin = '0 0 1rem 0';
                stateHeader.style.color = 'var(--text-primary)';
                stateGroup.appendChild(stateHeader);

                if (stateSettings.opacity !== undefined) {
                    createRangeInput(stateGroup, 'Opacity', 'opacity', stateSettings, 0, 1, 0.05);
                }

                const boolProps = ['isEnabled', 'isNameEnabled', 'isHealthBarEnabled', 'isDistanceEnabled'];
                boolProps.forEach(prop => {
                    if (stateSettings[prop] !== undefined) {
                        const label = prop.replace('is', '').replace(/([A-Z])/g, ' $1').trim();
                        createCheckbox(stateGroup, label, prop, stateSettings);
                    }
                });

                markerTypeContent.appendChild(stateGroup);
            });
        }

        renderMarkerType('ally', allySettings);

        function switchMarkerTab(type) {
            [allyTab, enemyTab, platoonTab].forEach(btn => {
                btn.style.color = 'var(--text-secondary)';
                btn.style.borderBottom = 'none';
            });
            if (type === 'ally') {
                allyTab.style.color = 'var(--accent-color)';
                allyTab.style.borderBottom = '2px solid var(--accent-color)';
                renderMarkerType('ally', allySettings);
            } else if (type === 'enemy') {
                enemyTab.style.color = 'var(--accent-color)';
                enemyTab.style.borderBottom = '2px solid var(--accent-color)';
                renderMarkerType('enemy', enemySettings);
            } else if (type === 'platoon') {
                platoonTab.style.color = 'var(--accent-color)';
                platoonTab.style.borderBottom = '2px solid var(--accent-color)';
                renderMarkerType('platoon', platoonSettings);
            }
        }

        allyTab.addEventListener('click', () => switchMarkerTab('ally'));
        enemyTab.addEventListener('click', () => switchMarkerTab('enemy'));
        platoonTab.addEventListener('click', () => switchMarkerTab('platoon'));
    }

    function renderWindowSettings() {
        const tab = document.getElementById('window-tab');
        tab.innerHTML = '';
        const windowSettings = configData['engine::WindowProjectSettings'] || {};

        const group = createSettingsGroup('Window Resolution Settings');
        tab.appendChild(group);

        if (windowSettings.minSize) {
            createRangeInput(group, 'Minimum Window Width', 'width', windowSettings.minSize, 800, 3840, 10);
            createRangeInput(group, 'Minimum Window Height', 'height', windowSettings.minSize, 600, 2160, 10);
        }
    }

    function renderFrameLimiterSettings() {
        const tab = document.getElementById('resolution-tab');
        tab.innerHTML = '';

        const frameLimiterSettings = configData['FrameLimiterSettings'] || {};

        if (Object.keys(frameLimiterSettings).length > 0) {
            const group = createSettingsGroup('Frame Limiter Settings');
            tab.appendChild(group);

            if (frameLimiterSettings.client) {
                const clientGroup = document.createElement('div');
                clientGroup.style.marginBottom = '1.5rem';
                const clientHeader = document.createElement('h4');
                clientHeader.textContent = 'Active Client';
                clientHeader.style.marginBottom = '0.5rem';
                clientGroup.appendChild(clientHeader);
                createRangeInput(clientGroup, 'Frequency (FPS)', 'frequency', frameLimiterSettings.client, 30, 360, 1);
                createRangeInput(clientGroup, 'Carried Overspent', 'carriedOverspent', frameLimiterSettings.client, 0.1, 1.0, 0.05);
                group.appendChild(clientGroup);
            }

            if (frameLimiterSettings['inactive client']) {
                const inactiveClientGroup = document.createElement('div');
                inactiveClientGroup.style.marginBottom = '1.5rem';
                const inactiveClientHeader = document.createElement('h4');
                inactiveClientHeader.textContent = 'Inactive Client';
                inactiveClientHeader.style.marginBottom = '0.5rem';
                inactiveClientGroup.appendChild(inactiveClientHeader);
                createRangeInput(inactiveClientGroup, 'Frequency (FPS)', 'frequency', frameLimiterSettings['inactive client'], 10, 144, 1);
                createRangeInput(inactiveClientGroup, 'Carried Overspent', 'carriedOverspent', frameLimiterSettings['inactive client'], 0.1, 1.0, 0.05);
                group.appendChild(inactiveClientGroup);
            }
        }

        // Resolution presets section
        let resolutionPresets = [];
        let breakpoints = [];

        if (configData['engine::WindowSettings']) {
            resolutionPresets = configData['engine::WindowSettings'].values || [];
        } else {
            for (const key in configData) {
                if (key.includes('WindowSettings') && configData[key].values) {
                    resolutionPresets = configData[key].values || [];
                    break;
                }
            }
        }

        if (configData['engine::Breakpoints']) {
            breakpoints = configData['engine::Breakpoints'];
        } else {
            for (const key in configData) {
                if (key.includes('Breakpoints')) {
                    breakpoints = configData[key];
                    break;
                }
            }
        }

        if (resolutionPresets.length > 0) {
            const presetsGroup = createSettingsGroup('Resolution Presets');
            tab.appendChild(presetsGroup);

            resolutionPresets.forEach((preset, index) => {
                if (preset.value && preset.value['resolution fullscreen']) {
                    const presetGroup = document.createElement('div');
                    presetGroup.style.marginBottom = '1.5rem';
                    const presetHeader = document.createElement('h4');
                    presetHeader.textContent = preset.key;
                    presetHeader.style.marginBottom = '0.5rem';
                    presetGroup.appendChild(presetHeader);
                    createRangeInput(presetGroup, 'Width', 'width', preset.value['resolution fullscreen'], 800, 7680, 10);
                    createRangeInput(presetGroup, 'Height', 'height', preset.value['resolution fullscreen'], 600, 4320, 10);
                    presetsGroup.appendChild(presetGroup);
                }
            });
        }

        if (breakpoints.length > 0) {
            const breakpointsGroup = createSettingsGroup('Resolution Breakpoints');
            tab.appendChild(breakpointsGroup);

            breakpoints.forEach((bp, index) => {
                if (bp.Width !== undefined && bp.Height !== undefined && bp.Scale !== undefined) {
                    const bpGroup = document.createElement('div');
                    bpGroup.style.marginBottom = '1rem';
                    const bpHeader = document.createElement('h4');
                    bpHeader.textContent = `Breakpoint ${index + 1}`;
                    bpHeader.style.marginBottom = '0.5rem';
                    bpGroup.appendChild(bpHeader);
                    createRangeInput(bpGroup, 'Width', 'Width', bp, 0, 7680, 10);
                    createRangeInput(bpGroup, 'Height', 'Height', bp, 0, 4320, 10);
                    createRangeInput(bpGroup, 'Scale', 'Scale', bp, 0.1, 3, 0.01);
                    breakpointsGroup.appendChild(bpGroup);
                }
            });
        }
    }

    // Helper function to create a settings group
    function createSettingsGroup(title) {
        const group = document.createElement('div');
        group.className = 'settings-group';
        const heading = document.createElement('h3');
        heading.textContent = title;
        group.appendChild(heading);
        return group;
    }

    // Helper function to create a range input
    function createRangeInput(container, label, key, settingsObj, min, max, step) {
        const value = settingsObj[key] !== undefined ? settingsObj[key] : min;
        const item = document.createElement('div');
        item.className = 'setting-item';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = `setting-${key}`;
        item.appendChild(labelEl);

        const input = document.createElement('input');
        input.type = 'range';
        input.id = `setting-${key}`;
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;

        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'setting-value';
        valueDisplay.textContent = value.toFixed(2);

        input.addEventListener('input', (e) => {
            const newVal = parseFloat(e.target.value);
            settingsObj[key] = newVal;
            valueDisplay.textContent = newVal.toFixed(2);
        });

        item.appendChild(input);
        item.appendChild(valueDisplay);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn-reset';
        resetBtn.innerHTML = '↺';
        resetBtn.title = 'Reset to default';
        resetBtn.addEventListener('click', () => {
            const defaultValue = getDefaultValueForSetting(settingsObj, key, min);
            settingsObj[key] = defaultValue;
            input.value = defaultValue;
            valueDisplay.textContent = defaultValue.toFixed(2);
        });
        item.appendChild(resetBtn);

        container.appendChild(item);
    }

    // Helper function to create a checkbox input
    function createCheckbox(container, label, key, settingsObj) {
        const value = settingsObj[key] !== undefined ? settingsObj[key] : false;
        const item = document.createElement('div');
        item.className = 'setting-item checkbox-item';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '1rem';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `setting-${key}`;
        input.checked = value;
        input.style.width = '20px';
        input.style.height = '20px';
        input.style.cursor = 'pointer';

        input.addEventListener('change', (e) => {
            settingsObj[key] = e.target.checked;
        });
        item.appendChild(input);

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = `setting-${key}`;
        labelEl.style.cursor = 'pointer';
        labelEl.style.flex = '1';
        item.appendChild(labelEl);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn-reset';
        resetBtn.innerHTML = '↺';
        resetBtn.title = 'Reset to default';
        resetBtn.style.marginLeft = 'auto';
        resetBtn.addEventListener('click', () => {
            const defaultValue = getDefaultValueForSetting(settingsObj, key, false);
            settingsObj[key] = defaultValue;
            input.checked = defaultValue;
        });
        item.appendChild(resetBtn);

        container.appendChild(item);
    }

    // Helper function to create a dropdown input
    function createDropdown(container, label, key, settingsObj, options) {
        const value = settingsObj[key] !== undefined ? settingsObj[key] : options[0];
        const item = document.createElement('div');
        item.className = 'setting-item';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.htmlFor = `setting-${key}`;
        item.appendChild(labelEl);

        const select = document.createElement('select');
        select.id = `setting-${key}`;
        select.style.flex = '1';
        select.style.padding = '0.5rem';
        select.style.background = 'var(--bg-tertiary)';
        select.style.border = '1px solid var(--border-color)';
        select.style.borderRadius = '4px';
        select.style.color = 'var(--text-primary)';

        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option;
            optionEl.textContent = option;
            optionEl.selected = option === value;
            select.appendChild(optionEl);
        });

        select.addEventListener('change', (e) => {
            settingsObj[key] = e.target.value;
        });
        item.appendChild(select);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'btn-reset';
        resetBtn.innerHTML = '↺';
        resetBtn.title = 'Reset to default';
        resetBtn.addEventListener('click', () => {
            const defaultValue = getDefaultValueForSetting(settingsObj, key, options[0]);
            settingsObj[key] = defaultValue;
            select.value = defaultValue;
        });
        item.appendChild(resetBtn);

        container.appendChild(item);
    }

    function getDefaultValueForSetting(settingsObj, key, fallback) {
        if (settingsObj === configData?.['cw::AimingProjectSettings']) {
            return defaultValues.aiming[key] !== undefined ? defaultValues.aiming[key] : fallback;
        }
        if (settingsObj === configData?.['cw::FollowAimSettings']) {
            return defaultValues.followAim[key] !== undefined ? defaultValues.followAim[key] : fallback;
        }
        if (settingsObj === configData?.['cw::ArmorOutlinerProjectSettings']) {
            return defaultValues.armorOutliner[key] !== undefined ? defaultValues.armorOutliner[key] : fallback;
        }
        if (settingsObj === configData?.['cw::HapticsProjectSettings']) {
            return defaultValues.haptics[key] !== undefined ? defaultValues.haptics[key] : fallback;
        }
        if (settingsObj === configData?.['engine::WindowProjectSettings']?.minSize) {
            return defaultValues.window.minSize[key] !== undefined ? defaultValues.window.minSize[key] : fallback;
        }
        if (settingsObj === configData?.['FrameLimiterSettings']?.client) {
            return defaultValues.frameLimiter.client[key] !== undefined ? defaultValues.frameLimiter.client[key] : fallback;
        }
        if (settingsObj === configData?.['FrameLimiterSettings']?.['inactive client']) {
            return defaultValues.frameLimiter['inactive client'][key] !== undefined ? defaultValues.frameLimiter['inactive client'][key] : fallback;
        }
        // For marker settings
        if (configData?.['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']) {
            for (const type of ['ally', 'enemy', 'platoon']) {
                for (const state of ['InDirectVisible', 'Dead', 'DeadHotKey', 'DeadInAiming', 'InDirectInvisible']) {
                    if (defaultValues.markers[type]?.[state]?.[key] !== undefined) {
                        return defaultValues.markers[type][state][key];
                    }
                }
            }
        }
        return fallback;
    }

    // Reset all settings to default
    function resetAllSettings() {
        if (!configData) return;

        if (configData['cw::AimingProjectSettings']) {
            Object.assign(configData['cw::AimingProjectSettings'], JSON.parse(JSON.stringify(defaultValues.aiming)));
        }
        if (configData['cw::FollowAimSettings']) {
            Object.assign(configData['cw::FollowAimSettings'], JSON.parse(JSON.stringify(defaultValues.followAim)));
        }
        if (configData['cw::ArmorOutlinerProjectSettings']) {
            Object.assign(configData['cw::ArmorOutlinerProjectSettings'], JSON.parse(JSON.stringify(defaultValues.armorOutliner)));
        }
        if (configData['cw::HapticsProjectSettings']) {
            Object.assign(configData['cw::HapticsProjectSettings'], JSON.parse(JSON.stringify(defaultValues.haptics)));
        }
        if (configData['engine::WindowProjectSettings'] && configData['engine::WindowProjectSettings'].minSize) {
            Object.assign(configData['engine::WindowProjectSettings'].minSize, JSON.parse(JSON.stringify(defaultValues.window.minSize)));
        }
        if (configData['FrameLimiterSettings']) {
            if (configData['FrameLimiterSettings'].client) {
                Object.assign(configData['FrameLimiterSettings'].client, JSON.parse(JSON.stringify(defaultValues.frameLimiter.client)));
            }
            if (configData['FrameLimiterSettings']['inactive client']) {
                Object.assign(configData['FrameLimiterSettings']['inactive client'], JSON.parse(JSON.stringify(defaultValues.frameLimiter['inactive client'])));
            }
        }
        if (configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings'] &&
            configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']['Vehicle Marker Settings'] &&
            configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']['Vehicle Marker Settings'].markerSettings) {
            const markerSettings = configData['cw::hud::battle::VehicleMarkerSettingsSingleton::ProjectSettings']['Vehicle Marker Settings'].markerSettings;
            if (markerSettings.allyMarkerSettings && markerSettings.allyMarkerSettings.markerSettings) {
                Object.assign(markerSettings.allyMarkerSettings.markerSettings, JSON.parse(JSON.stringify(defaultValues.markers.ally)));
            }
            if (markerSettings.enemyMarkerSettings && markerSettings.enemyMarkerSettings.markerSettings) {
                Object.assign(markerSettings.enemyMarkerSettings.markerSettings, JSON.parse(JSON.stringify(defaultValues.markers.enemy)));
            }
            if (markerSettings.platoonMarkerSettings && markerSettings.platoonMarkerSettings.markerSettings) {
                Object.assign(markerSettings.platoonMarkerSettings.markerSettings, JSON.parse(JSON.stringify(defaultValues.markers.platoon)));
            }
        }

        renderSettings();
        showToast('All settings reset to default values');
    }

    // Show toast notification
    function showToast(message, type = 'success') {
        const existingToasts = document.querySelectorAll('.toast-notification');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.textContent = message;

        const toastStyles = {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%) translateY(100%)',
            backgroundColor: type === 'error' ? '#d13438' : '#ff8300',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            zIndex: '1000',
            opacity: '0',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
        };

        Object.assign(toast.style, toastStyles);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) translateY(0)';
            toast.style.opacity = '1';
        }, 10);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(100%)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, type === 'error' ? 5000 : 3000);
    }
});