import fs from 'fs-extra';
import path from 'path';
import OpenAI from 'openai';
import ffmpeg from 'fluent-ffmpeg';
import { getApiKey } from './config';
import { Transcript, DialogueLine, AudioOptions, AppConfig } from './types';
import { checkFFmpeg } from './utils';

/**
 * Generate audio for a single line of dialogue
 */
export async function generateSpeech(
  text: string, 
  voiceId: string, 
  outputPath: string
): Promise<string> {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: getApiKey('OPENAI_API_KEY'),
    });

    console.log(`Generating speech for: "${text.substring(0, 30)}..."`);

    // Generate speech
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voiceId as any, // Type assertion for OpenAI voice types
      input: text,
    });

    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(outputPath));
    
    // Write to file
    fs.writeFileSync(outputPath, buffer);
    
    return outputPath;
  } catch (error) {
    console.error(`Error generating speech for text: "${text.substring(0, 30)}..."`, error);
    throw error;
  }
}

/**
 * Process a transcript and generate audio for all dialogue lines
 */
export async function processTranscript(
  transcript: Transcript,
  options: AudioOptions,
  config: AppConfig
): Promise<string[]> {
  const audioFiles: string[] = [];
  
  // Get voice overrides from options if provided
  const voice1 = options.voice1 || config.audio.defaultVoices.speaker1;
  const voice2 = options.voice2 || config.audio.defaultVoices.speaker2;
  
  // Create output directory
  const outputDir = path.resolve(config.output.audioDir, transcript.id);
  fs.ensureDirSync(outputDir);
  
  // Generate audio for each line
  for (let i = 0; i < transcript.dialogue.length; i++) {
    const line = transcript.dialogue[i];
    const speakerIndex = transcript.speakers.findIndex(s => s.id === line.speakerId);
    
    // Determine which voice to use
    const voiceId = speakerIndex === 0 ? voice1 : voice2;
    
    // Generate file path
    const filePath = path.join(outputDir, `${transcript.id}_${line.speakerId}_${i}.mp3`);
    
    // Generate speech
    await generateSpeech(line.text, voiceId, filePath);
    
    // Add to list of files
    audioFiles.push(filePath);
  }
  
  return audioFiles;
}

/**
 * Merge audio files into a single file using FFmpeg
 * @param audioFiles Array of audio file paths to merge
 * @param transcript The transcript containing dialogue
 * @param outputPath The output file path
 * @param format The output format (wav or mp3)
 * @param bitrate The bitrate for MP3 (if format is mp3)
 * @returns Promise resolving to the output file path
 */
export async function mergeAudioFiles(
  audioFiles: string[],
  transcript: Transcript,
  outputPath: string,
  format: 'wav' | 'mp3' = 'wav',
  bitrate: string = '192k'
): Promise<string> {
  // Check if FFmpeg is installed
  const ffmpegInstalled = await checkFFmpeg();
  if (!ffmpegInstalled) {
    throw new Error('FFmpeg is required for audio merging. Please install FFmpeg and try again.');
  }

  console.log(`Merging ${audioFiles.length} audio files...`);
  
  // Make sure output directory exists
  fs.ensureDirSync(path.dirname(outputPath));
  
  // Create a temporary file list for ffmpeg in a directory we know exists
  // Use the same directory as the output file to ensure it exists
  const outputDir = path.dirname(outputPath);
  const fileListPath = path.join(
    outputDir, 
    `${path.basename(outputPath, path.extname(outputPath))}_filelist.txt`
  );
  
  // Write the file list with absolute paths to avoid directory issues
  const fileListContent = audioFiles
    .map(file => `file '${path.resolve(file).replace(/'/g, "'\\''")}'`)
    .join('\n');
  
  console.log(`Creating file list at: ${fileListPath}`);
  fs.writeFileSync(fileListPath, fileListContent);
  
  // Debug: print the content of the file list
  console.log(`File list content (first few entries):`);
  console.log(fileListContent.split('\n').slice(0, 3).join('\n') + (audioFiles.length > 3 ? '...' : ''));
  
  // Ensure the output path has the correct extension
  const finalOutputPath = format === 'mp3' 
    ? outputPath.replace(/\.[^/.]+$/, '.mp3') 
    : outputPath.replace(/\.[^/.]+$/, '.wav');
  
  return new Promise((resolve, reject) => {
    // Create ffmpeg command
    const command = ffmpeg()
      .input(fileListPath)
      .inputOptions(['-f', 'concat', '-safe', '0'])
      .output(finalOutputPath);
    
    // Set format-specific options
    if (format === 'mp3') {
      command
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate);
    } else {
      command
        .audioCodec('pcm_s16le') // Standard WAV format
        .format('wav');
    }
    
    // Execute the command
    command
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.round(progress.percent)}% done`);
        }
      })
      .on('end', () => {
        // Clean up the file list
        fs.removeSync(fileListPath);
        console.log(`Audio merging complete: ${finalOutputPath}`);
        resolve(finalOutputPath);
      })
      .on('error', (err) => {
        // Clean up the file list if it exists
        if (fs.existsSync(fileListPath)) {
          fs.removeSync(fileListPath);
        }
        console.error('Error merging audio files:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Process the audio command
 */
export async function processAudioCommand(
  options: AudioOptions,
  config: AppConfig
): Promise<string> {
  try {
    // Load the transcript
    const transcript = await fs.readJson(options.input) as Transcript;
    
    // Generate audio for each line
    const audioFiles = await processTranscript(transcript, options, config);
    
    // Determine format
    const format = options.format || config.audio.format.default;
    
    // Determine bitrate (only for MP3)
    const bitrate = options.bitrate || config.audio.format.mp3Quality;
    
    // Determine output path
    const extension = format === 'mp3' ? '.mp3' : '.wav';
    const outputPath = options.output || 
      path.join(config.output.audioDir, `${transcript.id}_merged${extension}`);
    
    // Merge the files
    const mergedPath = await mergeAudioFiles(
      audioFiles,
      transcript,
      outputPath,
      format,
      bitrate
    );
    
    return mergedPath;
  } catch (error) {
    console.error('Error processing audio command:', error);
    throw error;
  }
} 