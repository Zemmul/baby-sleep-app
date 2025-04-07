// Sound data
const soundData = [
    {
        id: 'rain',
        title: 'Rain',
        description: 'Gentle rainfall',
        image: 'assets/images/rain.jpg',
        audio: 'assets/audio/rain.aac'
    },
    {
        id: 'ocean',
        title: 'Ocean',
        description: 'Calm ocean waves',
        image: 'assets/images/ocean.jpg',
        audio: 'assets/audio/ocean.aac'
    },
    {
        id: 'fireplace',
        title: 'Fireplace',
        description: 'Crackling fireplace',
        image: 'assets/images/fireplace.jpg',
        audio: 'assets/audio/fireplace.aac'
    },
    {
        id: 'birds',
        title: 'Birds',
        description: 'Morning birdsong',
        image: 'assets/images/birds.jpg',
        audio: 'assets/audio/birds.aac'
    },
    {
        id: 'heartbeat',
        title: 'Heartbeat',
        description: 'Soothing heartbeat',
        image: 'assets/images/heartbeart.jpg',
        audio: 'assets/audio/heartbeat.aac'
    },
    {
        id: 'stream',
        title: 'Stream',
        description: 'Flowing stream',
        image: 'assets/images/stream.jpg',
        audio: 'assets/audio/stream.aac'
    },
    {
        id: 'vacuum',
        title: 'Vacuum',
        description: 'Vacuum cleaner',
        image: 'assets/images/vacuum.jpg',
        audio: 'assets/audio/vacuum.aac'
    },
    {
        id: 'whitenoise',
        title: 'White Noise',
        description: 'White noise',
        image: 'assets/images/whitenoise.jpg',
        audio: 'assets/audio/whitenoise.aac'
    },
    {
        id: 'hair-dryer',
        title: 'Hair Dryer',
        description: 'Hair dryer sound',
        image: 'assets/images/hair-dryer.jpg',
        audio: 'assets/audio/hair-dryer.aac'
    },
    {
        id: 'shush',
        title: 'Shush',
        description: 'Shushing sound',
        image: 'assets/images/shush.jpg',
        audio: 'assets/audio/shush.aac'
    },
    {
        id: 'coffee-shop',
        title: 'Coffee Shop',
        description: 'Coffee shop ambiance',
        image: 'assets/images/coffee-shop.jpg',
        audio: 'assets/audio/coffee-shop.aac'
    }
];

// DOM elements
let soundGrid;
let volumeSlider;
let volumeToggle;
let currentAudio = null;
let isPlaying = false;
let prevButton;
let nextButton;
let fadeInterval = null;
let lastVolume = 0.5; // Store the last volume level

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    soundGrid = document.getElementById('soundGrid');
    volumeSlider = document.getElementById('volumeSlider');
    volumeToggle = document.getElementById('volumeToggle');
    prevButton = document.querySelector('.carousel-nav.prev');
    nextButton = document.querySelector('.carousel-nav.next');
    
    // Initialize sound cards
    initializeSoundCards();
    
    // Set up volume control
    setupVolumeControl();
    
    // Set up carousel navigation
    setupCarouselNavigation();
    
    // Set initial volume
    lastVolume = volumeSlider.value / 100;
});

// Initialize sound cards
function initializeSoundCards() {
    // Clear existing content
    const existingCards = soundGrid.querySelectorAll('.sound-card');
    existingCards.forEach(card => card.remove());
    
    // Add data-index attribute to each card
    soundData.forEach((sound, index) => {
        const card = createSoundCard(sound, index);
        soundGrid.appendChild(card);
    });
}

// Create a sound card
function createSoundCard(sound, index) {
    const card = document.createElement('div');
    card.className = 'sound-card';
    card.setAttribute('data-index', index);
    
    // Create card content
    card.innerHTML = `
        <img src="${sound.image}" alt="${sound.title}">
        <div class="sound-card-content">
            <h3>${sound.title}</h3>
            <p>${sound.description}</p>
        </div>
        <div class="play-button">
            <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
            </svg>
        </div>
    `;
    
    // Add click event to the play button
    const playButton = card.querySelector('.play-button');
    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePlayButtonClick(index);
    });
    
    return card;
}

// Handle play button click
function handlePlayButtonClick(index) {
    // Toggle play/pause
    if (isPlaying) {
        pauseSound();
    } else {
        playSound(index);
    }
}

