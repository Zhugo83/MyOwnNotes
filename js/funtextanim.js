document.addEventListener('DOMContentLoaded', () => {
    async function displayRandomAnim() {
        const randomIndex = Math.floor(Math.random() * funFacts.length);
        const randomFact = funFacts[randomIndex];

        let animations = randomFact.length > 50 ? ['zoom', 'up-down'] : ['zoom', 'up-down', 'swing'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];

        const funTextElement = document.getElementById('fun-text');
        funTextElement.classList.add(randomAnimation);
    }
    window.onload = displayRandomAnim;
});