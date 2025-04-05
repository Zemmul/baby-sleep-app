// Sound configuration
const sounds = [
    {
        id: 'white-noise',
        title: 'White Noise',
        category: 'Ambient',
        cover: 'assets/images/white-noise.jpg',
        audio: 'assets/audio/white-noise.mp3'
    },
    {
        id: 'rain',
        title: 'Gentle Rain',
        category: 'Nature',
        cover: 'assets/images/rain.jpg',
        audio: 'assets/audio/rain.mp3'
    },
    {
        id: 'coffee-shop',
        title: 'Coffee Shop',
        category: 'Ambient',
        cover: 'assets/images/coffee-shop.jpg',
        audio: 'assets/audio/coffee-shop.mp3'
    },
    {
        id: 'ocean',
        title: 'Ocean Waves',
        category: 'Nature',
        cover: 'assets/images/ocean.jpg',
        audio: 'assets/audio/ocean.mp3'
    }
];

// Audio player state
let currentAudio = null;
let isPlaying = false;
let currentSoundIndex = 0;
let isMuted = false;
let previousVolume = 50;

// DOM Elements
const soundGrid = document.getElementById('soundGrid');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevTrackBtn = document.getElementById('prevTrackBtn');
const nextTrackBtn = document.getElementById('nextTrackBtn');
const volumeControl = document.getElementById('volume');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.querySelector('.volume-icon');
const currentCover = document.getElementById('currentCover');
const miniCurrentTrack = document.getElementById('miniCurrentTrack');
const miniCurrentCategory = document.getElementById('miniCurrentCategory');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Initialize the app
function initApp() {
    loadSounds();
    setupEventListeners();
    updateCarouselButtons();
    updateVolumeIcon();
}

// Load sounds into the grid
function loadSounds() {
    soundGrid.innerHTML = sounds.map(sound => `
        <div class="sound-card" data-sound-id="${sound.id}">
            <img src="${sound.cover}" alt="${sound.title}" loading="lazy">
            <h3>${sound.title}</h3>
            <p>${sound.category}</p>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Sound card click
    soundGrid.addEventListener('click', (e) => {
        const soundCard = e.target.closest('.sound-card');
        if (soundCard) {
            const soundId = soundCard.dataset.soundId;
            const index = sounds.findIndex(s => s.id === soundId);
            if (index !== -1) {
                currentSoundIndex = index;
                playSound(soundId);
            }
        }
    });

    // Carousel navigation
    prevBtn.addEventListener('click', () => {
        const cardWidth = soundGrid.querySelector('.sound-card').offsetWidth;
        const gap = 20; // Same as CSS gap
        
        // Check if we're at the beginning
        if (soundGrid.scrollLeft <= 0) {
            // If at the beginning, scroll to the end
            soundGrid.scrollTo({
                left: soundGrid.scrollWidth - soundGrid.clientWidth,
                behavior: 'smooth'
            });
        } else {
            // Otherwise, scroll left by one card
            soundGrid.scrollBy({
                left: -(cardWidth + gap),
                behavior: 'smooth'
            });
        }
    });

    nextBtn.addEventListener('click', () => {
        const cardWidth = soundGrid.querySelector('.sound-card').offsetWidth;
        const gap = 20; // Same as CSS gap
        
        // Check if we're at the end
        if (soundGrid.scrollLeft + soundGrid.clientWidth >= soundGrid.scrollWidth - 10) {
            // If at the end, scroll to the beginning
            soundGrid.scrollTo({
                left: 0,
                behavior: 'smooth'
            });
        } else {
            // Otherwise, scroll right by one card
            soundGrid.scrollBy({
                left: cardWidth + gap,
                behavior: 'smooth'
            });
        }
    });

    // Play/Pause button
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Previous/Next track buttons
    prevTrackBtn.addEventListener('click', () => {
        if (currentSoundIndex > 0) {
            currentSoundIndex--;
        } else {
            // Loop to the last track
            currentSoundIndex = sounds.length - 1;
        }
        playSound(sounds[currentSoundIndex].id);
        scrollToCurrentCard();
    });

    nextTrackBtn.addEventListener('click', () => {
        if (currentSoundIndex < sounds.length - 1) {
            currentSoundIndex++;
        } else {
            // Loop to the first track
            currentSoundIndex = 0;
        }
        playSound(sounds[currentSoundIndex].id);
        scrollToCurrentCard();
    });

    // Volume control
    volumeControl.addEventListener('input', (e) => {
        if (currentAudio) {
            const volume = e.target.value / 100;
            currentAudio.volume = volume;
            previousVolume = e.target.value;
            isMuted = volume === 0;
            updateVolumeIcon();
        }
    });

    // Volume button
    volumeBtn.addEventListener('click', toggleMute);

    // Handle scroll end to update carousel buttons
    soundGrid.addEventListener('scroll', () => {
        updateCarouselButtons();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        updateCarouselButtons();
    });
}

// Update carousel navigation buttons visibility
function updateCarouselButtons() {
    // We don't need to disable the buttons anymore since we're looping
    prevBtn.style.opacity = '1';
    prevBtn.style.pointerEvents = 'auto';
    nextBtn.style.opacity = '1';
    nextBtn.style.pointerEvents = 'auto';
}

// Scroll to the current card
function scrollToCurrentCard() {
    const cardWidth = soundGrid.querySelector('.sound-card').offsetWidth;
    const gap = 20; // Same as CSS gap
    soundGrid.scrollTo({
        left: currentSoundIndex * (cardWidth + gap),
        behavior: 'smooth'
    });
}

// Toggle mute
function toggleMute() {
    if (!currentAudio) return;

    isMuted = !isMuted;
    
    if (isMuted) {
        previousVolume = volumeControl.value;
        volumeControl.value = 0;
        currentAudio.volume = 0;
    } else {
        volumeControl.value = previousVolume;
        currentAudio.volume = previousVolume / 100;
    }
    
    updateVolumeIcon();
}

// Update volume icon based on volume level
function updateVolumeIcon() {
    const volume = volumeControl.value;
    
    if (volume === 0) {
        volumeIcon.textContent = '🔇';
    } else if (volume < 50) {
        volumeIcon.textContent = '🔉';
    } else {
        volumeIcon.textContent = '🔊';
    }
}

// Play a sound
function playSound(soundId) {
    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    // Create and play new audio
    currentAudio = new Audio(sound.audio);
    currentAudio.loop = true;
    currentAudio.volume = volumeControl.value / 100;
    currentAudio.play();

    // Update UI
    currentCover.src = sound.cover;
    miniCurrentTrack.textContent = sound.title;
    miniCurrentCategory.textContent = sound.category;
    updatePlayPauseButton(true);
    isPlaying = true;
}

// Toggle play/pause
function togglePlayPause() {
    if (!currentAudio) return;

    if (isPlaying) {
        currentAudio.pause();
        updatePlayPauseButton(false);
    } else {
        currentAudio.play();
        updatePlayPauseButton(true);
    }
    isPlaying = !isPlaying;
}

// Update play/pause button UI
function updatePlayPauseButton(playing) {
    const playIcon = playPauseBtn.querySelector('.play-icon');
    playIcon.textContent = playing ? '⏸' : '▶';
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 