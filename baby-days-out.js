// Global variables
let map;
let markers = [];
let places = [];
let currentLocation = null;
let currentFilter = 'all';
let activeFilters = ['parent_facility', 'toilet', 'event']; // Track active filters
let directoryContainer;
let searchMarker = null; // Add a variable to track the search marker

// Melbourne coordinates as default
const MELBOURNE_COORDS = {
    lat: -37.8136,
    lng: 144.9631
};

// Import Supabase client functions
import { fetchAllPoints, fetchPointsByType, fetchPointsInBounds, checkTableStructure, addTestPoint } from './supabase-client.js';

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

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing map...');
    initMap();
});

// Initialize the map
function initMap() {
    console.log('Initializing map...');
    
    // Get the directory container
    directoryContainer = document.getElementById('directory');
    console.log('Directory container:', directoryContainer);
    
    // Check the table structure
    checkTableStructure().then(columns => {
        console.log('Table columns:', columns);
    });
    
    // Add a debug button to add a test point
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Add Test Point';
    debugButton.style.position = 'absolute';
    debugButton.style.top = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '1000';
    debugButton.style.padding = '5px 10px';
    debugButton.style.backgroundColor = '#ff5722';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.borderRadius = '4px';
    debugButton.style.cursor = 'pointer';
    
    debugButton.addEventListener('click', async () => {
        console.log('Adding test point...');
        const result = await addTestPoint();
        if (result.success) {
            console.log('Test point added successfully');
            alert('Test point added successfully! Refreshing the page...');
            location.reload();
        } else {
            console.error('Failed to add test point:', result.error);
            alert('Failed to add test point: ' + JSON.stringify(result.error));
        }
    });
    
    document.body.appendChild(debugButton);
    
    // Initialize the map centered on Melbourne
    map = L.map('map', {
        zoomControl: false, // We'll add custom zoom control
        attributionControl: false, // We'll add custom attribution
        preferCanvas: true, // Use Canvas renderer for better performance
        minZoom: 4, // Limit minimum zoom to Australia level
        maxZoom: 18, // Limit maximum zoom to street level
        zoomSnap: 0.5, // Allow fractional zoom levels for smoother zooming
        wheelDebounceTime: 150, // Debounce wheel events for smoother zooming
        fadeAnimation: true, // Smooth fade animation for tiles
    }).setView([MELBOURNE_COORDS.lat, MELBOURNE_COORDS.lng], 13);
    
    // Add high-performance map tiles with caching and lazy loading
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 4,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        crossOrigin: true, // Enable CORS for better caching
        updateWhenIdle: true, // Only load tiles when panning/zooming ends
        updateWhenZooming: false, // Don't update tiles during zoom
        keepBuffer: 2, // Keep 2 rows of tiles in buffer (default is 4)
        maxNativeZoom: 18, // Maximum zoom level for source tiles
        tileSize: 256,
        zIndex: 1,
        detectRetina: true, // Support retina displays
        className: 'map-tiles' // Add class for potential CSS optimizations
    }).addTo(map);
    
    // Add attribution control first
    L.control.attribution({
        position: 'bottomright',
        prefix: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add custom zoom control second
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);
    
    // Add location control with performance optimizations
    const lc = L.control.locate({
        position: 'bottomright',
        strings: {
            title: "Show my location"
        },
        locateOptions: {
            enableHighAccuracy: true,
            maxZoom: 16, // Limit zoom when locating to prevent excessive tile loading
            watch: false, // Don't watch continuously to save resources
            timeout: 10000, // 10 second timeout
            maximumAge: 60000 // Allow 1-minute old location data
        },
        clickBehavior: {
            inView: 'stop',
            outOfView: 'setView'
        },
        showCompass: false, // Disable compass to save resources
        cacheLocation: true // Cache the last known location
    }).addTo(map);

    // Add map movement listener with performance optimizations
    let moveEndTimeout;
    map.on('moveend', () => {
        // Clear any existing timeout
        if (moveEndTimeout) clearTimeout(moveEndTimeout);
        
        // Set a new timeout to debounce the update
        moveEndTimeout = setTimeout(() => {
            const bounds = map.getBounds();
            const zoom = map.getZoom();
            console.log('Map moved. New bounds:', bounds, 'Zoom level:', zoom);
            updateVisiblePoints();
        }, 100); // 100ms debounce
    });

    // Initialize markers array
    markers = [];
    
    // Set all filter checkboxes to checked by default
    const filterFacilities = document.getElementById('filter-facilities');
    const filterEvents = document.getElementById('filter-events');
    const filterToilets = document.getElementById('filter-toilets');
    
    if (filterFacilities) filterFacilities.checked = true;
    if (filterEvents) filterEvents.checked = true;
    if (filterToilets) filterToilets.checked = true;
    
    // Update active filters based on checkbox states
    updateActiveFilters();
    
    // Load initial data
    loadData();
    
    // Setup event listeners
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Location input
    let searchTimeout;
    const locationInput = document.getElementById('location-input');
    const searchSuggestions = document.getElementById('search-suggestions');
    
    if (locationInput) {
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
    }
    
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
    
    // Filter checkboxes
    const filterFacilities = document.getElementById('filter-facilities');
    const filterEvents = document.getElementById('filter-events');
    const filterToilets = document.getElementById('filter-toilets');
    const resetFilters = document.getElementById('reset-filters');
    
    if (filterFacilities) {
        filterFacilities.addEventListener('change', updateActiveFilters);
    }
    
    if (filterEvents) {
        filterEvents.addEventListener('change', updateActiveFilters);
    }
    
    if (filterToilets) {
        filterToilets.addEventListener('change', updateActiveFilters);
    }
    
    if (resetFilters) {
        resetFilters.addEventListener('click', (e) => {
            e.preventDefault();
            if (filterFacilities) filterFacilities.checked = true;
            if (filterEvents) filterEvents.checked = true;
            if (filterToilets) filterToilets.checked = true;
            updateActiveFilters();
        });
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });
    }

    // Tab switching functionality
    const tabs = document.querySelectorAll('.sidebar-tab');
    const tabContents = document.querySelectorAll('.sidebar-tab-content');

    if (tabs.length > 0 && tabContents.length > 0) {
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
                const tabContent = document.getElementById(tabId + '-tab');
                if (tabContent) {
                    tabContent.style.display = 'block';
                }
            });
        });

        // Set initial active tab
        tabs[0].classList.add('active');
        tabContents[0].style.display = 'block';
    }
}