// Play a sound
function playSound(index) {
    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    
    // Create a new audio instance
    currentAudio = new Audio(soundData[index].audio);
    currentAudio.loop = true; // Enable looping
    currentAudio.volume = 0; // Start at volume 0 for fade in
    
    // Play the audio
    currentAudio.play().then(() => {
        isPlaying = true;
        
        // Update UI
        const cards = document.querySelectorAll('.sound-card');
        const activeCard = cards[index];
        if (activeCard) {
            activeCard.classList.add('playing');
            
            // Update play button to pause
            const playButton = activeCard.querySelector('.play-button svg');
            playButton.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        }

        // Fade in the audio
        const targetVolume = volumeSlider.value / 100;
        let currentVolume = 0;
        const fadeStep = 0.05;
        
        // Clear any existing fade interval
        if (fadeInterval) {
            clearInterval(fadeInterval);
        }
        
        fadeInterval = setInterval(() => {
            if (currentVolume < targetVolume) {
                currentVolume = Math.min(currentVolume + fadeStep, targetVolume);
                currentAudio.volume = currentVolume;
            } else {
                clearInterval(fadeInterval);
            }
        }, 50);
        
    }).catch(error => {
        console.error('Error playing audio:', error);
    });
}

// Pause the current sound
function pauseSound() {
    if (currentAudio) {
        // Fade out before pausing
        const fadeStep = 0.05;
        let currentVolume = currentAudio.volume;
        
        // Clear any existing fade interval
        if (fadeInterval) {
            clearInterval(fadeInterval);
        }
        
        fadeInterval = setInterval(() => {
            if (currentVolume > 0) {
                currentVolume = Math.max(currentVolume - fadeStep, 0);
                currentAudio.volume = currentVolume;
            } else {
                clearInterval(fadeInterval);
                currentAudio.pause();
                isPlaying = false;
                
                // Update UI
                const cards = document.querySelectorAll('.sound-card');
                cards.forEach(card => {
                    card.classList.remove('playing');
                    
                    // Update play button to play
                    const playButton = card.querySelector('.play-button svg');
                    playButton.innerHTML = '<path d="M8 5v14l11-7z"/>';
                });
            }
        }, 50);
    }
}

// Set up volume control
function setupVolumeControl() {
    // Set initial volume
    if (currentAudio) {
        currentAudio.volume = volumeSlider.value / 100;
    }
    
    // Add event listener for volume changes from slider
    volumeSlider.addEventListener('input', () => {
        updateVolume(volumeSlider.value / 100);
    });
    
    // Add event listener for volume toggle
    volumeToggle.addEventListener('click', () => {
        if (currentAudio) {
            if (currentAudio.volume > 0) {
                // Store current volume and mute
                lastVolume = currentAudio.volume;
                updateVolume(0);
                
                // Update volume icon
                volumeToggle.innerHTML = `
                    <svg class="volume-icon" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                `;
            } else {
                // Restore previous volume
                updateVolume(lastVolume);
                
                // Update volume icon
                volumeToggle.innerHTML = `
                    <svg class="volume-icon" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                `;
            }
        }
    });
    
    // Listen for device volume changes
    document.addEventListener('volumechange', () => {
        if (currentAudio) {
            // Get the current device volume
            const deviceVolume = currentAudio.volume;
            
            // Update our UI and stored volume
            updateVolume(deviceVolume);
        }
    });
}

// Update volume across all components
function updateVolume(volume) {
    // Store the volume
    lastVolume = volume;
    
    // Update the slider
    volumeSlider.value = volume * 100;
    
    // Update the audio volume
    if (currentAudio) {
        currentAudio.volume = volume;
    }
    
    // Update the volume icon
    if (volume === 0) {
        volumeToggle.innerHTML = `
            <svg class="volume-icon" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
        `;
    } else {
        volumeToggle.innerHTML = `
            <svg class="volume-icon" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
        `;
    }
}

// Set up carousel navigation
function setupCarouselNavigation() {
    // Add event listener for previous button
    prevButton.addEventListener('click', () => {
        scrollCarousel('prev');
    });
    
    // Add event listener for next button
    nextButton.addEventListener('click', () => {
        scrollCarousel('next');
    });
}

// Scroll the carousel
function scrollCarousel(direction) {
    const cardWidth = document.querySelector('.sound-card').offsetWidth;
    const gap = 20; // Gap between cards
    const scrollAmount = cardWidth + gap;
    
    if (direction === 'prev') {
        soundGrid.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        soundGrid.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
} 