/**
 * Visual Regression Testing with AI Analysis
 * Example showing how to integrate AI-powered visual regression analysis
 */

import { test, expect } from '@playwright/test';
import axios from 'axios';
import fs from 'fs';

const AI_ANALYSIS_API = 'http://localhost:3001/api/ai-analysis';

// Helper function to capture and analyze screenshots
async function analyzeVisualRegression(
  page: any,
  testName: string,
  options: {
    tolerance?: number;
    updateBaseline?: boolean;
    maskSelectors?: string[];
  } = {}
) {
  const { tolerance = 0.95, updateBaseline = false, maskSelectors = [] } = options;
  
  const baselinePath = `./screenshots/baseline-${testName}.png`;
  const currentPath = `./screenshots/current-${testName}.png`;
  
  // Take current screenshot
  const screenshotOptions: any = {
    path: currentPath,
    fullPage: true
  };
  
  // Add masking if specified
  if (maskSelectors.length > 0) {
    screenshotOptions.mask = maskSelectors.map(sel => page.locator(sel));
  }
  
  await page.screenshot(screenshotOptions);
  
  // If baseline doesn't exist or update requested, create it
  if (updateBaseline || !fs.existsSync(baselinePath)) {
    fs.copyFileSync(currentPath, baselinePath);
    console.log(`✅ Baseline created/updated: ${baselinePath}`);
    return { isBaseline: true };
  }
  
  // Read both images as base64
  const beforeBase64 = fs.readFileSync(baselinePath, 'base64');
  const afterBase64 = fs.readFileSync(currentPath, 'base64');
  
  // Call AI Analysis API
  const response = await axios.post(`${AI_ANALYSIS_API}/visual-regression`, {
    before_screenshot: beforeBase64,
    after_screenshot: afterBase64,
    tolerance: tolerance
  });
  
  return response.data.data;
}

// ==================== Test Examples ====================

