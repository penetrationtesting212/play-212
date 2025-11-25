"""
Build and Zip AI Analysis Service for Deployment
Creates a production-ready zip file with all necessary files
"""

import os
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

OUTPUT_DIR = "build-output"
ZIP_NAME = f"ai-analysis-service-{datetime.now().strftime('%Y-%m-%d')}.zip"

print("🚀 Starting AI Analysis Service build and zip process...\n")

# Step 1: Clean previous builds
print("📁 Step 1: Cleaning previous builds...")
if os.path.exists(OUTPUT_DIR):
    shutil.rmtree(OUTPUT_DIR)
os.makedirs(OUTPUT_DIR, exist_ok=True)
print("✓ Cleaned\n")

# Step 2: Define files to include
print("📋 Step 2: Copying files...")

files_to_copy = [
    "main.py",
    "requirements.txt",
    "setup.bat",
    "start.bat"
]

# Copy individual files
for file in files_to_copy:
    source = Path(file)
    if source.exists():
        dest = Path(OUTPUT_DIR) / file
        shutil.copy2(source, dest)
        print(f"✓ Copied: {file}")
    else:
        print(f"⚠️  Skipped (not found): {file}")

print("")

# Step 3: Create deployment instructions
print("📝 Step 3: Creating deployment instructions...")

deploy_instructions = f"""# AI Analysis Service Deployment Instructions

## Prerequisites
- Python 3.8 or higher
- pip package manager
- LLM API credentials (OpenAI, Anthropic, etc.) - optional

## Deployment Steps

### 1. Extract the zip file
```bash
unzip {ZIP_NAME}
cd ai-analysis-service
```

### 2. Set up Python virtual environment
```bash
# Windows
setup.bat

# Linux/Mac
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure LLM Integration (Optional)
Edit main.py and add your LLM service:

```python
# Example with OpenAI
import openai
openai.api_key = "your-api-key"

# Or with Anthropic
import anthropic
client = anthropic.Client(api_key="your-api-key")
```

### 4. Start the service
```bash
# Windows
start.bat

# Linux/Mac
python main.py
```

### 5. Verify service is running
```bash
curl http://localhost:8000/health
```

## Production Deployment Options

### Option 1: Uvicorn with workers
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Option 2: Gunicorn (Linux/Mac)
```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 3: Docker
```bash
docker build -t ai-analysis-service .
docker run -p 8000:8000 ai-analysis-service
```

### Option 4: PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name ai-analysis
pm2 save
pm2 startup
```

## Environment Variables
You can set these via environment variables or .env file:

- `PORT` - Service port (default: 8000)
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `ANTHROPIC_API_KEY` - Anthropic API key (if using Claude)

## Service Endpoints

All endpoints available at http://localhost:8000

### Health Check
- GET `/` - Service info
- GET `/health` - Health status

### AI Analysis Endpoints
- POST `/api/ai-analysis/generate-test` - Generate test from description
- POST `/api/ai-analysis/analyze-test` - Analyze test code
- POST `/api/ai-analysis/xpath-deep-analysis` - XPath analysis
- POST `/api/ai-analysis/playwright-metrics` - Test metrics
- POST `/api/ai-analysis/locator-health` - Locator stability
- POST `/api/ai-analysis/optimize-playwright` - Optimization suggestions
- POST `/api/ai-analysis/visual-regression` - Visual regression analysis
- POST `/api/ai-analysis/suggest-locators` - Locator suggestions
- POST `/api/ai-analysis/suggest-assertions` - Assertion suggestions
- POST `/api/ai-analysis/repair-test` - Test repair
- POST `/api/ai-analysis/review-code` - Code review
- POST `/api/ai-analysis/expand-scenarios` - Scenario expansion
- POST `/api/ai-analysis/predict-failures` - Failure prediction

## Integration with Node.js Backend

The Node.js backend (port 3001) proxies requests to this service:
```
http://localhost:3001/api/ai-analysis/* → http://localhost:8000/api/ai-analysis/*
```

Make sure both services are running:
1. Python AI Analysis Service: port 8000
2. Node.js Backend: port 3001

## Troubleshooting

### Port already in use
```bash
# Change port in main.py or use environment variable
PORT=8001 python main.py
```

### Import errors
```bash
pip install --upgrade -r requirements.txt
```

### LLM integration
- Update LLMService class in main.py with your LLM provider
- Add corresponding package to requirements.txt

## Performance Tuning

### For production, install optional dependencies:
```bash
# Image processing (for advanced visual regression)
pip install Pillow opencv-python numpy

# LLM integrations
pip install openai anthropic langchain
```

## Security Recommendations

1. Use environment variables for API keys
2. Enable CORS only for trusted origins
3. Add authentication if exposing publicly
4. Use HTTPS in production
5. Rate limiting (already included in code)

## Monitoring

Check logs and health:
```bash
# Health check
curl http://localhost:8000/health

# API documentation
curl http://localhost:8000/docs
```

## File Structure
- main.py - Main FastAPI application
- requirements.txt - Python dependencies
- setup.bat - Windows setup script
- start.bat - Windows start script
- DEPLOY.txt - This file
"""

deploy_path = Path(OUTPUT_DIR) / "DEPLOY.txt"
deploy_path.write_text(deploy_instructions, encoding='utf-8')
print("✓ Deployment instructions created\n")

# Step 4: Create production requirements.txt (with comments)
print("📦 Step 4: Creating production requirements file...")
prod_requirements = """# AI Analysis Service - Production Dependencies

# Core Framework
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-multipart==0.0.6
httpx==0.25.1
requests==2.31.0

# Optional: Image Processing (uncomment if needed)
# Pillow==10.1.0
# opencv-python==4.8.1.78
# numpy==1.26.2

# Optional: LLM Integration (uncomment and add your provider)
# openai==1.3.5
# anthropic==0.7.1
# langchain==0.0.335

# Production Server (Linux/Mac)
# gunicorn==21.2.0
"""

req_path = Path(OUTPUT_DIR) / "requirements.txt"
req_path.write_text(prod_requirements, encoding='utf-8')
print("✓ Production requirements.txt created\n")

# Step 5: Create zip file
print("🗜️  Step 5: Creating zip file...")

def zipdir(path, ziph):
    """Recursively zip directory"""
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, path)
            ziph.write(file_path, arcname)

try:
    with zipfile.ZipFile(ZIP_NAME, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipdir(OUTPUT_DIR, zipf)
    print(f"✓ Zip created: {ZIP_NAME}\n")
except Exception as e:
    print(f"❌ Failed to create zip: {e}\n")
    print("📝 Files are ready in build-output/ folder\n")

# Step 6: Calculate size
def get_directory_size(path):
    """Calculate directory size in MB"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            if os.path.exists(filepath):
                total_size += os.path.getsize(filepath)
    return total_size / (1024 * 1024)

size_mb = get_directory_size(OUTPUT_DIR)

# Step 7: Display summary
print("✅ Build complete!\n")
print("📊 Summary:")
print(f"   Output folder: {OUTPUT_DIR}/")
print(f"   Zip file: {ZIP_NAME}")
print(f"   Size: {size_mb:.2f} MB")
print("\n📋 Next steps:")
print(f"   1. Extract {ZIP_NAME} on server")
print("   2. Run: python -m venv venv")
print("   3. Activate venv and run: pip install -r requirements.txt")
print("   4. Configure LLM integration in main.py (optional)")
print("   5. Run: python main.py")
print("\n🎉 Ready for deployment!\n")
