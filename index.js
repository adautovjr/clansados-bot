import dotenv from 'dotenv';
dotenv.config();

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
             && message.content.includes('Countdown Update');
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
    
    const daysRemaining = getDaysRemaining();
    
    let message;
    if (daysRemaining > 0) {
      message = `🗓️ **Countdown Update**: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left until May 26, 2026!`;
    } else if (daysRemaining === 0) {
      message = `🎉 **Today is the day!** May 26, 2026 has arrived!`;
    } else {
      message = `📆 May 26, 2026 was ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ago.`;
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