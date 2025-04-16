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
  const popSound = useRef(new Audio('/sounds/pop.mp3'));

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

  // 🎤 Speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("SpeechRecognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    const transcript = lastResult[0].transcript.trim();
    if (transcript) {
      handleUserMessage(transcript);
    }
  };

  recognition.onend = () => {
    recognition.start(); // Auto-restart
  };

  recognition.start();

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
    const selectedVoice = availableVoices.find(v => v.name === novaVoiceName) || availableVoices[0];
    const speak = (textToSpeak) => {
      if (!window.speechSynthesis || !selectedVoice) return;
      const cleanedText = textToSpeak.replace(/([\u231A-\u231B]|[\u23E9-\u23FA]|[\u24C2]|[\u25AA-\u27BF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g, '');
      const parts = cleanedText.split(/(?<=[.?!])\s+/);
      const speakNext = (index) => {
        if (index >= parts.length) return;
        const sentence = parts[index].trim();
        if (!sentence) {
          speakNext(index + 1);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
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
          setTimeout(() => speakNext(index + 1), 300);
        };
        window.speechSynthesis.speak(utterance);
      };
      window.speechSynthesis.cancel();
      speakNext(0);
    };

    const isNova = sender.toLowerCase?.() === "nova";
    const newMessage = { type: 'text', content: text, isUser: !isNova };
    if (isNova) {
      setTimeout(() => {
        try {
          popSound.current.currentTime = 0;
          popSound.current.play();
        } catch (err) {
          console.error("Pop sound error:", err);
        }
        setMessages(prev => [...prev, newMessage]);
        speak(text);
      }, 1000);
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

    fetchReplyFromBackend("nova", text, memory, userName, "female").then((replyText) => {
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

  // JSX return and voiceSelector logic follows...
}

export default BeeOneAIChat;

