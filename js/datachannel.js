document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get('uuid');
    const noteTextarea = document.getElementById('note');
    const modificationPassword = params.get('modificationPassword');
    const visibilityPassword = params.get('visibilityPassword');

    // Initialize EasyMDE
    const easyMDE = new EasyMDE({
        element: noteTextarea,
        sideBySideFullscreen: false,
        autoDownloadFontAwesome: false,
        toolbar: [
            'bold', 'italic', 'strikethrough', 'heading', '|', 'quote', 'unordered-list', 'ordered-list', '|', 'link', '|', 'side-by-side', '|', 'guide'
        ]
    });
    
    if (modificationPassword) {
        document.getElementById('passwordmodification').value = modificationPassword;
    }
    if (visibilityPassword) {
        document.getElementById('passwordvisibility').value = visibilityPassword;
    }
    
    let ws;
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
        try {
            const messageData = JSON.parse(event.data);
    
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
    
        const message = {
            content: content,
        };
    
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    };
    
    
    easyMDE.codemirror.on('keyup', () => {
        broadcastContent();
    });
    
    connectWebSocket();


    // Functions

    // timer for the self-destruct
    let countdownTimer;
    const timerDisplay = document.getElementById('selfDestructTimer');
    const startCountdownTimer = (selfDestructTime) => {
        const selfDestructDate = new Date(selfDestructTime);
        const currentTime = new Date();
        
        let duration = Math.floor((selfDestructDate - currentTime) / 1000);
        
        if (duration <= 0) {
            timerDisplay.textContent = "Time's up!";
            return;
        }
    
        let timer = duration, hours, minutes, seconds;
        clearInterval(countdownTimer);
        countdownTimer = setInterval(() => {
            hours = parseInt(timer / 3600, 10);
            minutes = parseInt((timer % 3600) / 60, 10);
            seconds = parseInt(timer % 60, 10);
    
            hours = hours < 10 ? "0" + hours : hours;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
    
            timerDisplay.textContent = `Self Destruct Timer: ${hours}:${minutes}:${seconds}`;
    
            if (--timer < 0) {
                clearInterval(countdownTimer);
                timerDisplay.textContent = "Time's up!";
            }
        }, 1000);
    };


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
});
