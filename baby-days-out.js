// Global variables
let map;
let markers = [];
let places = [];
let currentLocation = null;
let currentFilter = 'all';
let activeFilters = ['facilities', 'toilets', 'events']; // Track active filters
let directoryContainer;
let searchMarker = null; // Add a variable to track the search marker

// Melbourne coordinates as default
const MELBOURNE_COORDS = {
    lat: -37.8136,
    lng: 144.9631
};

// DOM elements
const mapElement = document.getElementById('map');
const locationInput = document.getElementById('location-input');
const searchSuggestions = document.getElementById('search-suggestions');
const filterButtons = document.querySelectorAll('.filter-button');
const filterFacilitiesCheckbox = document.getElementById('filter-facilities');
const filterToiletsCheckbox = document.getElementById('filter-toilets');
const filterEventsCheckbox = document.getElementById('filter-events');
const resetFiltersLink = document.getElementById('reset-filters');
const sidebarToggle = document.getElementById('sidebar-toggle');

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

// Initialize the map
function initMap() {
    console.log('Initializing map...');
    
    // Get the directory container
    directoryContainer = document.getElementById('directory');
    console.log('Directory container:', directoryContainer);
    
    // Initialize the map centered on Melbourne
    map = L.map('map', {
        zoomControl: false, // We'll add custom zoom control
        attributionControl: false // We'll add custom attribution
    }).setView([MELBOURNE_COORDS.lat, MELBOURNE_COORDS.lng], 13);
    
    // Add Google Maps-like tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    
    // Add custom zoom control to bottom right
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);
    
    // Add location finder button
    const locationButton = L.control({position: 'bottomright'});
    locationButton.onAdd = function() {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `
            <a href="#" title="Find my location" style="width: 30px; height: 30px; line-height: 30px; text-align: center; display: block; background-color: white; border-radius: 4px; box-shadow: 0 1px 5px rgba(0,0,0,0.4);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
            </a>
        `;
        
        div.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        currentLocation = { lat, lng };
                        
                        // Center the map on the user's location
                        map.setView([lat, lng], 15);
                        
                        // Add a marker for the user's location
                        L.marker([lat, lng], {
                            icon: L.divIcon({
                                className: 'user-location',
                                html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #4285F4;"></div>',
                                iconSize: [16, 16],
                                iconAnchor: [8, 8]
                            })
                        }).addTo(map);
                        
                        // Load data for the user's location
                        loadData(currentLocation);
                    },
                    error => {
                        console.error('Error getting user location:', error);
                        // Load data for Melbourne as fallback
                        loadData(MELBOURNE_COORDS);
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser.');
                // Load data for Melbourne as fallback
                loadData(MELBOURNE_COORDS);
            }
        };
        
        return div;
    };
    locationButton.addTo(map);
    
    // Add attribution control to bottom right, below zoom controls
    const attributionControl = L.control.attribution({
        position: 'bottomright',
        prefix: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    });
    attributionControl.addTo(map);
    
    // Try to get the user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                currentLocation = { lat, lng };
                
                // Center the map on the user's location
                map.setView([lat, lng], 14);
                
                // Add a marker for the user's location
                L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'user-location',
                        html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #4285F4;"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).addTo(map);
                
                // Load data for the user's location
                loadData(currentLocation);
            },
            error => {
                console.error('Error getting user location:', error);
                // Load data for Melbourne as fallback
                loadData(MELBOURNE_COORDS);
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
        // Load data for Melbourne as fallback
        loadData(MELBOURNE_COORDS);
    }
    
    console.log('Map initialization complete');
}

