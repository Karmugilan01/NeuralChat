import Groq from "groq-sdk";

export const MODELS = {
  groq: [
    "llama-3.3-70b-versatile",
    "llama3-8b-8192",
    "mixtral-8x7b-32768"
  ]
};

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function streamChat({
  systemPrompt,
  messages,
  onChunk
}) {
  try {

    // Convert messages format
    const formattedMessages = [
      {
        role: "system",
        content: systemPrompt
      },

      ...messages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];

    // Create streaming completion
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      stream: true,
      temperature: 0.7
    });

    let fullText = "";

    for await (const chunk of stream) {

      const text =
        chunk.choices?.[0]?.delta?.content || "";

      if (text) {

        fullText += text;

        onChunk(text);
      }
    }

    return fullText;

  } catch (error) {

    console.log("Groq Error:", error);

    throw error;
  }
}