export function cleanJSON(text) {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}
