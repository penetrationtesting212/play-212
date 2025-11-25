import requests

# Endpoint to check
url = "http://localhost:8000/api/ai-analysis/visual-regression"

# Sample images
red_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
blue_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg=="

print("\n" + "="*60)
print("🔍 Testing Production Visual Regression Endpoint")
print("="*60)
print(f"\nEndpoint: {url}")
print(f"Method: POST")

# Make request
response = requests.post(url, json={
    'before_screenshot': red_png,
    'after_screenshot': blue_png,
    'tolerance': 0.95
})

print(f"\n📡 Response Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()['data']
    
    print(f"\n✅ Results:")
    print(f"  Similarity: {data['similarity']}")
    print(f"  Verdict: {data['verdict']}")
    
    # Check for production metrics
    if 'similarity_metrics' in data:
        print(f"\n📊 Production Metrics Available:")
        metrics = data['similarity_metrics']
        print(f"  SSIM Score: {metrics.get('ssim_score', 'N/A')}")
        print(f"  Method: {metrics.get('method', 'N/A')}")
        print(f"  Pixel Difference: {metrics.get('pixel_difference_percent', 'N/A')}%")
    else:
        print("\n⚠️ Production metrics not available")
    
    # Check metadata
    if 'before_metadata' in data:
        print(f"\n📦 Image Metadata:")
        print(f"  Dimensions: {data['before_metadata'].get('dimensions', 'N/A')}")
        print(f"  Format: {data['before_metadata'].get('format', 'N/A')}")
        print(f"  Width: {data['before_metadata'].get('width', 'N/A')}")
        print(f"  Height: {data['before_metadata'].get('height', 'N/A')}")
    
    print(f"\n🔍 Changes Detected: {len(data.get('changes', []))}")
    print(f"💡 Recommendations: {len(data.get('recommendations', []))}")
    
else:
    print(f"\n❌ Error: {response.text}")

print("\n" + "="*60)
print("✅ Check complete!")
print("="*60)
print(f"\n📖 View in Swagger: http://localhost:8000/docs")
print(f"🔍 Search for: 'visual-regression'\n")
