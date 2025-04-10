// YouTube API variables
let player;
let currentPlaylistId = 'PLmT98yAiEP6lEfUrJxyOiFgkm0socMUrw'; // Default playlist
let playlistVideos = [];
let currentVideoIndex = 0;

// DOM elements
const playlistSelect = document.getElementById('playlist-select');
const playlistContainer = document.getElementById('playlist');
const videoTitleElement = document.getElementById('video-title');
const videoDescriptionElement = document.getElementById('video-description');

// Initialize YouTube API
function onYouTubeIframeAPIReady() {
    console.log('YouTube IFrame API is ready');
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'rel': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

// Player ready event
function onPlayerReady(event) {
    console.log('Player is ready');
    // Load the default playlist
    loadPlaylist(currentPlaylistId);
    
    // Add event listener for playlist selection
    playlistSelect.addEventListener('change', function() {
        currentPlaylistId = this.value;
        loadPlaylist(currentPlaylistId);
    });
}

// Player error event
function onPlayerError(event) {
    console.error('Player error:', event.data);
    playlistContainer.innerHTML = '<div class="error">Error loading video player. Please try refreshing the page.</div>';
}

// Player state change event
function onPlayerStateChange(event) {
    console.log('Player state changed:', event.data);
    // When video ends, play the next video
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

// Load playlist videos
function loadPlaylist(playlistId) {
    console.log('Loading playlist:', playlistId);
    // Show loading state
    playlistContainer.innerHTML = '<div class="loading">Loading videos...</div>';
    
    // Fetch playlist data from YouTube API
    fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=AIzaSyDwliVOb7jaCkLwN8l27Gjd3La-WMmnM18`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('YouTube API response:', data);
            
            if (data.items && data.items.length > 0) {
                playlistVideos = data.items;
                renderPlaylist();
                
                // Play the first video
                if (playlistVideos.length > 0) {
                    playVideo(0);
                }
            } else {
                throw new Error('No videos found in playlist');
            }
        })
        .catch(error => {
            console.error('Error loading playlist:', error);
            playlistContainer.innerHTML = '<div class="error">Error loading videos. Please try again later.</div>';
            
            // Fallback to sample videos if API fails
            playlistVideos = [
                {
                    snippet: {
                        resourceId: { videoId: '9wCnlO6sMfc' },
                        thumbnails: { high: { url: 'https://i.ytimg.com/vi/9wCnlO6sMfc/hqdefault.jpg' } },
                        title: 'Baby Lullaby - Soothing Sleep Music',
                        description: 'A gentle lullaby to help your baby sleep.'
                    }
                },
                {
                    snippet: {
                        resourceId: { videoId: '8UEvuUQErSs' },
                        thumbnails: { high: { url: 'https://i.ytimg.com/vi/8UEvuUQErSs/hqdefault.jpg' } },
                        title: 'Nursery Rhymes Collection',
                        description: 'Classic nursery rhymes for babies and toddlers.'
                    }
                }
            ];
            renderPlaylist();
        });
}

// Render playlist thumbnails
function renderPlaylist() {
    // Clear the container
    playlistContainer.innerHTML = '';
    
    if (!playlistVideos || playlistVideos.length === 0) {
        playlistContainer.innerHTML = '<div class="error">No videos available.</div>';
        return;
    }
    
    // Create a simple grid layout
    playlistContainer.style.display = 'grid';
    playlistContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    playlistContainer.style.gap = '20px';
    playlistContainer.style.padding = '0 20px 40px';
    
    playlistVideos.forEach((video, index) => {
        try {
            const videoId = video.snippet.resourceId.videoId;
            const thumbnail = video.snippet.thumbnails.high.url;
            const title = video.snippet.title;
            
            // Create a simple thumbnail element
            const videoElement = document.createElement('div');
            videoElement.className = 'video-thumbnail';
            videoElement.dataset.index = index;
            
            // Set the background image directly
            videoElement.style.backgroundImage = `url(${thumbnail})`;
            videoElement.style.backgroundSize = 'cover';
            videoElement.style.backgroundPosition = 'center';
            videoElement.style.aspectRatio = '16/9';
            videoElement.style.borderRadius = '12px';
            videoElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            videoElement.style.position = 'relative';
            videoElement.style.cursor = 'pointer';
            videoElement.style.overflow = 'hidden';
            
            // Add title overlay
            const titleOverlay = document.createElement('div');
            titleOverlay.className = 'video-title';
            titleOverlay.textContent = title;
            titleOverlay.style.position = 'absolute';
            titleOverlay.style.bottom = '0';
            titleOverlay.style.left = '0';
            titleOverlay.style.right = '0';
            titleOverlay.style.padding = '15px';
            titleOverlay.style.background = 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)';
            titleOverlay.style.color = 'white';
            titleOverlay.style.fontSize = '0.9rem';
            titleOverlay.style.lineHeight = '1.4';
            titleOverlay.style.fontWeight = '500';
            
            // Add play icon
            const playIcon = document.createElement('div');
            playIcon.className = 'play-icon';
            playIcon.innerHTML = `
                <svg viewBox="0 0 24 24" style="width: 30px; height: 30px; fill: white;">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            playIcon.style.position = 'absolute';
            playIcon.style.top = '50%';
            playIcon.style.left = '50%';
            playIcon.style.transform = 'translate(-50%, -50%)';
            playIcon.style.width = '60px';
            playIcon.style.height = '60px';
            playIcon.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            playIcon.style.borderRadius = '50%';
            playIcon.style.display = 'flex';
            playIcon.style.alignItems = 'center';
            playIcon.style.justifyContent = 'center';
            playIcon.style.opacity = '0';
            playIcon.style.transition = 'opacity 0.3s ease';
            
            // Add hover effect
            videoElement.addEventListener('mouseenter', () => {
                playIcon.style.opacity = '1';
            });
            
            videoElement.addEventListener('mouseleave', () => {
                playIcon.style.opacity = '0';
            });
            
            // Add click event
            videoElement.addEventListener('click', () => {
                playVideo(index);
            });
            
            // Append elements
            videoElement.appendChild(titleOverlay);
            videoElement.appendChild(playIcon);
            
            // Add to container
            playlistContainer.appendChild(videoElement);
        } catch (error) {
            console.error('Error rendering video thumbnail:', error, video);
        }
    });
}

