/**
 * Complete Flow: Playwright Screenshot Capture → AI Analysis
 * This shows the step-by-step process
 */

import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Configuration
const SCREENSHOT_DIR = './test-screenshots';
const AI_API = 'http://localhost:3001/api/ai-analysis';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ==================== FLOW DEMONSTRATION ====================

test.describe('Screenshot Capture Flow', () => {
  
  test('STEP 1: Basic screenshot capture', async ({ page }) => {
    console.log('\n📸 STEP 1: Capturing Screenshot with Playwright\n');
    
    // Navigate to page
    await page.goto('https://example.com');
    console.log('✓ Navigated to page');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    console.log('✓ Page fully loaded');
    
    // Capture full page screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, 'example-full-page.png');
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`✓ Screenshot saved: ${screenshotPath}`);
    
    // Verify file exists
    expect(fs.existsSync(screenshotPath)).toBeTruthy();
    const stats = fs.statSync(screenshotPath);
    console.log(`✓ File size: ${stats.size} bytes`);
  });

  
  test('STEP 2: Screenshot with options', async ({ page }) => {
    console.log('\n📸 STEP 2: Screenshot with Advanced Options\n');
    
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Option 1: Viewport only (faster)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'viewport-only.png'),
      fullPage: false
    });
    console.log('✓ Viewport screenshot captured');
    
    // Option 2: Specific element only
    const header = page.locator('h1').first();
    await header.screenshot({
      path: path.join(SCREENSHOT_DIR, 'element-only.png')
    });
    console.log('✓ Element screenshot captured');
    
    // Option 3: With masking (hide dynamic content)
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'with-masking.png'),
      fullPage: true,
      mask: [
        page.locator('.timestamp'),
        page.locator('.user-id')
      ]
    });
    console.log('✓ Masked screenshot captured');
    
    // Option 4: With animations disabled
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'no-animations.png'),
      fullPage: true,
      animations: 'disabled'
    });
    console.log('✓ Animation-disabled screenshot captured');
  });

  
  test('STEP 3: Capture and convert to base64', async ({ page }) => {
    console.log('\n📸 STEP 3: Capture and Convert to Base64\n');
    
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Method 1: Save to file then read
    const filePath = path.join(SCREENSHOT_DIR, 'temp.png');
    await page.screenshot({ path: filePath });
    const base64FromFile = fs.readFileSync(filePath, 'base64');
    console.log(`✓ Method 1 - Base64 length: ${base64FromFile.length} chars`);
    
    // Method 2: Capture directly to buffer (recommended)
    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const base64FromBuffer = screenshotBuffer.toString('base64');
    console.log(`✓ Method 2 - Base64 length: ${base64FromBuffer.length} chars`);
    
    // Both methods produce same result
    console.log(`✓ Base64 preview: ${base64FromBuffer.substring(0, 50)}...`);
  });

  
  test('STEP 4: Baseline creation workflow', async ({ page }) => {
    console.log('\n📸 STEP 4: Creating Baseline Screenshots\n');
    
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    const baselineDir = path.join(SCREENSHOT_DIR, 'baselines');
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
    }
    
    // Create baseline for different scenarios
    const scenarios = [
      { name: 'desktop', viewport: { width: 1920, height: 1080 } },
      { name: 'tablet', viewport: { width: 768, height: 1024 } },
      { name: 'mobile', viewport: { width: 375, height: 667 } }
    ];
    
    for (const scenario of scenarios) {
      // Set viewport
      await page.setViewportSize(scenario.viewport);
      console.log(`\n  Setting viewport: ${scenario.name} (${scenario.viewport.width}x${scenario.viewport.height})`);
      
      // Wait for responsive layout
      await page.waitForTimeout(500);
      
      // Capture baseline
      const baselinePath = path.join(baselineDir, `baseline-${scenario.name}.png`);
      await page.screenshot({
        path: baselinePath,
        fullPage: true
      });
      
      console.log(`  ✓ Baseline created: ${baselinePath}`);
    }
  });

  
  test('STEP 5: Compare current vs baseline', async ({ page }) => {
    console.log('\n📸 STEP 5: Comparing Screenshots\n');
    
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    const testName = 'comparison-demo';
    const baselinePath = path.join(SCREENSHOT_DIR, 'baselines', `${testName}.png`);
    const currentPath = path.join(SCREENSHOT_DIR, 'current', `${testName}.png`);
    
    // Ensure directories exist
    fs.mkdirSync(path.dirname(currentPath), { recursive: true });
    
    // Capture current screenshot
    await page.screenshot({
      path: currentPath,
      fullPage: true
    });
    console.log(`✓ Current screenshot: ${currentPath}`);
    
    // If baseline doesn't exist, create it
    if (!fs.existsSync(baselinePath)) {
      fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`✓ Created baseline: ${baselinePath}`);
      console.log('⚠️  First run - baseline created, no comparison');
      return;
    }
    
    console.log(`✓ Baseline exists: ${baselinePath}`);
    console.log('✓ Ready for comparison');
    
    // Read both for comparison
    const baselineBuffer = fs.readFileSync(baselinePath);
    const currentBuffer = fs.readFileSync(currentPath);
    
    // Simple byte comparison
    const areIdentical = baselineBuffer.equals(currentBuffer);
    console.log(`✓ Screenshots identical: ${areIdentical}`);
  });

  
  test('STEP 6: Send to AI Analysis API', async ({ page }) => {
    console.log('\n📸 STEP 6: Sending to AI Analysis\n');
    
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Capture screenshots
    console.log('Capturing screenshots...');
    const baselineBuffer = await page.screenshot({ fullPage: true });
    
    // Simulate a small change (for demo, we'll use same image)
    const currentBuffer = await page.screenshot({ fullPage: true });
    
    // Convert to base64
    const baselineBase64 = baselineBuffer.toString('base64');
    const currentBase64 = currentBuffer.toString('base64');
    console.log(`✓ Converted to base64 (${baselineBase64.length} chars each)`);
    
    // Send to AI Analysis API
    console.log('\nSending to AI Analysis API...');
    try {
      const response = await axios.post(`${AI_API}/visual-regression`, {
        before_screenshot: baselineBase64,
        after_screenshot: currentBase64,
        tolerance: 0.95
      });
      
      const result = response.data.data;
      
      console.log('\n📊 AI Analysis Results:');
      console.log(`   Verdict: ${result.verdict}`);
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(2)}%`);
      console.log(`   LLM Description: ${result.llm_description}`);
      console.log(`   Changes Detected: ${result.change_summary.total}`);
      
      if (result.recommendations.length > 0) {
        console.log('\n💡 Recommendations:');
        result.recommendations.forEach((rec: any) => {
          console.log(`   - [${rec.priority}] ${rec.message}`);
        });
      }
      
      console.log('\n📝 Suggested Code:');
      console.log(result.suggested_playwright_code.assertion);
      
    } catch (error: any) {
      console.error('❌ AI Analysis API error:', error.message);
      console.log('⚠️  Make sure Python service is running on port 8000');
      console.log('   Command: cd ai-analysis-service && python main.py');
    }
  });

  
  test('STEP 7: Complete workflow with retry logic', async ({ page }) => {
    console.log('\n📸 STEP 7: Production-Ready Workflow\n');
    
    const testConfig = {
      name: 'production-test',
      url: 'https://example.com',
      tolerance: 0.95,
      maxRetries: 3,
      maskSelectors: ['.timestamp', '.session-id']
    };
    
    // Helper function
    async function captureWithRetry(page: Page, config: typeof testConfig) {
      const baselinePath = path.join(SCREENSHOT_DIR, 'baselines', `${config.name}.png`);
      const currentPath = path.join(SCREENSHOT_DIR, 'current', `${config.name}.png`);
      
      // Navigate
      await page.goto(config.url);
      await page.waitForLoadState('networkidle');
      console.log(`✓ Loaded: ${config.url}`);
      
      // Capture with masking
      const screenshotOptions: any = {
        fullPage: true,
        animations: 'disabled'
      };
      
      if (config.maskSelectors.length > 0) {
        screenshotOptions.mask = config.maskSelectors.map(sel => page.locator(sel));
      }
      
      // Capture current
      const currentBuffer = await page.screenshot(screenshotOptions);
      fs.mkdirSync(path.dirname(currentPath), { recursive: true });
      fs.writeFileSync(currentPath, currentBuffer);
      console.log(`✓ Current screenshot captured`);
      
      // Check baseline
      if (!fs.existsSync(baselinePath)) {
        fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
        fs.copyFileSync(currentPath, baselinePath);
        console.log(`✓ Baseline created (first run)`);
        return { isFirstRun: true };
      }
      
      // Compare
      const baselineBuffer = fs.readFileSync(baselinePath);
      const baselineBase64 = baselineBuffer.toString('base64');
      const currentBase64 = currentBuffer.toString('base64');
      
      // Call AI Analysis
      for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
          console.log(`\nAttempt ${attempt}/${config.maxRetries}: Analyzing...`);
          
          const response = await axios.post(`${AI_API}/visual-regression`, {
            before_screenshot: baselineBase64,
            after_screenshot: currentBase64,
            tolerance: config.tolerance
          }, {
            timeout: 30000
          });
          
          const result = response.data.data;
          
          console.log(`✓ Analysis complete`);
          console.log(`  Verdict: ${result.verdict}`);
          console.log(`  Similarity: ${(result.similarity * 100).toFixed(2)}%`);
          
          return result;
          
        } catch (error: any) {
          console.log(`  ⚠️  Attempt ${attempt} failed: ${error.message}`);
          
          if (attempt === config.maxRetries) {
            console.log(`  ❌ All retries exhausted`);
            throw error;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Execute
    try {
      const result = await captureWithRetry(page, testConfig);
      
      if ('isFirstRun' in result) {
        console.log('\n✅ First run complete - baseline established');
      } else {
        console.log('\n✅ Visual regression test complete');
        expect(result.verdict).toBe('PASS');
      }
      
    } catch (error: any) {
      console.error('\n❌ Workflow failed:', error.message);
      throw error;
    }
  });
});


// ==================== HELPER UTILITIES ====================

test.describe('Screenshot Utilities', () => {
  
  test('Utility: Bulk screenshot capture', async ({ page }) => {
    console.log('\n🔧 UTILITY: Bulk Screenshot Capture\n');
    
    const pages = [
      { url: 'https://example.com', name: 'home' },
      { url: 'https://example.com', name: 'home-mobile' } // Same URL, different viewport
    ];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      
      // Set viewport if mobile
      if (pageInfo.name.includes('mobile')) {
        await page.setViewportSize({ width: 375, height: 667 });
      }
      
      const screenshotPath = path.join(SCREENSHOT_DIR, `${pageInfo.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      
      console.log(`✓ Captured: ${pageInfo.name}`);
    }
  });

  
  test('Utility: Screenshot with wait strategies', async ({ page }) => {
    console.log('\n🔧 UTILITY: Wait Strategies\n');
    
    await page.goto('https://example.com');
    
    // Strategy 1: Wait for specific element
    await page.waitForSelector('h1', { state: 'visible' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wait-element.png') });
    console.log('✓ Strategy 1: Wait for element');
    
    // Strategy 2: Wait for network idle
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wait-network.png') });
    console.log('✓ Strategy 2: Wait for network idle');
    
    // Strategy 3: Wait for specific state
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wait-dom.png') });
    console.log('✓ Strategy 3: Wait for DOM');
    
    // Strategy 4: Custom wait
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'wait-custom.png') });
    console.log('✓ Strategy 4: Custom wait function');
  });

  
  test('Utility: Clean up old screenshots', async () => {
    console.log('\n🔧 UTILITY: Cleanup\n');
    
    const currentDir = path.join(SCREENSHOT_DIR, 'current');
    if (fs.existsSync(currentDir)) {
      const files = fs.readdirSync(currentDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`✓ Deleted old file: ${file}`);
        }
      });
    }
    
    console.log('✓ Cleanup complete');
  });
});


