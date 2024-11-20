export const transcriptFormatPrompt = {
  model: "gpt-4o-2024-08-06",
  temperature: 0.7,
  systemPrompt: `You are a helpful assistant that formats conversations into structured transcripts. 
    Your task is to preserve the exact conversation text provided and only format it into the required structure.
    Do not modify, expand, or create new dialogue content.`,
  userPrompt: (title: string, text: string) => `
    Format the following conversation into a transcript.
    Title: ${title}
    
    Conversation:
    ${text}
    
    Format as JSON with speakers and dialogue array. Use exact text as provided.`,

  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "transcriptResponse",
      strict: true,
      schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "A unique identifier for the transcript (format: conv-XXX)"
          },
          title: {
            type: "string",
            description: "The title of the conversation"
          },
          speakers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for the speaker (format: speaker-X)"
                },
                name: {
                  type: "string",
                  description: "The name of the speaker"
                },
                voice: {
                  type: "string",
                  enum: ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
                }
              },
              required: ["id", "name", "voice"],
              additionalProperties: false
            }
          },
          dialogue: {
            type: "array",
            items: {
              type: "object",
              properties: {
                speakerId: {
                  type: "string",
                  description: "Reference to the speaker's ID"
                },
                text: {
                  type: "string",
                  description: "The spoken text"
                }
              },
              required: ["speakerId", "text"],
              additionalProperties: false
            }
          }
        },
        required: ["id", "title", "speakers", "dialogue"],
        additionalProperties: false,
        $schema: "http://json-schema.org/draft-07/schema#"
      }
    }
  }
}; 