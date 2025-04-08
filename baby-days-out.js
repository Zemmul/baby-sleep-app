// Map and location variables
let map;
let userMarker;
let currentLocation = null;
let markers = [];
let places = [];
let selectedMarker = null; // Track the currently selected marker

// Melbourne coordinates as default
const MELBOURNE_COORDS = {
    lat: -37.8136,
    lng: 144.9631
};

// DOM elements
const mapElement = document.getElementById('map');
const locationInput = document.getElementById('location-input');
const searchButton = document.getElementById('search-button');
const directoryContainer = document.getElementById('directory');
const filterButtons = document.querySelectorAll('.filter-button');

// Date helper functions
function isToday(dateString) {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
}

function isTomorrow(dateString) {
    if (!dateString) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === tomorrow.getTime();
}

function isWeekend(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6; // Saturday or Sunday
}

// Initialize the map
function initMap() {
    console.log('Initializing map...');
    
    // Initialize map centered on Melbourne, Australia
    map = L.map('map').setView([MELBOURNE_COORDS.lat, MELBOURNE_COORDS.lng], 13);
    
    // Add Carto Voyager style (similar to Google Maps)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    
    // Add user location marker at Melbourne
    userMarker = L.marker([MELBOURNE_COORDS.lat, MELBOURNE_COORDS.lng], {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<div style="background-color: #FDA964; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(map);
    
    // Add event listeners
    searchButton.addEventListener('click', searchLocation);
    
    // Add filter button event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            // Filter the directory
            filterDirectory(button.dataset.filter);
        });
    });

    // Show initial message
    directoryContainer.innerHTML = '<div class="loading">Loading nearby places...</div>';
    
    console.log('Map initialization complete');
    
    // Load data for Melbourne by default
    loadData(MELBOURNE_COORDS);
}

// Search for a location based on user input
function searchLocation() {
    const query = locationInput.value.trim();
    
    if (!query) {
        return;
    }
    
    console.log('Searching for location:', query);
    
    // Show loading state
    directoryContainer.innerHTML = '<div class="loading">Searching for location...</div>';
    
    // Use Nominatim API to geocode the location
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Location search results:', data);
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                currentLocation = { lat, lng };
                
                // Update map view
                map.setView([lat, lng], 14);
                
                // Update user marker
                userMarker.setLatLng([lat, lng]);
                
                // Load data for the searched location
                loadData({ lat, lng });
            } else {
                directoryContainer.innerHTML = '<div class="no-results">Location not found. Please try a different search term.</div>';
            }
        })
        .catch(error => {
            console.error('Error searching location:', error);
            directoryContainer.innerHTML = '<div class="no-results">Error searching for location. Please try again.</div>';
        });
}

// Load data for a location
async function loadData(location) {
    // Show loading state
    directoryContainer.innerHTML = '<div class="loading">Finding nearby places...</div>';
    
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    try {
        // Fetch toilet data from the National Public Toilet Map API
        const toiletData = await window.ToiletMapAPI.searchToilets(location);
        console.log('Toilet data:', toiletData);
        
        // Get sample data for facilities and events
        const facilities = getSampleFacilities(location);
        const events = getSampleEvents(location);
        
        // Combine all places
        places = [...toiletData, ...facilities, ...events];
        
        // Add markers to the map
        places.forEach(place => {
            const markerColor = getMarkerColor(place);
            const lat = place.latitude || place.lat; // Support both formats
            const lng = place.longitude || place.lng; // Support both formats
            
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'place-marker',
                    html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(map);
            
            // Add popup to marker
            marker.bindPopup(`
                <strong>${place.name}</strong><br>
                ${place.description}
            `);
            
            // Store the place data with the marker for later reference
            marker.placeData = place;
            
            markers.push(marker);
        });
        
        // Render the directory with the current filter
        const activeFilter = document.querySelector('.filter-button.active').dataset.filter;
        renderDirectory(activeFilter);
    } catch (error) {
        console.error('Error loading data:', error);
        directoryContainer.innerHTML = '<div class="no-results">Error loading nearby places. Please try again.</div>';
    }
}

// Get sample facilities data
function getSampleFacilities(location) {
    return [
        {
            id: 'facility-1',
            name: 'Shopping Centre Parent Room',
            type: 'facility',
            description: 'Spacious parent room with changing tables, feeding area, and comfortable seating.',
            address: '123 Main St, Melbourne',
            lat: location.lat + 0.002,
            lng: location.lng + 0.002,
            tags: ['Changing Table', 'Feeding Area', 'Wheelchair Accessible']
        },
        {
            id: 'facility-2',
            name: 'Park Baby Change Facility',
            type: 'facility',
            description: 'Clean and well-maintained baby change facility in the park.',
            address: '456 Park Ave, Melbourne',
            lat: location.lat - 0.003,
            lng: location.lng + 0.001,
            tags: ['Changing Table', 'Outdoor']
        },
        {
            id: 'facility-3',
            name: 'Library Family Room',
            type: 'facility',
            description: 'Quiet space for parents and babies with changing facilities.',
            address: '789 Library St, Melbourne',
            lat: location.lat + 0.001,
            lng: location.lng - 0.002,
            tags: ['Changing Table', 'Quiet Space', 'Books']
        }
    ];
}

