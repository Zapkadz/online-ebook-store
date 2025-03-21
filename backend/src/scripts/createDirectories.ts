import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

const directories = [
  'public',
  'uploads',
  'logs',
  'uploads/books',
  'uploads/covers',
  'uploads/temp'
];

function createDirectories() {
  logger.info('Creating required directories...');

  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      } catch (error) {
        logger.error(`Error creating directory ${dir}:`, error);
      }
    } else {
      logger.info(`Directory already exists: ${dir}`);
    }
  });

  // Create an empty .gitkeep file in each directory to ensure they're tracked by git
  directories.forEach(dir => {
    const gitkeepPath = path.join(process.cwd(), dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      try {
        fs.writeFileSync(gitkeepPath, '');
        logger.debug(`Created .gitkeep in: ${dir}`);
      } catch (error) {
        logger.error(`Error creating .gitkeep in ${dir}:`, error);
      }
    }
  });

  logger.info('Directory setup completed');
}

// Add script to package.json for easy running
if (require.main === module) {
  createDirectories();
}

export { createDirectories };