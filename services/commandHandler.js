const { EmbedBuilder } = require('discord.js');
const linkedinScraper = require('../scrapers/linkedin');
const simplyhiredScraper = require('../scrapers/simplyhired');
const ziprecruiterScraper = require('../scrapers/ziprecruiter');
const careerjetScraper = require('../scrapers/careerjet');
const jobrightScraper = require('../scrapers/jobright');
const glassdoorScraper = require('../scrapers/glassdoor');
const diceScraper = require('../scrapers/dice');
const githubScraper = require('../scrapers/github');
const mongoService = require('./mongo');
const logger = require('./logger');
const config = require('../config');

// Command status tracking
let commandStatus = {
  linkedin: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  },
  simplyhired: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  },
  ziprecruiter: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  },
  careerjet: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  },
  jobright: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  },
  glassdoor: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  },
  dice: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  },
  github: {
    lastRun: null,
    success: false,
    jobsFound: 0,
    errorCount: 0
  }
};

/**
 * Process a command from Discord
 * @param {string} command - The command name
 * @param {object} message - The Discord message object
 * @param {object} client - The Discord client
 */
async function processCommand(command, message, client) {
  try {
    // LinkedIn specific commands
    if (command === 'jobslinkedin' || command === 'linkedin') {
      await message.reply('Starting LinkedIn job scraping for the past 24 hours...');
      await executeCommand('jobslinkedin', { timeFilter: config.linkedin.timeFilters.day }, client);
    } 
    // LinkedIn time-specific commands
    else if (command === 'linkedinday') {
      await message.reply('Starting LinkedIn job scraping for the past 24 hours...');
      await executeCommand('jobslinkedin', { timeFilter: config.linkedin.timeFilters.day }, client);
    } 
    else if (command === 'linkedinweek') {
      await message.reply('Starting LinkedIn job scraping for the past week...');
      await executeCommand('jobslinkedin', { timeFilter: config.linkedin.timeFilters.week }, client);
    } 
    else if (command === 'linkedinmonth') {
      await message.reply('Starting LinkedIn job scraping for the past month...');
      await executeCommand('jobslinkedin', { timeFilter: config.linkedin.timeFilters.month }, client);
    } 
    
    // SimplyHired specific commands
    else if (command === 'jobssimplyhired' || command === 'simplyhired') {
      await message.reply('Starting SimplyHired job scraping for the past 24 hours...');
      await executeCommand('jobssimplyhired', { timeFilter: config.simplyhired.timeFilters.day }, client);
    } 
    // SimplyHired time-specific commands
    else if (command === 'simplyhiredday') {
      await message.reply('Starting SimplyHired job scraping for the past 24 hours...');
      await executeCommand('jobssimplyhired', { timeFilter: config.simplyhired.timeFilters.day }, client);
    } 
    else if (command === 'simplyhiredweek') {
      await message.reply('Starting SimplyHired job scraping for the past week...');
      await executeCommand('jobssimplyhired', { timeFilter: config.simplyhired.timeFilters.week }, client);
    } 
    else if (command === 'simplyhiredmonth') {
      await message.reply('Starting SimplyHired job scraping for the past month...');
      await executeCommand('jobssimplyhired', { timeFilter: config.simplyhired.timeFilters.month }, client);
    } 
    
    // ZipRecruiter specific commands
    else if (command === 'jobsziprecruiter' || command === 'ziprecruiter') {
      await message.reply('Starting ZipRecruiter job scraping for the past 24 hours...');
      await executeCommand('jobsziprecruiter', { timeFilter: config.ziprecruiter.timeFilters.day }, client);
    } 
    // ZipRecruiter time-specific commands
    else if (command === 'ziprecruiterday') {
      await message.reply('Starting ZipRecruiter job scraping for the past 24 hours...');
      await executeCommand('jobsziprecruiter', { timeFilter: config.ziprecruiter.timeFilters.day }, client);
    } 
    else if (command === 'ziprecruiterweek') {
      await message.reply('Starting ZipRecruiter job scraping for the past week...');
      await executeCommand('jobsziprecruiter', { timeFilter: config.ziprecruiter.timeFilters.week }, client);
    } 
    else if (command === 'ziprecruitermonth') {
      await message.reply('Starting ZipRecruiter job scraping for the past month...');
      await executeCommand('jobsziprecruiter', { timeFilter: config.ziprecruiter.timeFilters.month }, client);
    } 
    
    // CareerJet specific commands
    else if (command === 'jobscareerjet' || command === 'careerjet') {
      await message.reply('Starting CareerJet job scraping for the past 24 hours...');
      await executeCommand('jobscareerjet', { timeFilter: config.careerjet.timeFilters.day }, client);
    } 
    // CareerJet time-specific commands
    else if (command === 'careerjetday') {
      await message.reply('Starting CareerJet job scraping for the past 24 hours...');
      await executeCommand('jobscareerjet', { timeFilter: config.careerjet.timeFilters.day }, client);
    } 
    else if (command === 'careerjetweek') {
      await message.reply('Starting CareerJet job scraping for the past week...');
      await executeCommand('jobscareerjet', { timeFilter: config.careerjet.timeFilters.week }, client);
    } 
    else if (command === 'careerjetmonth') {
      await message.reply('Starting CareerJet job scraping for the past month...');
      await executeCommand('jobscareerjet', { timeFilter: config.careerjet.timeFilters.month }, client);
    }
    
    // Jobright specific commands
    else if (command === 'jobsjobright' || command === 'jobright') {
      await message.reply('Starting Jobright.ai job scraping...');
      await executeCommand('jobsjobright', {}, client);
    }
    
    // Glassdoor specific commands
    else if (command === 'jobsglassdoor' || command === 'glassdoor') {
      await message.reply('Starting Glassdoor job scraping for the past 24 hours...');
      await executeCommand('jobsglassdoor', { timeFilter: 'day' }, client);
    }
    // Glassdoor time-specific commands
    else if (command === 'glassdoorday') {
      await message.reply('Starting Glassdoor job scraping for the past 24 hours...');
      await executeCommand('jobsglassdoor', { timeFilter: 'day' }, client);
    }
    else if (command === 'glassdoorweek') {
      await message.reply('Starting Glassdoor job scraping for the past week...');
      await executeCommand('jobsglassdoor', { timeFilter: 'week' }, client);
    }
    else if (command === 'glassdoormonth') {
      await message.reply('Starting Glassdoor job scraping for the past month...');
      await executeCommand('jobsglassdoor', { timeFilter: 'month' }, client);
    }
    
    // Dice specific commands
    else if (command === 'jobsdice' || command === 'dice') {
      await message.reply('Starting Dice.com job scraping for today\'s postings...');
      await executeCommand('jobsdice', { timeFilter: config.dice.timeFilters.day }, client);
    }
    // Dice time-specific commands
    else if (command === 'dicetoday') {
      await message.reply('Starting Dice.com job scraping for today\'s postings...');
      await executeCommand('jobsdice', { timeFilter: config.dice.timeFilters.day }, client);
    }
    else if (command === 'dice3days') {
      await message.reply('Starting Dice.com job scraping for the last 3 days...');
      await executeCommand('jobsdice', { timeFilter: config.dice.timeFilters.threeDay }, client);
    }
    else if (command === 'dice7days') {
      await message.reply('Starting Dice.com job scraping for the last 7 days...');
      await executeCommand('jobsdice', { timeFilter: config.dice.timeFilters.week }, client);
    }
    else if (command === 'diceall') {
      await message.reply('Starting Dice.com job scraping for all dates...');
      await executeCommand('jobsdice', { timeFilter: config.dice.timeFilters.all }, client);
    }
    
    // GitHub specific commands
    else if (command === 'jobsgithub' || command === 'github') {
      await message.reply('Starting GitHub repositories scraping...');
      await executeCommand('jobsgithub', {}, client);
    }
    // GitHub repo-specific commands
    else if (command === 'jobssimplify') {
      await message.reply('Starting GitHub job scraping for SimplifyJobs repository...');
      await executeCommand('jobsgithubspecific', { repoName: 'SimplifyJobs' }, client);
    }
    else if (command === 'jobsoffsimplify') {
      await message.reply('Starting GitHub job scraping for SimplifyJobs Off-Season repository...');
      await executeCommand('jobsgithubspecific', { repoName: 'SimplifyJobsOffSeason' }, client);
    }
    else if (command === 'jobsvans') {
      await message.reply('Starting GitHub job scraping for Vanshb03 repository...');
      await executeCommand('jobsgithubspecific', { repoName: 'Vanshb03' }, client);
    }
    else if (command === 'jobsspeedy') {
      await message.reply('Starting GitHub job scraping for SpeedyApply repository...');
      await executeCommand('jobsgithubspecific', { repoName: 'SpeedyApply' }, client);
    }
    
    // Combined jobs commands (all sources)
    else if (command === 'jobs') {
      await message.reply('Starting job scraping from all sources...');
      await executeCommand('jobsallsources', { 
        linkedinTimeFilter: config.linkedin.timeFilters.day,
        simplyhiredTimeFilter: config.simplyhired.timeFilters.day,
        ziprecruiterTimeFilter: config.ziprecruiter.timeFilters.day,
        careerjetTimeFilter: config.careerjet.timeFilters.day,
        glassdoorTimeFilter: 'day',
        diceTimeFilter: config.dice.timeFilters.day
      }, client);
    } 
    // Combined time-specific commands
    else if (command === 'jobsday') {
      await message.reply('Starting job scraping from all sources for the past 24 hours...');
      await executeCommand('jobsallsources', { 
        linkedinTimeFilter: config.linkedin.timeFilters.day,
        simplyhiredTimeFilter: config.simplyhired.timeFilters.day,
        ziprecruiterTimeFilter: config.ziprecruiter.timeFilters.day,
        careerjetTimeFilter: config.careerjet.timeFilters.day,
        glassdoorTimeFilter: 'day',
        diceTimeFilter: config.dice.timeFilters.day
      }, client);
    } 
    else if (command === 'jobsweek') {
      await message.reply('Starting job scraping from all sources for the past week...');
      await executeCommand('jobsallsources', { 
        linkedinTimeFilter: config.linkedin.timeFilters.week,
        simplyhiredTimeFilter: config.simplyhired.timeFilters.week,
        ziprecruiterTimeFilter: config.ziprecruiter.timeFilters.week,
        careerjetTimeFilter: config.careerjet.timeFilters.week,
        glassdoorTimeFilter: 'week',
        diceTimeFilter: config.dice.timeFilters.week
      }, client);
    } 
    else if (command === 'jobsmonth') {
      await message.reply('Starting job scraping from all sources for the past month...');
      await executeCommand('jobsallsources', { 
        linkedinTimeFilter: config.linkedin.timeFilters.month,
        simplyhiredTimeFilter: config.simplyhired.timeFilters.month,
        ziprecruiterTimeFilter: config.ziprecruiter.timeFilters.month,
        careerjetTimeFilter: config.careerjet.timeFilters.month,
        glassdoorTimeFilter: 'month',
        diceTimeFilter: config.dice.timeFilters.week
      }, client);
    } 
    else if (command === 'jobsall') {
      await message.reply('Starting job scraping from all sources including GitHub repositories...');
      await executeCommand('jobseverything', {
        linkedinTimeFilter: config.linkedin.timeFilters.day,
        simplyhiredTimeFilter: config.simplyhired.timeFilters.day,
        ziprecruiterTimeFilter: config.ziprecruiter.timeFilters.day,
        careerjetTimeFilter: config.careerjet.timeFilters.day,
        glassdoorTimeFilter: 'day',
        diceTimeFilter: config.dice.timeFilters.day
      }, client);
    }
    
    // Cache management commands
    else if (command === 'clearcache') {
      await mongoService.clearAllCaches();
      await message.reply('Job cache has been cleared for all sources.');
    } 
    else if (command === 'clearlinkedincache') {
      await mongoService.clearCache('linkedin');
      await message.reply('LinkedIn job cache has been cleared.');
    } 
    else if (command === 'clearsimplyhiredcache') {
      await mongoService.clearCache('simplyhired');
      await message.reply('SimplyHired job cache has been cleared.');
    } 
    else if (command === 'clearziprecruiter') {
      await mongoService.clearCache('ziprecruiter');
      await message.reply('ZipRecruiter job cache has been cleared.');
    }
    else if (command === 'clearcareerjet') {
      await mongoService.clearCache('careerjet');
      await message.reply('CareerJet job cache has been cleared.');
    }
    else if (command === 'clearjobright') {
      await mongoService.clearCache('jobright');
      await message.reply('Jobright.ai job cache has been cleared.');
    }
    else if (command === 'clearglassdoor') {
      await mongoService.clearCache('glassdoor');
      await message.reply('Glassdoor job cache has been cleared.');
    }
    else if (command === 'cleardice') {
      await mongoService.clearCache('dice');
      await message.reply('Dice.com job cache has been cleared.');
    }
    else if (command === 'cleargithub') {
      await mongoService.clearCache('github');
      await message.reply('GitHub job cache has been cleared.');
    }
    
    // Status commands
    else if (command === 'status') {
      await sendStatusReport(message, client);
    } 
    else if (command === 'dbstatus') {
      await sendDatabaseStatus(message, client);
    } 
    else if (command === 'help') {
      await sendHelpMessage(message);
    } 
    else {
      // Unknown command
      if (command.startsWith('jobs') || command.startsWith('linkedin') || 
          command.startsWith('simplyhired') || command.startsWith('ziprecruiter') ||
          command.startsWith('careerjet') || command.startsWith('jobright') ||
          command.startsWith('glassdoor') || command.startsWith('dice') ||
          command.startsWith('github')) {
        await message.reply(`Unknown command: !${command}. Type !help to see available commands.`);
      }
    }
  } catch (error) {
    logger.log(`Error processing command ${command}: ${error.message}`, 'error');
    try {
      await message.reply(`Error processing command: ${error.message.substring(0, 100)}`);
    } catch (replyError) {
      logger.log(`Error sending error reply: ${replyError.message}`, 'error');
    }
  }
}

