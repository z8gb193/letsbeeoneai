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
    <div className={`my-2 p-2 ${message.isUser ? 'text-right text-blue-600' : 'text-left text-gray-800'}`}>
      {message.content}
    </div>
  );
}

function BeeOneAIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('beeMessages')) || [];
    setMessages(savedMessages);
    const savedMemory = JSON.parse(localStorage.getItem('beeMemory')) || [];
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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const extractKeywords = (text) => {
    const keywords = ['sad', 'father', 'career', 'football'];
    return keywords.filter(word => text.toLowerCase().includes(word));
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
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Left Panel – Nova Image */}
      <div style={{ width: '200px', padding: '1rem', borderRight: '1px solid #ddd', textAlign: 'center' }}>
        <img src={aiCharacters.Nova.avatar} alt="Nova" style={{ width: '100%', borderRadius: '1rem' }} />
        <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Nova</p>
      </div>

      {/* Center Panel – Chat */}
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
          onKeyDown={handleKeyDown}
          placeholder="Type a message, paste image, or use voice..."
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
            onClick={handleSend}
            style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '0.5rem' }}
          >
            Send
          </button>
          <button
            onClick={() => recognitionRef.current?.start()}
            style={{ padding: '0.5rem 1rem', background: isListening ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: '0.5rem' }}
          >
            {isListening ? 'Listening...' : '🎤 Speak'}
          </button>
        </div>
      </div>

      {/* Right Panel – Placeholder for Nova Video */}
      <div style={{ width: '250px', padding: '1rem', borderLeft: '1px solid #ddd', textAlign: 'center' }}>
        <p style={{ fontWeight: 'bold' }}>🎥 Nova Video</p>
        <div style={{ background: '#eee', width: '100%', height: '200px', borderRadius: '0.5rem' }}>
          {/* Placeholder for video or animation */}
        </div>
      </div>
    </div>
  );
}

export default BeeOneAIChat;