// Set up event listeners
function setupEventListeners() {
    // Location input
    let searchTimeout;
    locationInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        console.log('Search term:', searchTerm);
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Set new timeout to avoid too many API calls
        searchTimeout = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                try {
                    console.log('Fetching suggestions for:', searchTerm);
                    
                    // For local development, use sample suggestions
                    console.log('Using sample suggestions for local development');
                    const sampleSuggestions = getSampleSuggestions(searchTerm);
                    console.log('Sample suggestions:', sampleSuggestions);
                    
                    // Clear previous suggestions
                    searchSuggestions.innerHTML = '';
                    
                    if (sampleSuggestions && sampleSuggestions.length > 0) {
                        sampleSuggestions.forEach(suggestion => {
                            const div = document.createElement('div');
                            div.className = 'suggestion-item';
                            
                            // Format the display name and address
                            const displayName = suggestion.displayName;
                            const address = suggestion.address;
                            
                            console.log('Suggestion:', {
                                displayName,
                                address
                            });
                            
                            // Make sure we have an address to display
                            const mainText = address || displayName;
                            const secondaryText = address ? displayName : '';
                            
                            div.innerHTML = `
                                <h4>${mainText}</h4>
                                ${secondaryText ? `<p>${secondaryText}</p>` : ''}
                            `;
                            
                            div.addEventListener('click', () => {
                                locationInput.value = mainText;
                                searchSuggestions.classList.remove('active');
                                
                                // Update map view and load data
                                const coords = suggestion.coords;
                                
                                currentLocation = coords;
                                map.setView([coords.lat, coords.lng], 15);
                                
                                // Add a marker for the searched location
                                addSearchMarker(coords.lat, coords.lng, mainText);
                                
                                loadData(coords);
                            });
                            
                            searchSuggestions.appendChild(div);
                        });
                        
                        searchSuggestions.classList.add('active');
                    } else {
                        searchSuggestions.classList.remove('active');
                    }
                    
                    /* Commented out for local development
                    // Use Nominatim to search for locations
                    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&countrycodes=au&limit=10&addressdetails=1`;
                    console.log('Fetching from URL:', url);
                    
                    const response = await fetch(url);
                    const suggestions = await response.json();
                    console.log('Received suggestions:', suggestions);
                    
                    // Clear previous suggestions
                    searchSuggestions.innerHTML = '';
                    
                    if (suggestions && suggestions.length > 0) {
                        suggestions.forEach(suggestion => {
                            const div = document.createElement('div');
                            div.className = 'suggestion-item';
                            
                            // Format the display name and address
                            const displayName = formatDisplayName(suggestion);
                            const address = formatAddress(suggestion.address);
                            
                            console.log('Suggestion:', {
                                displayName,
                                address,
                                rawAddress: suggestion.address
                            });
                            
                            // Make sure we have an address to display
                            const mainText = address || displayName;
                            const secondaryText = address ? displayName : '';
                            
                            div.innerHTML = `
                                <h4>${mainText}</h4>
                                ${secondaryText ? `<p>${secondaryText}</p>` : ''}
                            `;
                            
                            div.addEventListener('click', () => {
                                locationInput.value = mainText;
                                searchSuggestions.classList.remove('active');
                                
                                // Update map view and load data
                                const coords = {
                                    lat: parseFloat(suggestion.lat),
                                    lng: parseFloat(suggestion.lon)
                                };
                                
                                currentLocation = coords;
                                map.setView([coords.lat, coords.lng], 15);
                                
                                // Add a marker for the searched location
                                addSearchMarker(coords.lat, coords.lng, mainText);
                                
                                loadData(coords);
                            });
                            
                            searchSuggestions.appendChild(div);
                        });
                        
                        searchSuggestions.classList.add('active');
                    } else {
                        searchSuggestions.classList.remove('active');
                    }
                    */
                } catch (error) {
                    console.error('Error fetching location suggestions:', error);
                    searchSuggestions.classList.remove('active');
                }
            } else {
                searchSuggestions.classList.remove('active');
            }
        }, 300); // 300ms delay
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.location-search')) {
            searchSuggestions.classList.remove('active');
        }
    });
    
    // Filter buttons click
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get the filter value
            currentFilter = button.getAttribute('data-filter');
            
            // Update map markers based on current filter
            updateMapMarkers();
            
            // Render the directory with the new filter
            renderDirectory();
            
            console.log('Filter button clicked. Current filter:', currentFilter);
        });
    });
    
    // Filter checkboxes change
    [filterFacilitiesCheckbox, filterToiletsCheckbox, filterEventsCheckbox].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Update active filters array
            updateActiveFilters();
            
            // Update the directory view
            renderDirectory();
            
            // Log the current state of filters
            console.log('Filter checkboxes changed. Active filters:', activeFilters);
        });
    });
    
    // Reset filters link
    resetFiltersLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Reset all checkboxes to checked
        filterFacilitiesCheckbox.checked = true;
        filterToiletsCheckbox.checked = true;
        filterEventsCheckbox.checked = true;
        
        // Reset active filters
        activeFilters = ['facilities', 'toilets', 'events'];
        
        // Reset date filter
        currentFilter = 'all';
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Update map markers with reset filters
        updateMapMarkers();
        
        // Render the directory with the reset filters
        renderDirectory();
        
        console.log('Filters reset. Active filters:', activeFilters);
    });
    
    // Sidebar toggle
    sidebarToggle.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('collapsed');
    });

    // Tab switching functionality
    const tabs = document.querySelectorAll('.sidebar-tab');
    const tabContents = document.querySelectorAll('.sidebar-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all tab contents
            tabContents.forEach(content => content.style.display = 'none');
            // Show the corresponding tab content
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId + '-tab').style.display = 'block';
        });
    });

    // Set initial active tab
    tabs[0].classList.add('active');
    tabContents[0].style.display = 'block';
}

