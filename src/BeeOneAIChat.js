import React, { useState, useEffect, useRef } from 'react';

const aiCharacters = {
  Nova: {
    name: 'Nova',
    avatar: '/avatars/Nova.png',
    gallery: [
      '/avatars/Nova.png',
      '/avatars/Nova1.png',
      '/avatars/Nova2.png',
      '/avatars/Nova3.png',
      '/avatars/Nova4.png',
      '/avatars/Nova5.png',
      '/avatars/Nova6.png',
    ],
    response: (msg, memory) => {
      if (memory.includes('sad')) return "I’m here for you, always.";
      return "Thanks for sharing that.";
    },
  },
};

function ChatMessage({ message }) {
  return (
    <div className={`my-2 ${message.isUser ? 'text-right text-blue-600' : 'text-left text-gray-800'}`}>
      {message.content}
    </div>
  );
}

function BeeOneAIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState([]);
  const [language] = useState('en-GB');
  const [isListening, setIsListening] = useState(false);
  const [modalImage, setModalImage] = useState(null);
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

    recognition.onresult = (event) => {
      const transcript = event.results[event.resultIndex][0].transcript;
      handleUserMessage(transcript);
    };

    recognition.onend = () => {
      if (isListening) recognition.start();
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, [isListening, language]);

  const extractKeywords = (text) => {
    const keywords = ['sad', 'father', 'career', 'football'];
    return keywords.filter((word) => text.toLowerCase().includes(word));
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const synth = window.speechSynthesis;

    const speakNow = () => {
      const voices = synth.getVoices();
      const selectedVoice = voices.find(v => v.name === 'Microsoft Libby Online (Natural)') || voices[0];

      const utter = new SpeechSynthesisUtterance(text);
      utter.voice = selectedVoice;
      utter.lang = selectedVoice?.lang || 'en-GB';
      utter.rate = 1;
      utter.pitch = 1;
      synth.cancel();
      synth.speak(utter);
    };

    if (synth.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakNow();
    } else {
      speakNow();
    }
  };

  const handleUserMessage = (text) => {
    const userMsg = { type: 'text', content: text, isUser: true };
    const newMemory = extractKeywords(text);
    const updatedMemory = Array.from(new Set([...memory, ...newMemory]));
    const replyText = aiCharacters.Nova.response(text, updatedMemory);
    const novaMsg = { type: 'text', content: replyText, isUser: false };

    setMessages((prev) => [...prev, userMsg, novaMsg]);
    setMemory(updatedMemory);
    setInput('');
    speak(replyText);
  };

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
        {/* Left Panel – Nova Gallery */}
        <div style={{
          width: '200px',
          padding: '1rem',
          borderRight: '1px solid #ddd',
          textAlign: 'center',
          overflowY: 'auto',
          maxHeight: '100vh',
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Nova</p>
          {aiCharacters.Nova.gallery.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Nova ${idx}`}
              style={{
                width: '100%',
                borderRadius: '1rem',
                marginBottom: '0.75rem',
                cursor: 'pointer',
              }}
              onClick={() => setModalImage(src)}
            />
          ))}
        </div>

        {/* Center Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: '#f9f9f9',
            padding: '1rem',
            borderRadius: '0.5rem'
          }}>
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
                handleUserMessage(input);
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
              style={{
                padding: '0.5rem 1rem',
                background: isListening ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
              }}
            >
              {isListening ? '🔇 Stop Listening' : '🎤 Speak'}
            </button>
          </div>
        </div>

        {/* Right Panel – Nova Video */}
        <div style={{ width: '250px', padding: '1rem', borderLeft: '1px solid #ddd', textAlign: 'center' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>🎥 Nova Talking</p>
          <video
            src="/videos/NovaTalk1.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              borderRadius: '1rem',
              boxShadow: '0 0 8px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>

      {/* Modal Image Viewer */}
      {modalImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={modalImage}
              alt="Expanded Nova"
              style={{
                maxWidth: '80vw',
                maxHeight: '80vh',
                borderRadius: '1rem',
                boxShadow: '0 0 15px rgba(0,0,0,0.8)',
              }}
            />
            <button
              onClick={() => setModalImage(null)}
              style={{
                position: 'absolute',
                top: '-1rem',
                right: '-1rem',
                fontSize: '1.5rem',
                background: '#fff',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                width: '2rem',
                height: '2rem',
                lineHeight: '2rem',
              }}
            >
              ❌
            </button>
          </div>
        </div>
      )}
    </>
  );
}

async function fetchReplyFromBackend(character, message, memory, userName = "Friend", userGender = "unspecified") {
  try {
    const response = await fetch("https://beeoneai-backend.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        character,
        message,
        memory,
        name: userName,
        userId: "default",
        gender: userGender
      })
    });

    const data = await response.json();
    return data.reply || "Hmm... I didn’t quite get that.";
  } catch (error) {
    console.error("Backend error:", error);
    return "Hmm... Nova couldn’t connect just now.";
  }
}

export default fetchReplyFromBackend;
