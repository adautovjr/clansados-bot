/**
 * Discord Countdown Bot
 * 
 * A bot that sends daily countdown messages to a specific Discord channel,
 * showing how many days are left until May 26, 2026 with ASCII art.
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

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Import required Discord.js components and cron scheduler
import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';

// Initialize Discord client with necessary permissions
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,          // Access to guild information
    GatewayIntentBits.GuildMessages,   // Read messages in guilds
    GatewayIntentBits.GuildMembers,    // Access to member information (optional)
    GatewayIntentBits.MessageContent,  // Read message content (required for bot functionality)
  ]
});

// Configuration constants
const targetDate = new Date('May 26, 2026'); // The target date we're counting down to
const channelId = process.env.CHANNEL_ID;    // Discord channel ID where messages will be sent

/**
 * Calculate the number of days remaining until the target date
 * 
 * @returns {number} The number of days remaining (positive) or days passed (negative)
 */
function getDaysRemaining() {
  const today = new Date();
  const timeDiff = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysRemaining;
}

/**
 * Generate ASCII art for a given string of numbers and letters
 * 
 * This function converts a string containing digits and specific letters
 * (D, A, Y, S, I) into large ASCII art representation.
 * 
 * @param {string} numberString - The string to convert to ASCII art
 * @returns {string} The ASCII art representation with newlines
 */
function getAsciiArt(numberString) {
  // ASCII art patterns for each supported character
  // Each character is represented as an array of 6 lines
  const digitsArt = {
    "0": [
      "  ___  ",
      " / _ \\ ",
      "| | | |",
      "| | | |",
      "| |_| |",
      " \\___/ "
    ],
    "1": [
      "  __ ",
      " /_ |",
      "  | |",
      "  | |",
      "  | |",
      "  |_|"
    ],
    "2": [
      "  ___  ",
      " |__ \\ ",
      "    ) |",
      "   / / ",
      "  / /_ ",
      " |____|"
    ],
    "3": [
      "  ____  ",
      " |___ \\ ",
      "   __) |",
      "  |__ < ",
      "  ___) |",
      " |____/ "
    ],
    "4": [
      "  _  _   ",
      " | || |  ",
      " | || |_ ",
      " |__   _|",
      "    | |  ",
      "    |_|  "
    ],
    "5": [
      "  _____ ",
      " | ____|",
      " | |__  ",
      " |___ \\ ",
      "  ___) |",
      " |____/ "
    ],
    "6": [
      "   __  ",
      "  / /  ",
      " / /_  ",
      "| '_ \\ ",
      "| (_) |",
      " \\___/ "
    ],
    "7": [
      "  ______ ",
      " |____  |",
      "     / / ",
      "    / /  ",
      "   / /   ",
      "  /_/    "
    ],
    "8": [
      "  ___  ",
      " / _ \\ ",
      "| (_) |",
      " > _ < ",
      "| (_) |",
      " \\___/ "
    ],
    "9": [
      "  ___  ",
      " / _ \\ ",
      "| (_) |",
      " \\__, |",
      "   / / ",
      "  /_/  "
    ],
    "D": [
      "  ____  ",
      " |  _ \\ ",
      " | | | |",
      " | | | |",
      " | |_| |",
      " |____/ ",
      "        "
    ],
    "A": [
      "      __     ",
      "     /  \\    ",
      "    /    \\   ",
      "   /  __  \\  ",
      "  /  ____  \\ ",
      " /__/    \\__\\",
    ],
    "Y": [
      "  __   __ ",
      "  \\ \\ / / ",
      "   \\ V /  ",
      "    > /   ",
      "   / /    ",
      "  /_/     "
    ],
    "S": [
      "  ____  ",
      " / ___| ",
      "| (___ ",
      " \\___ \\ ",
      "  ___) |",
      " |____/ "
    ],
    "I": [
      "  ___  ",
      " |_ _| ",
      "  | |  ",
      "  | |  ",
      " |___| ",
      "       "
    ],
    " ": [
      "       ",
      "       ",
      "       ",
      "       ",
      "       ",
      "       "
    ]
  };

  // Initialize array to hold the 6 lines of ASCII art
  const lines = ["", "", "", "", "", ""];

  // Process each character in the input string
  for (const digit of numberString) {
    // Get ASCII art for current character, fallback to spaces if not found
    const digitLines = digitsArt[digit] || ["      ", "      ", "      ", "      ", "      ", "      "];
    
    // Append each line of the character's ASCII art to the corresponding line
    for (let i = 0; i < 6; i++) {
      lines[i] += digitLines[i];
    }
  }

  // Join all lines with newlines to create the final ASCII art
  return lines.join("\n");
}