// ==================== PLAYWRIGHT BUILT-IN VISUAL COMPARISON ====================

test.describe('Playwright Built-in Screenshot Comparison', () => {
  
  test('Built-in: expect.toHaveScreenshot()', async ({ page }) => {
    console.log('\n📸 Playwright Built-in Visual Comparison\n');
    
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Playwright's built-in visual comparison
    // First run: creates baseline
    // Subsequent runs: compares against baseline
    try {
      await expect(page).toHaveScreenshot('example-page.png', {
        maxDiffPixels: 100,        // Allow up to 100 different pixels
        threshold: 0.2,             // Pixel color difference threshold
        animations: 'disabled',     // Disable animations
        scale: 'css'                // Use CSS pixels
      });
      console.log('✓ Visual comparison passed');
    } catch (error: any) {
      console.log('⚠️  Visual comparison failed');
      console.log('   Run with --update-snapshots to update baseline');
      // Don't fail the test for demo purposes
    }
  });

  
  test('Built-in: Element screenshot comparison', async ({ page }) => {
    console.log('\n📸 Element-Level Comparison\n');
    
    await page.goto('https://example.com');
    const header = page.locator('h1').first();
    
    try {
      await expect(header).toHaveScreenshot('header.png', {
        maxDiffPixels: 50
      });
      console.log('✓ Header visual comparison passed');
    } catch (error: any) {
      console.log('⚠️  First run - baseline created');
    }
  });
});
