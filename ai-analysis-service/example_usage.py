"""
Visual Regression Analysis - Example Usage
Shows how to call the API directly for testing
"""

import requests
import base64
import json
from pathlib import Path


def encode_image_to_base64(image_path: str) -> str:
    """Convert image file to base64 string"""
    with open(image_path, 'rb') as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def example_visual_regression_analysis():
    """
    Example: Analyze visual regression between two screenshots
    
    Workflow:
    1. Playwright captures screenshot (before.png)
    2. Code changes are deployed
    3. Playwright captures new screenshot (after.png)
    4. AI analyzes the differences
    5. Returns detailed report with LLM insights
    """
    
    # API endpoint
    url = "http://localhost:8000/api/ai-analysis/visual-regression"
    
    # Example: Using dummy images (replace with real Playwright screenshots)
    # In real scenario, Playwright would generate these:
    # await page.screenshot({ path: 'before.png' })
    
    # For demo, create simple base64 strings
    # In production, use actual screenshot files:
    # before_image = encode_image_to_base64('screenshots/baseline.png')
    # after_image = encode_image_to_base64('screenshots/current.png')
    
    # Dummy base64 image (small PNG)
    dummy_png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    payload = {
        "before_screenshot": dummy_png_base64,
        "after_screenshot": dummy_png_base64,
        "tolerance": 0.95
    }
    
    # Make request
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        data = result['data']
        
        print("\n" + "="*60)
        print("📊 VISUAL REGRESSION ANALYSIS RESULTS")
        print("="*60)
        
        print(f"\n✓ Verdict: {data['verdict']}")
        print(f"✓ Similarity: {data['similarity']*100:.2f}%")
        print(f"✓ Threshold: {data['threshold']*100:.2f}%")
        
        print(f"\n🤖 LLM Analysis:")
        print(f"   Description: {data['llm_description']}")
        print(f"   Severity: {data['llm_severity']}")
        print(f"   Impact: {data['llm_impact']}")
        
        print(f"\n📸 Image Metadata:")
        print(f"   Before: {data['before_metadata']['format']}, {data['before_metadata']['size_bytes']} bytes")
        print(f"   After: {data['after_metadata']['format']}, {data['after_metadata']['size_bytes']} bytes")
        
        print(f"\n📝 Changes Detected: {data['change_summary']['total']}")
        if data['changes']:
            for idx, change in enumerate(data['changes'], 1):
                print(f"\n   {idx}. {change['description']}")
                print(f"      Severity: {change['severity']}")
                print(f"      Area: {change['area']}")
        
        if data['recommendations']:
            print(f"\n💡 AI Recommendations:")
            for rec in data['recommendations']:
                print(f"   [{rec['priority'].upper()}] {rec['message']}")
                print(f"   Action: {rec['action']}")
        
        print(f"\n🎭 Playwright Insights:")
        print(f"   Test Stability: {data['playwright_insights']['test_stability']}")
        print(f"   Suggested Tolerance: {data['playwright_insights']['suggested_tolerance']:.2f}")
        print(f"   Rerun Recommended: {data['playwright_insights']['rerun_recommended']}")
        
        print(f"\n📝 Suggested Playwright Code:")
        print(data['suggested_playwright_code']['assertion'])
        
        if data['suggested_playwright_code']['update_baseline_command']:
            print(f"\n⚠️  Update baseline command:")
            print(f"   {data['suggested_playwright_code']['update_baseline_command']}")
        
        print("\n" + "="*60)
        
        return data
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None


def example_xpath_analysis():
    """
    Example: Analyze XPath and get AI recommendations
    """
    url = "http://localhost:8000/api/ai-analysis/xpath-deep-analysis"
    
    # Test various XPath patterns
    xpaths = [
        "//div[@data-testid='login-button']",
        "/html/body/div[1]/div[2]/button[3]",
        "//button[@class='btn-12345 primary']",
        "//span[contains(@aria-label, 'Submit')]"
    ]
    
    print("\n" + "="*60)
    print("🔍 XPATH ANALYSIS")
    print("="*60)
    
    for xpath in xpaths:
        payload = {"xpath": xpath}
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            result = response.json()['data']
            
            print(f"\n📍 XPath: {xpath}")
            print(f"   Type: {result['type']}")
            print(f"   Complexity: {result['complexity_score']}/100")
            print(f"   Stability: {result['stability']}")
            
            if result['issues']:
                print(f"   ⚠️  Issues:")
                for issue in result['issues']:
                    print(f"      - {issue}")
            
            if result['suggestions']:
                best = result['suggestions'][0]
                print(f"   ✅ Best Alternative:")
                print(f"      {best['locator']}")
                print(f"      Confidence: {best['confidence']*100:.0f}%")
                print(f"      Reason: {best['reasoning']}")


