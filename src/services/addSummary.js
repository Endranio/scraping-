import axios from "axios";

function cleanJSON(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

export async function addAISummary(products, apiKey) {
  const prompt = `
You are an expert summarizer. Summarize each product description in 2-3 sentences.

Products:
${JSON.stringify(products, null, 2)}

Return only a JSON array with these keys:
- title
- price
- link
- description
- summary
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat-v3-0324",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let jsonText = response.data.choices?.[0]?.message?.content?.trim();
    jsonText = cleanJSON(jsonText);
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("AI error:", err.message);
    return products.map((p) => ({ ...p, summary: "-" }));
  }
}
