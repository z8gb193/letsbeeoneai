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
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
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

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
  }

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const voices = synth.getVoices();
      setAvailableVoices(voices);
      if (voices.length && !novaVoiceName) {
        const firstVoice = voices[0].name;
        setNovaVoiceName(firstVoice);
        localStorage.setItem('novaVoice', firstVoice);
      }
    };
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

    if (recognition) {
      recognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          if (transcript) handleUserMessage(transcript);
        }
      };
      recognition.onend = () => recognition.start();
      recognition.onerror = (event) => console.error('Speech recognition error:', event.error);
      recognition.start();
    }

    const identity = JSON.parse(localStorage.getItem('novaIdentity'));
    if (identity && identity.codeWord) {
      setUserName(identity.firstName);
      setSetupStage('verify');
      addMessage('Nova', 'Hey! What’s the codeword you gave me last time?');
    } else {
      setSetupStage('askName');
      addMessage('Nova', 'Hi! I’m Nova 💛 What’s your name?');
    }

    return () => {
      if (recognition) recognition.stop();
      synth.cancel();
    };
  }, []);

  const addMessage = (sender, text) => {
    const isNova = sender.toLowerCase() === 'nova';
    const newMessage = { type: 'text', content: text, isUser: !isNova };
    setMessages((prev) => [...prev, newMessage]);

    if (isNova && window.speechSynthesis) {
      const selectedVoice = availableVoices.find(v => v.name === novaVoiceName) || availableVoices[0];
      if (!selectedVoice) return;

      if (recognition) recognition.stop();
      window.speechSynthesis.cancel();

      const cleanedText = text.replace(/[\u231A-\u231B]|[\u23E9-\u23FA]|[\u24C2]|[\u25AA-\u27BF]|[\uD83C-\uDBFF\uDC00-\uDFFF]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.voice = selectedVoice;
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        if (recognition) recognition.start();
      };
      utterance.onerror = () => {
        if (recognition) recognition.start();
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleUserMessage = (text) => {
    if (!text.trim()) return;
    addMessage('user', text);

    if (setupStage === 'askName') {
      setUserName(text.trim());
      setSetupStage('askAge');
      addMessage('Nova', 'Nice to meet you! How old are you?');
      return;
    }
    if (setupStage === 'askAge') {
      setSetupStage('askMother');
      addMessage('Nova', 'What’s your mother’s first name?');
      return;
    }
    if (setupStage === 'askMother') {
      setSetupStage('askPet');
      addMessage('Nova', 'What’s your pet’s name? (or say "none")');
      return;
    }
    if (setupStage === 'askPet') {
      setSetupStage('askCodeword');
      addMessage('Nova', 'Now choose a codeword you’ll remember. This will be your key next time! 🧠 Write it down now.');
      return;
    }
    if (setupStage === 'askCodeword') {
      const identity = { firstName: userName, age: '?', motherName: '?', petName: '?', codeWord: text.trim() };
      localStorage.setItem('novaIdentity', JSON.stringify(identity));
      setSetupStage('complete');
      addMessage('Nova', `Great! Your codeword is saved in my memory, ${userName}. Next time, I’ll ask for it before we start. 💾`);
      return;
    }
    if (setupStage === 'verify') {
      const saved = JSON.parse(localStorage.getItem('novaIdentity'));
      if (saved.codeWord.toLowerCase() === text.trim().toLowerCase()) {
        setSetupStage('complete');
        addMessage('Nova', `Access granted 💛 Welcome back, ${saved.firstName}! Let's get going.`);
      } else {
        addMessage('Nova', 'Hmm... that’s not quite right. Until I get the correct codeword, things might be a bit... slow. 😶‍🌫️ Try again?');
      }
      return;
    }

    fetchReplyFromBackend('nova', text, memory, userName, 'female').then((replyText) => {
      addMessage('Nova', replyText);
    });
  };

  const fetchReplyFromBackend = async (character, message, memory, userName = 'Friend', userGender = 'unspecified') => {
    try {
      const response = await fetch('https://beeoneai-backend.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, message, memory, name: userName, userId: 'default', gender: userGender })
      });
      const data = await response.json();
      return data.reply || 'Hmm... I didn’t quite get that.';
    } catch (error) {
      console.error('Backend error:', error);
      return 'Hmm... Nova couldn’t connect just now.';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUserMessage(input);
      setInput('');
    }
  };

  return (
    <></>
  );
}

export default BeeOneAIChat;
