import { exec } from 'child_process';
import chalk from 'chalk';

/**
 * Format a duration in milliseconds to a readable string
 * @param ms Duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes === 0) {
    return `${seconds}s`;
  }
  
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Word count in a text
 * @param text The text to count words in
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Generate a simple slug from a string
 * @param text The text to convert to a slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')  // Remove special characters
    .replace(/\s+/g, '_')      // Replace spaces with underscores
    .substring(0, 50);         // Limit length
}

/**
 * Check if FFmpeg is installed on the system
 * @returns Promise that resolves to true if FFmpeg is installed, false otherwise
 */
export function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      if (error) {
        console.error(chalk.red('FFmpeg is not installed or not found in PATH.'));
        console.error(chalk.yellow('Please install FFmpeg to use audio merging functionality:'));
        console.error(chalk.yellow('- macOS: brew install ffmpeg'));
        console.error(chalk.yellow('- Windows: https://ffmpeg.org/download.html'));
        console.error(chalk.yellow('- Linux: apt-get install ffmpeg or equivalent'));
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
} 