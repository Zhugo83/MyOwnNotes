document.addEventListener('DOMContentLoaded', () => {
    // Create Channel Form Submission
    const form = document.getElementById('create-channel-form');
    const messageElement = document.getElementById('message');

    form.addEventListener('submit', async (event) => {
    event.preventDefault();
    messageElement.textContent = '';  // Clear previous messages

    const selfdestructchoice = document.getElementById('selfdestructchoice').value;

        try {
            const response = await fetch('http://localhost:3000/api/channel/add', {  // Assuming this is your back-end endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ selfdestructchoice })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to the channel page with the UUID from the server's response
                const uuid = data.uuid;  // Assuming the response includes the uuid in this format
                window.location.href = `channel.html?uuid=${uuid}`;
            } else {
                messageElement.textContent = data.message;  // Show error message from the server
            }
        } catch (error) {
            messageElement.textContent = 'An error occurred. Please try again.';  // Handle network errors
        }
    });
});