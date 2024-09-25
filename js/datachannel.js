document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get('uuid');
    const noteTextarea = document.getElementById('note');
    const savedTheme = localStorage.getItem('theme');
    const modificationPassword = params.get('modificationPassword');
    const visibilityPassword = params.get('visibilityPassword');

    if (modificationPassword) {
        document.getElementById('passwordmodification').value = modificationPassword;
    }
    
    if (visibilityPassword) {
        document.getElementById('passwordvisibility').value = visibilityPassword;
    }

    // Initialize EasyMDE
    const easyMDE = new EasyMDE({
        element: noteTextarea,
        sideBySideFullscreen: false,
        autoDownloadFontAwesome: false,
        theme: savedTheme === 'light-mode' ? 'easymde-light' : 'easymde-dark',
        toolbar: [
            'bold', 'italic', 'strikethrough', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', '|', 'side-by-side', '|', 'guide'
        ]
    });

    let ws; // WebSocket variable
    let isTyping = false; // Track if user is typing to reduce unnecessary broadcasts

    // Establish WebSocket connection
    const connectWebSocket = () => {
        ws = new WebSocket(`ws://localhost:3000/${uuid}`); // Connect to WebSocket server

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
        };

        ws.onmessage = (event) => {
            console.log('Raw WebSocket message received:', event.data); // Log raw message for debugging
            try {
                const messageData = JSON.parse(event.data);
        
                // Avoid updating content while user is typing
                if (isTyping) return;
        
                // Preserve the current cursor position before updating content
                const cursorPos = easyMDE.codemirror.getCursor();
                const scrollPos = easyMDE.codemirror.getScrollInfo();
        
                // Update note content if it changes
                if (messageData.content !== undefined) { // Accept empty content too
                    easyMDE.value(messageData.content);
                }
        
                // Restore the cursor and scroll position after update
                easyMDE.codemirror.setCursor(cursorPos);
                easyMDE.codemirror.scrollTo(scrollPos.left, scrollPos.top);
        
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
                console.error('Received data:', event.data); // Log the raw data received for debugging
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };

    // Function to broadcast the note content to WebSocket
    const broadcastContent = () => {
        const content = easyMDE.value(); // Get current content
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ content })); // Send updated content, even empty strings
        }
    };

    // Listen for keydown event and send immediate update
    easyMDE.codemirror.on('keydown', () => {
        isTyping = true; // User is typing
        // broadcastContent(); // Send current content, even if empty
        console.log('is typing!!!');
    });

    // Listen for keyup event to stop sending updates
    easyMDE.codemirror.on('keyup', () => {
        isTyping = false; // User finished typing
        broadcastContent(); // Send current content again
        console.log('not typing!!!');
    });

    // Initialize WebSocket connection
    connectWebSocket();




    // Data stuff above rest is below for simplicity and organization
    const body = document.body;
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
