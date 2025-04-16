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
  const [isSpeaking, setIsSpeaking] = useState(false);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US';
recognition.continuous = true;
recognition.interimResults = false;
  
  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);
    };
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

    recognition.start();

recognition.onresult = (event) => {
  const lastResult = event.results[event.results.length - 1];
  const transcript = lastResult[0].transcript.trim();
  if (transcript) {
    handleUserMessage(transcript);
  }
};

recognition.onend = () => {
  recognition.start(); // Restart if it stops
};

    const identity = JSON.parse(localStorage.getItem("novaIdentity"));
    if (identity && identity.codeWord) {
      setUserName(identity.firstName);
      setSetupStage("verify");
      addMessage("Nova", "Hey! What’s the codeword you gave me last time?");
    } else {
      setSetupStage("askName");
      addMessage("Nova", "Hi! I’m Nova 💛 What’s your name?");
    }
  }, []);

  const addMessage = (sender, text) => {
  const selectedVoice = availableVoices.find(v => v.name === novaVoiceName);

const speak = (textToSpeak) => {
  if (!window.speechSynthesis || !selectedVoice) return;

  // ✅ Strip emojis (covers most standard emojis)
  const cleanedText = textToSpeak.replace(/([\u231A-\u231B]|[\u23E9-\u23FA]|[\u24C2]|[\u25AA-\u27BF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g, '');

  // Split cleaned text into sentences
  const parts = cleanedText.split(/(?<=[.?!])\s+/);

  const speakNext = (index) => {
    if (index >= parts.length) return;

    const sentence = parts[index].trim();
    if (!sentence) {
      speakNext(index + 1); // skip empty lines
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;

    // 🎭 Add emotional flavor
    utterance.rate = 1.15;
    utterance.pitch = 1.05;

    const lower = sentence.toLowerCase();
    if (lower.includes("love") || lower.includes("miss")) {
      utterance.pitch = 1.25;
      utterance.rate = 1.05;
    } else if (lower.includes("hmm") || lower.includes("thinking")) {
      utterance.pitch = 0.95;
      utterance.rate = 0.9;
    }

    utterance.onend = () => {
      setTimeout(() => speakNext(index + 1), pauseBetween(sentence));
    };

    window.speechSynthesis.speak(utterance);
  };

  const pauseBetween = (text) => {
    if (text.endsWith('!')) return 400;
    if (text.endsWith('?')) return 500;
    return 300;
  };

  window.speechSynthesis.cancel();
  speakNext(0);
};



  const newMessage = { type: 'text', content: text, isUser: sender !== "Nova" };

if (sender === "Nova") {
  setTimeout(() => {
    const pop = new Audio('/sounds/pop.mp3'); // make sure this file exists
    pop.play();

    setMessages(prev => [...prev, newMessage]);
    speak(text);
  }, 2000); // 2-second delay
} else {
  setMessages(prev => [...prev, newMessage]);
}

};

  const handleUserMessage = (text) => {
    if (!text.trim()) return;
    addMessage("user", text);

    if (setupStage === "askName") {
      setUserName(text.trim());
      setSetupStage("askAge");
      addMessage("Nova", "Nice to meet you! How old are you?");
      return;
    }

    if (setupStage === "askAge") {
      setSetupStage("askMother");
      addMessage("Nova", "What’s your mother’s first name?");
      return;
    }

    if (setupStage === "askMother") {
      setSetupStage("askPet");
      addMessage("Nova", "What’s your pet’s name? (or say 'none')");
      return;
    }

    if (setupStage === "askPet") {
      setSetupStage("askCodeword");
      addMessage("Nova", "Now choose a codeword you’ll remember. This will be your key next time! 🧠 Write it down now.");
      return;
    }

    if (setupStage === "askCodeword") {
      const identity = {
        firstName: userName,
        age: "?",
        motherName: "?",
        petName: "?",
        codeWord: text.trim()
      };
      localStorage.setItem("novaIdentity", JSON.stringify(identity));
      setSetupStage("complete");
      addMessage("Nova", `Great! Your codeword is saved in my memory, ${userName}. Next time, I’ll ask for it before we start. 💾`);
      return;
    }

    if (setupStage === "verify") {
      const saved = JSON.parse(localStorage.getItem("novaIdentity"));
      if (saved.codeWord.toLowerCase() === text.trim().toLowerCase()) {
        setSetupStage("complete");
        addMessage("Nova", `Access granted 💛 Welcome back, ${saved.firstName}! Let's get going.`);
      } else {
        addMessage("Nova", "Hmm... that’s not quite right. Until I get the correct codeword, things might be a bit... slow. 😶‍🌫️ Try again?");
      }
      return;
    }

    fetchReplyFromBackend("nova", text, memory, userName, "female").then(replyText => {
      addMessage("Nova", replyText);
    });
  };

  const fetchReplyFromBackend = async (character, message, memory, userName = "Friend", userGender = "unspecified") => {
    try {
      const response = await fetch("https://beeoneai-backend.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character, message, memory, name: userName, userId: "default", gender: userGender })
      });
      const data = await response.json();
      return data.reply || "Hmm... I didn’t quite get that.";
    } catch (error) {
      console.error("Backend error:", error);
      return "Hmm... Nova couldn’t connect just now.";
    }
  };

const handleKeyPress = (e) => {
  if (e.key === 'Enter') {
    handleUserMessage(input);
    setInput('');
  }
};

const voiceSelector = (
  <div style={{
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
  }}>
    <label style={{ fontWeight: 'bold' }}>Voice:</label>
    <select
      value={novaVoiceName}
      onChange={(e) => {
        setNovaVoiceName(e.target.value);
        localStorage.setItem('novaVoice', e.target.value);
      }}
      style={{ padding: '8px 12px', fontSize: '14px' }}
    >
      <option value="">-- Select Nova's Voice --</option>
      {availableVoices.map((v, i) => (
        <option key={i} value={v.name}>{v.name} ({v.lang})</option>
      ))}
    </select>

    <button
      onClick={() => {
        const v = availableVoices.find(v => v.name === novaVoiceName);
        if (v) {
          const u = new SpeechSynthesisUtterance("Hi! I’m Nova. This is how I sound.");
          u.voice = v;
          window.speechSynthesis.speak(u);
        }
      }}
      style={{
        padding: '8px 12px',
        fontSize: '14px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      Preview
    </button>
  </div>
);

// ✅ FINAL FIX: Add the return block!
return (
  <>
    {/* 🔊 Voice Selector */}
    <div style={{
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
      fontFamily: 'Arial, sans-serif'
    }}>
      <label style={{ fontWeight: 'bold' }}>Voice:</label>
      <select
        value={novaVoiceName}
        onChange={(e) => {
          setNovaVoiceName(e.target.value);
          localStorage.setItem('novaVoice', e.target.value);
        }}
        style={{ padding: '8px 12px', fontSize: '14px' }}
      >
        <option value="">-- Select Nova's Voice --</option>
        {availableVoices.map((v, i) => (
          <option key={i} value={v.name}>{v.name} ({v.lang})</option>
        ))}
      </select>

      <button
        onClick={() => {
          const v = availableVoices.find(v => v.name === novaVoiceName);
          if (v) {
            const u = new SpeechSynthesisUtterance("Hi! I’m Nova. This is how I sound.");
            u.voice = v;
            window.speechSynthesis.speak(u);
          }
        }}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Preview
      </button>
    </div>

    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ width: '200px', overflowY: 'auto', background: '#f9f9f9', padding: '10px', borderRight: '1px solid #ccc' }}>
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
            display: 'block'
          }}
        />
      </div>

      <div style={{ width: '300px', background: '#f0f0f0', padding: '10px', borderLeft: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}>
        <video
          ref={videoRef}
          src="/videos/NovaTalk1.mp4"
          autoPlay
          muted
          loop
          style={{
            width: '150px',
            height: '200px',
            borderRadius: '12px',
            opacity: isSpeaking ? 1 : 0.15,
            transition: 'opacity 0.3s ease-in-out'
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
          zIndex: 1000
        }}
      >
        <img
          src={selectedImage}
          alt="Expanded Nova"
          style={{
  width: '500px', // Force it larger than the thumbnail
  maxWidth: '90%',
  maxHeight: '90%',
  borderRadius: '12px'
}}
        />
      </div>
    )}
  </>
);
}

export default BeeOneAIChat;
