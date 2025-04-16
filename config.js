// Global configuration for the job scraping bot
module.exports = {
    // Discord configuration
    channelId: process.env.CHANNEL_ID,
    debugMode: process.env.DEBUG_MODE === 'true',
    
    // Main scraping schedule (for all job sources)
    scrapingSchedule: '0 9 * * *', // Daily at 9:00 AM (cron format)
    
    // MongoDB configuration
    mongo: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
      dbName: process.env.DB_NAME || 'job_scraper_bot',
      collections: {
        linkedin: 'linkedin_jobs',
        simplyhired: 'simplyhired_jobs',
        ziprecruiter: 'ziprecruiter_jobs',
        careerjet: 'careerjet_jobs',
        jobright: 'jobright_jobs',
        glassdoor: 'glassdoor_jobs',
        dice: 'dice_jobs',
        github: 'github_jobs'
      },
      maxCacheSize: 1000 // Maximum number of jobs to keep in cache per source
    },
    
    // LinkedIn scraper configuration
    linkedin: {
      jobKeywords: [
        'software engineer intern',
        'software engineer new grad'
      ],
      // Updated locations to include United States and Canada
      jobLocations: ['United States', 'Canada'],
      maxJobsPerSearch: 10, // Increased from 5 to 10
      fileCache: 'linkedin-job-cache.json', // Fallback file cache
      embedColor: '#0077b5',
      optionalQueryParams: {
        f_TPR: 'r86400' // Default: past 24 hours
      },
      timeFilters: {
        day: 'r86400',      // Past 24 hours
        week: 'r604800',    // Past week
        month: 'r2592000'   // Past month
      },
      // Job limits mapping for each keyword with a default fallback.
      jobLimits: {
        "software engineer intern": 10,
        "software engineer new grad": 10,
        default: 10
      }
    },
    
    // SimplyHired scraper configuration
    simplyhired: {
      jobKeywords: [
        'software engineer intern',
        'software engineer new grad'
      ],
      // Updated locations to include United States and Canada
      jobLocations: ['United States', 'Canada'],
      maxJobsPerSearch: 10, // Increased from 5 to 10
      maxPages: 5, // Maximum pages to search per keyword/location
      fileCache: 'simplyhired-job-cache.json', // Fallback file cache
      embedColor: '#1e90ff',
      timeFilters: {
        day: '1',    // Past 24 hours
        week: '7',   // Past week
        month: '30'  // Past month
      },
      jobLimits: {
        "software engineer intern": 10,
        "software engineer new grad": 10,
        default: 10
      }
    },
    
    // ZipRecruiter scraper configuration
    ziprecruiter: {
      jobKeywords: [
        'software engineer intern',
        'software engineer new grad'
      ],
      // Blank location implies USA-wide; if Canada is desired for this source, you might consider specifying both
      // For now, we'll leave it as blank if the intention is to focus on US-based but you can change this to ['United States', 'Canada']
      jobLocations: [''],
      maxJobsPerSearch: 10, // Increased from 5 to 10
      fileCache: 'ziprecruiter-job-cache.json', // Fallback file cache
      embedColor: '#1e90ff',
      timeFilters: {
        day: '1',    // Past 24 hours
        week: '5',   // Past ~week
        month: '30'  // Past month
      }
    },
    
    // CareerJet scraper configuration
    careerjet: {
      jobKeywords: [
        'software engineer intern',
        'software engineer new grad'
      ],
      maxJobsPerSearch: 10, // Increased from 5 to 10
      fileCache: 'careerjet-job-cache.json', // Fallback file cache
      embedColor: '#1e90ff',
      timeFilters: {
        day: '1',    // Past 24 hours
        week: '7',   // Past week
        month: '30'  // Past month
      },
      jobsLimits: {
        "software engineer intern": 10,
        "software engineer new grad":5,
        default:10
      }
    },
    
    // Jobright.ai scraper configuration
    jobright: {
      baseUrl: 'https://jobright.ai/jobs/search',
      searches: [
        {
          name: 'Software Developer Intern / New Grad',
          jobTitle: 'Software Developer'
        },
        {
          name: 'Software Engineer Intern / New Grad',
          jobTitle: 'Software Engineer'
        },
        {
          name: 'Software Engineer - New Grad',
          jobTitle: 'Software Engineer - New Grad'
        }
      ],
      additionalParams: 'workModel=2&city=Within+US&seniority=1&jobTypes=1%2C2%2C3%2C4&radiusRange=50',
      maxJobsPerSearch: 5,
      fileCache: 'jobright-job-cache.json',
      embedColor: '#1e90ff'
    },
    
    // Glassdoor scraper configuration
    glassdoor: {
      jobKeywords: ['software-engineer-intern'],
      jobLocations: ['us'],
      maxJobsPerSearch: 5,
      maxJobsToPost: 10, // Maximum jobs to post (from all searches combined)
      fileCache: 'glassdoor-job-cache.json',
      embedColor: '#0caa41',
      searchUrls: {
        day: 'https://www.glassdoor.com/Job/us-software-engineer-intern-jobs-SRCH_IL.0,2_IS1_KO3,27_IP1.htm?sortBy=date_desc&fromAge=1',
        week: 'https://www.glassdoor.com/Job/us-software-engineer-intern-jobs-SRCH_IL.0,2_IS1_KO3,27_IP1.htm?sortBy=date_desc&fromAge=7',
        month: 'https://www.glassdoor.com/Job/us-software-engineer-intern-jobs-SRCH_IL.0,2_IS1_KO3,27_IP1.htm?sortBy=date_desc&fromAge=30'
      }
    },
    
    // Dice.com scraper configuration
    dice: {
      jobKeywords: [
        'summer 2025 software engineer intern',
        'software engineer intern',
        'software developer intern'
      ],
      maxJobsPerSearch: 10,
      fileCache: 'dice-job-cache.json',
      embedColor: '#2b2b67',
      baseUrl: 'https://www.dice.com/jobs',
      defaultSearchParams: {
        countryCode: 'US',
        radius: '30',
        radiusUnit: 'mi',
        page: '1',
        pageSize: '20',
        language: 'en',
        eid: '8855'
      },
      timeFilters: {
        day: 'ONE',    // Today
        threeDay: 'THREE', // Last 3 days
        week: 'SEVEN', // Last 7 days
        all: 'ALL'     // All time
      }
    },
    
    // GitHub scraper configuration
    github: {
      // List of GitHub repositories to scrape
      repos: [
        { name: 'SimplifyJobs', url: 'https://github.com/SimplifyJobs/Summer2025-Internships', maxJobs: 20 },
        { name: 'SimplifyJobsOffSeason', url: 'https://github.com/SimplifyJobs/Summer2025-Internships/blob/dev/README-Off-Season.md', maxJobs: 5 },
        { name: 'Vanshb03', url: 'https://github.com/vanshb03/Summer2025-Internships', maxJobs: 20 },
        { name: 'SpeedyApply', url: 'https://github.com/speedyapply/2025-SWE-College-Jobs', maxJobs: 2 }
      ],
      fileCache: 'github-job-cache.json',
      embedColor: '#1e90ff'
    },
    
    // Logging configuration
    logging: {
      directory: 'logs',
      errorFile: 'error.log',
      combinedFile: 'combined.log'
    }
  };
  