import React, { useState, useEffect, useRef } from 'react';

const aiCharacters = {
  Nova: {
    name: 'Nova',
    intro: 'Hi, I’m Nova. Let’s grow together.',
    avatar: '/avatars/Nova.PNG',
    response: (msg, memory) => {
      if (memory.includes('sad')) return "I’m here for you, always.";
      return "Thanks for sharing that.";
    },
  },
};

function ChatMessage({ message }) {
  return (
    <div
      className={`my-2 ${
        message.isUser ? 'text-right text-blue-600' : 'text-left text-gray-800'
      }`}
    >
      {message.content}
    </div>
  );
}

function BeeOneAIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState([]);
  const [language, setLanguage] = useState('en-US');
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('beeMessages')) || [];
    const savedMemory = JSON.parse(localStorage.getItem('beeMemory')) || [];
    setMessages(savedMessages);
    setMemory(savedMemory);
  }, []);

  useEffect(() => {
    localStorage.setItem('beeMessages', JSON.stringify(messages));
    localStorage.setItem('beeMemory', JSON.stringify(memory));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, memory]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(), 500);
    };
    recognition.onend = () => {
      if (isListening) recognition.start();
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      setIsListening(false);
    };
  }, [language, isListening]);

  const extractKeywords = (text) => {
    const keywords = ['sad', 'father', 'career', 'football'];
    return keywords.filter((word) => text.toLowerCase().includes(word));
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { type: 'text', content: input, isUser: true };
    const newMemory = extractKeywords(input);
    const updatedMemory = Array.from(new Set([...memory, ...newMemory]));
    setMemory(updatedMemory);

    const replyText = aiCharacters.Nova.response(input, updatedMemory);
    const novaMsg = { type: 'text', content: replyText, isUser: false };

    setMessages((prev) => [...prev, userMsg, novaMsg]);
    speak(replyText);
    setInput('');
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Left Panel */}
      <div style={{ width: '200px', padding: '1rem', borderRight: '1px solid #ddd', textAlign: 'center' }}>
        <img src={aiCharacters.Nova.avatar} alt="Nova" style={{ width: '100%', borderRadius: '1rem' }} />
        <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Nova</p>
      </div>

      {/* Center Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', background: '#f9f9f9', padding: '1rem', borderRadius: '0.5rem' }}>
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}
          <div ref={chatEndRef} />
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type or speak your message..."
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #ccc',
            width: '100%',
            resize: 'none',
            fontSize: '1rem',
            height: '80px',
          }}
        />

        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => {
              if (isListening) {
                recognitionRef.current?.stop();
                setIsListening(false);
              } else {
                recognitionRef.current?.start();
                setIsListening(true);
              }
            }}
            style={{ padding: '0.5rem 1rem', background: isListening ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: '0.5rem' }}
          >
            {isListening ? '🔇 Stop Listening' : '🎤 Speak'}
          </button>

          <button
            onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
            style={{ padding: '0.5rem 1rem', background: voiceInputEnabled ? '#ffc107' : '#6c757d', color: 'white', border: 'none', borderRadius: '0.5rem' }}
          >
            🎛️ Voice {voiceInputEnabled ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: '250px', padding: '1rem', borderLeft: '1px solid #ddd', textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold' }}>🎥 Nova Video</p>
        <div style={{ background: '#eee', width: '100%', height: '200px', borderRadius: '0.5rem' }}>
          {/* Placeholder for future video */}
        </div>
      </div>
    </div>
  );
}

export default BeeOneAIChat;


