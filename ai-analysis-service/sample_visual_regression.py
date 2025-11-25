"""
Sample data and examples for Visual Regression Testing
Demonstrates how to use the visual regression API endpoint
"""

import base64
import requests
import json

# API endpoint
API_URL = "http://localhost:8000/api/ai-analysis/visual-regression"

# Sample base64 encoded images (1x1 pixel PNG - for demonstration)
# In production, use actual screenshot base64 strings

# Sample 1: Red pixel (baseline)
SAMPLE_RED_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

# Sample 2: Blue pixel (changed version)
SAMPLE_BLUE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg=="

# Sample 3: Same as baseline (no changes)
SAMPLE_RED_PNG_DUPLICATE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="


def example_1_identical_screenshots():
    """
    Example 1: Compare identical screenshots
    Expected: PASS (similarity = 1.0)
    """
    print("\n" + "="*60)
    print("Example 1: Identical Screenshots")
    print("="*60)
    
    payload = {
        "before_screenshot": SAMPLE_RED_PNG,
        "after_screenshot": SAMPLE_RED_PNG_DUPLICATE,
        "tolerance": 0.95
    }
    
    response = requests.post(API_URL, json=payload)
    result = response.json()
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200 and result.get('success'):
        print(f"Verdict: {result['data']['verdict']}")
        print(f"Similarity: {result['data']['similarity']}")
        print(f"LLM Analysis: {result['data']['llm_description']}")
        print(f"Test Stability: {result['data']['playwright_insights']['test_stability']}")
    else:
        print(f"Error: {result.get('detail', 'Unknown error')}")
        print(f"Response: {json.dumps(result, indent=2)}")
    
    return result


def example_2_different_screenshots():
    """
    Example 2: Compare different screenshots
    Expected: FAIL (similarity < 0.95)
    """
    print("\n" + "="*60)
    print("Example 2: Different Screenshots")
    print("="*60)
    
    payload = {
        "before_screenshot": SAMPLE_RED_PNG,
        "after_screenshot": SAMPLE_BLUE_PNG,
        "tolerance": 0.95
    }
    
    response = requests.post(API_URL, json=payload)
    result = response.json()
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200 and result.get('success'):
        print(f"Verdict: {result['data']['verdict']}")
        print(f"Similarity: {result['data']['similarity']}")
        print(f"Changes Detected: {len(result['data']['changes'])}")
        
        if result['data']['changes']:
            print("\nDetected Changes:")
            for change in result['data']['changes']:
                print(f"  - {change['type']}: {change['description']} (Severity: {change['severity']})")
        
        print(f"\nSuggested Tolerance: {result['data']['playwright_insights']['suggested_tolerance']}")
    else:
        print(f"Error: {result.get('detail', 'Unknown error')}")
    
    return result


def example_3_custom_tolerance():
    """
    Example 3: Custom tolerance level
    """
    print("\n" + "="*60)
    print("Example 3: Custom Tolerance (0.80)")
    print("="*60)
    
    payload = {
        "before_screenshot": SAMPLE_RED_PNG,
        "after_screenshot": SAMPLE_BLUE_PNG,
        "tolerance": 0.80  # More lenient
    }
    
    response = requests.post(API_URL, json=payload)
    result = response.json()
    
    if response.status_code == 200 and result.get('success'):
        print(f"Verdict: {result['data']['verdict']}")
        print(f"Similarity: {result['data']['similarity']}")
        print(f"Playwright Assertion Example:")
        print(f"  {result['data']['suggested_playwright_code']['assertion']}")
    else:
        print(f"Error: {result.get('detail', 'Unknown error')}")
    
    return result


def example_4_playwright_integration():
    """
    Example 4: How to integrate with Playwright
    """
    print("\n" + "="*60)
    print("Example 4: Playwright Integration Code")
    print("="*60)
    
    playwright_code = '''
import { test, expect } from '@playwright/test';
import axios from 'axios';
import fs from 'fs';

test('visual regression test', async ({ page }) => {
  // Navigate to page
  await page.goto('https://example.com');
  
  // Take screenshot
  const screenshot = await page.screenshot({ fullPage: true });
  const base64Screenshot = screenshot.toString('base64');
  
  // Load baseline screenshot
  const baselineBase64 = fs.readFileSync('./screenshots/baseline.png', 'base64');
  
  // Call AI Visual Regression API
  const response = await axios.post('http://localhost:8000/api/ai-analysis/visual-regression', {
    before_screenshot: baselineBase64,
    after_screenshot: base64Screenshot,
    tolerance: 0.95
  });
  
  const { verdict, similarity, llm_description, changes } = response.data.data;
  
  console.log(`Verdict: ${verdict}`);
  console.log(`Similarity: ${similarity}`);
  console.log(`AI Analysis: ${llm_description}`);
  
  // Assert based on verdict
  expect(verdict).toBe('PASS');
  
  // Or use Playwright's built-in visual regression
  await expect(page).toHaveScreenshot('baseline.png', {
    maxDiffPixels: 100
  });
});
'''
    
    print(playwright_code)