test.describe('Visual Regression with AI Analysis', () => {
  
  test('homepage visual test with AI analysis', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Perform visual regression with AI analysis
    const analysis = await analyzeVisualRegression(page, 'homepage', {
      tolerance: 0.95,
      maskSelectors: [
        '.timestamp',      // Mask dynamic timestamps
        '.user-avatar',    // Mask user-specific content
        '.ad-banner'       // Mask ads
      ]
    });
    
    // Log AI insights
    console.log('\n📊 Visual Regression Analysis:');
    console.log(`Similarity: ${(analysis.similarity * 100).toFixed(2)}%`);
    console.log(`Verdict: ${analysis.verdict}`);
    console.log(`\n🤖 LLM Analysis: ${analysis.llm_description}`);
    
    // Check if there are changes
    if (analysis.has_changes) {
      console.log(`\n⚠️  Changes Detected (${analysis.change_summary.total}):`);
      
      analysis.changes.forEach((change: any, index: number) => {
        console.log(`\n${index + 1}. ${change.description}`);
        console.log(`   Severity: ${change.severity}`);
        console.log(`   Area: ${change.area}`);
        console.log(`   Type: ${change.type}`);
      });
      
      // Show recommendations
      if (analysis.recommendations.length > 0) {
        console.log('\n💡 AI Recommendations:');
        analysis.recommendations.forEach((rec: any) => {
          console.log(`   [${rec.priority}] ${rec.message}`);
          console.log(`   Action: ${rec.action}`);
        });
      }
      
      // Show accessibility issues
      if (analysis.accessibility_issues.length > 0) {
        console.log('\n♿ Accessibility Concerns:');
        analysis.accessibility_issues.forEach((issue: any) => {
          console.log(`   - ${issue.description}`);
          console.log(`     WCAG: ${issue.wcag_concern}`);
        });
      }
      
      // Show Playwright suggestions
      console.log('\n📝 Suggested Playwright Code:');
      console.log(analysis.suggested_playwright_code.assertion);
      
      if (analysis.playwright_insights.rerun_recommended) {
        console.log('\n⚠️  Rerun recommended - changes may be flaky');
      }
    }
    
    // Assert based on AI verdict
    expect(analysis.verdict).toBe('PASS');
    expect(analysis.similarity).toBeGreaterThanOrEqual(0.95);
  });
  
  
  test('button styling visual regression', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Focus on specific element
    const button = page.locator('button.primary');
    await expect(button).toBeVisible();
    
    // Take screenshot of specific element
    const screenshotBuffer = await button.screenshot();
    const base64Screenshot = screenshotBuffer.toString('base64');
    
    // For element-specific regression, you'd compare against a baseline
    // This example shows the full flow
    console.log('📸 Captured button screenshot for regression testing');
  });
  
  
  test('responsive design visual regression', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Test different viewports
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500); // Wait for reflow
      
      const analysis = await analyzeVisualRegression(page, `responsive-${viewport.name}`, {
        tolerance: 0.92 // Slightly lower tolerance for responsive tests
      });
      
      console.log(`\n📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log(`   Similarity: ${(analysis.similarity * 100).toFixed(2)}%`);
      console.log(`   Status: ${analysis.verdict}`);
      
      expect(analysis.verdict).toBe('PASS');
    }
  });
  
  
  test('dark mode visual regression', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    
    const analysis = await analyzeVisualRegression(page, 'dark-mode', {
      tolerance: 0.90
    });
    
    console.log('\n🌙 Dark Mode Analysis:');
    console.log(`   Similarity: ${(analysis.similarity * 100).toFixed(2)}%`);
    console.log(`   ${analysis.llm_description}`);
    
    // Check for color changes
    const colorChanges = analysis.color_changes || [];
    if (colorChanges.length > 0) {
      console.log(`\n🎨 Color Changes Detected: ${colorChanges.length}`);
    }
    
    expect(analysis.verdict).toBe('PASS');
  });
  
  
  test('animation state visual regression', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Wait for animations to complete
    await page.waitForTimeout(2000);
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });
    
    const analysis = await analyzeVisualRegression(page, 'no-animations', {
      tolerance: 0.98 // Higher tolerance when animations are disabled
    });
    
    console.log('\n🎭 Animation-Disabled State:');
    console.log(`   Stability: ${analysis.playwright_insights.test_stability}`);
    
    expect(analysis.verdict).toBe('PASS');
  });
});


// ==================== Advanced Example: CI/CD Integration ====================

test.describe('CI/CD Visual Regression Suite', () => {
  
  test('full page regression with detailed AI report', async ({ page }) => {
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');
    
    // Comprehensive visual regression
    const analysis = await analyzeVisualRegression(page, 'cicd-full-page', {
      tolerance: 0.95,
      maskSelectors: ['.timestamp', '.session-id', '.csrf-token']
    });
    
    // Generate detailed report
    const report = {
      testName: 'Full Page Visual Regression',
      timestamp: new Date().toISOString(),
      verdict: analysis.verdict,
      similarity: analysis.similarity,
      threshold: analysis.threshold,
      
      // AI Insights
      aiAnalysis: {
        description: analysis.llm_description,
        severity: analysis.llm_severity,
        impact: analysis.llm_impact
      },
      
      // Changes breakdown
      changes: {
        total: analysis.change_summary.total,
        critical: analysis.change_summary.critical,
        medium: analysis.change_summary.medium,
        low: analysis.change_summary.low,
        details: analysis.changes
      },
      
      // Recommendations
      recommendations: analysis.recommendations,
      accessibilityIssues: analysis.accessibility_issues,
      
      // Playwright insights
      playwrightInsights: analysis.playwright_insights
    };
    
    // Save report
    const reportPath = `./visual-regression-reports/${Date.now()}-report.json`;
    fs.mkdirSync('./visual-regression-reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report saved: ${reportPath}`);
    
    // Assert
    if (analysis.verdict === 'FAIL') {
      console.error('\n❌ Visual regression FAILED');
      console.error('Review the report for details');
      
      // In CI/CD, you might want to:
      // 1. Upload screenshots to artifact storage
      // 2. Post to Slack/Teams
      // 3. Create GitHub issue
      // 4. Send email notification
    }
    
    expect(analysis.verdict).toBe('PASS');
  });
});


// ==================== Utility: Batch Analysis ====================

test('batch visual regression analysis', async ({ page }) => {
  const pages = [
    { url: 'https://example.com', name: 'home' },
    { url: 'https://example.com/about', name: 'about' },
    { url: 'https://example.com/contact', name: 'contact' }
  ];
  
  const results = [];
  
  for (const pageInfo of pages) {
    await page.goto(pageInfo.url);
    await page.waitForLoadState('networkidle');
    
    const analysis = await analyzeVisualRegression(page, pageInfo.name, {
      tolerance: 0.95
    });
    
    results.push({
      page: pageInfo.name,
      url: pageInfo.url,
      verdict: analysis.verdict,
      similarity: analysis.similarity,
      changes: analysis.change_summary.total
    });
  }
  
  // Summary report
  console.log('\n📊 Batch Visual Regression Summary:');
  console.table(results);
  
  const failedPages = results.filter(r => r.verdict === 'FAIL');
  expect(failedPages.length).toBe(0);
});