/**
 * Execute a command without user interaction (for scheduled tasks)
 * @param {string} command - The command to execute
 * @param {object} options - Command options
 * @param {object} client - The Discord client
 */
async function executeCommand(command, options, client) {
  try {
    if (command === 'jobslinkedin') {
      const result = await linkedinScraper.scrapeAllJobs(options.timeFilter, client);
      commandStatus.linkedin = result;
      return result;
    } 
    else if (command === 'jobssimplyhired') {
      const result = await simplyhiredScraper.scrapeAllJobs(options.timeFilter, client);
      commandStatus.simplyhired = result;
      return result;
    } 
    else if (command === 'jobsziprecruiter') {
      const result = await ziprecruiterScraper.scrapeAllJobs(options.timeFilter, client);
      commandStatus.ziprecruiter = result;
      return result;
    }
    else if (command === 'jobscareerjet') {
      const result = await careerjetScraper.scrapeAllJobs(options.timeFilter, client);
      commandStatus.careerjet = result;
      return result;
    }
    else if (command === 'jobsjobright') {
      const result = await jobrightScraper.scrapeAllJobs(client);
      commandStatus.jobright = result;
      return result;
    }
    else if (command === 'jobsglassdoor') {
      const result = await glassdoorScraper.scrapeAllJobs(options.timeFilter, client);
      commandStatus.glassdoor = result;
      return result;
    }
    else if (command === 'jobsdice') {
      const result = await diceScraper.scrapeAllJobs(options.timeFilter, client);
      commandStatus.dice = result;
      return result;
    }
    else if (command === 'jobsgithub') {
      const result = await githubScraper.scrapeAllJobs(client);
      commandStatus.github = result;
      return result;
    }
    else if (command === 'jobsgithubspecific') {
      const result = await githubScraper.scrapeSpecificRepo(options.repoName, client);
      // Update command status but only for successfully scraped repos
      if (result.success) {
        if (!commandStatus.github.lastRun) {
          commandStatus.github = {
            lastRun: result.lastRun,
            success: result.success,
            jobsFound: result.jobsFound,
            errorCount: result.errorCount
          };
        } else {
          commandStatus.github.jobsFound += result.jobsFound;
          commandStatus.github.errorCount += result.errorCount;
        }
      }
      return result;
    }
    else if (command === 'jobsallsources') {
      // Run all job board scrapers (excluding GitHub)
      const channel = client.channels.cache.get(config.channelId);
      if (channel) {
        await channel.send('Starting job scraping from all job board sources...');
      }
      
      // Run all job scrapers
      const linkedinResult = await linkedinScraper.scrapeAllJobs(options.linkedinTimeFilter, client);
      commandStatus.linkedin = linkedinResult;
      
      const simplyhiredResult = await simplyhiredScraper.scrapeAllJobs(options.simplyhiredTimeFilter, client);
      commandStatus.simplyhired = simplyhiredResult;
      
      const ziprecruiterResult = await ziprecruiterScraper.scrapeAllJobs(options.ziprecruiterTimeFilter, client);
      commandStatus.ziprecruiter = ziprecruiterResult;
      
      const careerjetResult = await careerjetScraper.scrapeAllJobs(options.careerjetTimeFilter, client);
      commandStatus.careerjet = careerjetResult;
      
      const jobrightResult = await jobrightScraper.scrapeAllJobs(client);
      commandStatus.jobright = jobrightResult;
      
      const glassdoorResult = await glassdoorScraper.scrapeAllJobs(options.glassdoorTimeFilter, client);
      commandStatus.glassdoor = glassdoorResult;
      
      const diceResult = await diceScraper.scrapeAllJobs(options.diceTimeFilter, client);
      commandStatus.dice = diceResult;
      
      // Send summary message
      if (channel) {
        const totalJobs = linkedinResult.jobsFound + simplyhiredResult.jobsFound + 
                          ziprecruiterResult.jobsFound + careerjetResult.jobsFound +
                          jobrightResult.jobsFound + glassdoorResult.jobsFound +
                          diceResult.jobsFound;
        
        await channel.send(`Job scraping complete for all job board sources. Found ${totalJobs} new jobs total:\n` +
          `- LinkedIn: ${linkedinResult.jobsFound}\n` +
          `- SimplyHired: ${simplyhiredResult.jobsFound}\n` +
          `- ZipRecruiter: ${ziprecruiterResult.jobsFound}\n` +
          `- CareerJet: ${careerjetResult.jobsFound}\n` +
          `- Jobright.ai: ${jobrightResult.jobsFound}\n` +
          `- Glassdoor: ${glassdoorResult.jobsFound}\n` +
          `- Dice.com: ${diceResult.jobsFound}`);
      }
      
      return {
        linkedin: linkedinResult,
        simplyhired: simplyhiredResult,
        ziprecruiter: ziprecruiterResult,
        careerjet: careerjetResult,
        jobright: jobrightResult,
        glassdoor: glassdoorResult,
        dice: diceResult,
        totalJobs: linkedinResult.jobsFound + simplyhiredResult.jobsFound + 
                   ziprecruiterResult.jobsFound + careerjetResult.jobsFound +
                   jobrightResult.jobsFound + glassdoorResult.jobsFound +
                   diceResult.jobsFound
      };
    }
    else if (command === 'jobseverything') {
      // First run all job board scrapers
      const jobBoardsResult = await executeCommand('jobsallsources', options, client);
      
      // Then run GitHub scraper
      const githubResult = await githubScraper.scrapeAllJobs(client);
      commandStatus.github = githubResult;
      
      // Send summary message with all results
      const channel = client.channels.cache.get(config.channelId);
      if (channel) {
        const totalJobs = jobBoardsResult.totalJobs + githubResult.jobsFound;
        
        await channel.send(`ALL sources job scraping complete. Found ${totalJobs} new listings total, including ${githubResult.jobsFound} from GitHub repositories.`);
      }
      
      return {
        ...jobBoardsResult,
        github: githubResult,
        totalJobs: jobBoardsResult.totalJobs + githubResult.jobsFound
      };
    }
  } catch (error) {
    logger.log(`Error executing command ${command}: ${error.message}`, 'error');
    return { error: error.message };
  }
}

