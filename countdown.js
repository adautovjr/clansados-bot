/**
 * Discord Countdown Bot Functions
 * 
 * Funções para countdown que podem ser integradas em outros bots.
 * 
 * Features:
 * - Daily automatic updates at 8:00 AM UTC
 * - ASCII art visualization of the countdown
 * - Automatic cleanup of previous messages
 * - Protection against duplicate daily messages
 * 
 * @author adautovjr
 * @version 1.0.0
 */

// Import required Discord.js components for countdown functionality
import { AttachmentBuilder } from 'discord.js';
import cron from 'node-cron';
import { generate } from 'text-to-image';

/**
 * Generate an image with styled text using the custom Diploma font
 * 
 * This function creates a Discord attachment containing an image with the 
 * specified text rendered using the registered Diploma font. The image
 * has white text with black stroke for better readability.
 * 
 * @param {string} string - The text to render in the image
 * @returns {Promise<AttachmentBuilder>} Discord attachment with the generated image
 */
export async function getImageArt(string) {
  console.log(`🎨 Generating image art for: "${string}"`);
  
  // Generate image data URL with specified styles
  const dataUrl = await generate(string, {
    fontPath: "./assets/pricedown.otf",
    fontSize: 180,
    textColor: 'white',
    lineHeight: 230,
    margin: 10,
    bgColor: 'transparent',
    strokeWidth: 20,
    strokeColor: 'black',
    maxWidth: 800
  });

  // Convert data URL to buffer
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Create and return Discord attachment
  return new AttachmentBuilder(imageBuffer, { name: 'countdown.png' });
}

// Configuration constants
const targetDate = new Date('May 26, 2026'); // The target date we're counting down to

/**
 * Calculate the number of days remaining until the target date
 * 
 * @returns {number} The number of days remaining (positive) or days passed (negative)
 */
export function getDaysRemaining() {
  const today = new Date();
  const timeDiff = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysRemaining;
}

/**
 * Find the most recent countdown message sent by this bot in the channel
 * 
 * This function searches through recent messages to find the last countdown
 * message sent by the bot, which will be deleted before sending a new one.
 * 
 * @param {Object} channel - The Discord channel object to search in
 * @param {Object} client - The Discord client instance
 * @returns {Promise<Object|null>} The last countdown message or null if not found
 */
export async function findLastCountdownMessage(channel, client) {
  try {
    // Fetch a reasonable number of recent messages from the channel
    const messages = await channel.messages.fetch({ limit: 50 });
    
    // Find the most recent countdown message from this bot
    // Look for messages containing specific countdown-related keywords
    return messages.find(message => 
      message.author.id === client.user.id && 
      (message.content.includes('Countdown Update') || 
       message.content.includes('Today is the day') ||
       message.content.includes('was') && message.content.includes('day'))
    );
  } catch (error) {
    console.error('Error finding last countdown message:', error);
    return null;
  }
}

/**
 * Check if a countdown message was already sent today
 * 
 * This function prevents the bot from sending multiple countdown messages
 * on the same day by checking recent messages for today's date.
 * 
 * @param {Object} channel - The Discord channel object to check
 * @param {Object} client - The Discord client instance
 * @returns {Promise<boolean>} True if a message was already sent today, false otherwise
 */
export async function hasPostedTodayMessage(channel, client) {
  try {
    // Get today's date at midnight for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch recent messages from the channel (limited to avoid unnecessary API calls)
    const messages = await channel.messages.fetch({ limit: 10 });
    
    // Check if any countdown message from this bot was sent today
    return messages.some(message => {
      // Verify: message is from this bot, sent today, and is a countdown message
      return message.author.id === client.user.id 
             && message.createdAt >= today
             && (message.content.includes('Countdown Update') || 
                 message.content.includes('Today is the day') ||
                 message.content.includes('was') && message.content.includes('day'));
    });
  } catch (error) {
    console.error('Error checking for today\'s messages:', error);
    return false; // Assume no message was sent if we can't check
  }
}

/**
 * Send the daily countdown message to a specific Discord channel
 * 
 * This is the main function that:
 * 1. Checks if a message was already sent today (prevents duplicates)
 * 2. Deletes the previous countdown message (keeps channel clean)
 * 3. Calculates days remaining and generates ASCII art
 * 4. Formats and sends the appropriate message based on the countdown status
 * 
 * @param {Object} client - The Discord client instance
 * @param {string} channelId - The channel ID where to send the countdown
 * @returns {Promise<void>}
 */
export async function sendCountdownMessage(client, channelId) {
  try {
    // Get the Discord channel object using the configured channel ID
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`);
      return;
    }
    
    // Prevent duplicate messages: check if we already posted today
    const alreadyPostedToday = await hasPostedTodayMessage(channel, client);
    if (alreadyPostedToday) {
      console.log('Countdown message for today was already sent. Skipping.');
      return;
    }
    
    // Clean up: find and delete the previous countdown message
    const lastMessage = await findLastCountdownMessage(channel, client);
    if (lastMessage) {
      try {
        await lastMessage.delete();
        console.log('Previous countdown message deleted');
      } catch (deleteError) {
        console.error('Error deleting previous message:', deleteError);
        // Continue execution even if deletion fails
      }
    }
    
    // Calculate countdown and generate ASCII art
    const daysRemaining = getDaysRemaining();
    const numberString = Math.abs(daysRemaining).toString();
    const imageArt = await getImageArt(numberString + " days");
    
    // Format message based on countdown status
    let message;
    if (daysRemaining > 0) {
      // Future: Days remaining until target date
      message = `🗓️ **Countdown Update**: ${daysRemaining > 1 ? `${daysRemaining} days` : '1 day'} left until May 26, 2026!\n \n`;
    } else if (daysRemaining === 0) {
      // Present: Target date is today
      message = `🎉 **Today is the day!** May 26, 2026 has arrived!\n \n`;
    } else {
      // Past: Target date has already passed
      message = `📆 May 26, 2026 was ${Math.abs(daysRemaining) > 1 ? `${Math.abs(daysRemaining)} days` : '1 day'} ago.\n \n`;
    }
    
    // Send the formatted message to the channel
    await channel.send({ content: message, files: [imageArt] });
    console.log('Countdown message sent successfully');
  } catch (error) {
    console.error('Error sending countdown message:', error);
  }
}

/**
 * Initialize countdown functionality with cron scheduling
 * 
 * @param {Object} client - The Discord client instance
 * @param {string} channelId - The channel ID where to send countdowns
 * @returns {Object} Object with scheduling controls
 */
export function initializeCountdown(client, channelId) {
  // Send initial countdown message if none was sent today
  // This ensures the countdown is up-to-date when the bot starts
  sendCountdownMessage(client, channelId);
  
  // Schedule daily countdown messages at 8:00 AM UTC
  // Cron format: minute hour day month day_of_week
  // '0 8 * * *' means: at minute 0 of hour 8, every day of every month
  const cronJob = cron.schedule('0 8 * * *', () => {
    sendCountdownMessage(client, channelId);
  }, {
    timezone: 'UTC', // You can change this to your preferred timezone
    scheduled: false // Don't start immediately
  });
  
  console.log('Daily countdown message scheduled for 8:00 AM UTC');
  
  return {
    start: () => cronJob.start(),
    stop: () => cronJob.stop(),
    destroy: () => cronJob.destroy()
  };
}