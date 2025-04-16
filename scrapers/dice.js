const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const config = require('../config');
const logger = require('../services/logger');
const mongoService = require('../services/mongo');
const { EmbedBuilder } = require('discord.js');
const { delay } = require('../utils/helpers');

/**
 * Build Dice.com search URL with special handling for Dice's URL structure
 * @param {string} keyword - Search keyword
 * @param {string} timeFilter - Time filter parameter
 * @returns {string} Complete search URL
 */
function buildDiceSearchUrl(keyword, timeFilter = null) {
  // Using the URL structure seen in the actual page HTML
  const encodedKeyword = encodeURIComponent(keyword);
  let url = `${config.dice.baseUrl}?q=${encodedKeyword}`;
 
  // Add standard parameters in the order they appear in the original URL
  url += `&countryCode=${config.dice.defaultSearchParams.countryCode}`;
  url += `&radius=${config.dice.defaultSearchParams.radius}`;
  url += `&radiusUnit=${config.dice.defaultSearchParams.radiusUnit}`;
  url += `&page=${config.dice.defaultSearchParams.page}`;
  url += `&pageSize=${config.dice.defaultSearchParams.pageSize}`;
 
  // Add posted date filter if specified
  if (timeFilter && timeFilter !== 'ALL') {
    url += `&filters.postedDate=${timeFilter}`;
  }
 
  // Add language
  url += `&language=${config.dice.defaultSearchParams.language}`;
 
  // Add eid if present
  if (config.dice.defaultSearchParams.eid) {
    url += `&eid=${config.dice.defaultSearchParams.eid}`;
  }
 
  logger.log(`Built URL: ${url}`);
  return url;
}

/**
 * Scrape Dice.com search results
 * @param {string} searchUrl - The search URL
 * @param {number} maxJobs - Maximum number of jobs to return
 * @returns {Array} Array of job objects
 */
async function scrapeDice(searchUrl, maxJobs) {
  logger.log(`Scraping Dice.com: ${searchUrl}`);
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the search URL
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(3000);

    // Check for cookie consent dialog and accept if present
    try {
      const cookieButton = await page.$('button[data-testid="cookie-banner-accept"]');
      if (cookieButton) {
        await cookieButton.click();
        await delay(1000);
      }
    } catch (e) {
      logger.log('No cookie consent dialog found or unable to accept.', 'info');
    }

    // Take a screenshot for debugging if in debug mode
    if (config.debugMode) {
      await page.screenshot({ path: `dice-debug-${Date.now()}.png` });
      logger.log('Screenshot saved as dice-debug.png');
    }
   
    // Wait for job cards to be loaded
    await page.waitForSelector('[data-cy="card"]', { timeout: 10000 }).catch(() => {
      logger.log('Could not find job cards with [data-cy="card"] selector', 'warn');
    });
   
    const jobs = await page.evaluate((maxJobs) => {
      // Try different selectors that might match job cards on Dice.com
      const selectors = [
        '[data-cy="card"]',
        '.search-card',
        'dhi-search-card',
        '[data-testid="searchCard"]',
        '.job-card',
        'article'
      ];
     
      let jobCards = [];
      for (const selector of selectors) {
        const cards = Array.from(document.querySelectorAll(selector));
        if (cards.length > 0) {
          jobCards = cards;
          console.log(`Found ${cards.length} job cards with selector: ${selector}`);
          break;
        }
      }
     
      console.log(`Total job cards found: ${jobCards.length}`);
      const results = [];
     
      for (let i = 0; i < Math.min(maxJobs, jobCards.length); i++) {
        const card = jobCards[i];
        console.log(`Processing job card ${i+1}`);
       
        // Try multiple possible selectors for each element
        const titleSelectors = ['[data-cy="card-title"]', '[data-testid="title"]', 'a.card-title-link', 'h5', '.title'];
        const companySelectors = ['[data-cy="company-name"]', '[data-testid="company-name-link"]', '.company-name', 'h6', '.employer'];
        const locationSelectors = ['[data-cy="location"]', '[data-testid="location"]', '.location', '[itemprop="location"]'];
        const dateSelectors = ['[data-cy="card-date"]', '[data-cy="search-result-posted-date"]', '.posted-date', '.date', 'time'];
        const linkSelectors = ['a[data-cy="card-title-link"]', 'a[data-testid="title-link"]', 'a.card-title-link', 'a.title', 'a[href*="/job-detail/"]'];
       
        // Helper function to find element by multiple selectors
        const findElement = (selectors) => {
          for (const selector of selectors) {
            const element = card.querySelector(selector);
            if (element) return element;
          }
          return null;
        };
       
        // Find elements
        const titleElement = findElement(titleSelectors);
        const companyElement = findElement(companySelectors);
        const locationElement = findElement(locationSelectors);
        const postedDateElement = findElement(dateSelectors);
        const linkElement = findElement(linkSelectors);
       
        // Extract data with fallbacks
        const title = titleElement ? titleElement.innerText.trim() : 'Unknown Position';
        let url = '';
        
        if (linkElement) {
          url = linkElement.href;
        } else {
          // If we can't find a direct link, look for any link that might contain job details
          const anyLink = card.querySelector('a[href*="/job-detail/"]');
          url = anyLink ? anyLink.href : '';
        }
       
        const company = companyElement ? companyElement.innerText.trim() : 'Unknown Company';
        const location = locationElement ? locationElement.innerText.trim() : 'Not specified';
        const postedDate = postedDateElement ? postedDateElement.innerText.trim() : 'N/A';
       
        console.log(`Found job: ${title} at ${company}`);
       
        // Generate a job ID from URL if possible
        let jobId = '';
        try {
          if (url.includes('/job-detail/')) {
            const urlParts = url.split('/');
            jobId = `dice-${urlParts[urlParts.length - 1]}`;
          } else {
            jobId = `dice-${Math.random().toString(36).substring(2, 15)}`;
          }
        } catch (e) {
          jobId = `dice-${Math.random().toString(36).substring(2, 15)}`;
        }
       
        results.push({
          id: jobId,
          title,
          url,
          company,
          location,
          postedDate
        });
      }
     
      return results;
    }, maxJobs);

    if (config.debugMode) {
      logger.log(`Dice.com scraper found ${jobs.length} jobs.`);
    }
   
    await browser.close();
    return jobs;
  } catch (error) {
    logger.log(`Error scraping Dice.com: ${error.message}`, 'error');
    if (browser) await browser.close();
    return [];
  }
}