/**
 * Send status report to Discord
 * @param {object} message - Discord message object
 */
async function sendStatusReport(message) {
  try {
    const cacheStats = await mongoService.getAllCacheStats();
    
    const statusEmbed = new EmbedBuilder()
      .setTitle('Job Bot Status')
      .setColor('#00FF00')
      .addFields(
        { name: 'Total Cache Size', value: cacheStats.total.toString(), inline: false }
      );
    
    // Add LinkedIn status info if available
    if (commandStatus.linkedin.lastRun) {
      statusEmbed.addFields(
        { name: 'LinkedIn Last Run', value: commandStatus.linkedin.lastRun.toLocaleString(), inline: true },
        { name: 'LinkedIn Status', value: commandStatus.linkedin.success ? 'Success' : 'Failed', inline: true },
        { name: 'LinkedIn Jobs Found', value: commandStatus.linkedin.jobsFound.toString(), inline: true }
      );
    }
    
    // Add SimplyHired status info if available
    if (commandStatus.simplyhired.lastRun) {
      statusEmbed.addFields(
        { name: 'SimplyHired Last Run', value: commandStatus.simplyhired.lastRun.toLocaleString(), inline: true },
        { name: 'SimplyHired Status', value: commandStatus.simplyhired.success ? 'Success' : 'Failed', inline: true },
        { name: 'SimplyHired Jobs Found', value: commandStatus.simplyhired.jobsFound.toString(), inline: true }
      );
    }
    
    // Add ZipRecruiter status info if available 
    if (commandStatus.ziprecruiter.lastRun) {
      statusEmbed.addFields(
        { name: 'ZipRecruiter Last Run', value: commandStatus.ziprecruiter.lastRun.toLocaleString(), inline: true },
        { name: 'ZipRecruiter Status', value: commandStatus.ziprecruiter.success ? 'Success' : 'Failed', inline: true },
        { name: 'ZipRecruiter Jobs Found', value: commandStatus.ziprecruiter.jobsFound.toString(), inline: true }
      );
    }
    
    // Add CareerJet status info if available
    if (commandStatus.careerjet.lastRun) {
      statusEmbed.addFields(
        { name: 'CareerJet Last Run', value: commandStatus.careerjet.lastRun.toLocaleString(), inline: true },
        { name: 'CareerJet Status', value: commandStatus.careerjet.success ? 'Success' : 'Failed', inline: true },
        { name: 'CareerJet Jobs Found', value: commandStatus.careerjet.jobsFound.toString(), inline: true }
      );
    }
    
    // Add Jobright status info if available
    if (commandStatus.jobright.lastRun) {
      statusEmbed.addFields(
        { name: 'Jobright.ai Last Run', value: commandStatus.jobright.lastRun.toLocaleString(), inline: true },
        { name: 'Jobright.ai Status', value: commandStatus.jobright.success ? 'Success' : 'Failed', inline: true },
        { name: 'Jobright.ai Jobs Found', value: commandStatus.jobright.jobsFound.toString(), inline: true }
      );
    }
    
    // Add Glassdoor status info if available
    if (commandStatus.glassdoor.lastRun) {
      statusEmbed.addFields(
        { name: 'Glassdoor Last Run', value: commandStatus.glassdoor.lastRun.toLocaleString(), inline: true },
        { name: 'Glassdoor Status', value: commandStatus.glassdoor.success ? 'Success' : 'Failed', inline: true },
        { name: 'Glassdoor Jobs Found', value: commandStatus.glassdoor.jobsFound.toString(), inline: true }
      );
    }
    
    // Add Dice status info if available
    if (commandStatus.dice.lastRun) {
      statusEmbed.addFields(
        { name: 'Dice.com Last Run', value: commandStatus.dice.lastRun.toLocaleString(), inline: true },
        { name: 'Dice.com Status', value: commandStatus.dice.success ? 'Success' : 'Failed', inline: true },
        { name: 'Dice.com Jobs Found', value: commandStatus.dice.jobsFound.toString(), inline: true }
      );
    }
    
    // Add GitHub status info if available
    if (commandStatus.github.lastRun) {
      statusEmbed.addFields(
        { name: 'GitHub Last Run', value: commandStatus.github.lastRun.toLocaleString(), inline: true },
        { name: 'GitHub Status', value: commandStatus.github.success ? 'Success' : 'Failed', inline: true },
        { name: 'GitHub Posts Found', value: commandStatus.github.jobsFound.toString(), inline: true }
      );
    }
    
    statusEmbed.setFooter({ text: `Job Bot Status | ${new Date().toLocaleString()}` });
    await message.reply({ embeds: [statusEmbed] });
  } catch (error) {
    logger.log(`Error sending status: ${error.message}`, 'error');
    await message.reply('Error generating status report.');
  }
}

