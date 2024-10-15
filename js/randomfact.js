document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display a random fact
    const funTextElement = document.getElementById('fun-text');

    // Function to apply colors to words based on the "{color}word" format
    const buildHtmlStructure = (text) => {
        const words = text.split(' '); // Split text into words
        let result = '';

        words.forEach(word => {
            // Check if the word contains a color tag
            const colorMatch = word.match(/\{(.*?)\}(.*)/);
            if (colorMatch) {
                // If a color tag is found, create a colored span
                const color = colorMatch[1]; // Extract the color
                const coloredWord = colorMatch[2]; // Extract the word
                result += `<span style="color:${color};">${coloredWord}</span> `;
            } else {
                // Otherwise, create a normal span
                result += `<span>${word}</span> `;
            }
        });

        return result.trim(); // Trim trailing spaces
    };

    async function displayRandomFact() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            let message = decodeURIComponent(urlParams.get('message'));

            if (message === "null" || message === '') {
                const response = await fetch('../Texts.json');
                const funFacts = await response.json();
                const randomIndex = Math.floor(Math.random() * funFacts.length);
                message = funFacts[randomIndex];
            }

            // Apply the color formatting to the message and build the HTML
            const fullHtmlStructure = buildHtmlStructure(message);
            const wordsArray = fullHtmlStructure.match(/<span.*?>.*?<\/span>/g) || []; // Match spans

            // Clear the element and prepare for writing animation
            funTextElement.innerHTML = ''; // Clear existing content

            // Write each word one at a time
            let index = 0;
            const typingSpeed = 100; // Adjust typing speed (in milliseconds)

            const typingInterval = setInterval(() => {
                if (index < wordsArray.length) {
                    funTextElement.innerHTML += wordsArray[index] + ' '; // Add the next word
                    index++;
                } else {
                    clearInterval(typingInterval); // Stop the interval when done
                    let animations = message.length > 50 ? ['zoom', 'up-down'] : ['zoom', 'up-down', 'swing'];
                    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
                    funTextElement.classList.add(randomAnimation);
                }
            }, typingSpeed);

        } catch (error) {
            console.error('Error loading text:', error);
            funTextElement.textContent = "Oops, something went wrong!";
        }
    }

    // Call the random fact display function after page loads
    window.onload = displayRandomFact;
});
