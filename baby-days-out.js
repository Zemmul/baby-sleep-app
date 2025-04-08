// Map and location variables
let map;
let userMarker;
let currentLocation = null;
let markers = [];
let places = [];

// Melbourne coordinates
const MELBOURNE_COORDS = {
    lat: -37.8136,
    lng: 144.9631
};

// DOM elements
const mapElement = document.getElementById('map');
const locationInput = document.getElementById('location-input');
const searchButton = document.getElementById('search-button');
const retryLocationButton = document.getElementById('retry-location');
const locationError = document.getElementById('location-error');
const directoryContainer = document.getElementById('directory');
const filterButtons = document.querySelectorAll('.filter-button');

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
    
    // Add location control button
    const locationControl = L.control({ position: 'bottomright' });
    locationControl.onAdd = function() {
        const div = L.DomUtil.create('div', 'location-control');
        div.innerHTML = '<button class="location-button" title="Go to my location"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></button>';
        div.onclick = function() {
            getCurrentLocation();
        };
        return div;
    };
    locationControl.addTo(map);
    
    // Add event listeners
    searchButton.addEventListener('click', searchLocation);
    retryLocationButton.addEventListener('click', getCurrentLocation);
    
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
    directoryContainer.innerHTML = '<div class="no-results">Enter your location or click the location button to find nearby places.</div>';
    
    console.log('Map initialization complete');
    
    // Search for places in Melbourne by default
    searchNearbyPlaces(MELBOURNE_COORDS);
}

// Get the user's current location
function getCurrentLocation() {
    console.log('Getting current location...');
    
    // Show loading state
    directoryContainer.innerHTML = '<div class="loading">Getting your location...</div>';
    
    // Hide location error
    locationError.style.display = 'none';
    
    if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        showLocationError('Your browser doesn\'t support geolocation. Please enter your location manually.');
        return;
    }
    
    // Check if we're in a secure context
    if (window.isSecureContext === false) {
        console.error('Geolocation requires a secure context (HTTPS)');
        showLocationError('Location access requires a secure connection. Please ensure you\'re using HTTPS.');
        return;
    }
    
    // Use a simple approach with minimal options
    const options = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0
    };
    
    // Try to get location once
    navigator.geolocation.getCurrentPosition(
        // Success callback
        position => {
            console.log('Location obtained successfully:', position);
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            currentLocation = { lat, lng };
            
            // Update map view
            map.setView([lat, lng], 14);
            
            // Update user marker
            userMarker.setLatLng([lat, lng]);
            
            // Search for nearby places
            searchNearbyPlaces({ lat, lng });
        },
        // Error callback
        error => {
            console.error('Error getting location:', error);
            
            // Show a helpful error message
            let errorMessage = 'Unable to get your location. ';
            
            if (error.code === 1) { // PERMISSION_DENIED
                errorMessage += 'Please allow location access in your browser settings.';
            } else if (error.code === 2) { // POSITION_UNAVAILABLE
                errorMessage += 'Your device is having trouble getting a location fix. Please try again later or enter your location manually.';
            } else if (error.code === 3) { // TIMEOUT
                errorMessage += 'Location request timed out. Please try again.';
            } else {
                errorMessage += 'Please check your device settings or enter your location manually.';
            }
            
            showLocationError(errorMessage);
            
            // Suggest using the search box
            directoryContainer.innerHTML = '<div class="no-results">Please enter your location in the search box above to find nearby places.</div>';
        },
        options
    );
}

// Show location error message
function showLocationError(message) {
    locationError.style.display = 'flex';
    locationError.innerHTML = `
        <span>${message}</span>
        <button id="retry-location">Retry</button>
    `;
    directoryContainer.innerHTML = '<div class="no-results">Please enter your location to find nearby places.</div>';
    
    // Re-attach retry button event listener
    document.getElementById('retry-location').addEventListener('click', getCurrentLocation);
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
                
                // Search for nearby places
                searchNearbyPlaces({ lat, lng });
            } else {
                directoryContainer.innerHTML = '<div class="no-results">Location not found. Please try a different search term.</div>';
            }
        })
        .catch(error => {
            console.error('Error searching location:', error);
            directoryContainer.innerHTML = '<div class="no-results">Error searching for location. Please try again.</div>';
        });
}

