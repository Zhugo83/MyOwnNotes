document.addEventListener('DOMContentLoaded', () => {
    let passwordChangeTimeout;
    let isSendingPassword = false;  // Track if we're currently sending password updates
    
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get('uuid');
    
    // DOM Elements
    const noteTextarea = document.getElementById('note');
    const modificationPassword = document.getElementById('passwordmodification');
    const visibilityPassword = document.getElementById('passwordvisibility');
    const randompasswordbutton1 = document.getElementById('generatePassword');
    const randompasswordbutton2 = document.getElementById('generatePassword2');
    
    // Load passwords from localStorage if they exist
    const storedModificationPassword = localStorage.getItem(`modificationPassword_${uuid}`);
    const storedVisibilityPassword = localStorage.getItem(`visibilityPassword_${uuid}`);
    
    // Pre-fill passwords if available from localStorage or URL params
    modificationPassword.value = storedModificationPassword || params.get('modificationPassword') || '';
    visibilityPassword.value = storedVisibilityPassword || params.get('visibilityPassword') || '';
    
    // Track the last known passwords
    let lastModificationPassword = modificationPassword.value;
    let lastVisibilityPassword = visibilityPassword.value;
    
    // Event listeners for detecting password changes
    modificationPassword.addEventListener('input', handlePasswordChange);
    visibilityPassword.addEventListener('input', handlePasswordChange);
    randompasswordbutton1.addEventListener('click', handlePasswordChange);
    randompasswordbutton2.addEventListener('click', handlePasswordChange);
    
    // Function to handle password changes with debouncing
    function handlePasswordChange() {
        // Prevent further changes while sending the update
        if (isSendingPassword) {
            return;
        }
    
        // Clear the existing timeout to reset the delay
        clearTimeout(passwordChangeTimeout);
    
        // Disable input fields while the update is pending
        lockPasswordFields(true);
    
        // Set a new timeout to send the update after 5 seconds (5000ms)
        passwordChangeTimeout = setTimeout(() => {
            const currentModificationPassword = modificationPassword.value;
            const currentVisibilityPassword = visibilityPassword.value;
            
            // Send updated passwords only if there's a change
            if (currentModificationPassword !== lastModificationPassword || currentVisibilityPassword !== lastVisibilityPassword) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    const message = {
                        lastModificationPassword: lastModificationPassword || null, // Send previous password for comparison
                        lastVisibilityPassword: lastVisibilityPassword || null,     // Send previous password for comparison
                        newmodificationPassword: currentModificationPassword || null,
                        newvisibilityPassword: currentVisibilityPassword || null
                    };
    
                    isSendingPassword = true;  // Set flag to indicate we're sending the update
    
                    ws.send(JSON.stringify(message));
                    console.log("Sent password update");
    
                    // Store passwords in localStorage
                    localStorage.setItem(`modificationPassword_${uuid}`, currentModificationPassword);
                    localStorage.setItem(`visibilityPassword_${uuid}`, currentVisibilityPassword);
    
                    // Update stored password values
                    lastModificationPassword = currentModificationPassword;
                    lastVisibilityPassword = currentVisibilityPassword;
                } else {
                    console.log('WebSocket is closed. Reconnecting...');
                    connectWebSocket();
                }
            } 
    
            // Re-enable the fields after the update is sent
            lockPasswordFields(false);
            isSendingPassword = false;
        }, 250);
    }
    
    // Function to lock or unlock the password fields
    function lockPasswordFields(isLocked) {
        modificationPassword.disabled = isLocked;
        visibilityPassword.disabled = isLocked;
        randompasswordbutton1.disabled = isLocked;
        randompasswordbutton2.disabled = isLocked;
    }
    
    // Pre-fill passwords if passed via query parameters
    if (params.get('modificationPassword')) {
        modificationPassword.value = params.get('modificationPassword') || '';
    }
    if (params.get('visibilityPassword')) { 
        visibilityPassword.value = params.get('visibilityPassword') || '';
    }

    let ws;
    let clientVersion = 0;  // Local version tracker for OT

    // Connect to WebSocket server
    const connectWebSocket = () => {
        ws = new WebSocket(`ws://localhost:3000/${encodeURIComponent(uuid)}`);

        ws.onopen = () => {
            console.log('Connected to WebSocket server');

            // Send initial password data after connection is opened
            const message = {
                lastModificationPassword: modificationPassword.value || null,
                lastVisibilityPassword: visibilityPassword.value || null
            };
            ws.send(JSON.stringify(message));
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

            if (messageData.password) {
                // Update passwords from server response
                if (messageData.password) {
                    modificationPassword.value = messageData.password.newmodificationPassword || '';
                    visibilityPassword.value = messageData.password.newvisibilityPassword || '';
                    lastModificationPassword = modificationPassword.value;
                    lastVisibilityPassword = visibilityPassword.value;
                    console.log("Passwords updated from server");
                }
            }

            // If a new operation and version are received
            if (messageData.operation && messageData.version !== undefined) {
                if (messageData.version === clientVersion) {
                    console.warn("No new changes to apply. Versions are in sync.");
                } else if (clientVersion < messageData.version) {
                    console.log("Applying server operation.");
                    applyServerOperation(messageData.operation, messageData.version);
                }
            }

            // Update client version if the server version is higher
            if (messageData.version !== undefined && messageData.version > clientVersion) {
                clientVersion = messageData.version;
                console.log("Client Version updated to server version:", clientVersion);
            }

            // Handle initial content load
            if (messageData.content !== undefined) {
                noteTextarea.value = messageData.content;
                previousValue = messageData.content;
            }

            // Handle self-destruct timer from the server
            if (messageData.selfdestruct !== undefined) {
                startCountdownTimer(messageData.selfdestruct);
            }

        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    // Capture and broadcast the operation (insert/delete) as a message
    const captureAndBroadcastOperation = (operation) => {
        const message = {
            operation: operation,
            clientVersion: clientVersion
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
            clientVersion++;
        }
    };

    // Apply an incoming operation from the server
    const applyServerOperation = (operation, version) => {
        console.log('Applying operation:', operation);
        if (version === clientVersion) {
            console.warn("Versions are in sync. No need to apply.");
        } else {
            transformAndApplyOperation(operation);
            clientVersion = version;
            console.log("Client Version updated to:", clientVersion);
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
    noteTextarea.addEventListener('keyup', () => {
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
