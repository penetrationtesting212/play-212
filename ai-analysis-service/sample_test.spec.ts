
import { test, expect } from '@playwright/test';

test('sample test with XPath', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Absolute XPath - BAD
  await page.locator('/html/body/div[1]/div[2]/button[3]').click();
  
  // Relative XPath with index - BAD
  await page.locator('//div[1]/span[2]/button').click();
  
  // XPath with data-testid - BETTER
  await page.locator('xpath=//button[@data-testid="submit"]').click();
  
  // XPath with aria-label - GOOD
  await page.locator('//button[@aria-label="Submit form"]').click();
  
  // XPath with dynamic ID - BAD
  await page.locator('//div[@id="session-123456"]').isVisible();
  
  // XPath with CSS-in-JS - BAD
  await page.locator('//div[@class="css-1x2y3z4 sc-abcdef"]').click();
});
