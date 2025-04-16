import React, { useEffect, useRef, useState } from 'react';

function NovaVoiceTest() {
  const [messages, setMessages] = useState([]);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [novaVoiceName, setNovaVoiceName] = useState('');
  const isSpeakingRef = useRef(false);
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
      if (!novaVoiceName && voices.length) {
        setNovaVoiceName(voices[0].name);
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
          setMessages((prev) => [...prev, { from: 'User', text: transcript }]);
          replyFromNova(`You said: ${transcript}`);
        }
      };

      recognition.onspeechstart = () => {
        if (isSpeakingRef.current) {
          console.log('Interrupt — stopping Nova');
          window.speechSynthesis.cancel();
          isSpeakingRef.current = false;
        }
      };

      recognition.onend = () => {
        recognition.start();
      };

      recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
      };

      recognition.start();
    }

    return () => {
      if (recognition) recognition.stop();
      synth.cancel();
    };
  }, []);

  const replyFromNova = (text) => {
    const voice = availableVoices.find(v => v.name === novaVoiceName) || availableVoices[0];
    if (!voice) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    isSpeakingRef.current = true;

    utterance.onend = () => {
      isSpeakingRef.current = false;
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
    };

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
      setMessages((prev) => [...prev, { from: 'Nova', text }]);
    }, 300); // Delay helps fix edge cases
  };

  return (
    <div style={{ padding: 30, fontFamily: 'Arial' }}>
      <h2>🎤 Nova Voice Test</h2>
      <select
        value={novaVoiceName}
        onChange={(e) => setNovaVoiceName(e.target.value)}
      >
        {availableVoices.map((v, i) => (
          <option key={i} value={v.name}>{v.name} ({v.lang})</option>
        ))}
      </select>

      <div style={{ marginTop: 20 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default NovaVoiceTest;
