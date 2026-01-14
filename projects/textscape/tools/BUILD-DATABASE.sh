#!/bin/bash
# Textscape Knowledge Base Builder - Unix/Mac Launcher
# Run this to build the complete database

echo ""
echo "===================================================================="
echo "  TEXTSCAPE KNOWLEDGE BASE BUILDER"
echo "===================================================================="
echo ""
echo "This will download and process 60,000+ words into a music database"
echo ""
echo "Requirements:"
echo "  - Python 3.6 or higher"
echo "  - Internet connection (for downloading lexicons)"
echo ""
echo "Time: ~2-3 minutes"
echo "Cost: \$0 (all free resources)"
echo ""
echo "===================================================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found!"
    echo ""
    echo "Please install Python 3.6+ from https://www.python.org/downloads/"
    echo "Or use your package manager:"
    echo "  - Ubuntu/Debian: sudo apt-get install python3"
    echo "  - macOS: brew install python3"
    echo ""
    exit 1
fi

echo "Python found! Starting build process..."
echo ""

# Run the build script
python3 build-complete-database.py

echo ""
echo "===================================================================="
echo "Press Enter to continue..."
read
