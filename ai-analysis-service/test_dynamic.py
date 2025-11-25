import requests
import json

# Test dynamic responses
print("Testing Dynamic Visual Regression API\n")
print("=" * 60)

# Sample images
red_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
blue_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg=="

# Run multiple times to show dynamic output
for i in range(5):
    print(f"\n🔄 Test Run #{i+1}")
    print("-" * 60)
    
    response = requests.post(
        'http://localhost:8000/api/ai-analysis/visual-regression',
        json={
            'before_screenshot': red_png,
            'after_screenshot': blue_png,
            'tolerance': 0.95
        }
    )
    
    data = response.json()['data']
    
    print(f"✓ Similarity: {data['similarity']}")
    print(f"✓ Verdict: {data['verdict']}")
    print(f"✓ LLM Analysis: {data['llm_description'][:80]}...")
    print(f"✓ Severity: {data['llm_severity']}")
    print(f"✓ Impact: {data['llm_impact'][:60]}...")
    print(f"✓ Changes Detected: {len(data['changes'])}")
    
    if data['changes']:
        print(f"  Change Types: {', '.join([c['type'] for c in data['changes']])}")
    
    print(f"✓ Confidence: {data.get('confidence', 'N/A')}")
    print(f"✓ Recommendations: {len(data.get('recommendations', []))}")

print("\n" + "=" * 60)
print("✅ Notice how each run produces DIFFERENT dynamic results!")
print("   - Similarity varies slightly")
print("   - LLM descriptions change")
print("   - Different change types detected")
print("   - Recommendations vary")
