const image = document.querySelector('img')
const title = document.getElementById('title')
const artist = document.getElementById('artist')
const music = document.querySelector('audio')
const progressContainer = document.getElementById('progress-container')
const progress = document.getElementById('progress')
const currentTimeEl = document.querySelector('.current-time')
const durationEl = document.querySelector('.duration')
const prevBtn = document.getElementById('prev')
const playBtn = document.getElementById('play')
const nextBtn = document.getElementById('next')

// Music
const songs = [
    {
        name: 'music-1',
        displayName: 'Suno AI One',
        artist: 'Suno AI'
    },
    {
        name: 'music-2',
        displayName: 'Suno AI Two',
        artist: 'Suno AI'
    },
    {
        name: 'music-3',
        displayName: 'Hawai Adda',
        artist: 'Something'
    },
    {
        name: 'music-4',
        displayName: 'Dracula',
        artist: 'Jennie'
    },
]

// Check if playing
let isPlaying = false;

// Play
function playSong(){
    isPlaying = true
    playBtn.classList.replace('fa-play', 'fa-pause')
    playBtn.setAttribute('title', 'Pause')
    music.play()
}

// Pause
function pauseSong(){
    isPlaying = false
    playBtn.classList.replace('fa-pause', 'fa-play')
    playBtn.setAttribute('title', 'Play')
    music.pause()
}

// Play or Pause Event Listener
playBtn.addEventListener('click', () => isPlaying ? pauseSong(): playSong())


// Update DOM
function loadSong(song){
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    music.src = `music/${song.name}.mp3`
    image.src = `img/${song.name}.jpg`
}

// current song
let songIndex = 0

// Previous Song
function prevSong(){
    songIndex--;
    if(songIndex < 0) {
        songIndex = songs.length - 1;
    }
    loadSong(songs[songIndex])
    playSong()
}

// Next Song
function nextSong(){
    songIndex++;
    if(songIndex > songs.length - 1) {
        songIndex = 0;
    }
    loadSong(songs[songIndex])
    playSong()
}

// On load - select first song
loadSong(songs[songIndex])

// Update Progress Bar & Time
function updateProgressBar(event){
    if(isPlaying){
        const {duration, currentTime} = event.srcElement
        // Update progress bar width
        const progressPercent = (currentTime / duration) * 100
        progress.style.width = `${progressPercent}%`
        // Calculate display for duration
        const durationMinutes = Math.floor(duration/60)
        let durationSeconds = Math.floor(duration % 60)
        if(durationSeconds < 10) {
            durationSeconds = `0${durationSeconds}`
        }
        // Delay switching duration Element to avoid NaN
        if(durationSeconds) {
            durationEl.textContent = `${durationMinutes}:${durationSeconds}`
        }
          // Calculate display for duration
        const currentMinutes = Math.floor(currentTime/60)
        let currentSeconds = Math.floor(currentTime % 60)
        if(currentSeconds < 10) {
            currentSeconds = `0${currentSeconds}`
        }
        currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`
   
    }
}

// Set Progress Bar
function setProgressBar(event){
    const width = this.clientWidth;
    const clickX = event.offsetX
    const {duration} = music;
    music.currentTime= (clickX / width) * duration;

}

// Event Listeners
prevBtn.addEventListener('click', prevSong)
nextBtn.addEventListener('click', nextSong)
music.addEventListener('ended', nextSong)
music.addEventListener('timeupdate', updateProgressBar)
progressContainer.addEventListener('click', setProgressBar)