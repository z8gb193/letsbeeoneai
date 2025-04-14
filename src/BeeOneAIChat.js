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
  // ...other characters...
};  // <— ✅ This closing brace MUST be here

function ChatMessage({ message }) {
  if (message.type === 'text') return <div className="my-2">{message.content}</div>;
  if (message.type === 'image') return <img src={message.content} alt="Shared" className="my-2 rounded" />;
  return null;
}

function BeeOneAIChat() {
  const [messages, setMessages] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('beeMessages')) || [];
    if (saved.length > 0 && saved.every(m => typeof m.content === 'string' && m.content.startsWith('New: Message'))) {
      localStorage.removeItem('beeMessages');
      return [];
    }
    return saved;
  });

  const [input, setInput] = useState('');
  const [activeAIs, setActiveAIs] = useState(['Nova']);
  const [memory, setMemory] = useState(() => JSON.parse(localStorage.getItem('beeMemory')) || []);
  const [language, setLanguage] = useState('en-US');
  const [voiceInputEnabled, setVoiceInputEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('beeMessages', JSON.stringify(messages));
    localStorage.setItem('beeMemory', JSON.stringify(memory));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, memory]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      setInput(prev => prev + ' ' + transcript);
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      setIsListening(false);
    };
  }, [language]);

  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const replies = activeAIs.map(ai => aiCharacters[ai].response('', memory));
          const responses = replies.map(r => ({ type: 'text', content: r }));
          setMessages(prev => [...prev, { type: 'image', content }, ...responses]);
          replies.forEach(speak);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  const extractKeywords = (text) => {
    const keywords = ['sad', 'father', 'career', 'football'];
    return keywords.filter(word => text.toLowerCase().includes(word));
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { type: 'text', content: input };
    const newMemory = extractKeywords(input);
    if (newMemory.length) setMemory(prev => Array.from(new Set([...prev, ...newMemory])));
    const aiReplies = activeAIs.map(ai => aiCharacters[ai].response(input, memory));
    const aiMsgs = aiReplies.map(reply => ({ type: 'text', content: reply }));
    setMessages(prev => [...prev, userMsg, ...aiMsgs]);
    aiReplies.forEach(speak);
    setInput('');
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    window.speechSynthesis.speak(utter);
  };

  const toggleAI = (name) => {
    setActiveAIs(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...(prev.length === 2 ? prev.slice(1) : prev), name]
    );
  };

 return (
  <div className="p-4" onPaste={handlePaste}>
    <div className="flex gap-2 mb-4">
      {Object.keys(aiCharacters).map((name) => (
        <button
          key={name}
          onClick={() => toggleAI(name)}
          className={`px-3 py-1 rounded-full text-sm ${
            activeAIs.includes(name) ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          {aiCharacters[name].name}
        </button>
      ))}
    </div>

    <div className="mb-4">
      🌐 <strong>Language:</strong> 🇺🇸 English
    </div>

    <div className="mb-4">
      {activeAIs.map(ai => (
        <div key={ai} className="font-bold">
          {aiCharacters[ai].intro}
        </div>
      ))}
    </div>

    <div className="mb-4">
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} message={msg} />
      ))}
      <div ref={chatEndRef} />
    </div>

    <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      className="w-full p-2 border rounded mb-2"
      rows="3"
      placeholder="Type a message, paste image, or use voice..."
    />

    <div className="flex gap-2">
      <button onClick={handleSend} className="px-4 py-2 bg-blue-500 text-white rounded">
        Send
      </button>
      <button
        onClick={() => {
          if (voiceInputEnabled) {
            recognitionRef.current?.start();
            setIsListening(true);
          }
        }}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        🎤 Speak to Nova (ON)
      </button>
      <button
        onClick={() => {
          recognitionRef.current?.stop();
          setIsListening(false);
        }}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        🔇 Speak to Nova (OFF)
      </button>
      <button
        onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
        className={`px-4 py-2 ${
          voiceInputEnabled ? 'bg-yellow-500' : 'bg-gray-400'
        } text-white rounded`}
      >
        🎛️ Voice {voiceInputEnabled ? 'On' : 'Off'}
      </button>
    </div>
</div>
  );
}  // ✅ ← this closes the BeeOneAIChat function

export default BeeOneAIChat;
