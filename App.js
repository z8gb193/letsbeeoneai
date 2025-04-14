
import React, { useState } from 'react';

function App() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [listening, setListening] = useState(false);

  const toggleVoiceInput = () => {
    setListening(!listening);
    if (!listening) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage(transcript);
      };
      recognition.start();
    }
  };

  const handleSend = async () => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    setResponse(data.reply || 'No response');
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>BeeOne AI – Nova</h1>
      <textarea rows="3" value={message} onChange={(e) => setMessage(e.target.value)} />
      <br />
      <button onClick={handleSend}>Send</button>
      <button onClick={toggleVoiceInput}>
        {listening ? '🎤 Stop Voice Input' : '🎤 Start Voice Input'}
      </button>
      <p><strong>Response:</strong> {response}</p>
    </div>
  );
}

export default App;
