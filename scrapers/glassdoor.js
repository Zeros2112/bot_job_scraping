const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const config = require('../config');
const logger = require('../services/logger');
const mongoService = require('../services/mongo');
const { EmbedBuilder } = require('discord.js');
const { delay } = require('../utils/helpers');

/**
 * Scrape Glassdoor search results
 * @param {string} searchUrl - The Glassdoor search URL
 * @param {number} maxJobs - Maximum number of jobs to return
 * @returns {Array} Array of job objects
 */
async function scrapeGlassdoor(searchUrl, maxJobs) {
  logger.log(`Scraping Glassdoor: ${searchUrl}`);
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Handle potential cookie consent dialog
    try {
      const cookieButtonSelector = 'button[data-role="accept-all"]';
      if (await page.$(cookieButtonSelector)) {
        await page.click(cookieButtonSelector);
        await delay(1000);
      }
    } catch (error) {
      logger.log(`Couldn't interact with cookie consent: ${error.message}`, 'warn');
    }
    
    // Wait for job listings to load; try multiple selectors
    try {
      await page.waitForSelector('[data-test="jobListing"]', { timeout: 45000 });
    } catch (error) {
      logger.log("Couldn't find primary jobListing selector, trying alternatives...", 'warn');
      try {
        await page.waitForSelector('.react-job-listing', { timeout: 15000 });
      } catch (secondError) {
        try {
          await page.waitForSelector('.jobCard', { timeout: 15000 });
        } catch (thirdError) {
          if (config.debugMode) {
            await page.screenshot({ path: 'glassdoor-debug.png' });
            logger.log("Saved debug screenshot to glassdoor-debug.png", 'warn');
          }
          throw new Error("Failed to find any job listing selectors");
        }
      }
    }
    
    await delay(5000);

    if (config.debugMode) {
      const html = await page.content();
      fs.writeFileSync('glassdoor-page.html', html);
      logger.log("Saved page HTML to glassdoor-page.html for debugging", 'info');
    }

    const jobs = await page.evaluate((maxJobs) => {
      const results = [];

      // Simple hash function for stable ID generation
      function simpleHash(str) {
        let hash = 0;
        if (!str || str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
          hash = ((hash << 5) - hash) + str.charCodeAt(i);
          hash |= 0; // Convert to 32bit integer
        }
        return hash;
      }

      // Helper function to get a job title using multiple selectors
      function getJobTitle(el, selectors) {
        let title = "";
        for (const selector of selectors) {
          const elem = el.querySelector(selector);
          if (elem && (elem.textContent || elem.innerText)) {
            title = (elem.textContent || elem.innerText).trim();
            if (title && title.length > 2) break;
          }
        }
        if (!title || title.length < 2) {
          if (el.hasAttribute('aria-label')) {
            title = el.getAttribute('aria-label').trim();
          }
          if (!title || title.length < 2) {
            title = "Title Not Available";
          }
        }
        return title;
      }

      // Process partner listings (if any)
      const partnerListings = Array.from(document.querySelectorAll('[data-id^="job-listing-partner-"]'));
      if (partnerListings.length > 0) {
        for (let i = 0; i < Math.min(maxJobs, partnerListings.length); i++) {
          try {
            const el = partnerListings[i];
            const linkEl = el.querySelector('a[href*="partner/jobListing"]');
            if (!linkEl) continue;
            const url = linkEl.href;
            const partnerTitleSelectors = ['[class*="title"]', '[class*="jobTitle"]', 'h2', 'h3', 'h4', '[data-test*="job-link"]'];
            const title = getJobTitle(el, partnerTitleSelectors);
            const companyEl = el.querySelector('[class*="employer"], [class*="company"], [data-test*="employer"]');
            const company = companyEl ? companyEl.textContent.trim() : 'Unknown Company';
            const locationEl = el.querySelector('[class*="location"], [data-test*="location"]');
            const location = locationEl ? locationEl.textContent.trim() : 'Not specified';
            const salaryEl = el.querySelector('[class*="salary"], [data-test*="salary"]');
            const salary = salaryEl ? salaryEl.textContent.trim() : '';
            const dateEl = el.querySelector('[class*="date"], [class*="posted"], [data-test*="job-age"]');
            const postedDate = dateEl ? dateEl.textContent.trim() : '';
            let jobId = "";
            const match = url.match(/jobListingId=(\d+)/);
            if (match && match[1]) {
              jobId = `glassdoor-${match[1]}`;
            } else {
              // Use composite string for a stable hash
              jobId = `glassdoor-${simpleHash(url + title + company + location + postedDate + salary)}`;
            }
            results.push({
              id: jobId,
              title: title,
              url,
              company,
              location,
              salary,
              postedDate,
              isPartnerListing: true
            });
          } catch (error) {
            console.error("Error parsing partner listing:", error);
          }
        }
      }
      
      // Process regular job listings
      const jobNodes = Array.from(
        document.querySelectorAll('[data-test="jobListing"], .react-job-listing, .jobCard, a[href*="glassdoor.com/job-listing"], a[href*="glassdoor.com/partner/jobListing"]')
      );
      
      for (let i = 0; i < Math.min(maxJobs, jobNodes.length); i++) {
        const el = jobNodes[i];
        try {
          const titleSelectors = ['[data-test="job-link"]', 'a[data-test*="job"]', 'a[class*="job-title"]', 'a[class*="jobTitle"]', 'h2', 'h3'];
          const title = getJobTitle(el, titleSelectors);
          const companyElement = el.querySelector('[data-test="employer-name"]') ||
                                 el.querySelector('[class*="employer"]') ||
                                 el.querySelector('[class*="company"]') ||
                                 el.querySelector('.companyName');
          const company = companyElement ? (companyElement.textContent || companyElement.innerText).trim() : 'Unknown Company';
          const locationElement = el.querySelector('[data-test="location"]') ||
                                  el.querySelector('[class*="location"]') ||
                                  el.querySelector('.jobLocation');
          const location = locationElement ? (locationElement.textContent || locationElement.innerText).trim() : 'Not specified';
          const salaryElement = el.querySelector('[data-test="detailSalary"]') ||
                                el.querySelector('[class*="salary"]') ||
                                el.querySelector('[data-test*="salary"]');
          const salary = salaryElement ? (salaryElement.textContent || salaryElement.innerText).trim() : 'Not specified';
          const dateElement = el.querySelector('[data-test="job-age"]') ||
                              el.querySelector('[class*="date"]') ||
                              el.querySelector('[class*="posted"]');
          const postedDate = dateElement ? (dateElement.textContent || dateElement.innerText).trim() : 'N/A';
          let url = '';
          if (el.querySelector('[data-test="job-link"]') && el.querySelector('[data-test="job-link"]').href) {
            url = el.querySelector('[data-test="job-link"]').href;
          } else if (el.tagName === 'A' && el.href) {
            url = el.href;
          } else {
            const linkElement = el.querySelector('a[href*="glassdoor.com"]');
            if (linkElement) {
              url = linkElement.href;
            }
          }
          let jobId = "";
          const match = url.match(/jobListingId=(\d+)/) ||
                        url.match(/job-listing\/([A-Za-z0-9_-]+)/) ||
                        url.match(/[?&]jl=(\d+)/);
          if (match && match[1]) {
            jobId = `glassdoor-${match[1]}`;
          } else {
            // Use composite string from all fields for uniqueness
            jobId = `glassdoor-${simpleHash(url + title + company + location + postedDate + salary)}`;
          }
          if (url) {
            results.push({
              id: jobId,
              title: title,
              url,
              company,
              location,
              salary,
              postedDate
            });
          }
        } catch (error) {
          console.error('Error parsing job listing:', error);
        }
      }
      return results;
    }, maxJobs);

    if (config.debugMode) {
      logger.log(`Glassdoor scraper found ${jobs.length} jobs.`);
    }
    
    await browser.close();
    return jobs;
  } catch (error) {
    logger.log(`Error scraping Glassdoor: ${error.message}`, 'error');
    if (browser) await browser.close();
    return [];
  }
}

