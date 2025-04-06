// Sound data
const sounds = [
    {
        title: "Rain",
        description: "Gentle rainfall to soothe your baby",
        cover: "assets/images/rain.jpg",
        audio: "assets/audio/rain.mp3"
    },
    {
        title: "Ocean",
        description: "Calming ocean waves for peaceful sleep",
        cover: "assets/images/ocean.jpg",
        audio: "assets/audio/ocean.mp3"
    },
    {
        title: "White Noise",
        description: "Consistent white noise to block distractions",
        cover: "assets/images/white-noise.jpg",
        audio: "assets/audio/white-noise.mp3"
    },
    {
        title: "Coffee Shop",
        description: "Ambient coffee shop sounds for a cozy atmosphere",
        cover: "assets/images/coffee-shop.jpg",
        audio: "assets/audio/coffee-shop.mp3"
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
});

// Initialize sound cards
function initializeSoundCards() {
    // Clear existing content
    const existingCards = soundGrid.querySelectorAll('.sound-card');
    existingCards.forEach(card => card.remove());
    
    // Add data-index attribute to each card
    sounds.forEach((sound, index) => {
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
        <img src="${sound.cover}" alt="${sound.title}">
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
    currentAudio = new Audio(sounds[index].audio);
    currentAudio.volume = volumeSlider.value / 100; // Convert to 0-1 range
    
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
    }).catch(error => {
        console.error('Error playing audio:', error);
    });
}

// Pause the current sound
function pauseSound() {
    if (currentAudio) {
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
}

// Set up volume control
function setupVolumeControl() {
    // Set initial volume
    if (currentAudio) {
        currentAudio.volume = volumeSlider.value / 100; // Convert to 0-1 range
    }
    
    // Add event listener for volume changes
    volumeSlider.addEventListener('input', () => {
        if (currentAudio) {
            currentAudio.volume = volumeSlider.value / 100; // Convert to 0-1 range
        }
    });
    
    // Add event listener for volume toggle
    volumeToggle.addEventListener('click', () => {
        if (currentAudio) {
            if (currentAudio.volume > 0) {
                // Store current volume and mute
                currentAudio.dataset.previousVolume = currentAudio.volume;
                currentAudio.volume = 0;
                volumeSlider.value = 0;
                
                // Update volume icon
                volumeToggle.innerHTML = `
                    <svg class="volume-icon" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                `;
            } else {
                // Restore previous volume
                const previousVolume = parseFloat(currentAudio.dataset.previousVolume) || 0.5;
                currentAudio.volume = previousVolume;
                volumeSlider.value = previousVolume * 100; // Convert to 0-100 range
                
                // Update volume icon
                volumeToggle.innerHTML = `
                    <svg class="volume-icon" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                `;
            }
        }
    });
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