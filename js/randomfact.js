document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display a random fact
    async function displayRandomFact() {
        try {
            const response = await fetch('../Texts.json');
            const funFacts = await response.json();
            const randomIndex = Math.floor(Math.random() * funFacts.length);
            const randomFact = funFacts[randomIndex];

            let animations = randomFact.length > 50 ? ['zoom', 'up-down'] : ['zoom', 'up-down', 'swing'];
            const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

            const funTextElement = document.getElementById('fun-text');
            funTextElement.textContent = randomFact;
            funTextElement.classList.add(randomAnimation);
        } catch (error) {
            console.error('Error loading text:', error);
            document.getElementById('fun-text').textContent = "Oops, something went wrong!";
        }
    }

    // Call the random fact display function after page loads
    window.onload = displayRandomFact;
});