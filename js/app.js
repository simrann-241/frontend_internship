document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');

    let websocket = null;

    // Initialize WebSocket connection
    function connectWebSocket() {
        websocket = new WebSocket('ws://localhost:8765');

        websocket.onopen = () => {
            console.log('Connected to BuddYBot server');
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'message') {
                addMessage(data.content, data.sender === 'user');
            } else if (data.type === 'response') {
                typingIndicator.style.display = 'none';
                addMessage(data.content, false);
            }
        };

        websocket.onclose = () => {
            console.log('Disconnected from server');
            // Attempt to reconnect after 2 seconds
            setTimeout(connectWebSocket, 2000);
        };
    }

    // Add message to chat container
    function addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = content;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Send message
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessage(message, true);
        
        // Clear input
        messageInput.value = '';
        
        // Show typing indicator
        typingIndicator.style.display = 'block';
        
        // Send message to server
        websocket.send(JSON.stringify({
            content: message
        }));
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Start connection
    connectWebSocket();
});
