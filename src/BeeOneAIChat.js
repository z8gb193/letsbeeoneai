import React, { useState, useEffect, useRef } from 'react'; 

const novaImages = [
  '/avatars/Nova.png',
  '/avatars/Nova1.png',
  '/avatars/Nova2.png',
  '/avatars/Nova3.png',
  '/avatars/Nova4.png',
  '/avatars/Nova5.png',
  '/avatars/Nova6.png'
];

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
  const [userName, setUserName] = useState('');
  const [setupStage, setSetupStage] = useState('start');
  const [memory, setMemory] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
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
    const newMessage = { type: 'text', content: text, isUser: sender !== "Nova" ? true : false };
    setMessages(prev => [...prev, newMessage]);
    if (sender === "Nova") speak(text);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const synth = window.speechSynthesis;

    const speakWithVoice = () => {
      const voices = synth.getVoices();
      const selectedVoice = voices.find(v => v.name === 'Microsoft Libby Online (Natural)') ||
                            voices.find(v => v.lang === 'en-GB' && v.name.toLowerCase().includes('female')) ||
                            voices.find(v => v.lang === 'en-GB') ||
                            voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
                            voices.find(v => v.lang.startsWith('en')) ||
                            voices[0];

      const segments = text.split(/(\.\.\.|\.|,|!|\?|
)/g).filter(Boolean);

      const speakNext = (index) => {
        if (index >= segments.length) return;

        const utter = new SpeechSynthesisUtterance(segments[index]);
        utter.voice = selectedVoice;
        utter.lang = selectedVoice?.lang || 'en-GB';
        utter.rate = 1;
        utter.pitch = 1;

        utter.onend = () => {
          setTimeout(() => speakNext(index + 1), 800 + Math.random() * 1500);
        };

        synth.speak(utter);
      };

      synth.cancel();
      speakNext(0);
    };

    if (synth.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakWithVoice();
    } else {
      speakWithVoice();
    }
};

      synth.speak(utter);
    };

    synth.cancel();
    speakNext(0);
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

    // Normal conversation after setup
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

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* Left Panel - Nova Images */}
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

      {/* Center Panel - Chat */}
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
          style={{ width: '100%', padding: '10px', borderTop: '1px solid #ccc' }}
        />
      </div>

      {/* Right Panel - Nova Video */}
      <div style={{ width: '300px', background: '#f0f0f0', padding: '10px', borderLeft: '1px solid #ccc' }}>
        <video
          ref={videoRef}
          src="/videos/NovaTalk1.mp4"
          autoPlay
          muted
          loop
          style={{ width: '100%', borderRadius: '12px' }}
        />
      </div>

      {/* Modal for Expanded Image */}
      {selectedImage && (
        <div onClick={() => setSelectedImage(null)} style={{
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
        }}>
          <img src={selectedImage} alt="Expanded Nova" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px' }} />
        </div>
      )}
    </div>
  );
}

export default BeeOneAIChat;




