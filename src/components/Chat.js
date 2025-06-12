import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Chat.css';

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      
      setMessages(prevMessages => {
        // Avoid duplicate messages
        const messageExists = prevMessages.some(
          msg => msg.timestamp === data.timestamp && 
                 msg.sender === data.sender && 
                 msg.content === data.content
        );
        
        if (!messageExists) {
          return [...prevMessages, data];
        }
        return prevMessages;
      });
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }, []);

  // Set up WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`ws://localhost:3001?user=${user}`);
    
    ws.onopen = () => {
      console.log(`Connected to WebSocket server as ${user}`);
      setIsConnected(true);
      
      // Clear any pending reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = handleWebSocketMessage;

    ws.onclose = () => {
      console.log(`Disconnected from WebSocket server (${user})`);
      setIsConnected(false);
      
      // Try to reconnect after 3 seconds
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };

    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [user, handleWebSocketMessage]);

  // Initialize WebSocket connection
  useEffect(() => {
    document.title = `Chat - ${user}`;
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [user, connectWebSocket]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    const message = inputMessage.trim();
    
    if (!message || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // Send the message
      wsRef.current.send(JSON.stringify({
        content: message,
        timestamp: new Date().toISOString()
      }));
      
      // Clear input
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chat as {user}</h1>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            {isConnected ? 'No messages yet. Say hello!' : 'Connecting to chat...'}
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={`${message.timestamp}-${index}`}
              className={`message ${message.sender === user || message.isOwnMessage ? 'user-message' : 'other-message'}`}
            >
              <div className="message-sender">
                {message.sender === user || message.isOwnMessage ? 'You' : message.sender || 'User'}
              </div>
              <div className="message-content">{message.content}</div>
              <div className="message-timestamp">
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="message-input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={isConnected ? "Type your message..." : "Connecting..."}
          className="message-input"
          disabled={!isConnected}
          aria-label="Type your message"
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!isConnected || !inputMessage.trim()}
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
