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

// DOM Elements
const soundGrid = document.getElementById('soundGrid');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevTrackBtn = document.getElementById('prevTrackBtn');
const nextTrackBtn = document.getElementById('nextTrackBtn');
const volumeControl = document.getElementById('volume');
const currentCover = document.getElementById('currentCover');
const currentTrack = document.getElementById('currentTrack');
const currentCategory = document.getElementById('currentCategory');
const miniCurrentTrack = document.getElementById('miniCurrentTrack');
const miniCurrentCategory = document.getElementById('miniCurrentCategory');
const coverCarousel = document.getElementById('coverCarousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// Initialize the app
function initApp() {
    loadSounds();
    setupCarousel();
    setupEventListeners();
}

// Load sounds into the grid and carousel
function loadSounds() {
    // Load sound grid
    soundGrid.innerHTML = sounds.map(sound => `
        <div class="sound-card" data-sound-id="${sound.id}">
            <img src="${sound.cover}" alt="${sound.title}" loading="lazy">
            <h3>${sound.title}</h3>
            <p>${sound.category}</p>
        </div>
    `).join('');

    // Load carousel
    coverCarousel.innerHTML = sounds.map(sound => `
        <img src="${sound.cover}" alt="${sound.title}" data-sound-id="${sound.id}">
    `).join('');
}

// Setup carousel
function setupCarousel() {
    const carouselWidth = coverCarousel.offsetWidth;
    coverCarousel.style.width = `${carouselWidth * sounds.length}px`;
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
                updateCarousel();
            }
        }
    });

    // Carousel navigation
    prevBtn.addEventListener('click', () => {
        if (currentSoundIndex > 0) {
            currentSoundIndex--;
            updateCarousel();
            playSound(sounds[currentSoundIndex].id);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentSoundIndex < sounds.length - 1) {
            currentSoundIndex++;
            updateCarousel();
            playSound(sounds[currentSoundIndex].id);
        }
    });

    // Play/Pause button
    playPauseBtn.addEventListener('click', togglePlayPause);

    // Previous/Next track buttons
    prevTrackBtn.addEventListener('click', () => {
        if (currentSoundIndex > 0) {
            currentSoundIndex--;
            playSound(sounds[currentSoundIndex].id);
            updateCarousel();
        }
    });

    nextTrackBtn.addEventListener('click', () => {
        if (currentSoundIndex < sounds.length - 1) {
            currentSoundIndex++;
            playSound(sounds[currentSoundIndex].id);
            updateCarousel();
        }
    });

    // Volume control
    volumeControl.addEventListener('input', (e) => {
        if (currentAudio) {
            currentAudio.volume = e.target.value / 100;
        }
    });

    // Handle window resize
    window.addEventListener('resize', setupCarousel);
}

// Update carousel position
function updateCarousel() {
    const carouselWidth = coverCarousel.offsetWidth / sounds.length;
    coverCarousel.style.transform = `translateX(-${currentSoundIndex * carouselWidth}px)`;
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
    currentTrack.textContent = sound.title;
    currentCategory.textContent = sound.category;
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