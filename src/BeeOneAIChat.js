import React, { useState, useEffect, useRef } from 'react'; 

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

  useEffect(() => {
    const identity = JSON.parse(localStorage.getItem("novaIdentity"));

    if (identity) {
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
      addMessage("Nova", "Now pick a codeword I’ll remember you by forever 💾. Write it down!");
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
      addMessage("Nova", `Got it, ${userName}. Your codeword is saved! Let’s begin 💛`);
      return;
    }

    if (setupStage === "verify") {
      const saved = JSON.parse(localStorage.getItem("novaIdentity"));
      if (saved.codeWord.toLowerCase() === text.trim().toLowerCase()) {
        setSetupStage("complete");
        addMessage("Nova", `Access granted 💛 Welcome back, ${saved.firstName}`);
      } else {
        addMessage("Nova", "Hmm... that’s not it. Want to try again?");
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
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ height: '70vh', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type your message..."
        style={{ width: '100%', padding: '10px', marginTop: '10px' }}
      />
    </div>
  );
}

export default BeeOneAIChat;