// Get sample events data
function getSampleEvents(location) {
    return [
        {
            id: 'event-1',
            name: 'Baby Music Class',
            type: 'event',
            description: 'Interactive music class for babies 0-12 months. Songs, rhymes, and gentle movements.',
            address: '321 Music Hall, Melbourne',
            lat: location.lat + 0.004,
            lng: location.lng - 0.001,
            date: new Date().toISOString().split('T')[0],
            time: '10:00 AM',
            tags: ['Music', '0-12 months', 'Today']
        },
        {
            id: 'event-2',
            name: 'Baby Sensory Play',
            type: 'event',
            description: 'Sensory play session for babies to explore textures, sounds, and colors.',
            address: '654 Play Centre, Melbourne',
            lat: location.lat - 0.002,
            lng: location.lng - 0.003,
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '11:30 AM',
            tags: ['Sensory', '6-12 months', 'Tomorrow']
        },
        {
            id: 'event-3',
            name: 'Parent & Baby Yoga',
            type: 'event',
            description: 'Gentle yoga session for parents and babies. Bonding through movement.',
            address: '987 Yoga Studio, Melbourne',
            lat: location.lat + 0.003,
            lng: location.lng + 0.003,
            date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            time: '9:00 AM',
            tags: ['Yoga', 'All Ages', 'This Weekend']
        }
    ];
}

// Get marker color based on place type
function getMarkerColor(place) {
    switch (place.type) {
        case 'toilet':
            return '#4CAF50'; // Green
        case 'facility':
            return '#2196F3'; // Blue
        case 'event':
            return '#9C27B0'; // Purple
        default:
            return '#757575'; // Grey
    }
}

// Render the directory with filtered places
function renderDirectory(filter = 'all') {
    console.log('Rendering directory with filter:', filter);
    
    // Filter places based on type and date
    const filteredPlaces = places.filter(place => {
        if (filter === 'all') return true;
        if (filter === 'toilets') return place.type === 'toilet';
        if (filter === 'facilities') return place.type === 'facility';
        if (filter === 'events') return place.type === 'event';
        
        // Date-based filters for events
        if (filter === 'today' && place.type === 'event') {
            return isToday(place.date);
        }
        if (filter === 'tomorrow' && place.type === 'event') {
            return isTomorrow(place.date);
        }
        if (filter === 'weekend' && place.type === 'event') {
            return isWeekend(place.date);
        }
        
        return false;
    });
    
    // Sort places by distance if we have user location
    if (currentLocation) {
        filteredPlaces.sort((a, b) => {
            const aLat = a.latitude || a.lat;
            const aLng = a.longitude || a.lng;
            const bLat = b.latitude || b.lat;
            const bLng = b.longitude || b.lng;
            
            const distA = calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                aLat,
                aLng
            );
            const distB = calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                bLat,
                bLng
            );
            return distA - distB;
        });
    }
    
    // Generate HTML for the directory
    if (filteredPlaces.length === 0) {
        directoryContainer.innerHTML = '<div class="no-results">No places found for the selected filter.</div>';
        return;
    }
    
    const html = filteredPlaces.map(place => {
        const distance = currentLocation ? 
            calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                place.latitude || place.lat,
                place.longitude || place.lng
            ).toFixed(1) : null;
            
        return `
            <div class="directory-item" onclick="selectPlace('${place.id}')">
                <div class="item-header">
                    ${place.type === 'toilet' ? '<span class="toilet-icon"></span>' : ''}
                    <h3>${place.name}</h3>
                    ${distance ? `<span class="distance">${distance}km</span>` : ''}
                </div>
                <p>${place.description}</p>
                ${place.amenities ? `
                    <div class="toilet-info">
                        <strong>Amenities:</strong> ${place.amenities.join(', ')}
                    </div>
                ` : ''}
                <div class="tags">
                    ${place.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    directoryContainer.innerHTML = html;
}

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Filter the directory based on the selected filter
function filterDirectory(filter) {
    renderDirectory(filter);
}

// Select a place and show its details
function selectPlace(placeId) {
    const place = places.find(p => p.id === placeId);
    if (!place) return;
    
    // Find the corresponding marker
    const marker = markers.find(m => m.placeData.id === placeId);
    if (!marker) return;
    
    // Deselect previous marker if any
    if (selectedMarker) {
        const prevIcon = selectedMarker.getIcon();
        prevIcon.options.html = prevIcon.options.html.replace('3px', '2px');
        selectedMarker.setIcon(prevIcon);
    }
    
    // Select new marker
    const icon = marker.getIcon();
    icon.options.html = icon.options.html.replace('2px', '3px');
    marker.setIcon(icon);
    selectedMarker = marker;
    
    // Pan to marker
    map.panTo(marker.getLatLng());
    
    // Open popup
    marker.openPopup();
}

// Wait for the ToiletMapAPI to be initialized
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing map...');
    
    // Wait a moment for the ToiletMapAPI to be initialized
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Initialize the map
    initMap();
    
    // Set up event listeners
    setupEventListeners();
}); 