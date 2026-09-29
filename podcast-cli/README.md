# Podcast CLI

A command-line tool for generating podcast-style conversations and converting them to speech using AI.

## Features

- Generate natural discussion scripts using Claude AI
- Convert scripts to audio using OpenAI's TTS API
- Support for multiple voices
- Simple command-line interface
- **Read content from Markdown files**
- **Audio file merging with FFmpeg**
- **MP3 and WAV output support**

## Prerequisites

- Node.js 16+
- NPM or Yarn
- **FFmpeg** (required for audio merging)

### Installing FFmpeg

FFmpeg is required for merging individual audio files:

- **macOS**: `brew install ffmpeg`
- **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **Linux**: `apt-get install ffmpeg` or equivalent for your distribution

## Installation

1. Clone this repository:

```bash
git clone https://github.com/yourusername/podcast-cli.git
cd podcast-cli
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your API keys:

```bash
cp .env.example .env
```

Edit the `.env` file and add your API keys:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

4. Build the project:

```bash
npm run build
```

5. Link the CLI (optional):

```bash
npm link
```

## Usage

### Generate a Script

You can generate a script either by providing content directly or using a Markdown file:

#### Using Direct Content

```bash
npx ts-node src/index.ts generate --content "A detailed explanation of how quantum computing works"
```

#### Using a Markdown File

```bash
npx ts-node src/index.ts generate --file "./examples/template.md"
```

Or if you linked the CLI:

```bash
podcast-cli generate --file "./examples/template.md"
```

Options:

- `--content`: The topic or content to create a conversation about
- `--file`: Path to a Markdown file containing the content
- `--output`: Custom output file path (default: `./output/scripts/<slug>-<timestamp>.json`)
- `--model`: Override the AI model
- `--max-tokens`: Maximum tokens to generate
- `--temperature`: Temperature for generation

**Note**: You must provide either `--content` or `--file`.

### Generate Audio from a Script

```bash
npx ts-node src/index.ts audio --input "./output/scripts/your-script.json"
```

Or if you linked the CLI:

```bash
podcast-cli audio --input "./output/scripts/your-script.json"
```

Options:

- `--input` (required): Path to the script JSON file
- `--output`: Custom output file path for the merged audio
- `--voice1`: Voice for the first speaker (default: from config)
- `--voice2`: Voice for the second speaker (default: from config) 
- `--format`: Output format (`wav` or `mp3`, default: `wav`)
- `--bitrate`: Bitrate for MP3 output (e.g., `128k`, `192k`, `256k`, default: `192k`)

### Merge Existing Audio Files

If you already have individual audio files generated and just want to merge them:

```bash
npx ts-node src/index.ts merge --input "./output/scripts/your-script.json" --dir "./output/audio/transcript-12345"
```

Or if you linked the CLI:

```bash
podcast-cli merge --input "./output/scripts/your-script.json" --dir "./output/audio/transcript-12345"
```

Options:

- `--input` (required): Path to the script JSON file (used to determine file order)
- `--dir` (required): Directory containing the audio files to merge
- `--output`: Custom output file path for the merged audio
- `--format`: Output format (`wav` or `mp3`, default: `wav`)
- `--bitrate`: Bitrate for MP3 output (e.g., `128k`, `192k`, `256k`, default: `192k`)

This command is useful in scenarios where:
- You need to re-merge audio files without regenerating them
- You've generated some audio files separately and want to merge them
- You want to convert your merged file from WAV to MP3 (or vice versa)

#### Audio Output Formats

The tool supports two output formats:

- **WAV**: Uncompressed audio with perfect quality (larger files)
- **MP3**: Compressed audio with good quality (smaller files)

Example of generating an MP3 file:

```bash
podcast-cli audio --input "./output/scripts/your-script.json" --format mp3 --bitrate 256k
```

## Using Markdown Files

You can create Markdown files to structure complex topics for your podcast conversations:

1. See `examples/template.md` for a sample structure
2. Include sections like Overview, Key Concepts, Applications, etc.
3. Use Markdown formatting (headings, lists, emphasis) to organize your content
4. The entire Markdown file will be processed by Claude to create a natural conversation

### Example Markdown Structure

```markdown
# Main Topic Title

## Topic Overview
A brief introduction to the topic...

## Key Concepts
- Concept 1: Explanation
- Concept 2: Explanation

## Applications
1. Application area 1
2. Application area 2

## Challenges or Future Directions
Challenges and potential future developments...
```

## Available Voices

- `alloy`: OpenAI Alloy (neutral)
- `echo`: OpenAI Echo (male)
- `fable`: OpenAI Fable (female)
- `onyx`: OpenAI Onyx (male)
- `nova`: OpenAI Nova (female)
- `shimmer`: OpenAI Shimmer (female)

## Configuration

The default configuration is in `config.json`. You can modify this file to change:

- Default output directories
- Default AI model parameters
- Default voices for speakers
- Audio format settings (WAV/MP3)
- MP3 quality settings

## Troubleshooting

### Audio Merging Issues

If you encounter issues with audio merging:

1. Make sure FFmpeg is installed and available in your PATH
2. Check that you have permissions to write to the output directory
3. For large scripts, ensure you have enough disk space

## License

MIT 