import React from 'react';
import Chat from './components/Chat';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="chat-container-wrapper">
        <div className="chat-instance">
          <Chat user="user1" />
        </div>
        <div className="chat-instance">
          <Chat user="user2" />
        </div>
      </div>
    </div>
  );
}

export default App;
