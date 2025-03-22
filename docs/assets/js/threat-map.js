// threat-map.js

// Map configuration
const mapConfig = {
    center: [20, 0], // Starting position [lat, lng]
    zoom: 2,
    minZoom: 2,
    maxBounds: [
        [-90, -180], // Southwest corner
        [90, 180] // Northeast corner
    ]
};

// Country codes and their approximate center coordinates
const countryCenters = {
    "US": {
        lat: 37.0902,
        lng: -95.7129,
        name: "United States"
    },
    "RU": {
        lat: 61.5240,
        lng: 105.3188,
        name: "Russia"
    },
    "CN": {
        lat: 35.8617,
        lng: 104.1954,
        name: "China"
    },
    "BR": {
        lat: -14.2350,
        lng: -51.9253,
        name: "Brazil"
    },
    "IN": {
        lat: 20.5937,
        lng: 78.9629,
        name: "India"
    },
    "CA": {
        lat: 56.1304,
        lng: -106.3468,
        name: "Canada"
    },
    "AU": {
        lat: -25.2744,
        lng: 133.7751,
        name: "Australia"
    },
    "DE": {
        lat: 51.1657,
        lng: 10.4515,
        name: "Germany"
    },
    "FR": {
        lat: 46.2276,
        lng: 2.2137,
        name: "France"
    },
    "GB": {
        lat: 55.3781,
        lng: -3.4360,
        name: "United Kingdom"
    },
    "JP": {
        lat: 36.2048,
        lng: 138.2529,
        name: "Japan"
    },
    "KR": {
        lat: 35.9078,
        lng: 127.7669,
        name: "South Korea"
    },
    "TR": {
        lat: 38.9637,
        lng: 35.2433,
        name: "Turkey"
    },
    "IT": {
        lat: 41.8719,
        lng: 12.5674,
        name: "Italy"
    },
    "ES": {
        lat: 40.4637,
        lng: -3.7492,
        name: "Spain"
    },
    "MX": {
        lat: 23.6345,
        lng: -102.5528,
        name: "Mexico"
    },
    "ID": {
        lat: -0.7893,
        lng: 113.9213,
        name: "Indonesia"
    },
    "PL": {
        lat: 51.9194,
        lng: 19.1451,
        name: "Poland"
    },
    "UA": {
        lat: 48.3794,
        lng: 31.1656,
        name: "Ukraine"
    },
    "NL": {
        lat: 52.1326,
        lng: 5.2913,
        name: "Netherlands"
    },
    "IR": {
        lat: 32.4279,
        lng: 53.6880,
        name: "Iran"
    },
    "KP": {
        lat: 40.3399,
        lng: 127.5101,
        name: "North Korea"
    },
    "VN": {
        lat: 14.0583,
        lng: 108.2772,
        name: "Vietnam"
    },
    "ZA": {
        lat: -30.5595,
        lng: 22.9375,
        name: "South Africa"
    },
    "TH": {
        lat: 15.8700,
        lng: 100.9925,
        name: "Thailand"
    },
    "EG": {
        lat: 26.8206,
        lng: 30.8025,
        name: "Egypt"
    },
    "AR": {
        lat: -38.4161,
        lng: -63.6167,
        name: "Argentina"
    },
    "SA": {
        lat: 23.8859,
        lng: 45.0792,
        name: "Saudi Arabia"
    },
    "RO": {
        lat: 45.9432,
        lng: 24.9668,
        name: "Romania"
    },
    "MY": {
        lat: 4.2105,
        lng: 101.9758,
        name: "Malaysia"
    },
    "HU": {
        lat: 47.1625,
        lng: 19.5033,
        name: "Hungary"
    },
    "BE": {
        lat: 50.6403,
        lng: 4.6667,
        name: "Belgium"
    },
    "SK": {
        lat: 48.6690,
        lng: 19.6990,
        name: "Slovakia"
    },
    "SG": {
        lat: 1.3521,
        lng: 103.8198,
        name: "Singapore"
    }
};

// Country codes for random selection when region is unknown
const countryCodesList = Object.keys(countryCenters);

// Initialize the map
let map;
let pings = [];
let jsonData = [];
let activePings = [];

// Colors for different threat levels
const threatColors = {
    low: '#4CAF50', // Green
    medium: '#FFC107', // Yellow
    high: '#FF5722', // Orange
    critical: '#F44336' // Red
};