// Update active filters based on checkbox states
function updateActiveFilters() {
    activeFilters = [];
    
    if (filterFacilitiesCheckbox.checked) {
        activeFilters.push('facilities');
    }
    
    if (filterToiletsCheckbox.checked) {
        activeFilters.push('toilets');
    }
    
    if (filterEventsCheckbox.checked) {
        activeFilters.push('events');
    }
    
    // Update map markers based on active filters
    updateMapMarkers();
}

// Update map markers based on active filters
function updateMapMarkers() {
    console.log('Updating map markers with active filters:', activeFilters);
    
    // Clear all existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // If no places, return
    if (!places || places.length === 0) {
        return;
    }
    
    // Filter places based on active filters
    let filteredPlaces = places;
    
    // If there are active filters, apply them
    if (activeFilters.length > 0) {
        filteredPlaces = places.filter(place => {
            return activeFilters.includes(place.type);
        });
    }
    
    console.log(`Showing ${filteredPlaces.length} places on map`);
    
    // Add markers for filtered places
    filteredPlaces.forEach(place => {
        const markerColor = getMarkerColor(place);
        const lat = place.latitude || place.lat; // Support both formats
        const lng = place.longitude || place.lng; // Support both formats
        
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px ${markerColor};"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(map);
        
        // Add popup with place info
        marker.bindPopup(`
            <div class="marker-popup">
                <h3>${place.name}</h3>
                <p>${place.description}</p>
                ${place.amenities ? `<p><strong>Amenities:</strong> ${place.amenities.join(', ')}</p>` : ''}
                <button onclick="selectPlace('${place.id}')">View Details</button>
            </div>
        `);
        
        // Store marker reference
        markers.push(marker);
    });
}

// Load data for a location
async function loadData(location) {
    console.log('Loading data for location:', location);
    
    // Show loading state
    if (directoryContainer) {
        directoryContainer.innerHTML = '<div class="loading">Finding nearby places...</div>';
    } else {
        console.error('Directory container not found in loadData!');
        return;
    }
    
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    try {
        // Get sample data
        console.log('Getting sample data...');
        const sampleData = getSampleData(location);
        console.log('Sample data retrieved:', sampleData);
        
        console.log('Getting additional dummy data...');
        const additionalData = getAdditionalDummyData(location);
        console.log('Additional dummy data retrieved:', additionalData);
        
        // Combine all data
        places = [...sampleData, ...additionalData];
        
        console.log(`Total places: ${places.length}`);
        
        // Filter places based on active filters
        let filteredPlaces = places;
        
        // If there are active filters, apply them
        if (activeFilters.length > 0) {
            filteredPlaces = places.filter(place => {
                return activeFilters.includes(place.type);
            });
        }
        
        console.log(`Filtered places: ${filteredPlaces.length}`);
        
        // Add markers to the map for filtered places
        filteredPlaces.forEach(place => {
            const markerColor = getMarkerColor(place);
            const lat = place.location.lat;
            const lng = place.location.lng;
            
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div style="background-color: ${markerColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 2px ${markerColor};"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(map);
            
            // Add popup with place info
            marker.bindPopup(`
                <div class="marker-popup">
                    <h3>${place.name}</h3>
                    <p>${place.description}</p>
                    ${place.amenities ? `<p><strong>Amenities:</strong> ${place.amenities.join(', ')}</p>` : ''}
                    <button onclick="selectPlace('${place.id}')">View Details</button>
                </div>
            `);
            
            // Store marker reference
            markers.push(marker);
        });
        
        // Render the directory with filtered places
        renderDirectory(filteredPlaces);
        
        // Update the results count
        updateResultsCount(filteredPlaces.length);
    } catch (error) {
        console.error('Error loading data:', error);
        if (directoryContainer) {
            directoryContainer.innerHTML = '<div class="no-results">Error loading data. Please try again.</div>';
        }
    }
}

