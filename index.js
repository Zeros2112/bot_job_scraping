require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const mongoService = require('./services/mongo');
const loggerService = require('./services/logger');
const commandHandler = require('./services/commandHandler');
const config = require('./config');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Discord bot event handlers
client.once('ready', async () => {
  loggerService.log(`Logged in as ${client.user.tag}`);
  
  // Connect to MongoDB
  const mongoConnected = await mongoService.connect();
  if (!mongoConnected) {
    loggerService.log('Unable to connect to MongoDB, will use file-based cache as fallback', 'error');
  }
  
  // Load job cache for all sources
  await mongoService.loadCache();

  try {
    // Schedule daily job scraping for all sources at once
    cron.schedule(config.scrapingSchedule, () => {
      loggerService.log('Running scheduled job scraping for all sources...');
      commandHandler.executeCommand('jobseverything', { 
        linkedinTimeFilter: config.linkedin.timeFilters.day,
        simplyhiredTimeFilter: config.simplyhired.timeFilters.day,
        ziprecruiterTimeFilter: config.ziprecruiter.timeFilters.day,
        careerjetTimeFilter: config.careerjet.timeFilters.day,
        glassdoorTimeFilter: 'day',
        diceTimeFilter: config.dice.timeFilters.day
      }, client);
    });
    
    loggerService.log(`Job scraping scheduled for all sources: ${config.scrapingSchedule}`);
    
    // Send startup message to the Discord channel
    const channel = client.channels.cache.get(config.channelId);
    if (channel) {
      try {
        await channel.send('🤖 Job Scraping Bot is now online with all eight job sources integrated!\n'
          + 'Type `!help` to see all available commands.');
      } catch (error) {
        loggerService.log(`Error sending startup message: ${error.message}`, 'error');
      }
    }
  } catch (error) {
    loggerService.log(`Error setting up cron schedule: ${error.message}`, 'error');
  }
});

client.on('error', (error) => {
  loggerService.log(`Discord client error: ${error.message}`, 'error');
});

// Command handler for manual triggers and status checks
client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!') || message.author.bot) return;
  
  // Only process commands from the configured channel
  if (message.channel.id !== config.channelId) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  
  await commandHandler.processCommand(command, message, client);
});

// Process error handling to prevent crashes
process.on('uncaughtException', (error) => {
  loggerService.log(`Uncaught Exception: ${error.message}`, 'error');
});

process.on('unhandledRejection', (reason, promise) => {
  loggerService.log(`Unhandled Rejection: ${reason}`, 'error');
});

// Graceful shutdown to close MongoDB connection
process.on('SIGINT', async () => {
  loggerService.log('Bot shutting down...');
  await mongoService.close();
  process.exit(0);
});

// Start the bot with connection retry
function startBot() {
  client.login(process.env.DISCORD_TOKEN).catch(error => {
    loggerService.log(`Failed to login: ${error.message}`, 'error');
    loggerService.log('Retrying in 30 seconds...', 'info');
    setTimeout(startBot, 30000);
  });
}

loggerService.log('Starting Job Scraping Bot with ALL sources integration (job boards + GitHub)...');
startBot();