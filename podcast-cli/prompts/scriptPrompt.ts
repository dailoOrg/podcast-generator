import { PromptConfig } from '../src/types';

export interface ScriptPromptInputs {
  content: string;
}

/**
 * Generate a system prompt for the script generation
 */
export function getSystemPrompt(): string {
  return `
<Role>
You are an educational script writer. 
You will receive a detailed book summary or topic and you will develop a very long educational script for two people directed to a general audience.
You explain any technical terms that a general audience would not understand.
</Role>
  `;
}

/**
 * Generate a user prompt for the script generation
 */
export function getUserPrompt(inputs: ScriptPromptInputs): string {
  return `
<Content>
${inputs.content}
</Content>

<Instructions>
- The script is for a general audience, if there are any technical terms, they should be explained.
- Generate a very long educational script.
- The script must be around 1500 words.
- Create a script for two speakers a curious learner and an expert explainer.
- The curious learner should create a very short introduction of the topic of the conversation at the beginning of the script.
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
  `;
}

/**
 * Tool definition for Claude to generate transcripts
 */
export const transcriptTool = {
  name: "generate_transcript",
  description: `Generate a structured transcript for a conversation between two speakers that can be used for audio generation.`,
  input_schema: {
    type: "object",
    properties: {
      title: { 
        type: "string",
        description: "simplified book title or topic that is discussed."
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
}; 