// Get marker color based on place type
function getMarkerColor(place) {
    switch (place.type) {
        case 'toilet':
            return '#4CAF50'; // Green
        case 'facility':
            return '#2196F3'; // Blue
        case 'event':
            return '#FF9800'; // Orange
        default:
            return '#9E9E9E'; // Gray
    }
}

// Function to render the directory
function renderDirectory(places) {
    console.log('Rendering directory with places:', places);
    
    if (!directoryContainer) {
        console.error('Directory container not found!');
        return;
    }
    
    // Clear existing content
    directoryContainer.innerHTML = '';
    
    if (places.length === 0) {
        console.log('No places to display');
        directoryContainer.innerHTML = '<p class="no-results">No places found matching your criteria.</p>';
        return;
    }
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add each place to the directory
    places.forEach(place => {
        console.log('Creating element for place:', place.name);
        
        const placeElement = document.createElement('div');
        placeElement.className = 'place-card';
        placeElement.dataset.id = place.id;
        
        // Calculate distance if we have current location
        let distanceText = '';
        if (currentLocation) {
            const distance = calculateDistance(
                currentLocation.lat,
                currentLocation.lng,
                place.location.lat,
                place.location.lng
            );
            distanceText = `<span class="distance">${distance.toFixed(1)} km away</span>`;
        }
        
        // Create the place card HTML
        placeElement.innerHTML = `
            <div class="place-header">
                <h3>${place.name}</h3>
                ${distanceText}
            </div>
            <p class="description">${place.description}</p>
            <div class="place-details">
                <div class="amenities">
                    ${place.amenities.map(amenity => `<span class="amenity">${amenity}</span>`).join('')}
                </div>
                <div class="tags">
                    ${place.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
        
        // Add click event to show place details
        placeElement.addEventListener('click', () => {
            showPlaceDetails(place);
        });
        
        fragment.appendChild(placeElement);
    });
    
    // Append all place elements at once
    directoryContainer.appendChild(fragment);
    console.log('Directory rendering complete');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
    });
}

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d;
}

// Convert degrees to radians
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Select a place and show its details
function selectPlace(id) {
    const place = places.find(p => p.id === id);
    if (!place) return;
    
    // Center the map on the place
    const lat = place.latitude || place.lat;
    const lng = place.longitude || place.lng;
    map.setView([lat, lng], 16);
    
    // Find the marker for this place
    const marker = markers.find(m => {
        const markerLat = m.getLatLng().lat;
        const markerLng = m.getLatLng().lng;
        return markerLat === lat && markerLng === lng;
    });
    
    // Open the popup
    if (marker) {
        marker.openPopup();
    }
}

// Get sample facilities data
function getSampleFacilities(location) {
    // Generate a grid of sample facilities around the location
    const sampleFacilities = [];
    const offsets = [-0.01, -0.005, 0.005, 0.01];
    
    // Create facilities at different offsets
    for (let i = 0; i < offsets.length; i++) {
        for (let j = 0; j < offsets.length; j++) {
            const lat = location.lat + offsets[i];
            const lng = location.lng + offsets[j];
            
            const id = `facility-${i}-${j}`;
            const distance = calculateDistance(location.lat, location.lng, lat, lng);
            
            // Only include facilities within 5km
            if (distance <= 5) {
                const facilityTypes = [
                    'Baby Care Room',
                    'Parent Room',
                    'Family Room',
                    'Nursing Room',
                    'Changing Station'
                ];
                
                const type = facilityTypes[Math.floor(Math.random() * facilityTypes.length)];
                const hasNursing = Math.random() > 0.5;
                const hasMicrowave = Math.random() > 0.7;
                
                const amenities = [type];
                if (hasNursing) amenities.push('Nursing Area');
                if (hasMicrowave) amenities.push('Microwave');
                
                const tags = [...amenities];
                if (Math.random() > 0.5) tags.push('Wheelchair Accessible');
                
                sampleFacilities.push({
                    id,
                    name: `${type} ${sampleFacilities.length + 1}`,
                    type: 'facility',
                    description: `A ${type.toLowerCase()} for parents with babies and young children${hasNursing ? ' with a private nursing area' : ''}${hasMicrowave ? ' and microwave for warming bottles' : ''}.`,
                    location: { lat, lng },
                    amenities,
                    tags,
                    rating: (Math.random() * 5).toFixed(1),
                    reviews: []
                });
            }
        }
    }
    
    return sampleFacilities;
}

// Get sample events data
function getSampleEvents(location) {
    // Generate a grid of sample events around the location
    const sampleEvents = [];
    const offsets = [-0.01, -0.005, 0.005, 0.01];
    
    // Create events at different offsets
    for (let i = 0; i < offsets.length; i++) {
        for (let j = 0; j < offsets.length; j++) {
            const lat = location.lat + offsets[i];
            const lng = location.lng + offsets[j];
            
            const id = `event-${i}-${j}`;
            const distance = calculateDistance(location.lat, location.lng, lat, lng);
            
            // Only include events within 5km
            if (distance <= 5) {
                const eventTypes = [
                    'Baby Music Class',
                    'Parent & Baby Yoga',
                    'Story Time',
                    'Baby Sensory Play',
                    'Parent Support Group'
                ];
                
                const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                const isRecurring = Math.random() > 0.5;
                const hasBooking = Math.random() > 0.7;
                
                const amenities = ['Baby Change Facilities'];
                if (hasBooking) amenities.push('Online Booking');
                
                const tags = [...amenities];
                if (Math.random() > 0.5) tags.push('Wheelchair Accessible');
                
                sampleEvents.push({
                    id,
                    name: `${type} ${sampleEvents.length + 1}`,
                    type: 'event',
                    description: `A ${type.toLowerCase()} for parents and babies${isRecurring ? ' (recurring weekly)' : ''}${hasBooking ? ' with online booking available' : ''}.`,
                    location: { lat, lng },
                    amenities,
                    tags,
                    rating: (Math.random() * 5).toFixed(1),
                    reviews: [],
                    schedule: isRecurring ? 'Weekly' : 'One-time',
                    bookingRequired: hasBooking
                });
            }
        }
    }
    
    return sampleEvents;
}

// Helper function to check if a location is in Victoria
function isLocationInVictoria(latlng) {
    // Victoria's approximate bounding box
    const victoriaBounds = {
        north: -34.0,
        south: -39.0,
        east: 150.0,
        west: 141.0
    };
    
    return (
        latlng.lat >= victoriaBounds.south &&
        latlng.lat <= victoriaBounds.north &&
        latlng.lng >= victoriaBounds.west &&
        latlng.lng <= victoriaBounds.east
    );
}

// Helper function to format the display name
function formatDisplayName(suggestion) {
    if (suggestion.type === 'poi') {
        return suggestion.name || suggestion.display_name.split(',')[0];
    }
    
    const parts = suggestion.display_name.split(',');
    return parts[0];
}

// Helper function to format the address
function formatAddress(address) {
    if (!address) return '';
    
    const parts = [];
    
    // Add street if available
    if (address.road) {
        parts.push(address.road);
    }
    
    // Add suburb if available
    if (address.suburb) {
        parts.push(address.suburb);
    }
    
    // Add city/town if available
    if (address.city || address.town) {
        parts.push(address.city || address.town);
    }
    
    // Add state if available
    if (address.state) {
        parts.push(address.state);
    }
    
    // If we don't have any parts, try to use the display_name
    if (parts.length === 0 && address.display_name) {
        return address.display_name;
    }
    
    return parts.join(', ');
}

// Add a marker for the searched location
function addSearchMarker(lat, lng, title) {
    console.log('Adding search marker:', { lat, lng, title });
    
    // Remove any existing search marker
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
    
    // Create a custom icon for the search marker
    const searchIcon = L.divIcon({
        className: 'search-marker',
        html: `
            <div class="search-marker-pin">
                <div class="search-marker-dot"></div>
            </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -42]
    });
    
    // Add the marker to the map
    searchMarker = L.marker([lat, lng], { icon: searchIcon }).addTo(map);
    
    // Add a popup with the location name
    searchMarker.bindPopup(title).openPopup();
    
    // Add pulse animation to the marker
    const markerElement = searchMarker.getElement();
    if (markerElement) {
        const dotElement = markerElement.querySelector('.search-marker-dot');
        if (dotElement) {
            dotElement.classList.add('pulse');
            console.log('Added pulse animation to search marker');
        } else {
            console.error('Could not find dot element in search marker');
        }
    } else {
        console.error('Could not get marker element');
    }
    
    console.log('Search marker added successfully');
}

