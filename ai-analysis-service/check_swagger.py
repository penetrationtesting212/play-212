import requests
import json

# Get OpenAPI schema
response = requests.get('http://localhost:8000/openapi.json')
openapi_data = response.json()

print("\n" + "="*80)
print("📚 SWAGGER/OPENAPI DOCUMENTATION CHECK")
print("="*80)

# Show all endpoints
print("\n✅ ALL ENDPOINTS REGISTERED:")
print("-"*80)
for path in sorted(openapi_data['paths'].keys()):
    methods = list(openapi_data['paths'][path].keys())
    print(f"  {', '.join([m.upper() for m in methods]):10} {path}")

# Focus on dynamic endpoints
print("\n" + "="*80)
print("🎯 DYNAMIC ENDPOINTS (New Additions):")
print("="*80)

dynamic_paths = {k: v for k, v in openapi_data['paths'].items() if '/dynamic/' in k}

for path, methods in dynamic_paths.items():
    print(f"\n📍 {path}")
    for method, details in methods.items():
        print(f"   Method: {method.upper()}")
        print(f"   Summary: {details.get('summary', 'N/A')}")
        
        # Show request body schema if exists
        if 'requestBody' in details:
            schema_ref = details['requestBody']['content']['application/json'].get('schema', {})
            if '$ref' in schema_ref:
                model_name = schema_ref['$ref'].split('/')[-1]
                print(f"   Request Model: {model_name}")
        
        print()

# Check visual regression endpoint
print("="*80)
print("🎨 VISUAL REGRESSION ENDPOINT:")
print("="*80)

visual_path = '/api/ai-analysis/visual-regression'
if visual_path in openapi_data['paths']:
    details = openapi_data['paths'][visual_path]['post']
    print(f"\n✅ Endpoint: {visual_path}")
    print(f"   Summary: {details.get('summary', 'N/A')}")
    print(f"   Description: {details.get('description', 'N/A')[:100]}...")
    
    # Show request model
    if 'requestBody' in details:
        schema_ref = details['requestBody']['content']['application/json'].get('schema', {})
        if '$ref' in schema_ref:
            model_name = schema_ref['$ref'].split('/')[-1]
            print(f"   Request Model: {model_name}")

print("\n" + "="*80)
print("📖 Access Swagger UI at: http://localhost:8000/docs")
print("📖 Access ReDoc at: http://localhost:8000/redoc")
print("📖 OpenAPI JSON at: http://localhost:8000/openapi.json")
print("="*80 + "\n")
