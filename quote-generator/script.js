const quoteContainer = document.getElementById('quote-container')
const quoteText = document.getElementById('quote')
const authorText = document.getElementById('author')
const twitterBtn = document.getElementById('twitter')
const newQuotBtn = document.getElementById('new-quote')
const loader = document.getElementById('loader')

let apiQuotes = [];

function showLoadingSpinner(){
    loader.hidden = false
    quoteContainer.hidden = true
}

function removeLoadingSpinner(){
    if(!loader.hidden){
        quoteContainer.hidden = false
        loader.hidden = true
    }
}

// Show New Quote
function newQuote() {
    showLoadingSpinner()
    // Pick a random quote from apiQuotes array
    const quote = apiQuotes[Math.floor(Math.random() * apiQuotes.length)]
    // Check if Author field is blank and replace it with 'Unknown'
    if(!quote.author){
        authorText.textContent = "Unknown"
    } else {
        authorText.textContent = quote.author
    }

    // Check Quote length to determine styling
    if(quote.text.length > 120){
        quoteText.classList.add("long-quote")
    } else {
        quoteText.classList.remove("long-quote") 
    }
    // Set Quote, Hide Loader
    quoteText.textContent = quote.text
    removeLoadingSpinner()
}

// Locally
// function newQuote() {
//     // Pick a random quote from apiQuotes array
//     const quote = localQuotes[Math.floor(Math.random() * localQuotes.length)]
//     console.log(quote)
// }

// Get Quotes From API
async function getQuotes(){
    showLoadingSpinner()
    // const proxyUrl = "https://cors-anywhere.herokuapp.com"
    const apiUrl = 'https://jacintodesign.github.io/quotes-api/data/quotes.json'
    try {
        const response = await fetch(apiUrl)
        // const response = await fetch(proxyUrl + apiUrl)

        apiQuotes = await response.json()
        newQuote();
        // throw new Error('Oops')
    } catch (error) {
        // Catch Error Here
        // console.log(error)
        console.log("Something went wrong! Ooops")
    }
}

// Tweet Quote
function tweetQuote(){
    const twitterUrl = `https://twitter.com/intent/tweet?text=${quoteText.textContent} - ${authorText.textContent}`
    window.open(twitterUrl, '_blank')
}

// Event Listener
newQuotBtn.addEventListener('click', newQuote);
twitterBtn.addEventListener('click', tweetQuote)

// // On Load
getQuotes();



/**
 * 
 *  Different API Option
 *  There is an alternative option for this project that does not require an API key - https://zenquotes.io/

 *  Sample Requests
 *  https://zenquotes.io/api/quotes - Generate a JSON array of 50 random quotes on each request
 *  https://zenquotes.io/api/today - Generate the quote of the day on each request
 *  https://zenquotes.io/api/random - Generate a random quote on each request
 * 
 * 
 * 
 */