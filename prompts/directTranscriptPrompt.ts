import { Prompt } from "@/types/prompt";

export const directTranscriptPrompt: Prompt = {
  id: "directTranscript",
  model: "claude-3-7-sonnet-20250219",
  max_tokens: 8192,
  temperature: 0,
  name: "Direct Transcript Generator",
  description: "Generates a conversation directly in transcript format ready for audio",
  // thinking: {
  //   type: "enabled",
  //   budget_tokens: 8000
  // },
  systemPrompt: `
<Role>
You are an educational script writer. 
You will receive a detailed book summary and you will develop a very long educational script for two people.
</Role> 
  `,
  
  inputs: [
    {
      key: "content",
      label: "Topic or Content",
      type: "textarea",
      placeholder: "Enter the topic or content you want to create a conversation about...",
      required: true
    }
  ],
  
  userPrompt: (inputs) => `
<Content>
${inputs.content}
</Content>

<Instructions>
- Generate a very long educational script.
- The script must be around 1500 words.
- Create a script for two hosts. A curious learner. And an expert explainer.
</Instructions>

<Style>
- The speakers should avoid sounding unaturally enthusiastic.
- The speakers should not pretend to be human.
</Style>

<Format>
Speaker-1: [Speaker-1's dialogue]
Speaker-2: [Speaker-2's dialogue]
Speaker-1: [Speaker-1's dialogue]
Speaker-2: [Speaker-2's dialogue]
[Continue the dialogue as needed...]
</Format>
  `,
  
  tools: [{
    name: "generate_transcript",
    description: `Generate a structured transcript for a conversation between two speakers that can be used for audio generation.`,
    input_schema: {
      type: "object",
      properties: {
        title: { 
          type: "string",
          description: "simplified book title that is discussed. (e.g. thinking_fast_slow)"
        },
        speakers: {
          type: "array",
          description: "Array of speaker definitions ",
          items: {
            type: "object",
            properties: {
              id: { 
                type: "string",
                description: "Unique identifier for the speaker (e.g., 'speaker-1')"
              },
            },
            required: ["id"]
          }
        },
        dialogue: {
          type: "array",
          description: "Conversation transcript as defined in prompt. Between speaker-1 and speaker-2.",
          items: {
            type: "object",
            properties: {
              speakerId: { 
                type: "string",
                description: "Reference to a speaker's ID from the speakers array"
              },
              text: { 
                type: "string",
                description: "The actual spoken text for this line of dialogue"
              }
            },
            required: ["speakerId", "text"]
          }
        }
      },
      required: ["title", "speakers", "dialogue"]
    }
  }]
}; 