#!/usr/bin/env node

import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { loadConfig, ensureOutputDirs } from './config';
import { generateScript, saveScript } from './script';
import { processAudioCommand } from './audio';
import { generateSlug, checkFFmpeg } from './utils';
import { GenerateOptions, AudioOptions, Transcript } from './types';
import { mergeAudioFiles } from './audio';

// Initialize commander
const program = new Command();

// Load configuration
const config = loadConfig();
ensureOutputDirs(config);

// Set up CLI
program
  .name('podcast-cli')
  .description('CLI tool for generating podcast-style conversations')
  .version('0.1.0');

// Script generation command
program
  .command('generate')
  .description('Generate a podcast script from content')
  .option('-c, --content <content>', 'The content to create a conversation about')
  .option('-f, --file <file>', 'Markdown file to read content from')
  .option('-o, --output <output>', 'Output file path for the generated script')
  .option('-m, --model <model>', 'AI model to use')
  .option('-t, --max-tokens <maxTokens>', 'Maximum number of tokens')
  .option('-T, --temperature <temperature>', 'Temperature for generation')
  .action(async (options: GenerateOptions) => {
    // Validate inputs - need either content or file
    if (!options.content && !options.file) {
      console.error(chalk.red('Error: Either --content or --file must be provided'));
      process.exit(1);
    }

    const spinner = ora('Preparing script generation...').start();
    
    try {
      // If file is provided, read content from the file
      if (options.file) {
        spinner.text = `Reading content from ${options.file}...`;
        if (!fs.existsSync(options.file)) {
          throw new Error(`File not found: ${options.file}`);
        }
        
        // Read the markdown file
        const fileContent = fs.readFileSync(options.file, 'utf-8');
        
        // Use file content as the content for generation (override any direct content)
        options.content = fileContent;
        
        spinner.succeed(`Read content from ${chalk.green(options.file)}`);
        spinner.start('Generating script...');
      }
      
      // Generate output path if not provided
      if (!options.output) {
        // Create slug from content or filename
        const baseText = options.file ? 
          path.basename(options.file, path.extname(options.file)) : 
          options.content!.substring(0, 50);
        
        const slug = generateSlug(baseText);
        options.output = path.join(
          config.output.scriptDir, 
          `${slug}-${Date.now()}.json`
        );
      }
      
      // Generate the script
      spinner.text = 'Calling Claude API to generate script...';
      const transcript = await generateScript(options, config);
      
      // Save the script
      spinner.text = 'Saving script...';
      const outputPath = saveScript(transcript, options.output);
      
      spinner.succeed(`Script generated and saved to ${chalk.green(outputPath)}`);
      console.log(`The transcript has ${chalk.cyan(transcript.dialogue.length)} lines of dialogue`);
    } catch (error) {
      spinner.fail('Failed to generate script');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// Audio generation command
program
  .command('audio')
  .description('Generate audio from a script')
  .requiredOption('-i, --input <input>', 'Input script file path')
  .option('-o, --output <output>', 'Output file path for the merged audio')
  .option('-v1, --voice1 <voice1>', 'Voice for the first speaker')
  .option('-v2, --voice2 <voice2>', 'Voice for the second speaker')
  .option('-f, --format <format>', 'Output format (wav or mp3)', /^(wav|mp3)$/i)
  .option('-b, --bitrate <bitrate>', 'Bitrate for MP3 output (e.g., 128k, 192k, 256k)')
  .action(async (options: AudioOptions) => {
    const spinner = ora('Processing audio...').start();
    
    try {
      // Check if input file exists
      if (!fs.existsSync(options.input)) {
        throw new Error(`Input file not found: ${options.input}`);
      }
      
      // Process audio
      spinner.text = 'Generating audio files...';
      const outputPath = await processAudioCommand(options, config);
      
      spinner.succeed(`Audio generated and saved to ${chalk.green(outputPath)}`);
      
      // Provide instructions for FFmpeg installation if needed
      console.log(chalk.cyan('Note: Audio merging requires FFmpeg to be installed on your system.'));
      console.log(chalk.cyan('If you encounter any errors, please check that FFmpeg is installed:'));
      console.log(chalk.cyan('- macOS: brew install ffmpeg'));
      console.log(chalk.cyan('- Windows: https://ffmpeg.org/download.html'));
      console.log(chalk.cyan('- Linux: apt-get install ffmpeg or equivalent'));
    } catch (error) {
      spinner.fail('Failed to generate audio');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// Merge command (just merges existing audio files)
program
  .command('merge')
  .description('Merge existing audio files without generating new ones')
  .requiredOption('-i, --input <input>', 'Input script file path')
  .requiredOption('-d, --dir <directory>', 'Directory containing audio files')
  .option('-o, --output <output>', 'Output file path for the merged audio')
  .option('-f, --format <format>', 'Output format (wav or mp3)', /^(wav|mp3)$/i)
  .option('-b, --bitrate <bitrate>', 'Bitrate for MP3 output (e.g., 128k, 192k, 256k)')
  .action(async (options) => {
    const spinner = ora('Preparing to merge audio files...').start();
    
    try {
      // Check FFmpeg installation
      const ffmpegInstalled = await checkFFmpeg();
      if (!ffmpegInstalled) {
        spinner.fail('FFmpeg is required for audio merging');
        process.exit(1);
      }
      
      // Resolve absolute paths
      const inputPath = path.resolve(options.input);
      const audioDir = path.resolve(options.dir);
      
      // Check if input script file exists
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Script file not found: ${inputPath}`);
      }
      
      // Check if audio directory exists
      if (!fs.existsSync(audioDir)) {
        throw new Error(`Audio directory not found: ${audioDir}`);
      }
      
      spinner.text = `Loading transcript from ${path.basename(inputPath)}...`;
      
      // Load the transcript
      const transcript: Transcript = await fs.readJson(inputPath);
      
      // Get the format and bitrate
      const format = options.format || config.audio.format.default;
      const bitrate = options.bitrate || config.audio.format.mp3Quality;
      
      // Determine output path
      const extension = format === 'mp3' ? '.mp3' : '.wav';
      const outputFilename = options.output || 
        path.join(config.output.audioDir, `${transcript.id}_merged${extension}`);
      const outputPath = path.resolve(outputFilename);
      
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(outputPath));
      
      // Collect audio files based on transcript
      spinner.text = 'Collecting audio files...';
      const audioFiles: string[] = [];
      let missingFiles = false;
      
      for (let i = 0; i < transcript.dialogue.length; i++) {
        const line = transcript.dialogue[i];
        // Construct the expected filename pattern
        const filePattern = `${transcript.id}_${line.speakerId}_${i}.mp3`;
        const filePath = path.join(audioDir, filePattern);
        
        if (fs.existsSync(filePath)) {
          audioFiles.push(filePath);
        } else {
          console.warn(chalk.yellow(`Warning: Missing audio file ${filePattern}`));
          missingFiles = true;
        }
      }
      
      if (missingFiles) {
        console.warn(chalk.yellow('Some audio files are missing. The merged file will be incomplete.'));
        
        if (audioFiles.length === 0) {
          throw new Error('No audio files found to merge.');
        }
        
        spinner.text = 'Continue with merging available files...';
      } else {
        spinner.text = `Found all ${audioFiles.length} audio files. Merging...`;
      }
      
      // Merge the audio files
      const mergedPath = await mergeAudioFiles(
        audioFiles,
        transcript,
        outputPath,
        format,
        bitrate
      );
      
      spinner.succeed(`Audio files merged successfully to ${chalk.green(mergedPath)}`);
    } catch (error) {
      spinner.fail('Failed to merge audio files');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no args are provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 