exports.handler = async function(event) {
  return {
    statusCode: 200,
    body: JSON.stringify({ reply: "GPT is wired in!" })
  };
};
