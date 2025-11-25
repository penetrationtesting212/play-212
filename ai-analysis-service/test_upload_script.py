"""
Test Script Upload with GPT-4o XPath Analysis
"""

import requests

API_URL = "http://localhost:8000/api/ai-analysis"

print("\n" + "="*80)
print("📤 UPLOAD PLAYWRIGHT SCRIPT FOR XPATH ANALYSIS")
print("="*80)

# Create a sample Playwright script with XPath
sample_script = """
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
"""

# Save to file
with open('sample_test.spec.ts', 'w') as f:
    f.write(sample_script)

# Upload file
print("\n📁 Uploading: sample_test.spec.ts")
print("="*80)

with open('sample_test.spec.ts', 'rb') as f:
    files = {'file': ('sample_test.spec.ts', f, 'text/plain')}
    response = requests.post(f"{API_URL}/upload-script-xpath-analysis", files=files)

if response.status_code == 200:
    data = response.json()['data']
    
    print(f"\n✅ Analysis Complete!")
    print(f"Filename: {data['filename']}")
    print(f"Script Size: {data['script_size']} bytes")
    print(f"XPath Found: {data['xpath_count']}")
    
    print(f"\n📊 Summary:")
    summary = data['summary']
    print(f"  Total XPaths: {summary['total_xpaths']}")
    print(f"  Low Stability: {summary['low_stability']}")
    print(f"  Medium Stability: {summary['medium_stability']}")
    print(f"  High Stability: {summary['high_stability']}")
    print(f"  Average Complexity: {summary['avg_complexity']:.1f}/100")
    
    print(f"\n🔍 XPath Analysis Details:")
    for idx, xpath_analysis in enumerate(data['xpaths_analyzed'], 1):
        print(f"\n  {idx}. {xpath_analysis['xpath']}")
        print(f"     Type: {xpath_analysis['type']}")
        print(f"     Stability: {xpath_analysis['stability']}")
        print(f"     Complexity: {xpath_analysis['complexity_score']}/100")
        if xpath_analysis['issues']:
            print(f"     Issues: {', '.join(xpath_analysis['issues'])}")
        
        # GPT-4o Recommendation
        if 'gpt4_recommendation' in xpath_analysis:
            print(f"\n     🤖 GPT-4o Recommendation:")
            print(f"     {xpath_analysis['gpt4_recommendation'][:200]}...")
    
    print(f"\n📝 Overall GPT-4o Script Analysis:")
    print("="*80)
    print(data['gpt4_script_analysis'])
    
    print(f"\n💡 General Recommendations:")
    for rec in data['recommendations']:
        print(f"  • {rec}")

else:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)

print("\n" + "="*80)
print("✅ Test Complete!")
print("="*80)
print("\n💡 To use GPT-4o:")
print("  1. Set environment variable: OPENAI_API_KEY=your-api-key")
print("  2. Restart the AI service: python main.py")
print("  3. Re-run this test")
print("\n📖 API Endpoint: POST /api/ai-analysis/upload-script-xpath-analysis")
print("🔗 Swagger UI: http://localhost:8000/docs\n")
