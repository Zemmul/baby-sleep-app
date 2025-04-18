import { fetchPointsByType } from './supabase-client.js';

async function checkToilets() {
    try {
        console.log('Checking for toilet records...');
        const toilets = await fetchPointsByType('toilet');
        console.log('Found toilet records:', toilets);
        console.log('Total toilet records:', toilets.length);
        
        if (toilets.length === 0) {
            console.log('No toilet records found in the database.');
        } else {
            console.log('Toilet records found:');
            toilets.forEach(toilet => {
                console.log(`- ${toilet.title} (${toilet.latitude}, ${toilet.longitude})`);
            });
        }
    } catch (error) {
        console.error('Error checking toilet records:', error);
    }
}

// Run the check
checkToilets(); 