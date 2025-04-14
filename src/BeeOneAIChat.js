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
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      setIsListening(false);
    };
  }, [language]);

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
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        🌐 <strong>Language:</strong>{' '}
        {language === 'en-US' ? '🇺🇸 English' : language}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 font-bold">
          <img
            src={aiCharacters.Nova.avatar}
            alt="Nova"
            className="w-8 h-8 rounded-full"
          />
          {aiCharacters.Nova.intro}
        </div>
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        className="w-full p-2 border rounded mb-2"
        rows="3"
        placeholder="Speak or type..."
      />

      <div className="flex gap-2">
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
          className={`px-4 py-2 ${
            isListening ? 'bg-red-500' : 'bg-green-500'
          } text-white rounded`}
        >
          {isListening ? '🔇 Stop Listening' : '🎤 Speak'}
        </button>

        <button
          onClick={() => setVoiceInputEnabled(!voiceInputEnabled)}
          className={`px-4 py-2 ${
            voiceInputEnabled ? 'bg-yellow-500' : 'bg-gray-400'
          } text-white rounded`}
        >
          🎧 Voice {voiceInputEnabled ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );
}

export default BeeOneAIChat;

