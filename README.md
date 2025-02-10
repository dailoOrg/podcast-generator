# Podcast Generator

An AI-powered platform for creating podcast-style conversations from transcripts, using Anthropic's Claude AI.

## Features

- Generate natural discussion scripts using Claude AI
- Multiple prompt types for different conversation styles
- Extensible prompt system for custom conversation formats
- Text-to-speech generation for multiple speakers
- Smart volume control for natural conversation flow
- Automatic volume adjustment for reactions and acknowledgments
- Individual audio file generation and merging
- Download merged conversations as WAV files

## Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/podcast-generator.git
cd podcast-generator
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Add your Anthropic API key to `.env`:

```
ANTHROPIC_API_KEY=your-api-key-here
```

5. Run the development server:

```bash
npm run dev
```

## Prompt System

The application uses a modular prompt system for generating different types of conversations:

### Built-in Prompts

- **Book Club Discussion**: Generates educational discussions about books between a curious learner (Alex) and an expert (Jane)
- **Discussion Style Transformer**: Transforms existing scripts into different speaking styles while preserving content

### Creating Custom Prompts

You can create your own prompts by adding a new file in the `prompts` directory:

```typescript
// prompts/yourCustomPrompt.ts
import { Prompt } from "@/types/prompt";

export const yourCustomPrompt: Prompt = {
  id: "uniquePromptId",
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 8192,
  temperature: 0,
  name: "Your Prompt Name",
  description: "Description of what your prompt does",
  // Optional system prompt for setting context
  systemPrompt: `Your system prompt here`,
  inputs: [
    {
      key: "inputKey",
      label: "Input Label",
      type: "textarea", // or "text"
      placeholder: "Placeholder text...",
      required: true
    }
  ],
  userPrompt: (inputs) => `Your prompt template here`
};
```

Then register your prompt in `prompts/registry.ts`:

```typescript
import { yourCustomPrompt } from "./yourCustomPrompt";

export const promptRegistry = {
  // ... existing prompts
  yourPromptId: yourCustomPrompt
};
```

## Smart Volume Control

The application includes intelligent volume control for more natural-sounding conversations:

- Automatically detects and lowers volume for:
  - Short reactions (1-2 words)
  - Common acknowledgments ("yeah", "mhm", etc.)
  - Brief interjections

### Customizing Volume Control

You can customize which phrases trigger volume reduction by editing `utils/dialogueUtils.ts`. The file contains:

- `lowVolumeExpressions`: Array of words/phrases that trigger volume reduction
- `shouldLowerVolume()`: Logic for determining when to lower volume

Example:

```typescript
// in dialogueUtils.ts
export const lowVolumeExpressions = [
  "yeah",
  "mhm",
  "okay",
  // Add your own expressions here
];
```

## Usage 

1. Select a prompt type from the AI Content Generator
2. Fill in the required inputs
3. Generate your script
4. Use the Transcript Player to convert the script to audio
5. Enable Smart Volume Control if desired
6. Initialize audio to generate speech
7. Play sequence or merge audio for final output
8. Download the merged conversation