/**
 * Send database status to Discord
 * @param {object} message - Discord message object
 */
async function sendDatabaseStatus(message) {
  try {
    const cacheStats = await mongoService.getAllCacheStats();
    
    const dbStatusEmbed = new EmbedBuilder()
      .setTitle('Database Status')
      .setColor('#0077b5')
      .addFields(
        { name: 'Database Type', value: cacheStats.linkedin.source.includes('MongoDB') ? 'MongoDB' : 'File-based', inline: true },
        { name: 'LinkedIn Cache Count', value: cacheStats.linkedin.count.toString(), inline: true },
        { name: 'SimplyHired Cache Count', value: cacheStats.simplyhired.count.toString(), inline: true },
        { name: 'ZipRecruiter Cache Count', value: cacheStats.ziprecruiter.count.toString(), inline: true },
        { name: 'CareerJet Cache Count', value: cacheStats.careerjet.count.toString(), inline: true },
        { name: 'Jobright.ai Cache Count', value: cacheStats.jobright.count.toString(), inline: true },
        { name: 'Glassdoor Cache Count', value: cacheStats.glassdoor.count.toString(), inline: true },
        { name: 'Dice.com Cache Count', value: cacheStats.dice.count.toString(), inline: true },
        { name: 'GitHub Cache Count', value: cacheStats.github.count.toString(), inline: true },
        { name: 'Total Cache Size', value: cacheStats.total.toString(), inline: true }
      );
    
    dbStatusEmbed.setFooter({ text: `Database Status | ${new Date().toLocaleString()}` });
    await message.reply({ embeds: [dbStatusEmbed] });
  } catch (error) {
    logger.log(`Error sending database status: ${error.message}`, 'error');
    await message.reply('Error getting database status.');
  }
}