def example_playwright_metrics():
    """
    Example: Get comprehensive Playwright test metrics
    """
    url = "http://localhost:8000/api/ai-analysis/playwright-metrics"
    
    sample_code = """
import { test, expect } from '@playwright/test';

test('user login', async ({ page }) => {
  await page.goto('https://example.com');
  await page.waitForTimeout(5000);
  await page.click('#username');
  await page.fill('#username', 'test@example.com');
  await page.click('.submit-btn-12345');
  await expect(page.locator('.welcome')).toBeTruthy();
});
    """
    
    payload = {"code": sample_code}
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()['data']
        
        print("\n" + "="*60)
        print("📊 PLAYWRIGHT TEST METRICS")
        print("="*60)
        
        print(f"\n🎯 Overall Score: {result['overall_score']}/100")
        print(f"   Grade: {result['grade']}")
        
        print(f"\n📈 Detailed Metrics:")
        for metric_name, metric_data in result['metrics'].items():
            if isinstance(metric_data, dict) and 'score' in metric_data:
                print(f"\n   {metric_name.replace('_', ' ').title()}:")
                print(f"      Score: {metric_data['score']}/100")
                for key, value in metric_data.items():
                    if key != 'score':
                        print(f"      {key}: {value}")
        
        if result['recommendations']:
            print(f"\n💡 Recommendations:")
            for idx, rec in enumerate(result['recommendations'], 1):
                print(f"\n   {idx}. [{rec['priority'].upper()}] {rec['issue']}")
                print(f"      Category: {rec['category']}")
                print(f"      Suggestion: {rec['suggestion']}")
                print(f"      Impact: {rec['impact']}")
        
        if result['quick_wins']:
            print(f"\n⚡ Quick Wins:")
            for win in result['quick_wins']:
                if win:
                    print(f"   - {win}")


def example_locator_health():
    """
    Example: Analyze locator health and stability
    """
    url = "http://localhost:8000/api/ai-analysis/locator-health"
    
    locators = [
        "page.getByTestId('submit-button')",
        "page.locator('.css-abc123')",
        "page.locator('xpath=//div[1]/span[2]')",
        "page.getByRole('button', { name: 'Submit' })",
        "page.locator('#user-12345678')"
    ]
    
    payload = {"locators": locators}
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()['data']
        
        print("\n" + "="*60)
        print("🏥 LOCATOR HEALTH ANALYSIS")
        print("="*60)
        
        print(f"\n📊 Summary:")
        print(f"   Total Locators: {result['summary']['total_locators']}")
        print(f"   Average Health: {result['summary']['average_health']}/100")
        print(f"   High Risk: {result['summary']['high_risk_count']}")
        print(f"   Status: {result['summary']['overall_status']}")
        
        print(f"\n📝 Locator Details:")
        for idx, loc in enumerate(result['results'], 1):
            print(f"\n   {idx}. {loc['locator'][:60]}...")
            print(f"      Health: {loc['health_score']}/100")
            print(f"      Stability: {loc['stability']}")
            print(f"      Risk: {loc['failure_risk']}")
            
            if loc['issues']:
                print(f"      Issues: {', '.join(loc['issues'])}")
            
            if loc['suggestions']:
                print(f"      Fix: {loc['suggestions'][0]}")


if __name__ == "__main__":
    print("\n🚀 AI Analysis Service - Example Usage\n")
    
    # Run examples
    print("1️⃣  Visual Regression Analysis")
    example_visual_regression_analysis()
    
    print("\n\n2️⃣  XPath Analysis")
    example_xpath_analysis()
    
    print("\n\n3️⃣  Playwright Metrics")
    example_playwright_metrics()
    
    print("\n\n4️⃣  Locator Health Check")
    example_locator_health()
    
    print("\n\n✅ All examples completed!")
    print("💡 Tip: Start the FastAPI service with 'python main.py' first\n")
