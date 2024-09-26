document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get('uuid');
    const noteTextarea = document.getElementById('note');
    const savedTheme = localStorage.getItem('theme');
    const modificationPassword = params.get('modificationPassword');
    const visibilityPassword = params.get('visibilityPassword');
    const timerDisplay = document.getElementById('selfDestructTimer');
    
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
    
    let ws; 
    let isTyping = false; 
    let countdownTimer;

    // retry to connect to the connect to the websocket with the new passwords, only when there's a new passwords entered, and only if they're not already connected to the websocket
    document.getElementById('passwordmodification').addEventListener('input', () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
        if (document.getElementById('passwordmodification').value) {
            document.getElementById('passwordvisibility').value = null;
            connectWebSocket();
        }
    });
    
    document.getElementById('passwordvisibility').addEventListener('input', () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
        if (document.getElementById('passwordvisibility').value) {
            document.getElementById('passwordmodification').value = null;
            connectWebSocket();
        }
    });

    const connectWebSocket = () => {
        ws = new WebSocket(`ws://localhost:3000/${encodeURIComponent(uuid)}&modificationPassword=${encodeURIComponent(modificationPassword)}&visibilityPassword=${encodeURIComponent(visibilityPassword)}`);
    
        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            // Optionally send an initial message
            const initialMessage = { request: "fetchContent", uuid }; 
            ws.send(JSON.stringify(initialMessage));
        };
    
        ws.onmessage = (event) => {
            handleWebSocketMessage(event);
        };
    
        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
            clearInterval(countdownTimer); 
        };
    
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };
    
    const handleWebSocketMessage = (event) => {
        console.log('Raw WebSocket message received:', event.data);
        try {
            const messageData = JSON.parse(event.data);
            if (isTyping) return;
    
            const cursorPos = easyMDE.codemirror.getCursor();
            const scrollPos = easyMDE.codemirror.getScrollInfo();
            
            if (messageData.content !== undefined) {
                easyMDE.value(messageData.content);
            }
    
            easyMDE.codemirror.setCursor(cursorPos);
            easyMDE.codemirror.scrollTo(scrollPos.left, scrollPos.top);
    
            if (messageData.selfdestruct !== undefined) {
                startCountdownTimer(messageData.selfdestruct); 
            }
    
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            console.error('Received data:', event.data);
        }
    };
    
    const broadcastContent = () => {
        const content = easyMDE.value();
        const oldModificationPassword = modificationPassword || null;
        const oldVisibilityPassword = visibilityPassword || null;
        const newModificationPassword = document.getElementById('passwordmodification').value || null;
        const newVisibilityPassword = document.getElementById('passwordvisibility').value || null;
    
        const message = {
            content: content,
            oldModificationPassword: oldModificationPassword,
            newModificationPassword: newModificationPassword,
            oldVisibilityPassword: oldVisibilityPassword,
            newVisibilityPassword: newVisibilityPassword
        };
    
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    };
    
    easyMDE.codemirror.on('keydown', () => {
        isTyping = true; 
        console.log('is typing!!!');
    });
    
    easyMDE.codemirror.on('keyup', () => {
        isTyping = false; 
        broadcastContent();
        console.log('not typing!!!');
    });
    
    const startCountdownTimer = (selfDestructTime) => {
        // Convert selfDestructTime from string to Date object
        const selfDestructDate = new Date(selfDestructTime);
        const currentTime = new Date();
        
        // Calculate the difference in seconds between the self-destruct time and the current time
        let duration = Math.floor((selfDestructDate - currentTime) / 1000);
        
        if (duration <= 0) {
            timerDisplay.textContent = "Time's up!";
            return; // If the self-destruct time is in the past, exit early
        }
    
        let timer = duration, hours, minutes, seconds;
        clearInterval(countdownTimer); // Clear any previous interval
        countdownTimer = setInterval(() => {
            hours = parseInt(timer / 3600, 10);
            minutes = parseInt((timer % 3600) / 60, 10);
            seconds = parseInt(timer % 60, 10);
    
            // Pad hours, minutes, and seconds with a leading zero if less than 10
            hours = hours < 10 ? "0" + hours : hours;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
    
            // Update the display
            timerDisplay.textContent = `Self Destruct Timer: ${hours}:${minutes}:${seconds}`;
    
            // Decrement the timer
            if (--timer < 0) {
                clearInterval(countdownTimer);
                timerDisplay.textContent = "Time's up!";
                // Additional self-destruct logic can go here
            }
        }, 1000);
    };
    
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