// Update active filters based on checkbox states
function updateActiveFilters() {
    activeFilters = [];
    
    if (document.getElementById('filter-facilities').checked) {
        activeFilters.push('parent_facility');
    }
    
    if (document.getElementById('filter-events').checked) {
        activeFilters.push('event');
    }
    
    if (document.getElementById('filter-toilets').checked) {
        activeFilters.push('toilet');
    }
    
    // Update visible points based on new filters
    updateVisiblePoints();
}

// Update map markers based on active filters
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Get current map bounds
    const bounds = map.getBounds();
    
    // Filter places based on active filters and current bounds
    const filteredPlaces = places.filter(place => {
        const isInBounds = bounds.contains([place.location.lat, place.location.lng]);
        const matchesFilter = activeFilters.includes(place.type);
        return isInBounds && matchesFilter;
    });
    
    // Add markers for filtered places
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
                ${place.amenities && place.amenities.length > 0 ? `<p><strong>Amenities:</strong> ${place.amenities.join(', ')}</p>` : ''}
                ${place.cost ? `<p><strong>Cost:</strong> ${place.cost}</p>` : ''}
                ${place.tags && place.tags.length > 0 ? `
                    <div class="tags">
                        ${place.tags.map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                <button onclick="window.handlePlaceSelect('${place.id}')">View Details</button>
            </div>
        `);
        
        markers.push(marker);
    });
    
    // Update the directory with only visible places
    renderDirectory(filteredPlaces);
    
    // Update the results count
    updateResultsCount(filteredPlaces.length);
}