// Get additional dummy data for the map
function getAdditionalDummyData(location) {
    const additionalData = [];
    
    // Add some popular baby-friendly locations
    const popularLocations = [
        {
            name: "Melbourne Zoo",
            description: "Family-friendly zoo with baby change facilities and stroller rentals.",
            type: "facility",
            amenities: ["Baby Change", "Stroller Rental", "Cafe", "Playground"],
            tags: ["Family Friendly", "Educational", "Outdoor"],
            rating: "4.8"
        },
        {
            name: "Scienceworks",
            description: "Interactive science museum with dedicated baby area and nursing rooms.",
            type: "facility",
            amenities: ["Nursing Room", "Baby Area", "Cafe", "Wheelchair Accessible"],
            tags: ["Educational", "Indoor", "Family Friendly"],
            rating: "4.6"
        },
        {
            name: "Royal Botanic Gardens",
            description: "Beautiful gardens with baby change facilities and picnic areas.",
            type: "facility",
            amenities: ["Baby Change", "Picnic Area", "Cafe", "Wheelchair Accessible"],
            tags: ["Outdoor", "Nature", "Family Friendly"],
            rating: "4.7"
        },
        {
            name: "Baby Sensory Playgroup",
            description: "Weekly sensory play sessions for babies 0-12 months.",
            type: "event",
            date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(),
            formattedDate: new Date(new Date().setDate(new Date().getDate() + 2)).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: "10:00 AM",
            tags: ["Sensory Play", "Baby Friendly", "Weekly"],
            bookingRequired: true,
            isFree: false
        },
        {
            name: "Parent & Baby Yoga",
            description: "Gentle yoga classes designed for parents and babies to enjoy together.",
            type: "event",
            date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
            formattedDate: new Date(new Date().setDate(new Date().getDate() + 3)).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: "11:30 AM",
            tags: ["Yoga", "Baby Friendly", "Weekly"],
            bookingRequired: true,
            isFree: false
        },
        {
            name: "Baby Music Class",
            description: "Interactive music sessions for babies 0-18 months with singing and instruments.",
            type: "event",
            date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            formattedDate: new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: "9:30 AM",
            tags: ["Music", "Baby Friendly", "Weekly"],
            bookingRequired: false,
            isFree: false
        }
    ];
    
    // Add these locations with slight offsets from the center point
    popularLocations.forEach((place, index) => {
        // Create a circular pattern around the center point
        const angle = (index / popularLocations.length) * 2 * Math.PI;
        const radius = 0.01; // About 1km from center
        const lat = location.lat + radius * Math.cos(angle);
        const lng = location.lng + radius * Math.sin(angle);
        
        const id = `popular-${index}`;
        
        additionalData.push({
            id,
            name: place.name,
            type: place.type,
            description: place.description,
            location: { lat, lng },
            amenities: place.amenities || [],
            tags: place.tags || [],
            rating: place.rating,
            date: place.date,
            formattedDate: place.formattedDate,
            time: place.time,
            bookingRequired: place.bookingRequired,
            isFree: place.isFree,
            reviews: []
        });
    });
    
    return additionalData;
}

