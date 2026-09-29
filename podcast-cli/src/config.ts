import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { AppConfig } from './types';

// Load environment variables
dotenv.config();

/**
 * Load the configuration from the config file
 */
export function loadConfig(): AppConfig {
  try {
    const configPath = path.resolve(__dirname, '../config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found at ${configPath}`);
    }
    
    const config = fs.readJSONSync(configPath) as AppConfig;
    return config;
  } catch (error) {
    console.error('Error loading configuration:', error);
    process.exit(1);
  }
}

/**
 * Get an API key from environment variables
 */
export function getApiKey(key: 'ANTHROPIC_API_KEY' | 'OPENAI_API_KEY' | 'ELEVENLABS_API_KEY'): string {
  const apiKey = process.env[key];
  if (!apiKey) {
    throw new Error(`${key} is not set in the environment variables`);
  }
  return apiKey;
}

/**
 * Ensure output directories exist
 */
export function ensureOutputDirs(config: AppConfig): void {
  try {
    fs.ensureDirSync(config.output.scriptDir);
    fs.ensureDirSync(config.output.audioDir);
  } catch (error) {
    console.error('Error creating output directories:', error);
    process.exit(1);
  }
}

/**
 * Get a voice configuration by ID
 */
export function getVoiceById(config: AppConfig, id: string) {
  // Check OpenAI voices
  const openaiVoice = config.voices.openai.find(voice => voice.id === id);
  if (openaiVoice) {
    return { ...openaiVoice, provider: 'openai' as const };
  }
  
  // Check ElevenLabs voices if they exist
  if (config.voices.elevenlabs) {
    const elevenLabsVoice = config.voices.elevenlabs.find(voice => voice.id === id);
    if (elevenLabsVoice) {
      return { ...elevenLabsVoice, provider: 'elevenlabs' as const };
    }
  }
  
  // Return default if not found
  return { 
    id: 'alloy', 
    name: 'Alloy',
    gender: 'neutral' as const,
    provider: 'openai' as const
  };
} 