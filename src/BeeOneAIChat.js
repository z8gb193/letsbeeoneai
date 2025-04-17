import React, { useState, useEffect, useRef } from 'react';

const novaImages = [
  '/avatars/Nova.png',
  '/avatars/Nova2.png',
  '/avatars/Nova3.png',
  '/avatars/Nova4.png',
  '/avatars/Nova5.png',
  '/avatars/Nova6.png'
];

function ChatMessage({ message }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: message.isUser ? '#e0f7fa' : '#f1f1f1',
          color: message.isUser ? '#00796B' : '#333',
          padding: '12px 16px',
          borderRadius: '16px',
          maxWidth: '70%',
          fontSize: '17px',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function BeeOneAIChat() {
  const [availableVoices, setAvailableVoices] = useState([]);
  const [novaVoiceName, setNovaVoiceName] = useState(localStorage.getItem('novaVoice') || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [userName, setUserName] = useState('');
  const [setupStage, setSetupStage] = useState('start');
  const [memory, setMemory] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const videoRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
// ✅ Utility to save memory with duplicate checks and trimming
const saveToMemory = (newEntry) => {
  const currentMemory = JSON.parse(localStorage.getItem('novaMemory')) || [];

  // Avoid duplicate or empty entries
  if (!newEntry || currentMemory.includes(newEntry.trim())) return;

  const updatedMemory = [...currentMemory, newEntry.trim()];

  // Trim memory if too long (keep max 50 important entries)
  if (updatedMemory.length > 50) {
    updatedMemory.splice(0, updatedMemory.length - 50);
  }

  localStorage.setItem('novaMemory', JSON.stringify(updatedMemory));
  setMemory(updatedMemory);
};


  
  if (recognition) {
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
  }

useEffect(() => {
  // ✅ NEW: Get ?user= from URL if present
  const params = new URLSearchParams(window.location.search);
  const userFromURL = params.get('user');
  if (userFromURL) {
    localStorage.setItem('beeoneUser', userFromURL);
    console.log('Identified user from URL:', userFromURL); // Debug log
  }

  // Load memory
  const storedMemory = JSON.parse(localStorage.getItem('novaMemory')) || [];
  setMemory(storedMemory);

  // Set up voices
  const synth = window.speechSynthesis;
  const loadVoices = () => {
    const voices = synth.getVoices();
    setAvailableVoices(voices);
    console.log('Loaded voices:', voices.map(v => v.name));
    if (voices.length && !novaVoiceName) {
      const firstVoice = voices[0].name;
      setNovaVoiceName(firstVoice);
      localStorage.setItem('novaVoice', firstVoice);
      console.log('Set default voice:', firstVoice);
    }
  };
  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  loadVoices();

  if (recognition) {
    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim();
        console.log('Speech transcript:', transcript);
        if (transcript) {
          handleUserMessage(transcript);
        }
      }
    };

    recognition.onend = () => {
      console.log('Recognition restarting');
      recognition.start();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.start();
  }

  // Initial setup
  const identity = JSON.parse(localStorage.getItem('novaIdentity'));
  if (identity && identity.codeWord) {
    setUserName(identity.firstName);
    setSetupStage('verify');
    addMessage('Nova', 'Hey! What’s the codeword you gave me last time?');
  } else {
    setSetupStage('askName');
    addMessage('Nova', 'Hi! I’m Nova 💛 What’s your name?');
  }

  return () => {
    if (recognition) recognition.stop();
    synth.cancel();
  };
}, []);
  const fetchReplyFromBackend = async (character, message, memory, userName = 'Friend', userGender = 'unspecified') => {
    try {
      const response = await fetch('https://beeoneai-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, message, memory, name: userName, userId: 'default', gender: userGender }),
      });
      const data = await response.json();
      return data.reply || 'Hmm... I didn’t quite get that.';
    } catch (error) {
      console.error('Backend error:', error);
      return 'Hmm... Nova couldn’t connect just now.';
    }
  };

const addMessage = (sender, text) => {
  console.log('Adding message:', { sender, text }); // Debug log
  const isNova = sender.toLowerCase() === 'nova';
  const newMessage = { type: 'text', content: text, isUser: !isNova };

  setMessages((prev) => [...prev, newMessage]);

  // 🗣️ Nova's speech is disabled intentionally — no voice playback
};

  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUserMessage(input);
      setInput('');
    }
  };

  return (
    <>
      

      <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <div
          style={{
            width: '200px',
            overflowY: 'auto',
            background: '#f9f9f9',
            padding: '10px',
            borderRight: '1px solid #ccc',
          }}
        >
          {novaImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Nova ${idx}`}
              style={{ width: '100%', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer' }}
              onClick={() => setSelectedImage(img)}
            />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
          </div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            style={{
              width: '90%',
              height: '120px',
              padding: '20px',
              fontSize: '18px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              margin: '20px auto',
              display: 'block',
            }}
          />
        </div>
       
      </div>
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
         <img
      src={selectedImage}
      alt="Expanded Nova"
      style={{
        width: '500px',
        maxWidth: '90%',
        maxHeight: '90%',
        borderRadius: '12px',
      }}
    />
  </div>
)}
</>
);
}

export default BeeOneAIChat;
