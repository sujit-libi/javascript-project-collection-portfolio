const videoElement = document.getElementById('video')
const button = document.getElementById('button')

// Prompt to select media stream, pass to video element, then play
async function selectMediaStream(){
   try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia()
        videoElement.srcObject = mediaStream
        videoElement.onloadedmetadata = () => {
            videoElement.play()
        }
   } catch (error) {
        // Catch Error 
        console.error("Something went wrong!!")
   } 
}

button.addEventListener('click', async () => {
    // Disable Button
    button.disabled = true;
    try {
        // Start Picture in Picture
        await videoElement.requestPictureInPicture();
    } catch (error) {
        console.error("Failed to enter Picture-in-Picture:", error);
    } finally {
        // Reset Button
        button.disabled = false;
    }
})

// On Load
selectMediaStream()