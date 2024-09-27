document.addEventListener('DOMContentLoaded', () => {
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme');

    // Disable transitions temporarily to avoid delay during initial load
    body.classList.add('no-transition');

    // Apply the saved theme (if exists) before removing the no-transition class

    if (savedTheme === 'light-mode') {
        body.classList.add('light-mode');
    } else if (savedTheme === 'dark-mode') {
        body.classList.add('dark-mode');
    }
    // Allow transitions after the theme is applied (when the page is fully loaded)
    window.addEventListener('load', () => {
        body.classList.remove('no-transition');
    });


    // Toggle theme logic
    toggleThemeBtn.addEventListener('click', () => {
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
            if (document.querySelector('.editor-toolbar')) {
                document.querySelector('.editor-toolbar').style.backgroundColor = '#000';
            }
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
            if (document.querySelector('.editor-toolbar')) {
                document.querySelector('.editor-toolbar').style.backgroundColor = '#777';
            }
        }
        // Save theme preference
        localStorage.setItem('theme', body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode');
    });
});