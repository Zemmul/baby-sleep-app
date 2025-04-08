/**
 * Convert National Public Toilet Map CSV to JSON
 * 
 * This script converts the CSV file from the National Public Toilet Map
 * to a JSON format that can be used by the frontend application.
 * 
 * Usage:
 * 1. Download the CSV file from data.gov.au
 * 2. Place it in the same directory as this script
 * 3. Run: node convert-toilet-data.js
 */

const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

// Input and output file paths
const inputFile = path.join(__dirname, 'national-public-toilet-map.csv');
const outputFile = path.join(__dirname, 'toilet-data.json');

// Check if input file exists
if (!fs.existsSync(inputFile)) {
  console.error('Error: Input CSV file not found at', inputFile);
  process.exit(1);
}

try {
  // Read and parse CSV file
  const fileContent = fs.readFileSync(inputFile, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  // Transform data to match our application format
  const transformedData = records.map(record => {
    // Extract amenities from the record
    const amenities = [];
    if (record.BabyChange === 'True') amenities.push('Baby Change');
    if (record.Accessible === 'True') amenities.push('Wheelchair Accessible');
    if (record.KeyRequired === 'True') amenities.push('Key Required');
    if (record.BabyCareRoom === 'True') amenities.push('Baby Care Room');
    if (record.AdultChange === 'True') amenities.push('Adult Change');
    if (record.ChangingPlaces === 'True') amenities.push('Changing Places');

    // Generate tags based on amenities and facility type
    const tags = [...amenities];
    if (record.Female === 'True') tags.push('Female');
    if (record.Male === 'True') tags.push('Male');
    if (record.Unisex === 'True') tags.push('Unisex');
    if (record.AllGender === 'True') tags.push('All Gender');
    if (record.Accessible === 'True') tags.push('Accessible');

    // Create description
    const description = [
      record.FacilityType || 'Public Toilet',
      record.Address1,
      record.Town,
      record.State
    ].filter(Boolean).join(', ');

    return {
      id: record.FacilityID || `toilet-${Math.random().toString(36).substr(2, 9)}`,
      name: record.Name || 'Public Toilet',
      type: 'toilet',
      description,
      latitude: parseFloat(record.Latitude),
      longitude: parseFloat(record.Longitude),
      amenities,
      tags,
      rating: 0, // Default rating
      reviews: [] // Empty reviews array
    };
  }).filter(item => !isNaN(item.latitude) && !isNaN(item.longitude)); // Filter out records with invalid coordinates

  // Write transformed data to JSON file
  fs.writeFileSync(outputFile, JSON.stringify(transformedData, null, 2));
  console.log(`Successfully converted ${transformedData.length} toilet records to JSON`);
  console.log('Output file:', outputFile);

} catch (error) {
  console.error('Error converting CSV to JSON:', error);
  process.exit(1);
} 