// Load data for a location
async function loadData(location = MELBOURNE_COORDS) {
    console.log('Loading data for location:', location);
    
    // Show loading state
    if (directoryContainer) {
        directoryContainer.innerHTML = '<div class="loading">Finding places...</div>';
    }
    
    try {
        // Fetch all points from Supabase
        console.log('Fetching all points in Victoria');
        const supabaseData = await fetchAllPoints();
        console.log('Supabase data length:', supabaseData.length);
        
        // Transform Supabase data
        const transformedData = supabaseData.map(point => {
            // Determine the correct latitude and longitude values
            let lat, lng;
            
            // Check for different possible column names
            if (point.hasOwnProperty('latitude') && point.hasOwnProperty('longitude')) {
                lat = parseFloat(point.latitude);
                lng = parseFloat(point.longitude);
            } else if (point.hasOwnProperty('lat') && point.hasOwnProperty('lng')) {
                lat = parseFloat(point.lat);
                lng = parseFloat(point.lng);
            } else {
                console.warn('Point missing latitude/longitude:', point);
                return null;
            }
            
            // Skip points with invalid coordinates
            if (isNaN(lat) || isNaN(lng)) {
                console.warn('Skipping point with invalid coordinates:', point);
                return null;
            }
            
            // Format cost based on its type
            let costDisplay = '';
            if (point.cost !== undefined && point.cost !== null) {
                if (typeof point.cost === 'number') {
                    costDisplay = point.cost === 0 ? 'Free' : `$${point.cost.toFixed(2)}`;
                } else {
                    costDisplay = point.cost;
                }
            }
            
            return {
                id: point.id,
                name: point.title || 'Untitled',
                description: point.description || '',
                type: point.type || 'parent_facility',
                location: {
                    lat: lat,
                    lng: lng
                },
                address: point.address || '',
                amenities: point.facilities || [],
                cost: costDisplay,
                ageGroup: point.age_group || '',
                contactInfo: point.contact_info || '',
                websiteUrl: point.website_url || '',
                startTime: point.start_time || '',
                endTime: point.end_time || '',
                submissionStatus: point.submission_status || '',
                submittedBy: point.submitted_by || '',
                createdAt: point.created_at || '',
                updatedAt: point.updated_at || ''
            };
        }).filter(Boolean);
        
        console.log('Transformed data length:', transformedData.length);
        
        // Set the global places array
        places = transformedData.length > 0 ? transformedData : getSampleData(location);
        
        // If a location is provided, center the map there
        if (location && location.lat && location.lng) {
            map.setView([location.lat, location.lng], 13);
        } else {
            // Otherwise, fit the map to show all points
            const allPoints = L.featureGroup(places.map(place => 
                L.marker([place.location.lat, place.location.lng])
            ));
            map.fitBounds(allPoints.getBounds().pad(0.1));
        }

        // Update visible points based on current viewport
        updateVisiblePoints();
    } catch (error) {
        console.error('Error loading data:', error);
        if (directoryContainer) {
            directoryContainer.innerHTML = '<div class="error">Error loading data. Please try again.</div>';
        }
    }
}

// Get marker color based on place type
function getMarkerColor(place) {
    if (!place || !place.type) {
        return '#9E9E9E'; // Default gray
    }
    
    switch (place.type) {
        case 'parent_facility':
            return '#2196F3'; // Blue
        case 'toilet':
            return '#4CAF50'; // Green
        case 'event':
            return '#FF9800'; // Orange
        case 'park':
            return '#8BC34A'; // Light Green
        case 'playground':
            return '#E91E63'; // Pink
        default:
            return '#9E9E9E'; // Gray
    }
}

