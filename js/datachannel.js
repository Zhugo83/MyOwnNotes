document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get('uuid');
    const noteTextarea = document.getElementById('note');
    const modificationPassword = params.get('modificationPassword');
    const visibilityPassword = params.get('visibilityPassword');

    let ws;
    let clientVersion = 0;  // Local version tracker for OT

    // Connect to WebSocket server
    const connectWebSocket = () => {
        ws = new WebSocket(`ws://localhost:3000/${encodeURIComponent(uuid)}&modificationPassword=${encodeURIComponent(modificationPassword)}&visibilityPassword=${encodeURIComponent(visibilityPassword)}`);
    
        ws.onopen = () => {
            console.log('Connected to WebSocket server');
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

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = (event) => {
        try {
            const messageData = JSON.parse(event.data);
            console.log('Received message:', messageData);  // Log the message for debugging
    
            // If a new operation and version are received
            if (messageData.operation && messageData.version !== undefined) {
                // Only apply the operation if the server version matches the client's current version
                if (messageData.version === clientVersion) {
                    applyServerOperation(messageData.operation, messageData.version);
                } else {
                    console.warn('Version mismatch. Skipping operation.');
                }
            }
    
            // Update client version if the server version is higher
            if (messageData.version !== undefined && messageData.version > clientVersion) {
                clientVersion = messageData.version;
            }
    
            // If the server sends the full content (e.g., on initial load)
            if (messageData.content !== undefined) {
                noteTextarea.value = messageData.content;  // Set the value of the textarea
                previousValue = messageData.content;  // Update previous value to prevent false detection
            }
    
            // Handle self-destruct timer from the server
            if (messageData.selfdestruct !== undefined) {
                startCountdownTimer(messageData.selfdestruct); 
            }
    
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            console.error('Received data:', event.data);
        }
    };

    // Capture and broadcast the operation (insert/delete) as a message
    const captureAndBroadcastOperation = (operation) => {
        const message = {
            operation: operation,  // The operation (insert/delete)
            clientVersion: clientVersion  // Send the current version of the document
        };
    
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));  // Send the operation to the WebSocket server
            clientVersion++;  // Increment local version after broadcasting
        }
    };

    // Apply an incoming operation from the server
    const applyServerOperation = (operation, version) => {
        // Apply the operation only if the versions match
        if (version === clientVersion) {
            // Transform and apply the operation (insert/delete)
            transformAndApplyOperation(operation);
    
            // Increment the client version after successfully applying the operation
            clientVersion++;
            console.log("Client Version updated to:", clientVersion);
        } else {
            console.warn('Version mismatch. Operation skipped.');
        }
    };

    // Transform and apply the server operation to the textarea
    const transformAndApplyOperation = (operation) => {
        const cursorPos = noteTextarea.selectionStart;  // Save cursor position
        const currentContent = noteTextarea.value;
    
        if (operation.type === 'insert') {
            // Insert new text at the specified position
            noteTextarea.value = currentContent.slice(0, operation.position) + operation.text + currentContent.slice(operation.position);
        } else if (operation.type === 'delete') {
            // Delete text from the specified range
            const fromPos = operation.position;
            const toPos = fromPos + operation.length;
            noteTextarea.value = currentContent.slice(0, fromPos) + currentContent.slice(toPos);
        }
    
        // Restore cursor position after applying the operation
        noteTextarea.setSelectionRange(cursorPos, cursorPos);
    
        // Update the previous value to match the new state after operation
        previousValue = noteTextarea.value;
    };

    // Event listener for changes in the textarea
    // Event listener for changes in the textarea
    noteTextarea.addEventListener('input', () => {
        const currentValue = noteTextarea.value;

        // Find the position where the change occurred
        const commonPrefixLength = findCommonPrefixLength(previousValue, currentValue);
        const commonSuffixLength = findCommonSuffixLength(previousValue, currentValue, commonPrefixLength);

        // Handle insertions or deletions
        const operation = {};
        if (previousValue.length < currentValue.length) {
            // Text was inserted
            operation.type = 'insert';
            operation.text = currentValue.slice(commonPrefixLength, currentValue.length - commonSuffixLength);
            operation.position = commonPrefixLength;
        } else if (previousValue.length > currentValue.length) {
            // Text was deleted
            operation.type = 'delete';
            operation.length = previousValue.length - currentValue.length;
            operation.position = commonPrefixLength;
        }

        // Broadcast the operation if it's a valid change
        if (operation.type) {
            captureAndBroadcastOperation(operation);
        }

        // Update the previous value
        previousValue = currentValue;
    });

    connectWebSocket();

    let previousValue = noteTextarea.value;

// Helper function to find common prefix length
const findCommonPrefixLength = (oldStr, newStr) => {
    let i = 0;
    while (i < oldStr.length && i < newStr.length && oldStr[i] === newStr[i]) {
        i++;
    }
    return i;
};

// Helper function to find common suffix length
const findCommonSuffixLength = (oldStr, newStr, prefixLength) => {
    let i = oldStr.length - 1, j = newStr.length - 1;
    while (i >= prefixLength && j >= prefixLength && oldStr[i] === newStr[j]) {
        i--; j--;
    }
    return oldStr.length - 1 - i;
};

    // Functions for the self-destruct timer
    let countdownTimer;
    const timerDisplay = document.getElementById('selfDestructTimer');
    const dateofselfDestruct = document.getElementById('selfDestructDate');
    
    const startCountdownTimer = (selfDestructTime) => {
        const selfDestructDate = new Date(selfDestructTime);
        const currentTime = new Date();
        
        // Get the day and month as numbers
        const day = selfDestructDate.getDate();
        const month = selfDestructDate.getMonth() + 1; // Add 1 because getMonth() returns 0-based month
        const formattedDate = `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`; // Format as DD/MM
        dateofselfDestruct.textContent = `Self Destruct Date: ${formattedDate}`;
    
        let duration = Math.floor((selfDestructDate - currentTime) / 1000);
        
        if (duration <= 0) {
            timerDisplay.textContent = "Time's up!";
            return;
        }
    
        clearInterval(countdownTimer);
    
        countdownTimer = setInterval(() => {
            // Calculate total hours, minutes, and seconds from the duration
            let hours = Math.floor(duration / 3600);
            let minutes = Math.floor((duration % 3600) / 60);
            let seconds = duration % 60;
    
            // Format hours, minutes, and seconds to always be two digits
            hours = hours < 10 ? "0" + hours : hours;
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
    
            // Display the countdown in "hours:minutes:seconds" format
            timerDisplay.textContent = `Self Destruct Timer: ${hours}:${minutes}:${seconds}`;
    
            // Decrease duration by 1 second
            if (--duration < 0) {
                clearInterval(countdownTimer);
                timerDisplay.textContent = "Time's up!";
            }
        }, 1000);
    };
    

    // Font size adjustment functions
    let textSize = 16;
    const increaseTextSizeBtn = document.getElementById('increaseTextSize');
    const decreaseTextSizeBtn = document.getElementById('decreaseTextSize');
    const textSizeDisplay = document.getElementById('textSizeDisplay');
    const adjustTextSize = (increment) => {
        textSize += increment;
        textSize = Math.max(10, textSize);
        noteTextarea.style.fontSize = `${textSize}px`;  // Adjust the font size of the textarea
        textSizeDisplay.textContent = `${textSize}px`;
    };

    increaseTextSizeBtn.addEventListener('click', () => {
        adjustTextSize(2);
    });

    decreaseTextSizeBtn.addEventListener('click', () => {
        adjustTextSize(-2);
    });
});
