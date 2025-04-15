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
    ]
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
  const [accessGranted, setAccessGranted] = useState(false);
  const [userName, setUserName] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [micStatus, setMicStatus] = useState("");
  const voiceWords = ["sunflower", "echo", "crystal", "mirror", "nebula", "horizon", "flame", "ocean"];
  const [attemptsLeft, setAttemptsLeft] = useState(2);

  useEffect(() => {
   const inputName = prompt("Welcome back! Please enter your name to continue:");
const savedHistory = JSON.parse(localStorage.getItem(`novaMemory-${inputName}`)) || [];
const challengeWord = identity.voiceWords[Math.floor(Math.random() * identity.voiceWords.length)];

setMicStatus(`🎙️ Please say the word: "${challengeWord}"`);
setIsVerifying(true);
speak(`Please say the word: ${challengeWord}`); // 🔊 Nova speaks

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = false;
recognition.maxAlternatives = 1;

recognition.onresult = (event) => {
  const spokenWord = event.results[0][0].transcript.trim().toLowerCase();
  console.log("User said:", spokenWord);
  setIsVerifying(false);
  setMicStatus("");

  if (spokenWord.includes(challengeWord.toLowerCase())) {
    setUserName(inputName);
    setChatHistory(savedHistory);
    setAccessGranted(true);
  } else {
    if (attemptsLeft > 1) {
      alert("Hmm... that didn’t sound quite right. Try again.");
      setAttemptsLeft(prev => prev - 1);
      window.location.reload();
} else {
  const inputName = prompt("Welcome back! Please enter your name to continue:");
  const savedHistory = JSON.parse(localStorage.getItem(`novaMemory-${inputName}`)) || [];
  const challengeWord = identity.voiceWords[Math.floor(Math.random() * identity.voiceWords.length)];

  // ✅ Set status and speak BEFORE mic starts
  setMicStatus(`🎙️ Please say the word: "${challengeWord}"`);
  setIsVerifying(true);
  speak(`Please say the word: ${challengeWord}`);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const spokenWord = event.results[0][0].transcript.trim().toLowerCase();
    console.log("User said:", spokenWord);

    if (spokenWord.includes(challengeWord.toLowerCase())) {
      setUserName(inputName);
      setChatHistory(savedHistory);
      setAccessGranted(true);
    } else {
      if (attemptsLeft > 1) {
        alert("Hmm... that didn’t sound quite right. Try again.");
        setAttemptsLeft(prev => prev - 1);
        window.location.reload();
      } else {
        alert("🚫 Access denied. Voice verification failed.");
        document.body.innerHTML = `<div style="text-align:center;margin-top:20vh;"><h2>🚫 Locked Out</h2><p>Nova could not verify your identity. Access has been blocked.</p></div>`;
        throw new Error("Unauthorized access");
      }
    }

    setIsVerifying(false);
    setMicStatus(""); // ✅ Clear message ONLY after result
  };

  recognition.onerror = (event) => {
    console.error("Mic error:", event.error);
    setMicStatus("🚫 Mic access failed. Please allow microphone use.");
    setIsVerifying(false);
  };

  recognition.start(); // 🎤 Start mic after setting visual/speaking
}
    }
  }, []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState([]);
  const [language] = useState('en-GB');
  const [isListening, setIsListening] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (userName) {
      const savedChat = JSON.parse(localStorage.getItem(`novaMemory-${userName}`)) || [];
      setMessages(savedChat);
      setChatHistory(savedChat);
    }
  }, [userName]);

  useEffect(() => {
    localStorage.setItem(`novaMemory-${userName}`, JSON.stringify(chatHistory));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

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
    setMessages((prev) => [...prev, userMsg]);
    setMemory(updatedMemory);
    setInput('');
    const updatedChat = [...chatHistory, userMsg];
    setChatHistory(updatedChat);
    localStorage.setItem(`novaMemory-${userName}`, JSON.stringify(updatedChat));
    fetchReplyFromBackend("nova", text, updatedMemory, userName, "female").then(replyText => {
      const novaMsg = { type: 'text', content: replyText, isUser: false };
      const updated = [...updatedChat, novaMsg];
      setMessages((prev) => [...prev, novaMsg]);
      setChatHistory(updated);
      localStorage.setItem(`novaMemory-${userName}`, JSON.stringify(updated));
      speak(replyText);
    });
  };

  return accessGranted ? (
    <>
      {/* Your full layout and chat UI goes here */}
      {/* Mic Status Indicator */}
      {isVerifying && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#222',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          fontSize: '1rem',
          zIndex: 9999,
          boxShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}>
          {micStatus}
        </div>
      )}
    </>
  ) : null;
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

export default BeeOneAIChat;
