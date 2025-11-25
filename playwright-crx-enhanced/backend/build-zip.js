/**
 * Build and Zip Backend for Deployment
 * Creates a production-ready zip file with all necessary files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = 'build-output';
const ZIP_NAME = `backend-${new Date().toISOString().split('T')[0]}.zip`;

console.log('🚀 Starting backend build and zip process...\n');

// Step 1: Clean previous builds
console.log('📁 Step 1: Cleaning previous builds...');
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
console.log('✓ Cleaned\n');

// Step 2: Copy necessary files
console.log('📋 Step 2: Copying files...');

const filesToCopy = [
  'dist',
  'package.json',
  'package-lock.json',
  '.env.example',
  'prisma',
  'migrations'
];

filesToCopy.forEach(item => {
  const sourcePath = path.join(__dirname, item);
  const destPath = path.join(OUTPUT_DIR, item);
  
  if (fs.existsSync(sourcePath)) {
    if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, destPath);
      console.log(`✓ Copied folder: ${item}`);
    } else {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ Copied file: ${item}`);
    }
  } else {
    console.log(`⚠️  Skipped (not found): ${item}`);
  }
});
console.log('');

// Step 3: Create production package.json (without devDependencies)
console.log('📦 Step 3: Creating production package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
delete packageJson.devDependencies;
packageJson.scripts = {
  start: 'node dist/index.js',
  'migrate:deploy': 'npx prisma migrate deploy'
};
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
console.log('✓ Production package.json created\n');

// Step 4: Create deployment instructions
console.log('📝 Step 4: Creating deployment instructions...');
const deployInstructions = `# Backend Deployment Instructions

## Prerequisites
- Node.js 20+ installed
- PostgreSQL database
- Environment variables configured

## Deployment Steps

### 1. Extract the zip file
unzip ${ZIP_NAME}

### 2. Install dependencies
cd backend
npm ci --production

### 3. Configure environment
cp .env.example .env
# Edit .env with your production values:
# - DATABASE_URL
# - PORT
# - JWT_SECRET
# - AI_ANALYSIS_SERVICE_URL (if using AI features)

### 4. Run database migrations
npm run migrate:deploy

### 5. Start the server
npm start

## Production Start Options

### Option 1: Direct Node.js
node dist/index.js

### Option 2: PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name playwright-backend
pm2 save
pm2 startup

### Option 3: Docker
docker build -t playwright-backend .
docker run -p 3001:3001 --env-file .env playwright-backend

## Health Check
curl http://localhost:3001/health

## Environment Variables Required
- PORT=3001
- DATABASE_URL=postgresql://user:password@host:port/database
- JWT_SECRET=your-secret-key
- AI_ANALYSIS_SERVICE_URL=http://localhost:8000 (optional)

## File Structure
- dist/          - Compiled JavaScript
- prisma/        - Database schema
- migrations/    - Database migrations
- package.json   - Dependencies
- .env.example   - Environment template
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'DEPLOY.txt'), deployInstructions);
console.log('✓ Deployment instructions created\n');

// Step 5: Create zip file
console.log('🗜️  Step 5: Creating zip file...');
try {
  // Try using PowerShell Compress-Archive (Windows)
  execSync(`powershell Compress-Archive -Path "${OUTPUT_DIR}\\*" -DestinationPath "${ZIP_NAME}" -Force`, {
    stdio: 'inherit'
  });
  console.log(`✓ Zip created: ${ZIP_NAME}\n`);
} catch (error) {
  console.error('❌ PowerShell zip failed, trying alternative method...\n');
  
  // Alternative: Create instruction to manually zip
  console.log('📝 Please manually zip the build-output folder');
  console.log(`   Target name: ${ZIP_NAME}\n`);
}

// Step 6: Display summary
console.log('✅ Build complete!\n');
console.log('📊 Summary:');
console.log(`   Output folder: ${OUTPUT_DIR}/`);
console.log(`   Zip file: ${ZIP_NAME}`);
console.log(`   Size: ${getDirectorySize(OUTPUT_DIR)} MB`);
console.log('\n📋 Next steps:');
console.log(`   1. Extract ${ZIP_NAME} on server`);
console.log('   2. Run: npm ci --production');
console.log('   3. Configure .env file');
console.log('   4. Run: npm run migrate:deploy');
console.log('   5. Run: npm start');
console.log('\n🎉 Ready for deployment!\n');

// Helper functions
function copyFolderRecursive(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

function getDirectorySize(dirPath) {
  let size = 0;
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(itemPath);
      files.forEach(file => {
        calculateSize(path.join(itemPath, file));
      });
    } else {
      size += stats.size;
    }
  }
  
  calculateSize(dirPath);
  return (size / (1024 * 1024)).toFixed(2);
}