/**
 * Send help message to Discord
 * @param {object} message - Discord message object
 */
async function sendHelpMessage(message) {
  try {
    const helpEmbed = new EmbedBuilder()
      .setTitle('Job Bot Commands')
      .setColor('#0077b5')
      .setDescription('Available commands:')
      .addFields(
        { name: 'Job Board Commands', value: 
          '!jobs - Scrape all job board sources (LinkedIn, SimplyHired, etc.)\n' +
          '!jobsDay - Scrape all job boards for the past 24 hours\n' +
          '!jobsWeek - Scrape all job boards for the past week\n' +
          '!jobsMonth - Scrape all job boards for the past month'
        },
        { name: 'GitHub Commands', value: 
          '!github - Scrape all GitHub repositories\n' +
          '!jobsSimplify - Scrape the SimplifyJobs repository\n' +
          '!jobsOffSimplify - Scrape the SimplifyJobs Off-Season repository\n' +
          '!jobsVans - Scrape the Vanshb03 repository\n' +
          '!jobsSpeedy - Scrape the SpeedyApply repository\n' +
          '!clearGithub - Clear GitHub job cache'
        },
        { name: 'LinkedIn Commands', value: 
          '!linkedin - Scrape LinkedIn jobs for the past 24 hours\n' +
          '!linkedinDay - Scrape LinkedIn jobs for the past 24 hours\n' +
          '!linkedinWeek - Scrape LinkedIn jobs for the past week\n' +
          '!linkedinMonth - Scrape LinkedIn jobs for the past month\n' +
          '!clearLinkedinCache - Clear LinkedIn job cache'
        },
        { name: 'SimplyHired Commands', value: 
          '!simplyhired - Scrape SimplyHired jobs for the past 24 hours\n' +
          '!simplyhiredDay - Scrape SimplyHired jobs for the past 24 hours\n' +
          '!simplyhiredWeek - Scrape SimplyHired jobs for the past week\n' +
          '!simplyhiredMonth - Scrape SimplyHired jobs for the past month\n' +
          '!clearSimplyhiredCache - Clear SimplyHired job cache'
        },
        { name: 'Other Job Sources', value:
          '!ziprecruiter - Scrape ZipRecruiter jobs\n' +
          '!careerjet - Scrape CareerJet jobs\n' +
          '!jobright - Scrape Jobright.ai jobs\n' +
          '!glassdoor - Scrape Glassdoor jobs\n' +
          '!dice - Scrape Dice.com jobs'
        },
        { name: 'Combined Commands', value: 
          '!jobsAll - Scrape ALL sources (job boards + GitHub)\n' +
          '!clearCache - Clear all job caches'
        },
        { name: 'Status Commands', value: 
          '!status - Check bot status and statistics\n' +
          '!dbStatus - Check database connection status\n' +
          '!help - Show this help message'
        }
      )
      .setFooter({ text: 'Job Scraping Bot' });
    await message.reply({ embeds: [helpEmbed] });
  } catch (error) {
    logger.log(`Error sending help: ${error.message}`, 'error');
    await message.reply('Error generating help message.');
  }
}

module.exports = {
  processCommand,
  executeCommand
};