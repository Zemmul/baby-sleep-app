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
    
    // Initialize the map centered on Melbourne
    map = L.map('map', {
        zoomControl: false, // We'll add custom zoom control
        attributionControl: false // We'll add custom attribution
    }).setView([-37.8136, 144.9631], 13);
    
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
                        alert('Unable to find your location. Please try again or search for a location.');
                    }
                );
            } else {
                alert('Geolocation is not supported by your browser.');
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
                loadData({ lat: -37.8136, lng: 144.9631 });
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
        // Load data for Melbourne as fallback
        loadData({ lat: -37.8136, lng: 144.9631 });
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
            
            // Render the directory with the new filter
            renderDirectory();
        });
    });
    
    // Filter checkboxes change
    [filterFacilitiesCheckbox, filterToiletsCheckbox, filterEventsCheckbox].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            // Update active filters array
            updateActiveFilters();
            renderDirectory();
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
        
        // Render the directory with the reset filters
        renderDirectory();
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
        
        // Get additional dummy data
        const additionalData = getAdditionalDummyData(location);
        
        // Combine all places
        places = [...toiletData, ...facilities, ...events, ...additionalData];
        
        // Add markers to the map
        places.forEach(place => {
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
        
        // Render the directory with the current filter
        renderDirectory();
    } catch (error) {
        console.error('Error loading data:', error);
        directoryContainer.innerHTML = '<div class="no-results">Error loading data. Please try again.</div>';
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

// Render the directory
function renderDirectory() {
    if (!directoryContainer) return;
    
    // Clear the directory
    directoryContainer.innerHTML = '';
    
    // If no places, show loading
    if (!places || places.length === 0) {
        directoryContainer.innerHTML = '<div class="loading">Loading...</div>';
        return;
    }
    
    // Filter places based on active filters
    let filteredPlaces = places.filter(place => {
        // First check if the place matches the date filter
        let matchesDateFilter = true;
        
        if (currentFilter === 'today') {
            matchesDateFilter = isToday(place.date);
        } else if (currentFilter === 'tomorrow') {
            matchesDateFilter = isTomorrow(place.date);
        } else if (currentFilter === 'weekend') {
            matchesDateFilter = isWeekend(place.date);
        }
        
        // Then check if the place type is in the active filters
        const matchesTypeFilter = activeFilters.includes(place.type);
        
        return matchesDateFilter && matchesTypeFilter;
    });
    
    // If no places match the filters, show a message
    if (filteredPlaces.length === 0) {
        directoryContainer.innerHTML = '<div class="no-results">No places match your filters</div>';
        return;
    }
    
    // Sort places by distance if we have a current location
    if (currentLocation) {
        filteredPlaces.sort((a, b) => {
            const distanceA = calculateDistance(
                currentLocation.lat, 
                currentLocation.lng, 
                a.lat, 
                a.lng
            );
            
            const distanceB = calculateDistance(
                currentLocation.lat, 
                currentLocation.lng, 
                b.lat, 
                b.lng
            );
            
            return distanceA - distanceB;
        });
    }
    
    // Render each place
    filteredPlaces.forEach(place => {
        const placeElement = document.createElement('div');
        placeElement.className = 'directory-item';
        placeElement.setAttribute('data-id', place.id);
        
        // Calculate distance if we have a current location
        let distanceText = '';
        if (currentLocation) {
            const distance = calculateDistance(
                currentLocation.lat, 
                currentLocation.lng, 
                place.lat, 
                place.lng
            );
            
            if (distance < 1) {
                distanceText = `<p>${Math.round(distance * 1000)}m away</p>`;
            } else {
                distanceText = `<p>${distance.toFixed(1)}km away</p>`;
            }
        }
        
        // Create the place HTML
        placeElement.innerHTML = `
            <h3>${place.name}</h3>
            ${distanceText}
            <p>${place.description || ''}</p>
            <div class="tags">
                <span class="tag">${place.type}</span>
                ${place.date ? `<span class="tag">${formatDate(place.date)}</span>` : ''}
            </div>
        `;
        
        // Add click event to select the place
        placeElement.addEventListener('click', () => {
            selectPlace(place.id);
        });
        
        // Add to directory
        directoryContainer.appendChild(placeElement);
    });
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
                    latitude: lat,
                    longitude: lng,
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
    // Generate sample events around the location
    const sampleEvents = [];
    const offsets = [-0.015, -0.01, -0.005, 0.005, 0.01, 0.015];
    
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
                    'Storytime',
                    'Baby Sensory Play',
                    'Parent Support Group',
                    'Baby Massage Workshop'
                ];
                
                const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
                
                // Generate a random date within the next 7 days
                const today = new Date();
                const daysToAdd = Math.floor(Math.random() * 7);
                const eventDate = new Date(today);
                eventDate.setDate(today.getDate() + daysToAdd);
                
                // Format the date
                const formattedDate = eventDate.toLocaleDateString('en-AU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                // Generate a random time
                const hours = Math.floor(Math.random() * 12) + 9; // Between 9 AM and 8 PM
                const minutes = Math.random() > 0.5 ? '00' : '30';
                const time = `${hours}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
                
                const hasBooking = Math.random() > 0.3;
                const isFree = Math.random() > 0.4;
                
                const tags = [type];
                if (hasBooking) tags.push('Booking Required');
                if (isFree) tags.push('Free');
                
                sampleEvents.push({
                    id,
                    name: `${type} ${sampleEvents.length + 1}`,
                    type: 'event',
                    description: `Join us for a ${type.toLowerCase()} session. ${hasBooking ? 'Booking is required in advance.' : 'No booking required, just turn up!'} ${isFree ? 'This event is free.' : 'Small fee applies.'}`,
                    latitude: lat,
                    longitude: lng,
                    date: eventDate.toISOString(),
                    formattedDate,
                    time,
                    tags,
                    bookingRequired: hasBooking,
                    isFree
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
    
    // Add these locations with slight offsets from the center
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
            latitude: lat,
            longitude: lng,
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