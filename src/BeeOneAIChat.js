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

  // Load voices
  const storedMemory = JSON.parse(localStorage.getItem('novaMemory')) || [];
  setMemory(storedMemory);
  const synth = window.speechSynthesis;
  const loadVoices = () => {
    const voices = synth.getVoices();
    setAvailableVoices(voices);
    console.log('Loaded voices:', voices.map(v => v.name)); // Debug log
    // Set first voice as default if none selected
    if (voices.length && !novaVoiceName) {
      const firstVoice = voices[0].name;
      setNovaVoiceName(firstVoice);
      localStorage.setItem('novaVoice', firstVoice);
      console.log('Set default voice:', firstVoice); // Debug log
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
        console.log('Speech transcript:', transcript); // Debug log
        if (transcript) {
          handleUserMessage(transcript);
        }
      }
    };

    recognition.onend = () => {
      console.log('Recognition restarting'); // Debug log
      recognition.start();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error); // Debug log
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

  // Cleanup
  return () => {
    if (recognition) recognition.stop();
    synth.cancel();
  };
}, []);

  const addMessage = (sender, text) => {
    console.log('Adding message:', { sender, text }); // Debug log
    const isNova = sender.toLowerCase() === 'nova';
    const newMessage = { type: 'text', content: text, isUser: !isNova };

    setMessages((prev) => [...prev, newMessage]);

    // Speak all Nova messages
    // if (isNova && window.speechSynthesis) {
//   ...
//   window.speechSynthesis.speak(utterance);
// }

  const handleUserMessage = (text) => {
    console.log('Handling user message:', text); // Debug log
    if (!text.trim()) return;
    addMessage('user', text);

if (setupStage === 'askName') {
  const name = text.trim();
  setUserName(name);
  saveToMemory(`User's name is ${name}`);
  setSetupStage('askAge');
  addMessage('Nova', 'Nice to meet you! How old are you?');
  return;
}

if (setupStage === 'askAge') {
  saveToMemory(`User is ${text.trim()} years old`);
  setSetupStage('askMother');
  addMessage('Nova', 'What’s your mother’s first name?');
  return;
}

if (setupStage === 'askMother') {
  saveToMemory(`User's mother is named ${text.trim()}`);
  setSetupStage('askPet');
  addMessage('Nova', 'What’s your pet’s name? (or say "none")');
  return;
}

if (setupStage === 'askPet') {
  saveToMemory(`User's pet is named ${text.trim()}`);
  setSetupStage('askCodeword');
  addMessage('Nova', 'Now choose a codeword you’ll remember. This will be your key next time! 🧠 Write it down now.');
  return;
}

if (setupStage === 'askCodeword') {
  const code = text.trim();
  saveToMemory(`User's codeword is ${code}`);
  const identity = {
    firstName: userName,
    age: '?',
    motherName: '?',
    petName: '?',
    codeWord: code,
  };
  localStorage.setItem('novaIdentity', JSON.stringify(identity));
  setSetupStage('complete');
  addMessage('Nova', `Great! Your codeword is saved in my memory, ${userName}. Next time, I’ll ask for it before we start. 💾`);
  return;
}

    if (setupStage === 'verify') {
      const saved = JSON.parse(localStorage.getItem('novaIdentity'));
      if (saved.codeWord.toLowerCase() === text.trim().toLowerCase()) {
        setSetupStage('complete');
        addMessage('Nova', `Access granted 💛 Welcome back, ${saved.firstName}! Let's get going.`);
      } else {
        addMessage('Nova', 'Hmm... that’s not quite right. Until I get the correct codeword, things might be a bit... slow. 😶‍🌫️ Try again?');
      }
      return;
    }

 fetchReplyFromBackend('nova', text, memory, userName, 'female').then((replyText) => {
  addMessage('Nova', replyText);
  // Optional: Save fact if user says something like "I love astronomy"
  if (text.toLowerCase().includes('i love')) {
    saveToMemory(`User loves: ${text.slice(text.toLowerCase().indexOf('i love') + 7)}`);
  }
});
  };

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUserMessage(input);
      setInput('');
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#ffffff',
          padding: '12px 20px',
          border: '1px solid #ccc',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <label style={{ fontWeight: 'bold' }}>Voice:</label>
        <select
          value={novaVoiceName}
          onChange={(e) => {
            setNovaVoiceName(e.target.value);
            localStorage.setItem('novaVoice', e.target.value);
            console.log('Voice changed to:', e.target.value); // Debug log
          }}
          style={{ padding: '8px 12px', fontSize: '14px' }}
        >
          <option value="">-- Select Nova's Voice --</option>
          {availableVoices.map((v, i) => (
            <option key={i} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            const v = availableVoices.find((v) => v.name === novaVoiceName) || availableVoices[0];
            if (v) {
              const u = new SpeechSynthesisUtterance('Hi! I’m Nova. This is how I sound.');
              u.voice = v;
              window.speechSynthesis.speak(u);
              console.log('Preview voice:', v.name); // Debug log
            }
          }}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Preview
        </button>
      </div>

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
