document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display a random fact
    const funTextElement = document.getElementById('fun-text');
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
            
            let animations = message.length > 50 ? ['zoom', 'up-down'] : ['zoom', 'up-down', 'swing'];
            const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
            funTextElement.textContent = message;
            funTextElement.classList.add(randomAnimation);
        } catch (error) {
            console.error('Error loading text:', error);
            document.getElementById('fun-text').textContent = "Oops, something went wrong!";
        }
    }

    // Call the random fact display function after page loads
    window.onload = displayRandomFact;
});