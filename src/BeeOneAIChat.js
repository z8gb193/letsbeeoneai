import { useState, useEffect, useRef } from 'react';

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

  // Function to add a message to the chat
  const addMessage = (sender, text) => {
    setMessages((prevMessages) => [...prevMessages, { sender, text }]);
  };

  // Function to handle text-to-speech
  const speakResponse = (text) => {
    if (!text || isSpeaking) return; // Skip if already speaking or no text
    const synth = window.speechSynthesis;
    
    // Cancel any ongoing speech
    synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Select voice based on novaVoiceName, fallback to first available voice
    const selectedVoice = availableVoices.find(voice => voice.name === novaVoiceName);
    utterance.voice = selectedVoice || availableVoices[0] || null;
    utterance.lang = 'en-US';

    // Pause recognition to prevent feedback
    recognition.stop();

    setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      recognition.start(); // Resume recognition after speaking
    };

    // Handle errors in speech synthesis
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      recognition.start(); // Resume recognition on error
    };

    synth.speak(utterance);
  };

  // Function to handle user messages (text or speech input)
  const handleUserMessage = async (userInput) => {
    // Add user message to chat
    addMessage('User', userInput);

    // Simulate Nova's response (replace with actual API call or logic)
    let novaResponse;
    if (setupStage === 'askName') {
      novaResponse = `Nice to meet you, ${userInput}! Let’s set a codeword for next time. What’s a fun word you’ll remember?`;
      setUserName(userInput);
      setSetupStage('setCodeWord');
      // Save to localStorage (example)
      localStorage.setItem('novaIdentity', JSON.stringify({ firstName: userInput, codeWord: '' }));
    } else if (setupStage === 'verify') {
      const identity = JSON.parse(localStorage.getItem('novaIdentity'));
      if (userInput.toLowerCase() === identity.codeWord.toLowerCase()) {
        novaResponse = `Codeword verified! Welcome back, ${userName}! What’s on your mind?`;
        setSetupStage('chat');
      } else {
        novaResponse = `Hmm, that’s not the codeword I have. Try again?`;
      }
    } else if (setupStage === 'setCodeWord') {
      novaResponse = `Got it! I’ll remember "${userInput}" as your codeword. What’s up?`;
      setSetupStage('chat');
      localStorage.setItem('novaIdentity', JSON.stringify({ firstName: userName, codeWord: userInput }));
    } else {
      novaResponse = `You said: ${userInput}. How can I help you today?`; // Default response
    }

    // Add Nova's response to chat
    addMessage('Nova', novaResponse);

    // Speak Nova's response
    speakResponse(novaResponse);
  };

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

    // Start speech recognition
    recognition.start();

    // Handle speech recognition results
    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.trim();
      if (transcript) {
        handleUserMessage(transcript);
      }
    };

    // Restart recognition if it stops
    recognition.onend = () => {
      if (!isSpeaking) {
        recognition.start(); // Only restart if not speaking
      }
    };

    // Handle initial setup based on novaIdentity
    const identity = JSON.parse(localStorage.getItem('novaIdentity'));
    if (identity && identity.codeWord) {
      setUserName(identity.firstName);
      setSetupStage('verify');
      addMessage('Nova', 'Hey! What’s the codeword you gave me last time?');
      speakResponse('Hey! What’s the codeword you gave me last time?');
    } else {
      setSetupStage('askName');
      addMessage('Nova', 'Hi! I’m Nova 💛 What’s your name?');
      speakResponse('Hi! I’m Nova 💛 What’s your name?');
    }

    // Cleanup on component unmount
    return () => {
      recognition.stop();
      synth.cancel();
    };
  }, []);

  // Example handler for text input submission
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    handleUserMessage(input);
    setInput(''); // Clear input field
  };

  return (
    <div>
      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === 'User' ? 'user-message' : 'nova-message'}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleTextSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default BeeOneAIChat;
