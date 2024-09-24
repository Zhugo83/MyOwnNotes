document.addEventListener('DOMContentLoaded', () => {
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme');

    // Disable transitions temporarily to avoid delay during initial load
    body.classList.add('no-transition');

    // Apply the saved theme (if exists) before removing the no-transition class
    if (savedTheme) {
        body.classList.add(savedTheme);
        toggleThemeBtn.innerHTML = savedTheme === 'light-mode'
            ? '<i class="fas fa-moon"></i> Dark Mode'
            : '<i class="fas fa-sun"></i> Light Mode';
    } else {
        body.classList.add('dark-mode');
    }

    // Allow transitions after the theme is applied (when the page is fully loaded)
    window.addEventListener('load', () => {
        body.classList.remove('no-transition');
    });


    // Toggle theme logic
    toggleThemeBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const currentTheme = body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
        toggleThemeBtn.innerHTML = currentTheme === 'light-mode'
            ? '<i class="fas fa-moon"></i> Dark Mode'
            : '<i class="fas fa-sun"></i> Light Mode';

        // Save theme preference
        localStorage.setItem('theme', currentTheme);
    });
});