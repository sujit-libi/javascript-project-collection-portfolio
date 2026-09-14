const form = document.getElementById('form')
const password1El = document.getElementById('password1')
const password2El = document.getElementById('password2')
const messageContainer = document.querySelector('.message-container')
const message = document.getElementById('message')

let isValid = false
let passwordsMatch = false

function validateForm(){
    // Using Contraint API
    isValid = form.checkValidity();
    // Style main message for an error
    if(!isValid){
        message.textContent = "Please fill out all fields."
        message.style.color = "tomato"
        messageContainer.style.borderColor = "tomato"
        return;
    }
    // Check to see if passwords match
    if(password1El.value === password2El.value){
        passwordsMatch = true;
        password1El.style.borderColor = "dodgerblue"
        password2El.style.borderColor = "dodgerblue"
    } else {
        passwordsMatch = false
        message.textContent = 'Make sure passwords match.'
        message.style.color = "tomato"
        messageContainer.style.borderColor = "tomato"
        password1El.style.borderColor = "tomato"
        password2El.style.borderColor = "tomato"
        return;
    }
    // If form is valid and passwords match
    if(isValid && passwordsMatch) {
        message.textContent = "Successfully Registered!"
        message.style.color = "dodgerblue"
        messageContainer.style.borderColor = "dodgerblue"
    }
}

function storeFormData() {
    const user = {
        name: form.name.value,
        phone: form.phone.value,
        email: form.email.value,
        website: form.website.value,
        password: form.password.value
    }
    // Do something with user data
    console.log(user)
}


function processFormData(event){
    event.preventDefault()
    validateForm()
    // Submit Data if Valid
    if(isValid && passwordsMatch){
        storeFormData()
    }
}

// Event Listener
form.addEventListener('submit', processFormData);