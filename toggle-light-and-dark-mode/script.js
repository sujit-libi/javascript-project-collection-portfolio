const toggleSwitch = document.querySelector('input[type="checkbox"]')
const nav = document.getElementById('nav')
const toggleIcon = document.getElementById('toggle-icon')
const image1 = document.getElementById('image1')
const image2 = document.getElementById('image2')
const image3 = document.getElementById('image3')
const textBox = document.getElementById('text-box')

// Dark or Light Images
function imageMode(color){
     image1.src = `img/undraw_proud_coder_${color}.svg`;
    image2.src = `img/undraw_proud_coder_${color}.svg`;
    image3.src = `img/undraw_proud_coder_${color}.svg`;
}

// Revising Code / Eliminating Redundant Code
// Initially i created to method darkmode and lightmode to toggle but after revising one function is sufficient which is toggleDarklightmode - in comment function name might be incorrect i am lazy so i just wrote it in comment.
function toggleDarkLightMode(isLight){
    nav.style.backgroundColor = isLight ? 'rgb(255 255 255 / 50%)' : 'rgb(0 0 0 / 50%)'
    textBox.style.backgroundColor = isLight ? 'rgb(0 0 0  / 50%)' : 'rgb(255 255 255 / 50%)'
    toggleIcon.children[0].textContent = isLight ? 'Light Mode' : 'Dark Mode'
    isLight ? toggleIcon.children[1].classList.replace('fa-moon', 'fa-sun'): toggleIcon.children[1].classList.replace('fa-sun', 'fa-moon')
    // isLight ? imageMode('light') : imageMode('dark')
}

// Dark Mode Styles
function darkMode(){
    nav.style.backgroundColor = 'rgb(0 0 0 / 50%)'
    textBox.style.backgroundColor = 'rgb(255 255 255 / 50%)'
    toggleIcon.children[0].textContent = 'Dark Mode'
    toggleIcon.children[1].classList.replace('fa-sun', 'fa-moon')
    // toggleIcon.children[1].classList.remove('fa-sun')
    // toggleIcon.children[1].classList.add('fa-moon') 
    // imageMode('dark')
}

// Light Mode Style
function lightMode(){
     nav.style.backgroundColor = 'rgb(255 255 255 / 50%)'
    textBox.style.backgroundColor = 'rgb(0 0 0  / 50%)'
    toggleIcon.children[0].textContent = 'Light Mode'
    toggleIcon.children[1].classList.replace('fa-moon', 'fa-sun')
    // toggleIcon.children[1].classList.add('fa-sun')
    // toggleIcon.children[1].classList.remove('fa-moon') 
    // imageMode('light')
}


// Switch Theme Dynamically
function switchTheme(event){
    console.log(event)
    if(event.target.checked){
        document.documentElement.setAttribute('data-theme', 'dark')
        localStorage.setItem('theme', 'dark')
        toggleDarkLightMode(false)
        // darkMode()
    } else {
        document.documentElement.setAttribute('data-theme', 'white')
        localStorage.setItem('theme', 'light')
        toggleDarkLightMode(true)
        // lightMode()
    }
}


// Event Listener
toggleSwitch.addEventListener('change', switchTheme)

// Check local storage for theme
const currentTheme = localStorage.getItem('theme')
if(currentTheme){
    document.documentElement.setAttribute('data-theme', currentTheme)
    if(currentTheme === 'dark'){
        toggleSwitch.checked = true;
        toggleDarkLightMode(false)
        // darkMode()
    }
}