/**
 * Scrape multiple Glassdoor URLs and post a batch of new jobs
 * @param {Array} urls - Array of Glassdoor search URLs
 * @param {object} client - Discord client
 * @returns {object} Status object with job count and errors
 */
async function scrapeMultipleUrls(urls, client) {
  const lastRunStatus = {
    lastRun: new Date(),
    success: false,
    errorCount: 0,
    jobsFound: 0
  };
  
  try {
    const channel = client.channels.cache.get(config.channelId);
    if (!channel) {
      logger.log(`Channel with ID ${config.channelId} not found`, 'error');
      return lastRunStatus;
    }
    
    // Scrape all URLs concurrently
    const resultsArr = await Promise.all(urls.map(url => scrapeGlassdoor(url, config.glassdoor.maxJobsPerSearch)));
    let jobs = resultsArr.flat();
    
    // Deduplicate jobs within the scraped results by job.id
    const seen = new Set();
    jobs = jobs.filter(job => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });
    
    // Filter out jobs already processed globally
    let newJobs = jobs.filter(job => !mongoService.jobExists(job.id, 'glassdoor'));
    
    // Skip posts whose title equals "title not available"
    newJobs = newJobs.filter(job => job.title.trim().toLowerCase() !== "title not available");
    
    // Take batch for posting (up to maxJobsToPost)
    let batch = newJobs.slice(0, config.glassdoor.maxJobsToPost);
    
    // Add jobs to MongoDB cache
    if (batch.length > 0) {
      await mongoService.addJobs(batch, 'glassdoor');
      lastRunStatus.jobsFound = batch.length;
      
      await channel.send(`📋 Glassdoor: Found ${batch.length} new posting(s).`);
      
      for (const job of batch) {
        if (!job.url) {
          logger.log(`Skipping job with missing URL: ${JSON.stringify(job)}`, 'warn');
          continue;
        }
        
        try {
          const embed = new EmbedBuilder()
            .setTitle(job.title.substring(0, 255))
            .setURL(job.url)
            .setColor(config.glassdoor.embedColor)
            .setDescription(job.company || 'Company not specified');
            
          const fields = [];
          
          if (job.location && job.location !== 'Not specified') {
            fields.push({ name: 'Location', value: job.location, inline: true });
          }
          
          if (job.postedDate && job.postedDate !== 'N/A') {
            fields.push({ name: 'Posted', value: job.postedDate, inline: true });
          }
          
          if (job.salary && job.salary !== 'Not specified') {
            fields.push({ name: 'Salary', value: job.salary, inline: true });
          }
          
          if (fields.length > 0) {
            embed.addFields(fields);
          }
          
          embed.setFooter({ text: `Source: Glassdoor | ID: ${job.id.substring(0, 10)}` });
            
          await channel.send({ embeds: [embed] });
          await delay(1500);
        } catch (embedError) {
          logger.log(`Error sending job embed: ${embedError.message}`, 'error');
          lastRunStatus.errorCount++;
          
          try {
            await channel.send(`**${job.title}** at ${job.company}\nLocation: ${job.location}\nPosted: ${job.postedDate}\nLink: ${job.url}`);
            await delay(1500);
          } catch (plainTextError) {
            logger.log(`Failed to send plain text for job: ${job.url}`, 'error');
          }
        }
      }
      
      lastRunStatus.success = true;
    } else {
      await channel.send(`No new job listings found on Glassdoor.`);
      lastRunStatus.success = true;
    }
    
    return lastRunStatus;
  } catch (error) {
    logger.log(`Error in Glassdoor scrapeMultipleUrls: ${error.message}`, 'error');
    lastRunStatus.success = false;
    lastRunStatus.errorCount++;
    return lastRunStatus;
  }
}

/**
 * Main function to scrape Glassdoor jobs
 * @param {string} timeFilter - Time filter (day, week, month)
 * @param {object} client - Discord client
 * @returns {object} Status object
 */
async function scrapeAllJobs(timeFilter = 'day', client) {
  logger.log('Starting Glassdoor job scraping process');
  
  try {
    // Get the appropriate search URL based on time filter
    let searchUrl;
    
    switch (timeFilter) {
      case 'week':
        searchUrl = config.glassdoor.searchUrls.week;
        break;
      case 'month':
        searchUrl = config.glassdoor.searchUrls.month;
        break;
      case 'day':
      default:
        searchUrl = config.glassdoor.searchUrls.day;
        break;
    }
    
    return await scrapeMultipleUrls([searchUrl], client);
  } catch (error) {
    logger.log(`Critical error in Glassdoor scrapeAllJobs: ${error.message}`, 'error');
    return {
      lastRun: new Date(),
      success: false,
      errorCount: 1,
      jobsFound: 0
    };
  }
}

module.exports = {
  scrapeAllJobs,
  scrapeMultipleUrls
};