// Initialize the map and load data
async function initThreatMap() {
    const loadingElement = document.getElementById('loading');
    const threatMapElement = document.getElementById('threatMap');
    const mapElement = document.getElementById('map');

    try {
        // Create the map
        map = L.map('map', {
            center: mapConfig.center,
            zoom: mapConfig.zoom,
            minZoom: mapConfig.minZoom,
            maxBounds: mapConfig.maxBounds
        });

        // Add tile layer (map style)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add fullscreen control
        if (L.control.fullscreen) {
            map.addControl(new L.control.fullscreen());
        } else {
            console.error('Fullscreen control plugin not loaded.');
        }

        // Force the map to resize and load correctly
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        // Fetch and process data
        await fetchThreatData();
        processThreatData();

        // Hide loading indicator and show map
        loadingElement.classList.add('hidden');
        threatMapElement.classList.remove('hidden');

        // Start the animation
        startPingAnimation();
    } catch (error) {
        console.error('Error initializing threat map:', error);
        loadingElement.innerHTML = `
            <div class="text-center">
                <svg class="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="mt-2 text-lg font-semibold text-red-500">Failed to load threat data</p>
                <p class="text-gray-600">Please try again later or contact support.</p>
            </div>
        `;
    }
}

// Fetch threat data from GitHub repository
async function fetchThreatData() {
    const response = await fetch('https://raw.githubusercontent.com/ThatSINEWAVE/CDA-Project/refs/heads/main/data/Compromised-Discord-Accounts.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    jsonData = await response.json();
    return jsonData;
}

// Process the threat data and prepare for visualization
function processThreatData() {
    const threatsByCountry = {};

    // Process each account in the data
    Object.values(jsonData).forEach(account => {
        let region = account.SUSPECTED_REGION_OF_ORIGIN;

        // Handle empty or unknown regions
        if (!region || region === "UNKNOWN" || region === "") {
            region = getRandomCountryCode();
        }

        // Skip if the region is not in our countryCenters mapping
        if (!countryCenters[region]) {
            console.warn(`Unknown region: ${region}. Skipping this account.`);
            return;
        }

        // Add to the threats by country
        if (!threatsByCountry[region]) {
            threatsByCountry[region] = [];
        }
        threatsByCountry[region].push(account);
    });

    // Create pings for each country
    Object.entries(threatsByCountry).forEach(([region, accounts]) => {
        const baseLocation = getCountryLocation(region);

        // Create multiple pings for countries with multiple threats
        accounts.forEach(account => {
            // Create a slightly randomized location within the country
            const pingLocation = getRandomLocationNear(baseLocation.lat, baseLocation.lng, 2); // Reduced radius to keep pings within the country

            // Determine threat level based on account properties
            const threatLevel = determineThreatLevel(account);

            pings.push({
                location: pingLocation,
                region: region,
                country: baseLocation.name || region,
                account: account,
                threatLevel: threatLevel,
                color: getThreatColor(threatLevel),
                active: false,
                nextPingTime: getRandomPingTime(),
                marker: null // Initialize marker as null
            });
        });
    });
}

// Get a random country code for unknown regions
function getRandomCountryCode() {
    const randomIndex = Math.floor(Math.random() * countryCodesList.length);
    return countryCodesList[randomIndex];
}

// Get country location from country code
function getCountryLocation(countryCode) {
    // If the country code exists in our mappings, return it
    if (countryCenters[countryCode]) {
        return countryCenters[countryCode];
    }

    // Fallback to a random country if the code is not found
    const randomCountryCode = getRandomCountryCode();
    return countryCenters[randomCountryCode];
}

// Get a random location near the specified coordinates
function getRandomLocationNear(lat, lng, radiusInDegrees = 2) {
    const radius = radiusInDegrees * (Math.random() * 0.8 + 0.2); // Random radius between 20% and 100% of max
    const angle = Math.random() * 2 * Math.PI; // Random angle

    // Calculate offset
    const latOffset = radius * Math.cos(angle) * 0.5; // Latitude changes less drastically
    const lngOffset = radius * Math.sin(angle);

    // Ensure the coordinates are within valid ranges
    let newLat = lat + latOffset;
    let newLng = lng + lngOffset;

    // Clamp latitude to valid range (-90 to 90)
    newLat = Math.max(-85, Math.min(85, newLat));

    // Normalize longitude to valid range (-180 to 180)
    newLng = ((newLng + 180) % 360) - 180;

    return {
        lat: newLat,
        lng: newLng
    };
}

// Determine the threat level based on account properties
function determineThreatLevel(account) {
    const highRiskVectors = ["Cloned Steam Pages", "Malware Distribution", "RAT", "Trojan"];
    const highRiskGoals = ["Steam Accounts", "Banking Details", "Personal Information"];

    if (highRiskVectors.includes(account.ATTACK_VECTOR) && highRiskGoals.includes(account.ATTACK_GOAL)) {
        return "critical";
    } else if (highRiskVectors.includes(account.ATTACK_VECTOR) || highRiskGoals.includes(account.ATTACK_GOAL)) {
        return "high";
    } else if (account.ATTACK_METHOD === "Phishing Website") {
        return "medium";
    } else {
        return "low";
    }
}

// Get color based on threat level
function getThreatColor(threatLevel) {
    return threatColors[threatLevel] || threatColors.low;
}

// Get random time for next ping (between 5 and 30 seconds)
function getRandomPingTime() {
    return Date.now() + Math.random() * 25000 + 5000;
}

// Start the ping animation
function startPingAnimation() {
    // Start with a few immediate pings
    for (let i = 0; i < Math.min(5, pings.length); i++) {
        const randomIndex = Math.floor(Math.random() * pings.length);
        createPing(pings[randomIndex]);
    }

    // Set up animation loop
    requestAnimationFrame(animatePings);
}

// Animate pings
function animatePings(timestamp) {
    const now = Date.now();
    const bounds = map.getBounds();

    // Remove inactive pings from the map
    activePings = activePings.filter(ping => ping.active);

    // Ensure there are always 50 pings within the visible area
    while (activePings.length < 50) {
        const visiblePings = pings.filter(ping => {
            const pingLatLng = L.latLng(ping.location.lat, ping.location.lng);
            return bounds.contains(pingLatLng) && !ping.active;
        });

        if (visiblePings.length > 0) {
            const randomIndex = Math.floor(Math.random() * visiblePings.length);
            createPing(visiblePings[randomIndex]);
        } else {
            break; // No more visible pings to activate
        }
    }

    // Continue animation loop
    requestAnimationFrame(animatePings);
}

// Create a ping on the map
function createPing(ping) {
    // Create ping marker
    const pulsingIcon = L.divIcon({
        className: 'pulsing-icon',
        html: `<div class="ping-marker" style="--ping-color: ${ping.color}"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    const marker = L.marker([ping.location.lat, ping.location.lng], {
        icon: pulsingIcon,
        zIndexOffset: 1000
    }).addTo(map);

    // Assign the marker to the ping object
    ping.marker = marker;

    // Add the ping to the active pings array
    activePings.push(ping);

    // Create pop-up with account information
    const popupContent = `
    <div class="threat-popup">
      <h3 class="text-md font-bold">${ping.account.USERNAME}</h3>
      <p class="text-sm"><strong>Origin:</strong> ${ping.country}</p>
      <p class="text-sm"><strong>Case:</strong> #${ping.account.CASE_NUMBER}</p>
      <p class="text-sm"><strong>Attack Method:</strong> ${ping.account.ATTACK_METHOD}</p>
      <p class="text-sm"><strong>Attack Vector:</strong> ${ping.account.ATTACK_VECTOR}</p>
      <p class="text-sm"><strong>Attack Goal:</strong> ${ping.account.ATTACK_GOAL}</p>
      <p class="text-sm"><strong>Found On:</strong> ${ping.account.FOUND_ON}</p>
      <p class="text-sm text-${getThreatLevelClass(ping.threatLevel)}"><strong>Threat Level:</strong> ${ping.threatLevel.toUpperCase()}</p>
    </div>
  `;

    marker.bindPopup(popupContent);

    // Set ping state to active
    ping.active = true;

    // Remove ping after animation completes
    setTimeout(() => {
        if (ping.active) {
            map.removeLayer(marker);
            ping.active = false;
            activePings = activePings.filter(p => p !== ping);
        }
    }, 5000);
}

// Get CSS class for threat level
function getThreatLevelClass(threatLevel) {
    switch (threatLevel) {
        case 'critical':
            return 'red-600';
        case 'high':
            return 'orange-500';
        case 'medium':
            return 'yellow-500';
        case 'low':
            return 'green-500';
        default:
            return 'gray-500';
    }
}

function filterPings() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const threatLevel = document.getElementById('threatLevelFilter').value;
    const countryFilter = document.getElementById('countryFilter').value;

    pings.forEach(ping => {
        const matchesSearch = ping.country.toLowerCase().includes(searchText);
        const matchesThreatLevel = threatLevel === "" || ping.threatLevel === threatLevel;
        const matchesCountry = countryFilter === "" || ping.region === countryFilter;

        if (matchesSearch && matchesThreatLevel && matchesCountry) {
            if (!ping.marker) {
                createPing(ping);
            }
        } else {
            if (ping.marker) {
                map.removeLayer(ping.marker);
                ping.marker = null;
            }
        }
    });
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', initThreatMap);
document.getElementById('searchInput').addEventListener('input', filterPings);
document.getElementById('threatLevelFilter').addEventListener('change', filterPings);
document.getElementById('countryFilter').addEventListener('change', filterPings);