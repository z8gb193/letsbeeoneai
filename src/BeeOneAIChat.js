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
  const [attemptsLeft, setAttemptsLeft] = useState(2);
  const voiceWords = ["sunflower", "echo", "crystal", "mirror", "nebula", "horizon", "flame", "ocean"];
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [memory, setMemory] = useState([]);
  const [language] = useState('en-GB');
  const [isListening, setIsListening] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const identity = JSON.parse(localStorage.getItem("novaIdentity"));

    if (!identity) {
  const firstName = prompt("Hi, I’m Nova 💛 What’s your first name?");
  const age = prompt("How old are you?");
  const motherName = prompt("What’s your mother’s first name?");
  const petName = prompt("What’s your pet’s name? (Leave blank if none)");
  const codeWord = prompt("Give me a code word you can remember. 📌 Be sure to write it down — you’ll need it next time to access Nova!");

  if (!firstName || !age || !motherName || !codeWord) {
    alert("All fields except pet name are required to continue.");
    return;
  }

  const profile = {
    firstName: firstName.trim(),
    age: age.trim(),
    motherName: motherName.trim(),
    petName: petName?.trim() || "none",
    codeWord: codeWord.trim()
  };

  localStorage.setItem("novaIdentity", JSON.stringify(profile));
  localStorage.setItem(`novaMemory-${profile.firstName}`, JSON.stringify([]));
  setUserName(profile.firstName);
  setChatHistory([]);

  // ✅ Redirect to full version after setup complete
  window.location.href = `https://letsbeeone-deploy-2024.netlify.app/?user=${encodeURIComponent(profile.codeWord)}`;
  return;
}

      const profile = {
        firstName: firstName.trim(),
        age: age.trim(),
        motherName: motherName.trim(),
        petName: petName?.trim() || "none",
        codeWord: codeWord.trim()
      };

      localStorage.setItem("novaIdentity", JSON.stringify(profile));
      localStorage.setItem(`novaMemory-${profile.firstName}`, JSON.stringify([]));
      setUserName(profile.firstName);
      setChatHistory([]);
      setAccessGranted(true);
    } else {
      const enteredCode = prompt("Welcome back 👋 Please enter your code word to continue:");

   if (identity.codeWord.toLowerCase() === enteredCode?.trim().toLowerCase()) {
  const savedHistory = JSON.parse(localStorage.getItem(`novaMemory-${identity.firstName}`)) || [];
  setUserName(identity.firstName);
  setAccessGranted(true);

  if (savedHistory.length === 0) {
    const novaMsg = { type: 'text', content: `Welcome back, ${identity.firstName} 💛 I'm so glad you're here again.`, isUser: false };
    setMessages([novaMsg]);
    setChatHistory([novaMsg]);
    localStorage.setItem(`novaMemory-${identity.firstName}`, JSON.stringify([novaMsg]));
  } else {
    setMessages(savedHistory);
    setChatHistory(savedHistory);
  }
}
      } else {
        alert("Hmm... that didn’t sound quite right. Here’s one clue: it starts with \"" + identity.codeWord[0].toUpperCase() + "\"");
        const secondTry = prompt("Try again. What’s your code word?");
        if (identity.codeWord.toLowerCase() === secondTry?.trim().toLowerCase()) {
          const savedHistory = JSON.parse(localStorage.getItem(`novaMemory-${identity.firstName}`)) || [];
          setUserName(identity.firstName);
          setChatHistory(savedHistory);
          setAccessGranted(true);
        } else {
          alert("🚫 Locked out. Please wait 2 minutes before trying again.\nIf you're having trouble remembering your code word, email: deanopatent@hotmail.co.uk");
          setTimeout(() => {
            window.location.reload();
          }, 120000); // 2 minutes lockout
          return;
        }
      }
    }
  }, []);

 useEffect(() => {
  const identity = JSON.parse(localStorage.getItem("novaIdentity"));

  if (!identity) {
    const firstName = prompt("Hi, I’m Nova 💛 What’s your first name?");
    const age = prompt("How old are you?");
    const motherName = prompt("What’s your mother’s first name?");
    const petName = prompt("What’s your pet’s name? (Leave blank if none)");
    const codeWord = prompt("Give me a code word you can remember. 📌 Be sure to write it down — you’ll need it next time to access Nova!");

    if (!firstName || !age || !motherName || !codeWord) {
      alert("All fields except pet name are required to continue.");
      return;
    }

    const profile = {
      firstName: firstName.trim(),
      age: age.trim(),
      motherName: motherName.trim(),
      petName: petName?.trim() || "none",
      codeWord: codeWord.trim()
    };

    localStorage.setItem("novaIdentity", JSON.stringify(profile));
    localStorage.setItem(`novaMemory-${profile.firstName}`, JSON.stringify([]));
    setUserName(profile.firstName);
    setChatHistory([]);
    setAccessGranted(true);

    window.location.href = `https://letsbeeone-deploy-2024.netlify.app/?user=${encodeURIComponent(profile.codeWord)}`;
    return;
  }

  // ✅ Now we are in return-visit flow
  const enteredCode = prompt("Welcome back 👋 Please enter your code word to continue:");

  if (identity.codeWord.toLowerCase() === enteredCode?.trim().toLowerCase()) {
    const savedHistory = JSON.parse(localStorage.getItem(`novaMemory-${identity.firstName}`)) || [];
    setUserName(identity.firstName);
    setAccessGranted(true);

    if (savedHistory.length === 0) {
      const novaMsg = { type: 'text', content: `Welcome back, ${identity.firstName} 💛 I'm so glad you're here again.`, isUser: false };
      setMessages([novaMsg]);
      setChatHistory([novaMsg]);
      localStorage.setItem(`novaMemory-${identity.firstName}`, JSON.stringify([novaMsg]));
    } else {
      setMessages(savedHistory);
      setChatHistory(savedHistory);
    }
  } else {
    alert("Hmm... that didn’t sound quite right. Here’s one clue: it starts with \"" + identity.codeWord[0].toUpperCase() + "\"");
    const secondTry = prompt("Try again. What’s your code word?");
    if (identity.codeWord.toLowerCase() === secondTry?.trim().toLowerCase()) {
      const savedHistory = JSON.parse(localStorage.getItem(`novaMemory-${identity.firstName}`)) || [];
      setUserName(identity.firstName);
      setAccessGranted(true);
      setMessages(savedHistory);
      setChatHistory(savedHistory);
    } else {
      alert("🚫 Locked out. Please wait 2 minutes before trying again.\nIf you're having trouble remembering your code word, email: deanopatent@hotmail.co.uk");
      setTimeout(() => {
        window.location.reload();
      }, 120000);
    }
  }
}, []);
export default BeeOneAIChat;