// Play a specific video
function playVideo(index) {
    if (index >= 0 && index < playlistVideos.length) {
        currentVideoIndex = index;
        const videoId = playlistVideos[index].snippet.resourceId.videoId;
        const title = playlistVideos[index].snippet.title;
        const description = playlistVideos[index].snippet.description;
        
        // Update player
        player.loadVideoById(videoId);
        
        // Update video info
        videoTitleElement.textContent = title;
        videoDescriptionElement.textContent = description;
        
        // Highlight the current video in the playlist
        document.querySelectorAll('.video-thumbnail').forEach((el, i) => {
            if (i === index) {
                el.style.border = '3px solid var(--accent-color)';
            } else {
                el.style.border = 'none';
            }
        });
        
        // Scroll the active video into view
        const activeVideo = document.querySelector('.video-thumbnail[data-index="' + index + '"]');
        if (activeVideo) {
            activeVideo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Play the next video
function playNextVideo() {
    const nextIndex = (currentVideoIndex + 1) % playlistVideos.length;
    playVideo(nextIndex);
}

// Add loading and error styles
const style = document.createElement('style');
style.textContent = `
    .loading, .error {
        text-align: center;
        padding: 30px;
        font-size: 1.1rem;
        color: var(--text-color);
    }
    
    .error {
        color: #e74c3c;
    }
`;
document.head.appendChild(style);

// Note: You need to replace 'YOUR_API_KEY' with an actual YouTube Data API key
// To get an API key, go to https://console.developers.google.com/
// Create a project, enable the YouTube Data API v3, and create credentials 