// Function to render the directory
function renderDirectory(places) {
    if (!directoryContainer) {
        console.error('Directory container not found');
        return;
    }
    
    // Clear existing content
    directoryContainer.innerHTML = '';
    
    if (!places || places.length === 0) {
        directoryContainer.innerHTML = '<div class="no-results">No places found</div>';
        return;
    }
    
    // Create a grid container for the tiles
    const gridContainer = document.createElement('div');
    gridContainer.className = 'directory-grid';
    
    places.forEach(place => {
        const placeCard = document.createElement('div');
        placeCard.className = 'place-card';
        
        // Create the card content
        const content = `
            <div class="place-header">
                <h3>${place.name}</h3>
                ${place.distance ? `<span class="distance">${place.distance.toFixed(1)}km</span>` : ''}
            </div>
            <p class="description">${place.description || ''}</p>
            ${place.cost ? `<p class="cost"><strong>Cost:</strong> ${place.cost}</p>` : ''}
            ${place.amenities && place.amenities.length > 0 ? `<p class="amenities"><strong>Amenities:</strong> ${place.amenities.join(', ')}</p>` : ''}
            ${place.tags && place.tags.length > 0 ? `
                <div class="tags">
                    ${place.tags.map(tag => `
                        <span class="tag">${tag}</span>
                    `).join('')}
                </div>
            ` : ''}
            <button class="view-details" onclick="window.handlePlaceSelect('${place.id}')">View on Map</button>
        `;
        
        placeCard.innerHTML = content;
        gridContainer.appendChild(placeCard);
    });
    
    directoryContainer.appendChild(gridContainer);
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

// Function to select a place
function selectPlace(id) {
    console.log('Selecting place:', id);
    const place = places.find(p => p.id === id);
    if (!place) {
        console.error('Place not found:', id);
        return;
    }
    
    // Center map on the selected place
    map.setView([place.location.lat, place.location.lng], 16);
    
    // Find and open the marker popup
    const marker = markers.find(m => {
        const popupContent = m.getPopup().getContent();
        return popupContent.includes(id);
    });
    
    if (marker) {
        marker.openPopup();
    }
}

// Make selectPlace available globally
window.handlePlaceSelect = selectPlace;

// Export functions that need to be accessible from other modules
export {
    initMap,
    loadData,
    updateActiveFilters,
    selectPlace
};

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
                    type: 'parent_facility',
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
            type: "parent_facility",
            amenities: ["Baby Change", "Stroller Rental", "Cafe", "Playground"],
            tags: ["Family Friendly", "Educational", "Outdoor"],
            rating: "4.8"
        },
        {
            name: "Scienceworks",
            description: "Interactive science museum with dedicated baby area and nursing rooms.",
            type: "parent_facility",
            amenities: ["Nursing Room", "Baby Area", "Cafe", "Wheelchair Accessible"],
            tags: ["Educational", "Indoor", "Family Friendly"],
            rating: "4.6"
        },
        {
            name: "Royal Botanic Gardens",
            description: "Beautiful gardens with baby change facilities and picnic areas.",
            type: "parent_facility",
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
    
    // Combine all sample data
    const allSampleData = [...sampleFacilities, ...sampleEvents];
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

// Function to update visible points based on map viewport
function updateVisiblePoints() {
    if (!places || places.length === 0) return;

    const bounds = map.getBounds();
    console.log('Updating visible points for bounds:', bounds);

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Filter places based on current viewport and active filters
    const visiblePlaces = places.filter(place => {
        // Check if place is within current bounds
        const isInBounds = bounds.contains([place.location.lat, place.location.lng]);
        // Check if place type matches active filters
        const matchesFilter = activeFilters.includes(place.type);
        return isInBounds && matchesFilter;
    });

    console.log(`Found ${visiblePlaces.length} visible places out of ${places.length} total places`);

    // Add markers for visible places
    visiblePlaces.forEach(place => {
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
                ${place.cost ? `<p class="cost"><strong>Cost:</strong> ${place.cost}</p>` : ''}
                ${place.amenities && place.amenities.length > 0 ? `<p class="amenities"><strong>Amenities:</strong> ${place.amenities.join(', ')}</p>` : ''}
                ${place.tags && place.tags.length > 0 ? `
                    <div class="tags">
                        ${place.tags.map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
                <button onclick="window.handlePlaceSelect('${place.id}')">View Details</button>
            </div>
        `);
        
        markers.push(marker);
    });

    // Update the directory with visible places
    renderDirectory(visiblePlaces);
    
    // Update the results count with visible places count
    updateResultsCount(visiblePlaces.length);
} 