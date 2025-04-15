// FULL UPDATED BeeOneAIChat.js
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
  const identity = JSON.parse(localStorage.getItem("novaIdentity"));

  if (!identity) {
    const firstName = prompt("Hi, I’m Nova 💛 What’s your first name?");
    const petName = prompt("Do you have a pet? If so, what’s their name? (Leave blank if none)");
    const motherName = prompt("What’s your mother’s first name?");
    const age = prompt("How old are you?");

    if (!firstName || !motherName || !age) {
      alert("All fields except pet name are required to continue.");
      return;
    }

    const profile = {
      firstName: firstName.trim(),
      petName: petName?.trim() || "none",
      motherName: motherName.trim(),
      age: age.trim()
    };

    localStorage.setItem("novaIdentity", JSON.stringify(profile));
    localStorage.setItem(`novaMemory-${profile.firstName}`, JSON.stringify([]));
    setUserName(profile.firstName);
    setChatHistory([]);
    setAccessGranted(true);
  } else {
    const savedHistory = JSON.parse(localStorage.getItem(`novaMemory-${identity.firstName}`)) || [];
    setUserName(identity.firstName);
    setChatHistory(savedHistory);
    setAccessGranted(true);
  }
});
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
      {/* Existing layout here... */}

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

