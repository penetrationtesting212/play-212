"""
Test XPath Analysis with AI
Run this to see XPath analysis output
"""

import requests
import json

API_URL = "http://localhost:8000/api/ai-analysis/xpath-deep-analysis"

print("\n" + "="*80)
print("🔍 AI-POWERED XPATH ANALYSIS")
print("="*80)

# Test different XPath patterns (Enhanced with more types)
test_cases = [
    {
        "name": "Absolute XPath (Fragile)",
        "xpath": "/html/body/div[1]/div[2]/button[3]"
    },
    {
        "name": "Relative XPath with data-testid (Best Practice)",
        "xpath": "//div[@data-testid='login-button']"
    },
    {
        "name": "Complex XPath with indices",
        "xpath": "//div[1]/span[2]/button[@class='btn-12345'][3]"
    },
    {
        "name": "ARIA label XPath",
        "xpath": "//button[@aria-label='Submit form']"
    },
    {
        "name": "Role-based XPath",
        "xpath": "//button[@role='button'][@name='submit']"
    },
    {
        "name": "CSS-in-JS classes (Unstable)",
        "xpath": "//div[@class='css-1x2y3z4 sc-abcdef emotion-xyz']"
    },
    {
        "name": "Contextual XPath (starts with dot)",
        "xpath": ".//div[@class='modal']//button"
    },
    {
        "name": "Axes-based XPath (parent/child)",
        "xpath": "//div[@id='main']//child::button[1]"
    },
    {
        "name": "Contains text (Partial match)",
        "xpath": "//button[contains(text(),'Submit')]"
    },
    {
        "name": "Starts-with XPath",
        "xpath": "//input[starts-with(@id,'search-')]"
    },
    {
        "name": "Normalized text",
        "xpath": "//p[normalize-space(text())='Welcome']"
    },
    {
        "name": "Sibling-based XPath",
        "xpath": "//label[@for='email']/following-sibling::input"
    },
    {
        "name": "Ancestor XPath",
        "xpath": "//button/ancestor::form[@id='login']"
    },
    {
        "name": "Multiple predicates with AND",
        "xpath": "//div[@class='card' and @data-status='active' and @role='region']"
    },
    {
        "name": "Position-based (Fragile)",
        "xpath": "//li[position()=2]"
    },
    {
        "name": "Dynamic ID (Session-based)",
        "xpath": "//div[@id='session-123456789']"
    },
    {
        "name": "Placeholder attribute",
        "xpath": "//input[@placeholder='Enter email']"
    },
    {
        "name": "Alt text for image",
        "xpath": "//img[@alt='Company logo']"
    },
    {
        "name": "Title attribute",
        "xpath": "//button[@title='Close dialog']"
    },
    {
        "name": "Deep nested XPath (10 levels)",
        "xpath": "//html/body/div/div/section/article/div/form/fieldset/div/input"
    }
]

for idx, test in enumerate(test_cases, 1):
    print(f"\n{'='*80}")
    print(f"Test Case {idx}: {test['name']}")
    print(f"{'='*80}")
    print(f"XPath: {test['xpath']}")
    
    # Call API
    response = requests.post(API_URL, json={
        "xpath": test['xpath']
    })
    
    if response.status_code == 200:
        data = response.json()['data']
        
        print(f"\n📊 Analysis Results:")
        print(f"  Type: {data['type']}")
        if data.get('subtypes'):
            print(f"  Subtypes: {', '.join(data['subtypes'])}")
        print(f"  Complexity Score: {data['complexity_score']}/100")
        print(f"  Stability: {data['stability']}")
        print(f"  Best Practice Score: {data['best_practice_score']}/100")
        
        # Detailed metrics
        if 'detailed_metrics' in data:
            metrics = data['detailed_metrics']
            print(f"\n📈 Detailed Metrics:")
            print(f"  Depth: {metrics['depth']} levels")
            print(f"  Predicates: {metrics['predicate_count']}")
            print(f"  Functions: {metrics['function_count']}")
            print(f"  Indices: {metrics['index_count']}")
            print(f"  Axes: {metrics['axes_count']}")
            print(f"  Logical operators: {'Yes' if metrics['has_logical_operators'] else 'No'}")
        
        # Issues
        if data['issues']:
            print(f"\n⚠️  Issues Found ({len(data['issues'])}):")
            for issue in data['issues']:
                print(f"    - {issue}")
        else:
            print(f"\n✅ No issues found!")
        
        # AI Suggestions
        if data['suggestions']:
            print(f"\n🤖 AI Conversion Suggestions ({len(data['suggestions'])}):")
            for i, suggestion in enumerate(data['suggestions'][:3], 1):
                print(f"\n  {i}. {suggestion['type'].upper()} (Confidence: {suggestion['confidence']*100:.0f}%)")
                print(f"     Locator: {suggestion['locator']}")
                print(f"     Reason: {suggestion['reasoning']}")
                print(f"     Priority: {suggestion['priority']}")
        
        # Best Recommendation
        if data['ai_recommendation']:
            print(f"\n🎯 BEST RECOMMENDATION:")
            rec = data['ai_recommendation']
            print(f"   Use: {rec['locator']}")
            print(f"   Why: {rec['reasoning']}")
        
                
        # Impact Analysis
        print(f"\n📈 Impact Analysis:")
        impact = data['impact_analysis']
        print(f"  Maintainability: {impact['maintainability']}")
        print(f"  Resilience: {impact['resilience']}")
        print(f"  Readability: {impact['readability']}")
        if 'performance' in impact:
            print(f"  Performance: {impact['performance']}")
    
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)

print("\n" + "="*80)
print("✅ XPath Analysis Complete!")
print("="*80)
print("\n💡 Enhanced XPath Type Detection:")
print("  ✅ Absolute - Starts with / (fragile)")
print("  ✅ Relative - Starts with // (better)")
print("  ✅ Contextual - Starts with . (context-dependent)")
print("  ✅ Axes-based - Uses :: operators")
print("  ✅ Predicate-based - Uses [ ] conditions")
print("  ✅ Function-based - Uses functions like contains()")
print("  ✅ Index-based - Uses [1], [2] indices")
print("  ✅ Text-based - Uses text() function")
print("  ✅ Partial-match - Uses contains()")
print("  ✅ Prefix-match - Uses starts-with()")
print("  ✅ Sibling-based - Uses following/preceding-sibling")
print("  ✅ Ancestor-based - Uses parent/ancestor axes")
print("\n💡 Best Practices:")
print("  - Avoid absolute XPaths (start with /html/body)")
print("  - Prefer data-testid over classes")
print("  - Avoid index-based selection [1], [2], etc.")
print("  - Use semantic attributes (aria-label, role, placeholder, alt, title)")
print("  - Prefer Playwright getBy* methods over XPath")
print("  - Avoid position() and last() functions")
print("\n📖 View API docs: http://localhost:8000/docs")
print("🔍 Search for: 'xpath-deep-analysis'\n")
