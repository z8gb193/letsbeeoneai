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
    <div className={`my-2 ${message.isUser ? 'text-right text-blue-600' : 'text-left text-gray-800'}`}>
      {message.content}
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
      const cleanText = textToSpeak.replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      utterance.rate = 1.4;
      utterance.pitch = 1.1;

      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch((e) => console.warn("Video play failed:", e));
      }

      window.speechSynthesis.speak(utterance);

      utterance.onend = () => {
        setIsSpeaking(false);
        if (videoRef.current) {
          videoRef.current.pause();
        }
      };
    };

    const newMessage = { type: 'text', content: text, isUser: sender !== "Nova" };
    setMessages(prev => [...prev, newMessage]);
    if (sender === "Nova") speak(text);
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

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Your full layout here */}
    </div>
  );
}

export default BeeOneAIChat;