// Get sample suggestions for local development
function getSampleSuggestions(searchTerm) {
    // Sample suggestions based on the search term
    const sampleSuggestions = [
        {
            displayName: `${searchTerm} Shopping Centre`,
            address: `123 ${searchTerm} Road, ${searchTerm}, VIC 3000`,
            coords: {
                lat: -37.8136 + (Math.random() * 0.01 - 0.005),
                lng: 144.9631 + (Math.random() * 0.01 - 0.005)
            }
        },
        {
            displayName: `${searchTerm} Park`,
            address: `${searchTerm} Park, ${searchTerm}, VIC 3000`,
            coords: {
                lat: -37.8136 + (Math.random() * 0.01 - 0.005),
                lng: 144.9631 + (Math.random() * 0.01 - 0.005)
            }
        },
        {
            displayName: `${searchTerm} Station`,
            address: `${searchTerm} Railway Station, ${searchTerm}, VIC 3000`,
            coords: {
                lat: -37.8136 + (Math.random() * 0.01 - 0.005),
                lng: 144.9631 + (Math.random() * 0.01 - 0.005)
            }
        }
    ];
    
    return sampleSuggestions;
}

// Function to get sample data
function getSampleData(location = { lat: -37.8136, lng: 144.9631 }) { // Default to Melbourne coordinates
    console.log('Getting sample data for location:', location);
    
    // Get sample facilities and events
    const sampleFacilities = getSampleFacilities(location);
    const sampleEvents = getSampleEvents(location);
    console.log('Sample facilities:', sampleFacilities);
    console.log('Sample events:', sampleEvents);
    
    // Get sample toilets
    let sampleToilets = [];
    if (window.ToiletMapAPI && typeof window.ToiletMapAPI.getSampleToiletData === 'function') {
        console.log('ToiletMapAPI is available, getting sample toilet data...');
        sampleToilets = window.ToiletMapAPI.getSampleToiletData(location);
        console.log('Sample toilets from API:', sampleToilets);
    } else {
        console.log('ToiletMapAPI not available, creating fallback sample toilets...');
        sampleToilets = createSampleToilets(location);
        console.log('Fallback sample toilets:', sampleToilets);
    }
    
    // Combine all sample data
    const allSampleData = [...sampleFacilities, ...sampleEvents, ...sampleToilets];
    console.log('Total sample data generated:', allSampleData.length);
    
    return allSampleData;
}

