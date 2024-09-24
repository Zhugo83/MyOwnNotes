document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const uuid = new URLSearchParams(window.location.search).get('uuid'); // Get the UUID from URL
    const selfDestructTimer = document.getElementById('selfDestructTimer');
    const noteTextarea = document.getElementById('note');
    const savedTheme = localStorage.getItem('theme');

    // Initialize EasyMDE
    const easyMDE = new EasyMDE({
        element: noteTextarea,
        sideBySideFullscreen: false,
        autoDownloadFontAwesome: false, // Avoid downloading FontAwesome again
        theme: savedTheme === 'light-mode' ? 'easymde-light' : 'easymde-dark', // Set theme
        initialValue: noteTextarea.value, // If you have an initial value
        toolbar: [
            'bold', 'italic', 'strikethrough', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', '|', 'side-by-side', '|', 'guide'
        ]
    });

    let currentEndTime; // Variable to hold the current end time
    let saveTimeout; // Variable to hold the save timeout

    // Fetch channel content
    fetch(`http://localhost:3000/api/channel/${uuid}`)
        .then(response => {
            return response.json();
        })
        .then(data => {
            // Check if there's an error message in the JSON response
            if (data.message) {
                // Redirect to error.html with the error message in the URL
                window.location.href = `error.html?message=${encodeURIComponent(data.message)}`;
                return; // Stop further execution
            }
            
            if (data.content == null)
            {
                data.content = '';
            }
            easyMDE.value(data.content); // Populate the textarea with the content
            currentEndTime = new Date(data.selfdestruct); // Convert to Date object
            startCountdown(currentEndTime); // Start the countdown timer
        })
        .catch(error => {
            console.error('Error fetching channel:', error);
            window.location.href = `error.html?message=${encodeURIComponent(error.message)}`; // Redirect to error page on catch
        });

    // Function to start the countdown
    const startCountdown = (endTime) => {
        currentEndTime = endTime; // Set the current end time
        updateTimerDisplay(); // Initial display update

        // Update the timer every second
        setInterval(updateTimerDisplay, 1000);
    };

    // Function to update the timer display
    const updateTimerDisplay = () => {
        const currentTime = new Date().getTime();
        const timeRemaining = currentEndTime.getTime() - currentTime;

        if (timeRemaining <= 0) {
            window.location.href = `error.html?message=💥 The channel has self destructed.`;
        } else {
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
            selfDestructTimer.textContent = `Self Destruct Timer: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    };

    // Function to save the note
    const autoSave = () => {
        const content = easyMDE.value();
        fetch(`http://localhost:3000/api/channel/update/${uuid}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save channel content');
            }
            return response.json();
        })
        .then(data => {
            const selfDestructDate = new Date(data.selfdestruct); // Convert to Date object
            currentEndTime = selfDestructDate; // Update the current end time
            updateTimerDisplay(); // Update the display with new self-destruct time
        })
        .catch(error => console.error('Error saving channel:', error));
    };

    // Function to handle input and debounce saving
    const handleInput = () => {
        clearTimeout(saveTimeout); // Clear any existing timeout
        saveTimeout = setTimeout(autoSave, 3000); // Set a new timeout for 3 seconds
    };

    // Listen for input events on EasyMDE
    easyMDE.codemirror.on('change', handleInput);









    // Data stuff above rest is below for simplicity and organization
    let textSize = 16;
    const increaseTextSizeBtn = document.getElementById('increaseTextSize');
    const decreaseTextSizeBtn = document.getElementById('decreaseTextSize');
    const textSizeDisplay = document.getElementById('textSizeDisplay');
    const adjustTextSize = (increment) => {
        textSize += increment;
        textSize = Math.max(10, textSize);
        easyMDE.codemirror.getWrapperElement().style.fontSize = `${textSize}px`;
        textSizeDisplay.textContent = `${textSize}px`;
    };

    // Event listeners for text size buttons
    increaseTextSizeBtn.addEventListener('click', () => {
        adjustTextSize(2);
    });

    decreaseTextSizeBtn.addEventListener('click', () => {
        adjustTextSize(-2);
    });

    const toggleThemeBtn = document.getElementById('toggleTheme');

    toggleThemeBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        if (body.classList.contains('light-mode')) {
            easyMDE.options.theme = 'easymde-light';
            toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        } else {
            easyMDE.options.theme = 'easymde-dark';
            toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        }
        const currentTheme = body.classList.contains('light-mode') ? 'light-mode' : 'dark-mode';
        localStorage.setItem('theme', currentTheme);
        easyMDE.codemirror.refresh();
    });

    if (savedTheme) {
        body.classList.add(savedTheme);
        toggleThemeBtn.innerHTML = savedTheme === 'light-mode' 
            ? '<i class="fas fa-moon"></i> Dark Mode' 
            : '<i class="fas fa-sun"></i> Light Mode';
    } else {
        body.classList.add('dark-mode');
    }
});
