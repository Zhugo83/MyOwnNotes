document.addEventListener('DOMContentLoaded', () => {
    let awaitingServerResponse = false; // Track if awaiting server response
    
    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get('uuid');
    
    // DOM Elements
    const noteTextarea = document.getElementById('note');
    const modificationPassword = document.getElementById('passwordmodification');
    const visibilityPassword = document.getElementById('passwordvisibility');
    const confirmpasswordbutton1 = document.getElementById('confirmPassword');
    const confirmpasswordbutton2 = document.getElementById('confirmPassword2');
    
    // Load passwords from localStorage if they exist
    const storedModificationPassword = localStorage.getItem(`modificationPassword_${uuid}`);
    const storedVisibilityPassword = localStorage.getItem(`visibilityPassword_${uuid}`);
    
    // Pre-fill passwords if available from localStorage or URL params
    if (storedModificationPassword && !params.get('modificationPassword')) {
        modificationPassword.value = params.get('modificationPassword') || storedModificationPassword || "";
    }
    if (storedVisibilityPassword && !params.get('visibilityPassword')) {
        visibilityPassword.value = params.get('modificationPassword') || storedVisibilityPassword || "";
    }
    if (params.get('modificationPassword')) {
        modificationPassword.value = params.get('modificationPassword');
    }
    if (params.get('visibilityPassword')) {
        visibilityPassword.value = params.get('visibilityPassword');
    }
    
    // Track the last known passwords
    let lastModificationPassword = modificationPassword.value;
    let lastVisibilityPassword = visibilityPassword.value;
    
    // Event listeners for detecting password changes
    confirmpasswordbutton1.addEventListener('click', handlePasswordChange);
    confirmpasswordbutton2.addEventListener('click', handlePasswordChange);
    
    // Function to handle password changes with debouncing
    function handlePasswordChange() {
        // Clear any pending timeout
        const currentModificationPassword = modificationPassword.value;
        const currentVisibilityPassword = visibilityPassword.value;

        // Prepare the new password data
        const newPasswordUpdate = {
            lastModificationPassword: lastModificationPassword || "", // previous password for comparison
            lastVisibilityPassword: lastVisibilityPassword || "",     // previous password for comparison
            newmodificationPassword: currentModificationPassword || "",
            newvisibilityPassword: currentVisibilityPassword || ""
        };

        // If waiting for the server, queue the new update
        if (awaitingServerResponse) {
            handlePasswordChange()
        } else {
            sendPasswordUpdate(newPasswordUpdate); // No waiting, send the update immediately
        }
    }
    
    // Function to send the password update
    function sendPasswordUpdate(passwordUpdate) {
        awaitingServerResponse = true;
        if (noteTextarea.disabled){
            ws.close()
            console.log("Disconnected due to you not having the correct mod password")
        }
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Set flag to indicate we are awaiting a server response
    
            // Send password update via WebSocket
            ws.send(JSON.stringify(passwordUpdate));
            console.log("Sent password update");
    
            // Update the last known passwords
            lastModificationPassword = passwordUpdate.newmodificationPassword;
            lastVisibilityPassword = passwordUpdate.newvisibilityPassword;
    
            // Store passwords in localStorage
            if (passwordUpdate.newmodificationPassword) {
                localStorage.setItem(`modificationPassword_${uuid}`, passwordUpdate.newmodificationPassword);
            }
            if (passwordUpdate.newvisibilityPassword) {
                localStorage.setItem(`visibilityPassword_${uuid}`, passwordUpdate.newvisibilityPassword);
            }
        } else {
            console.log('WebSocket is closed. Reconnecting...');
            connectWebSocket();
        }
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
                lastModificationPassword: modificationPassword.value || "",
                lastVisibilityPassword: visibilityPassword.value || ""
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
            awaitingServerResponse = false;
            if (messageData.password) {
                // Update passwords from server response
                noteTextarea.disabled = false;
                console.log(modificationPassword.value, messageData.password.newmodificationPassword)
                if (messageData.password.newmodificationPassword == null) {
                    console.log("No new modification password")
                } else {
                    // Lock the password fields before updating
                    modificationPassword.disabled = true;
                    visibilityPassword.disabled = true;
                
                    console.log("Password fields locked for update...");
                
                    // Update the modification password
                    modificationPassword.value = messageData.password.newmodificationPassword || '';
                    lastModificationPassword = messageData.password.newmodificationPassword || '';
                    localStorage.setItem(`modificationPassword_${uuid}`, lastModificationPassword);
                
                    // Update the visibility password
                    visibilityPassword.value = messageData.password.newvisibilityPassword || '';
                    lastVisibilityPassword = messageData.password.newvisibilityPassword || '';
                    localStorage.setItem(`visibilityPassword_${uuid}`, lastVisibilityPassword);
                
                    console.log("Modification and visibility passwords updated");
                
                    // Unlock the fields after update
                    setTimeout(() => {
                        modificationPassword.disabled = false;
                        visibilityPassword.disabled = false;
                    }, 200);  // Set a timeout to simulate a delay, allowing the user to notice the change
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

            if (messageData.error !== undefined) {
                // lock the textarea
                noteTextarea.disabled = true;
            }

            if (messageData.redirect !== undefined) {
                // if there's an message with the redirect then add it as message
                window.location.href = messageData.redirect + "?message=" + encodeURIComponent(messageData.redirecterror);
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
    
        // Get the day and month as numbers
        const day = selfDestructDate.getDate();
        const month = selfDestructDate.getMonth() + 1; // Add 1 because getMonth() returns 0-based month
        const formattedDate = `${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}`; // Format as DD/MM
        dateofselfDestruct.textContent = `Self Destruct Date: ${formattedDate}`;
    
        clearInterval(countdownTimer); // Clear any previous interval to avoid multiple timers
    
        countdownTimer = setInterval(() => {
            const currentTime = new Date();
            let duration = Math.floor((selfDestructDate - currentTime) / 1000);
    
            if (duration <= 3) {
                clearInterval(countdownTimer);
                timerDisplay.textContent = "Time's up!";
                const messages = [
                    "The {gray}channel auto {#ff5a00}destructed!",
                    "{#ff5a00}Boom! jus like that the {gray}channel is gone!",
                    "{gray}channel? What {gray}channel? It's been {#99a7ff}vaporized...",
                    "The {gray}channel is no more!",
                    "The {gray}channel {#ff5a00}exploded! You walked away like a movie star in slow motion.",
                    "The {gray}channel went {#ff5a00}kaboom!",
                    "The {gray}channel? It’s history!",
                    "Rest in peace, {gray}channel. You will not be missed.",
                    "The {gray}channel is {gray}dust.",
                    "The {gray}channel's destruction was {#99a7ff}dramatic!",
                    "{yellow}KA {#ff5a00}BOOM! The {gray}channel's gone!!",
                    "{gray}channel obliterated.",
                    "The {gray}channel {#ff5a00}imploded!"
                ];
    
                // Select a random message from the list
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
                window.location.href = "index.html?message=" + encodeURIComponent(randomMessage);
                return;
            }
    
            // Calculate total hours, minutes, and seconds from the duration
            const hours = Math.floor(duration / 3600);
            const minutes = Math.floor((duration % 3600) / 60);
            const seconds = duration % 60;
    
            // Format hours, minutes, and seconds to always be two digits
            const formattedHours = hours < 10 ? "0" + hours : hours;
            const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
            const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    
            // Display the countdown in "hours:minutes:seconds" format
            timerDisplay.textContent = `Self Destruct Timer: ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
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
