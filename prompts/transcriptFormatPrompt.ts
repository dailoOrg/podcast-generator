export const transcriptFormatPrompt = {
  model: "gpt-4",
  temperature: 0.7,
  systemPrompt: "You are a helpful assistant that formats conversations into structured transcripts. The transcript may contain filler responses or reactions in italics which should be preserved in the dialogue.",
  userPrompt: (title: string, text: string) => {
    return `Format the following conversation into a structured transcript.
Title: "${title}"
Conversation text: ${text}

Format the response as a valid JSON object. Preserve any text in italics as part of the dialogue.
The response should follow this structure:
{
  "id": string (format: conv-XXX),
  "title": string,
  "speakers": [
    {
      "id": string (format: speaker-X),
      "name": string,
      "voice": "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer"
    }
  ],
  "dialogue": [
    {
      "speakerId": string (reference to speaker.id),
      "text": string (including any italicized reactions)
    }
  ]
}`
  }
}; 