/**
 * Main function to scrape Dice.com jobs
 * @param {string} timeFilter - Time filter value
 * @param {object} client - Discord client
 * @returns {object} Status object
 */
async function scrapeAllJobs(timeFilter = null, client) {
  const lastRunStatus = {
    lastRun: new Date(),
    success: false,
    errorCount: 0,
    jobsFound: 0
  };
  
  const diceTimeFilter = timeFilter || config.dice.timeFilters.day;
  logger.log(`Starting Dice.com job scraping process with time filter: ${diceTimeFilter}`);

  try {
    const channel = client.channels.cache.get(config.channelId);
    if (!channel) {
      logger.log(`Channel with ID ${config.channelId} not found`, 'error');
      return lastRunStatus;
    }

    // Generate a human-readable time filter description
    let timeFilterDescription = "";
    switch(diceTimeFilter) {
      case config.dice.timeFilters.day:
        timeFilterDescription = "today";
        break;
      case config.dice.timeFilters.threeDay:
        timeFilterDescription = "in the last 3 days";
        break;
      case config.dice.timeFilters.week:
        timeFilterDescription = "in the last 7 days";
        break;
      case config.dice.timeFilters.all:
        timeFilterDescription = "any date";
        break;
      default:
        timeFilterDescription = diceTimeFilter;
    }

    await channel.send(`Dice.com Job Postings Update (Posted ${timeFilterDescription})`);

    // Process each keyword
    for (const keyword of config.dice.jobKeywords) {
      try {
        const searchUrl = buildDiceSearchUrl(keyword, diceTimeFilter);
        logger.log(`Scraping Dice.com for "${keyword}" with time filter: ${diceTimeFilter}`);
        logger.log(`Search URL: ${searchUrl}`);

        const jobs = await scrapeDice(searchUrl, config.dice.maxJobsPerSearch);

        if (!jobs || jobs.length === 0) {
          logger.log(`No jobs found for "${keyword}"`);
          continue;
        }

        // Filter out jobs already in cache
        const newJobs = jobs.filter(job => !mongoService.jobExists(job.id, 'dice'));
        
        if (newJobs.length === 0) {
          logger.log(`No new jobs for "${keyword}"`);
          continue;
        }
        
        // Add jobs to MongoDB cache
        await mongoService.addJobs(newJobs, 'dice');
        lastRunStatus.jobsFound += newJobs.length;

        await channel.send(`Dice.com - ${keyword} (${newJobs.length} new postings)`);
         
        // Send each job as a separate embed message
        for (const job of newJobs) {
          const embed = new EmbedBuilder()
            .setTitle(job.title || `Software Engineering Position`)
            .setURL(job.url || searchUrl) // Always include a URL
            .setColor(config.dice.embedColor) // Dice.com brand color
            .setDescription(job.company || 'Visit link for more details')
            .addFields(
              { name: 'Location', value: job.location || 'Check job details', inline: true },
              { name: 'Posted', value: job.postedDate || timeFilterDescription, inline: true }
            )
            .setFooter({ text: `Source: Dice.com | ID: ${job.id.substring(0, 10)}` });
           
          await channel.send({ embeds: [embed] });
          await delay(1000); // Wait between messages to avoid rate limits
        }
      } catch (error) {
        lastRunStatus.errorCount++;
        logger.log(`Error scraping for "${keyword}": ${error.message}`, 'error');
        try {
          await channel.send(`Error scraping Dice.com for ${keyword} - ${error.message.substring(0, 100)}`);    
        } catch (msgError) {
          logger.log(`Failed to send error message: ${msgError.message}`, 'error');
        }
      }
      
      // Delay between searches to reduce detection risk
      await delay(5000);
    }
   
    await channel.send(`Dice.com job scraping complete. Found ${lastRunStatus.jobsFound} new jobs.`);
    lastRunStatus.success = true;
    logger.log(`Dice.com job scraping completed successfully. Found ${lastRunStatus.jobsFound} new jobs.`);
    
    return lastRunStatus;
  } catch (error) {
    lastRunStatus.success = false;
    logger.log(`Critical error in Dice.com scrapeAllJobs: ${error.message}`, 'error');
    return lastRunStatus;
  }
}

module.exports = {
  scrapeAllJobs
};