// Search for nearby places based on location
function searchNearbyPlaces(location) {
    // Show loading state
    directoryContainer.innerHTML = '<div class="loading">Finding nearby places...</div>';
    
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // In a real application, you would use a proper API to search for places
    // For this demo, we'll use sample data
    setTimeout(() => {
        // Sample data for parent facilities
        const facilities = [
            {
                id: 1,
                name: 'Shopping Centre Parent Room',
                type: 'facility',
                description: 'Spacious parent room with changing tables, feeding area, and comfortable seating.',
                address: '123 Main St, Sydney',
                lat: location.lat + 0.002,
                lng: location.lng + 0.002,
                tags: ['Changing Table', 'Feeding Area', 'Wheelchair Accessible']
            },
            {
                id: 2,
                name: 'Park Baby Change Facility',
                type: 'facility',
                description: 'Clean and well-maintained baby change facility in the park.',
                address: '456 Park Ave, Sydney',
                lat: location.lat - 0.003,
                lng: location.lng + 0.001,
                tags: ['Changing Table', 'Outdoor']
            },
            {
                id: 3,
                name: 'Library Family Room',
                type: 'facility',
                description: 'Quiet space for parents and babies with changing facilities.',
                address: '789 Library St, Sydney',
                lat: location.lat + 0.001,
                lng: location.lng - 0.002,
                tags: ['Changing Table', 'Quiet Space', 'Books']
            }
        ];
        
        // Sample data for baby events
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const events = [
            {
                id: 4,
                name: 'Baby Music Class',
                type: 'event',
                description: 'Interactive music class for babies 0-12 months. Songs, rhymes, and gentle movements.',
                address: '321 Music Hall, Sydney',
                lat: location.lat + 0.004,
                lng: location.lng - 0.001,
                date: today.toISOString().split('T')[0],
                time: '10:00 AM',
                tags: ['Music', '0-12 months', 'Today']
            },
            {
                id: 5,
                name: 'Baby Sensory Play',
                type: 'event',
                description: 'Sensory play session for babies to explore textures, sounds, and colors.',
                address: '654 Play Centre, Sydney',
                lat: location.lat - 0.002,
                lng: location.lng - 0.003,
                date: tomorrow.toISOString().split('T')[0],
                time: '11:30 AM',
                tags: ['Sensory', '6-12 months', 'Tomorrow']
            },
            {
                id: 6,
                name: 'Parent & Baby Yoga',
                type: 'event',
                description: 'Gentle yoga session for parents and babies. Bonding through movement.',
                address: '987 Yoga Studio, Sydney',
                lat: location.lat + 0.003,
                lng: location.lng + 0.003,
                date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '9:00 AM',
                tags: ['Yoga', 'All Ages', 'This Weekend']
            }
        ];
        
        // Combine all places
        places = [...facilities, ...events];
        
        // Add markers to the map
        places.forEach(place => {
            const markerColor = place.type === 'facility' ? '#9D8576' : '#FDA964';
            const marker = L.marker([place.lat, place.lng], {
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
                ${place.description}<br>
                <small>${place.address}</small>
            `);
            
            markers.push(marker);
        });
        
        // Render the directory
        renderDirectory('all');
    }, 1000); // Simulate API delay
}

// Render the directory based on the selected filter
function renderDirectory(filter) {
    // Filter places based on the selected filter
    let filteredPlaces = places;
    
    if (filter !== 'all') {
        if (filter === 'facilities') {
            filteredPlaces = places.filter(place => place.type === 'facility');
        } else if (filter === 'events') {
            filteredPlaces = places.filter(place => place.type === 'event');
        } else if (filter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            filteredPlaces = places.filter(place => place.type === 'event' && place.date === today);
        } else if (filter === 'tomorrow') {
            const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0];
            filteredPlaces = places.filter(place => place.type === 'event' && place.date === tomorrow);
        } else if (filter === 'weekend') {
            const today = new Date();
            const day = today.getDay();
            const daysUntilWeekend = day === 0 ? 0 : (day === 6 ? 0 : 6 - day);
            const weekendDate = new Date(today.setDate(today.getDate() + daysUntilWeekend)).toISOString().split('T')[0];
            filteredPlaces = places.filter(place => place.type === 'event' && place.date === weekendDate);
        }
    }
    
    // Clear the directory container
    directoryContainer.innerHTML = '';
    
    // If no places match the filter, show a message
    if (filteredPlaces.length === 0) {
        directoryContainer.innerHTML = '<div class="no-results">No places found matching your filter.</div>';
        return;
    }
    
    // Render each place
    filteredPlaces.forEach(place => {
        const placeElement = document.createElement('div');
        placeElement.className = 'directory-item';
        
        // Create the HTML for the place
        let placeHTML = `
            <h3>${place.name}</h3>
            <p>${place.description}</p>
            <p><strong>Address:</strong> ${place.address}</p>
        `;
        
        // Add date and time for events
        if (place.type === 'event') {
            const date = new Date(place.date);
            const formattedDate = date.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            placeHTML += `<p><strong>Date:</strong> ${formattedDate}</p>`;
            placeHTML += `<p><strong>Time:</strong> ${place.time}</p>`;
        }
        
        // Add tags
        placeHTML += '<div class="tags">';
        place.tags.forEach(tag => {
            placeHTML += `<span class="tag">${tag}</span>`;
        });
        placeHTML += '</div>';
        
        // Set the HTML and add click event to center the map on the place
        placeElement.innerHTML = placeHTML;
        placeElement.addEventListener('click', () => {
            map.setView([place.lat, place.lng], 16);
            markers.find(marker => 
                marker.getLatLng().lat === place.lat && 
                marker.getLatLng().lng === place.lng
            ).openPopup();
        });
        
        // Add to the directory container
        directoryContainer.appendChild(placeElement);
    });
}

// Filter the directory based on the selected filter
function filterDirectory(filter) {
    renderDirectory(filter);
}

// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap); 