/**
 * National Public Toilet Map Data Integration
 * 
 * This file contains functions to work with the National Public Toilet Map data
 * that has been converted from CSV to JSON format.
 */

// Import the toilet data directly
let toiletDataModule = null;

// Try to load the toilet data as a module
try {
    // This will work if the JSON is properly formatted as a module
    toiletDataModule = await import('./toilet-data.js');
    console.log('Toilet data loaded as module');
} catch (moduleError) {
    console.warn('Could not load toilet data as module:', moduleError);
}

class ToiletMapAPI {
    constructor() {
        this.toiletData = null;
        console.log('ToiletMapAPI initialized');
        this.loadToiletData();
    }

    /**
     * Load toilet data from the JSON file
     */
    async loadToiletData() {
        console.log('Loading toilet data...');
        try {
            // First check if we already loaded the data as a module
            if (toiletDataModule && toiletDataModule.default) {
                console.log('Using toilet data loaded as module');
                const data = toiletDataModule.default;
                this.processToiletData(data);
                return this.toiletData;
            }
            
            // Try to load from the JSON file as a fallback
            const response = await fetch('toilet-data.json');
            console.log('Fetch response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to load toilet data: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Toilet data loaded successfully');
            this.processToiletData(data);
            return this.toiletData;
        } catch (error) {
            console.error('Error loading toilet data:', error);
            console.log('Falling back to sample data for development');
            
            // For development, use sample data
            this.toiletData = this.getSampleToiletData({ lat: -37.8136, lng: 144.9631 });
            console.log(`Using ${this.toiletData.length} sample toilet records for development`);
            
            return this.toiletData;
        }
    }
    
    /**
     * Process the loaded toilet data
     * @param {Array} data - The raw toilet data
     */
    processToiletData(data) {
        console.log(`Total records loaded: ${data.length}`);
        
        // Check for valid coordinates
        const validRecords = data.filter(item => 
            item.latitude !== null && 
            item.longitude !== null && 
            !isNaN(item.latitude) && 
            !isNaN(item.longitude)
        );
        
        console.log(`Found ${validRecords.length} records with valid coordinates out of ${data.length} total records`);
        
        // Log a sample of the data to verify structure
        if (validRecords.length > 0) {
            console.log('Sample record:', validRecords[0]);
        }
        
        this.toiletData = validRecords;
        console.log(`Loaded ${this.toiletData.length} toilet records`);
    }

    /**
     * Calculate distance between two points using the Haversine formula
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @returns {number} - Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
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

    /**
     * Search for toilets near a specific location
     * @param {Object} location - The location to search from
     * @param {number} location.lat - Latitude
     * @param {number} location.lng - Longitude
     * @param {number} radius - Search radius in kilometers (default: 5)
     * @returns {Promise<Array>} - Promise that resolves to an array of toilet data
     */
    async searchToilets(location, radius = 5) {
        console.log(`Searching for toilets near [${location.lat}, ${location.lng}] within ${radius}km radius`);
        try {
            // Wait for toilet data to be loaded if it hasn't been already
            if (!this.toiletData) {
                console.log('Toilet data not loaded yet, loading now...');
                await this.loadToiletData();
            }

            if (!this.toiletData || this.toiletData.length === 0) {
                console.log('No toilet data available, returning sample data');
                return this.getSampleToiletData(location);
            }

            console.log(`Filtering ${this.toiletData.length} toilets by distance`);
            
            // Filter toilets within the radius
            const nearbyToilets = this.toiletData.filter(toilet => {
                const distance = this.calculateDistance(
                    location.lat,
                    location.lng,
                    toilet.latitude,
                    toilet.longitude
                );
                return distance <= radius;
            });

            console.log(`Found ${nearbyToilets.length} toilets within ${radius}km radius`);

            // Sort by distance
            nearbyToilets.sort((a, b) => {
                const distanceA = this.calculateDistance(
                    location.lat,
                    location.lng,
                    a.latitude,
                    a.longitude
                );
                const distanceB = this.calculateDistance(
                    location.lat,
                    location.lng,
                    b.latitude,
                    b.longitude
                );
                return distanceA - distanceB;
            });

            // Add distance to each toilet
            nearbyToilets.forEach(toilet => {
                toilet.distance = this.calculateDistance(
                    location.lat,
                    location.lng,
                    toilet.latitude,
                    toilet.longitude
                );
            });

            if (nearbyToilets.length > 0) {
                console.log('First nearby toilet:', nearbyToilets[0]);
                console.log(`Closest toilet is ${nearbyToilets[0].distance.toFixed(2)}km away`);
            }

            return nearbyToilets;
        } catch (error) {
            console.error('Error searching toilets:', error);
            return this.getSampleToiletData(location);
        }
    }

    /**
     * Get sample toilet data as fallback
     * @param {Object} location - The location to generate sample data around
     * @returns {Array} - Sample toilet data
     */
    getSampleToiletData(location) {
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
                const distance = this.calculateDistance(location.lat, location.lng, lat, lng);
                
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
        
        console.log(`Generated ${sampleToilets.length} sample toilets around [${location.lat}, ${location.lng}]`);
        return sampleToilets;
    }
}

// Create a global instance of the API
window.ToiletMapAPI = new ToiletMapAPI(); 