import 'dotenv/config';

import { Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ]
});

// The target date we're counting down to
const targetDate = new Date('May 26, 2026');
// Channel ID where the message should be sent
const channelId = process.env.CHANNEL_ID;

// Function to calculate days remaining
function getDaysRemaining() {
  const today = new Date();
  const timeDiff = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysRemaining;
}

// ASCII Art function for numbers
function getAsciiArt(numberString) {
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

  const lines = ["", "", "", "", "", ""];

  for (const digit of numberString) {
    const digitLines = digitsArt[digit] || ["      ", "      ", "      ", "      ", "      ", "      "];
    for (let i = 0; i < 6; i++) {
      lines[i] += digitLines[i];
    }
  }

  return lines.join("\n");
}

// Find the last countdown message from the bot
async function findLastCountdownMessage(channel) {
  try {
    // Fetch a reasonable number of recent messages
    const messages = await channel.messages.fetch({ limit: 50 });
    
    // Find the most recent countdown message from this bot
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

// Check if a countdown message was already sent today
async function hasPostedTodayMessage(channel) {
  try {
    // Get today's date at midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fetch recent messages from the channel
    const messages = await channel.messages.fetch({ limit: 10 });
    
    // Check if any message from the bot was sent today
    return messages.some(message => {
      // Check if the message is from this bot and was sent today
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

// Function to send the countdown message
async function sendCountdownMessage() {
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found`);
      return;
    }
    
    // Check if we already posted today
    const alreadyPostedToday = await hasPostedTodayMessage(channel);
    if (alreadyPostedToday) {
      console.log('Countdown message for today was already sent. Skipping.');
      return;
    }
    
    // Find and delete the previous countdown message
    const lastMessage = await findLastCountdownMessage(channel);
    if (lastMessage) {
      try {
        await lastMessage.delete();
        console.log('Previous countdown message deleted');
      } catch (deleteError) {
        console.error('Error deleting previous message:', deleteError);
      }
    }
    
    const daysRemaining = getDaysRemaining();
    const numberString = Math.abs(daysRemaining).toString();
    const asciiArt = getAsciiArt(numberString + " DAYS");
    
    let message;
    if (daysRemaining > 0) {
      message = `🗓️ **Countdown Update**: ${daysRemaining > 1 ? `${daysRemaining} days` : '1 day'} left until May 26, 2026!\n\`\`\`\n${asciiArt}\n\`\`\``;
    } else if (daysRemaining === 0) {
      message = `🎉 **Today is the day!** May 26, 2026 has arrived!\n\`\`\`\n${getAsciiArt('0')}\n\`\`\``;
    } else {
      message = `📆 May 26, 2026 was ${Math.abs(daysRemaining) > 1 ? `${Math.abs(daysRemaining)} days` : '1 day'} ago.\n\`\`\`\n${asciiArt}\n\`\`\``;
    }
    
    await channel.send(message);
    console.log('Countdown message sent successfully');
  } catch (error) {
    console.error('Error sending countdown message:', error);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Check and send a message immediately if none was sent today
  await sendCountdownMessage();
  
  // Schedule the message to be sent every day at 8:00 AM
  cron.schedule('0 8 * * *', sendCountdownMessage, {
    timezone: 'UTC' // Change this to your timezone if needed
  });
  
  console.log('Daily countdown message scheduled for 8:00 AM');
});

client.login(process.env.DISCORD_TOKEN);