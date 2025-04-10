const fetch = require("node-fetch");

exports.handler = async function(event) {
  const { message, tone, memory, language } = JSON.parse(event.body || "{}");

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const tonePrompts = {
    gentle: "You are a kind, emotionally supportive companion. Keep your responses warm and calming.",
    nerdy: "You are a witty, fact-loving AI. Keep your responses full of fun facts and nerdy enthusiasm.",
    flirty: "You are a charming, playful AI who teases and flatters the user in a fun, flirty tone.",
    dippy: "You're a silly, spaced-out companion who doesn't really get things and says goofy stuff like 'that's crud' and 'ever noticed clouds... funny aren't they?'",
    genius: "You are a genius-level, smug Sherlock Holmes-style AI. Speak in short, sharp, eloquent deductions. Be confidently superior."
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
          {
            role: "system",
            content: `Please respond in ${language || "English"}. ${tonePrompts[tone] || tonePrompts.gentle}`
          },
          { role: "user", content: memory ? `Note: ${memory}` : "" },
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("No valid GPT reply returned.");
    }

    const reply = data.choices[0].message.content;
    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error("GPT Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "🤖 I tried, but something broke. Please try again." })
    };
  }
};