def example_5_real_screenshot_from_file():
    """
    Example 5: Load actual screenshot files and compare
    """
    print("\n" + "="*60)
    print("Example 5: Using Real Screenshot Files")
    print("="*60)
    
    # This is pseudocode - adapt to your actual file paths
    example_code = '''
# Load screenshots from files
with open('screenshots/baseline.png', 'rb') as f:
    baseline_bytes = f.read()
    baseline_base64 = base64.b64encode(baseline_bytes).decode('utf-8')

with open('screenshots/current.png', 'rb') as f:
    current_bytes = f.read()
    current_base64 = base64.b64encode(current_bytes).decode('utf-8')

# Call API
payload = {
    "before_screenshot": baseline_base64,
    "after_screenshot": current_base64,
    "tolerance": 0.95
}

response = requests.post(API_URL, json=payload)
result = response.json()

# Save results
with open('visual-regression-report.json', 'w') as f:
    json.dump(result, f, indent=2)
'''
    
    print(example_code)


def example_6_batch_visual_testing():
    """
    Example 6: Batch visual regression testing
    """
    print("\n" + "="*60)
    print("Example 6: Batch Visual Testing")
    print("="*60)
    
    batch_code = '''
# Test multiple pages
pages_to_test = [
    {'name': 'homepage', 'baseline': 'baseline_home.png', 'current': 'current_home.png'},
    {'name': 'dashboard', 'baseline': 'baseline_dash.png', 'current': 'current_dash.png'},
    {'name': 'profile', 'baseline': 'baseline_profile.png', 'current': 'current_profile.png'}
]

results = []

for page_test in pages_to_test:
    # Load screenshots
    with open(f'screenshots/{page_test["baseline"]}', 'rb') as f:
        baseline_b64 = base64.b64encode(f.read()).decode('utf-8')
    
    with open(f'screenshots/{page_test["current"]}', 'rb') as f:
        current_b64 = base64.b64encode(f.read()).decode('utf-8')
    
    # Compare
    response = requests.post(API_URL, json={
        "before_screenshot": baseline_b64,
        "after_screenshot": current_b64,
        "tolerance": 0.95
    })
    
    result = response.json()
    results.append({
        'page': page_test['name'],
        'verdict': result['data']['verdict'],
        'similarity': result['data']['similarity']
    })

# Generate report
print("Visual Regression Test Results:")
for r in results:
    status = "✓" if r['verdict'] == 'PASS' else "✗"
    print(f"{status} {r['page']}: {r['verdict']} (similarity: {r['similarity']})")
'''
    
    print(batch_code)


def run_all_examples():
    """Run all examples"""
    print("\n" + "="*70)
    print(" Visual Regression Testing - Sample Data and Examples")
    print("="*70)
    print("\nMake sure the AI Analysis Service is running on http://localhost:8000")
    print("Start with: python main.py")
    print("\n")
    
    try:
        # Check if service is running
        health = requests.get("http://localhost:8000/health")
        if health.status_code == 200:
            print("✓ AI Analysis Service is running\n")
            
            # Run examples with API calls
            example_1_identical_screenshots()
            example_2_different_screenshots()
            example_3_custom_tolerance()
            
        else:
            print("✗ AI Analysis Service is not responding")
            
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to AI Analysis Service at http://localhost:8000")
        print("  Please start the service with: python main.py")
    
    # Show code examples (no API call needed)
    example_4_playwright_integration()
    example_5_real_screenshot_from_file()
    example_6_batch_visual_testing()
    
    print("\n" + "="*70)
    print(" Sample Data Summary")
    print("="*70)
    print(f"\nSample Red PNG (baseline): {SAMPLE_RED_PNG[:50]}...")
    print(f"Sample Blue PNG (changed):  {SAMPLE_BLUE_PNG[:50]}...")
    print(f"\nThese are 1x1 pixel images for demonstration.")
    print("For production, use actual Playwright screenshots converted to base64.")
    print("\n")


if __name__ == "__main__":
    run_all_examples()
