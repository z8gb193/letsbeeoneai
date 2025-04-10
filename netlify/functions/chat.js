const fetch = require("node-fetch");

exports.handler = async function(event) {
  const { message, tone, memory } = JSON.parse(event.body || "{}");

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY; 👈 Insert your real key here

  const tonePrompts = {
    gentle: "You are a kind, emotionally supportive companion. Your responses are warm and calming.",
    nerdy: "You are a witty, fact-loving AI who explains things with enthusiasm and clarity.",
    flirty: "You are a charming, playful AI that responds with humor, affection, and gentle flirtation."
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: tonePrompts[tone] || tonePrompts.gentle },
          { role: "user", content: memory ? `Note: ${memory}` : "" },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "No response.";
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to reach OpenAI." }) };
  }
};