// Create sample toilets as fallback
function createSampleToilets(location) {
    console.log('Creating fallback sample toilets for location:', location);
    
    // Generate a grid of sample toilets around the location
    const sampleToilets = [];
    const offsets = [-0.005, -0.0025, 0, 0.0025, 0.005];
    
    // Create a 5x5 grid of toilets
    for (let i = 0; i < offsets.length; i++) {
        for (let j = 0; j < offsets.length; j++) {
            const lat = location.lat + offsets[i];
            const lng = location.lng + offsets[j];
            
            // Skip the center point (user location)
            if (i === 2 && j === 2) continue;
            
            const id = `toilet-${i}-${j}`;
            const distance = calculateDistance(location.lat, location.lng, lat, lng);
            
            // Only include toilets within 5km
            if (distance <= 5) {
                const hasBabyChange = Math.random() > 0.3; // 70% chance of having baby change
                const isWheelchairAccessible = Math.random() > 0.2; // 80% chance of being wheelchair accessible
                
                const amenities = [];
                if (hasBabyChange) amenities.push('Baby Change');
                if (isWheelchairAccessible) amenities.push('Wheelchair Accessible');
                
                const tags = [...amenities];
                if (Math.random() > 0.5) tags.push('Unisex');
                
                sampleToilets.push({
                    id,
                    name: `Public Toilet ${sampleToilets.length + 1}`,
                    type: 'toilet',
                    description: `Public toilet facility${hasBabyChange ? ' with baby change facilities' : ''}${isWheelchairAccessible ? ' and wheelchair access' : ''}.`,
                    location: { lat, lng },
                    amenities,
                    tags,
                    rating: (Math.random() * 5).toFixed(1),
                    reviews: []
                });
            }
        }
    }
    
    console.log(`Generated ${sampleToilets.length} fallback sample toilets around [${location.lat}, ${location.lng}]`);
    return sampleToilets;
}

// Update the results count
function updateResultsCount(count) {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = `${count} places found`;
    }
}

// Function to filter places based on active filters
function filterPlaces(places) {
    console.log('Filtering places:', places);
    console.log('Active filters:', activeFilters);
    
    if (!places || places.length === 0) {
        console.log('No places to filter');
        return [];
    }
    
    // If no filters are active, return all places
    if (Object.values(activeFilters).every(filter => !filter)) {
        console.log('No active filters, returning all places');
        return places;
    }
    
    // Filter places based on active filters
    const filteredPlaces = places.filter(place => {
        // Check if the place matches any active filter
        const matchesFilter = Object.entries(activeFilters).some(([filter, isActive]) => {
            if (!isActive) return false;
            
            // Check if the place has the filter as a tag or amenity
            const matches = place.tags.includes(filter) || place.amenities.includes(filter);
            console.log(`Place ${place.name} matches filter ${filter}: ${matches}`);
            return matches;
        });
        
        return matchesFilter;
    });
    
    console.log('Filtered places:', filteredPlaces);
    return filteredPlaces;
} 