/**
 * Find the most recent countdown message sent by this bot in the channel
 * 
 * This function searches through recent messages to find the last countdown
 * message sent by the bot, which will be deleted before sending a new one.
 * 
 * @param {Object} channel - The Discord channel object to search in
 * @returns {Promise<Object|null>} The last countdown message or null if not found
 */
async function findLastCountdownMessage(channel) {
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
 * @returns {Promise<boolean>} True if a message was already sent today, false otherwise
 */
async function hasPostedTodayMessage(channel) {
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
 * Send the daily countdown message to the configured Discord channel
 * 
 * This is the main function that:
 * 1. Checks if a message was already sent today (prevents duplicates)
 * 2. Deletes the previous countdown message (keeps channel clean)
 * 3. Calculates days remaining and generates ASCII art
 * 4. Formats and sends the appropriate message based on the countdown status
 * 
 * @returns {Promise<void>}
 */
async function sendCountdownMessage() {
  try {
    // Get the Discord channel object using the configured channel ID
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`);
      return;
    }
    
    // Prevent duplicate messages: check if we already posted today
    const alreadyPostedToday = await hasPostedTodayMessage(channel);
    if (alreadyPostedToday) {
      console.log('Countdown message for today was already sent. Skipping.');
      return;
    }
    
    // Clean up: find and delete the previous countdown message
    const lastMessage = await findLastCountdownMessage(channel);
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
    const asciiArt = getAsciiArt(numberString + " DAYS");
    
    // Format message based on countdown status
    let message;
    if (daysRemaining > 0) {
      // Future: Days remaining until target date
      message = `🗓️ **Countdown Update**: ${daysRemaining > 1 ? `${daysRemaining} days` : '1 day'} left until May 26, 2026!\n\`\`\`\n${asciiArt}\n\`\`\``;
    } else if (daysRemaining === 0) {
      // Present: Target date is today
      message = `🎉 **Today is the day!** May 26, 2026 has arrived!\n\`\`\`\n${getAsciiArt('0')}\n\`\`\``;
    } else {
      // Past: Target date has already passed
      message = `📆 May 26, 2026 was ${Math.abs(daysRemaining) > 1 ? `${Math.abs(daysRemaining)} days` : '1 day'} ago.\n\`\`\`\n${asciiArt}\n\`\`\``;
    }
    
    // Send the formatted message to the channel
    await channel.send(message);
    console.log('Countdown message sent successfully');
  } catch (error) {
    console.error('Error sending countdown message:', error);
  }
}

/**
 * Bot ready event handler
 * 
 * This event is triggered when the bot successfully connects to Discord.
 * It performs initial setup and schedules the daily countdown messages.
 */
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Send initial countdown message if none was sent today
  // This ensures the countdown is up-to-date when the bot starts
  await sendCountdownMessage();
  
  // Schedule daily countdown messages at 8:00 AM UTC
  // Cron format: minute hour day month day_of_week
  // '0 8 * * *' means: at minute 0 of hour 8, every day of every month
  cron.schedule('0 8 * * *', sendCountdownMessage, {
    timezone: 'UTC' // You can change this to your preferred timezone
  });
  
  console.log('Daily countdown message scheduled for 8:00 AM UTC');
});

/**
 * Login to Discord using the bot token
 * 
 * The bot token should be stored in the DISCORD_TOKEN environment variable.
 * This token authenticates the bot with Discord's API.
 */
client.login(process.env.DISCORD_TOKEN);