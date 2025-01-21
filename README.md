# Podcast Generator

An AI-powered platform for creating podcast-style conversations from transcripts.

## Features

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

4. Add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=your-api-key-here
```

5. Run the development server:

```bash
npm run dev
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

1. Format your transcript using the Transcript Formatter
2. Select your transcript in the Transcript Player
3. Enable Smart Volume Control if desired
4. Initialize audio to generate speech
5. Play sequence or merge audio for final output
6. Download the merged conversation

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
