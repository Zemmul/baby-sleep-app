// Sound data
const sounds = [
    {
        title: 'Rain',
        description: 'Gentle rain sounds to soothe your baby',
        cover: 'assets/images/rain.jpg',
        audio: 'assets/audio/rain.mp3'
    },
    {
        title: 'Ocean',
        description: 'Calming ocean waves for peaceful sleep',
        cover: 'assets/images/ocean.jpg',
        audio: 'assets/audio/ocean.mp3'
    },
    {
        title: 'White Noise',
        description: 'Soft white noise to block out distractions',
        cover: 'assets/images/white-noise.jpg',
        audio: 'assets/audio/white-noise.mp3'
    },
    {
        title: 'Coffee Shop',
        description: 'Ambient cafe sounds for a cozy atmosphere',
        cover: 'assets/images/coffee-shop.jpg',
        audio: 'assets/audio/coffee-shop.mp3'
    }
];

// DOM Elements
let soundGrid;
let volumeSlider;
let volumeToggle;
let currentAudio = null;
let activeCard = null;
let previousVolume = 50;
let isMuted = false;

// Initialize the app
function init() {
    soundGrid = document.getElementById('soundGrid');
    volumeSlider = document.getElementById('volumeSlider');
    volumeToggle = document.getElementById('volumeToggle');
    
    // Create sound cards
    createSoundCards();
    
    // Set up volume control
    volumeSlider.addEventListener('input', (e) => {
        if (currentAudio) {
            currentAudio.volume = e.target.value / 100;
            previousVolume = e.target.value;
            
            // Update volume icon
            updateVolumeIcon();
        }
    });
    
    // Set up volume toggle
    volumeToggle.addEventListener('click', toggleMute);
}

// Create sound cards
function createSoundCards() {
    sounds.forEach((sound, index) => {
        const card = document.createElement('div');
        card.className = 'sound-card';
        card.setAttribute('data-index', index);
        
        card.innerHTML = `
            <img src="${sound.cover}" alt="${sound.title}" class="sound-card-image">
            <div class="sound-card-content">
                <h3>${sound.title}</h3>
                <p>${sound.description}</p>
            </div>
            <div class="play-button">
                <svg viewBox="0 0 24 24">
                    <path class="play-icon" d="M8 5v14l11-7z"/>
                </svg>
            </div>
        `;
        
        // Add click handlers
        card.addEventListener('click', () => handleCardClick(card, sound));
        
        // Add play button click handler
        const playButton = card.querySelector('.play-button');
        playButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePlayButtonClick(card, sound);
        });
        
        soundGrid.appendChild(card);
    });
}

// Handle card click
function handleCardClick(card, sound) {
    // Remove active class from previous card
    if (activeCard) {
        activeCard.classList.remove('active');
    }
    
    // Add active class to clicked card
    card.classList.add('active');
    activeCard = card;
}

// Handle play button click
function handlePlayButtonClick(card, sound) {
    // Only allow play/pause on active card
    if (!card.classList.contains('active')) {
        return;
    }
    
    const playIcon = card.querySelector('.play-icon');
    
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    currentAudio = new Audio(sound.audio);
    currentAudio.volume = isMuted ? 0 : volumeSlider.value / 100;
    
    if (card.classList.contains('playing')) {
        // Pause
        card.classList.remove('playing');
        currentAudio.pause();
        playIcon.setAttribute('d', 'M8 5v14l11-7z'); // Play icon
    } else {
        // Play
        card.classList.add('playing');
        currentAudio.play();
        playIcon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'); // Pause icon
        
        currentAudio.addEventListener('ended', () => {
            card.classList.remove('playing');
            playIcon.setAttribute('d', 'M8 5v14l11-7z'); // Reset to play icon
        });
    }
}

// Toggle mute
function toggleMute() {
    isMuted = !isMuted;
    
    if (currentAudio) {
        currentAudio.volume = isMuted ? 0 : previousVolume / 100;
    }
    
    // Update volume slider
    volumeSlider.value = isMuted ? 0 : previousVolume;
    
    // Update volume icon
    updateVolumeIcon();
}

// Update volume icon based on volume level
function updateVolumeIcon() {
    const volumeIcon = volumeToggle.querySelector('.volume-icon path');
    const volume = volumeSlider.value;
    
    if (volume === 0 || isMuted) {
        // Muted icon
        volumeIcon.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z');
    } else if (volume < 50) {
        // Low volume icon
        volumeIcon.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z');
    } else {
        // High volume icon
        volumeIcon.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 