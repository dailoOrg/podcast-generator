import fs from 'fs-extra';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { getApiKey } from './config';
import { Transcript, PromptConfig, GenerateOptions, AppConfig } from './types';

// Import prompt functions directly here instead of from prompts directory
const getSystemPrompt = (): string => {
  return `
<Role>
You are an educational script writer. 
You will receive a detailed book summary or topic and you will develop a very long educational script for two people directed to a general audience.
You explain any technical terms that a general audience would not understand.
</Role>
  `;
};

const getUserPrompt = (inputs: { content: string }): string => {
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
};

const transcriptTool = {
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

/**
 * Generate a script using Claude API
 */
export async function generateScript(options: GenerateOptions, config: AppConfig): Promise<Transcript> {
  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: getApiKey('ANTHROPIC_API_KEY'),
    });

    // Prepare inputs for the prompt
    const promptInputs = {
      content: options.content
    };

    // Create message options
    const messageOptions: any = {
      model: options.model || config.script.model,
      max_tokens: options.maxTokens || config.script.max_tokens,
      temperature: options.temperature !== undefined ? options.temperature : config.script.temperature,
      messages: [{ role: "user", content: getUserPrompt({content: options.content || ''}) }],
      system: getSystemPrompt(),
      tools: [transcriptTool],
      tool_choice: { type: "any" }
    };

    console.log(`Generating script using ${messageOptions.model}...`);
    
    // Call the Anthropic API
    const response = await anthropic.messages.create(messageOptions);
    
    // Check if Claude used the tool
    if (response.stop_reason === 'tool_use') {
      // Find tool_use blocks
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      
      if (toolUseBlocks.length > 0) {
        // Get the first tool use block
        const toolUseBlock = toolUseBlocks[0] as any;
        
        // Check if it's our transcript generation tool
        if (toolUseBlock.name === 'generate_transcript') {
          const input = toolUseBlock.input;
          
          // Create a proper transcript with all the required fields
          const transcript: Transcript = {
            id: `transcript-${Date.now()}`,
            title: input.title || "Untitled Conversation",
            speakers: input.speakers.map((speaker: any) => ({
              id: speaker.id,
              name: speaker.name || (speaker.id === 'speaker-1' ? 'Speaker 1' : 'Speaker 2'),
              voice: speaker.id === 'speaker-1' ? config.audio.defaultVoices.speaker1 : config.audio.defaultVoices.speaker2,
              gender: speaker.id === 'speaker-1' ? 'female' : 'male'
            })),
            dialogue: input.dialogue.map((line: any, index: number) => ({
              speakerId: line.speakerId,
              text: line.text,
              id: `line-${index}`
            }))
          };
          
          return transcript;
        }
      }
    }
    
    // If we get here, Claude didn't use the tool or used an unexpected tool
    throw new Error('Failed to generate a proper transcript. Claude did not use the expected tool.');
    
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
}

/**
 * Save a transcript to a JSON file
 */
export function saveScript(transcript: Transcript, outputPath?: string): string {
  try {
    // Generate a filename if not provided
    const filename = outputPath || `${transcript.id}.json`;
    
    // Write the transcript to a file
    fs.writeJSONSync(filename, transcript, { spaces: 2 });
    
    return filename;
  } catch (error) {
    console.error('Error saving script:', error);
    throw error;
  }
} 