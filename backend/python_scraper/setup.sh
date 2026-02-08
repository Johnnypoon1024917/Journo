#!/bin/bash

# Setup script for Python Selenium scraper

echo "🐍 Setting up Python Selenium scraper..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Install Chrome WebDriver
echo "🌐 Installing Chrome WebDriver..."
# The webdriver-manager will handle this automatically

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your database credentials"
fi

# Make scraper executable
chmod +x scraper.py

echo "✅ Python scraper setup completed!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your database credentials"
echo "2. Test the scraper: python3 scraper.py 'Tokyo,Japan'"
echo "3. Schedule weekly scraping: python3 scraper.py schedule"
echo ""
echo "To run the scraper manually:"
echo "  cd python_scraper"
echo "  source venv/bin/activate"
echo "  python3 scraper.py run-once"