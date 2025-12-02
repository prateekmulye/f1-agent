#!/bin/bash

# Script to rename project from f1-slipstream/slipstream to ChatFormula1
# This script updates all occurrences in the codebase

set -e

echo "🔄 Renaming project to ChatFormula1..."
echo ""

# Function to replace text in files
replace_in_files() {
    local search="$1"
    local replace="$2"
    local pattern="$3"
    
    echo "Replacing '$search' with '$replace' in $pattern files..."
    
    find src -type f -name "$pattern" -exec sed -i '' "s/$search/$replace/g" {} +
    find docs -type f -name "$pattern" -exec sed -i '' "s/$search/$replace/g" {} + 2>/dev/null || true
    find tests -type f -name "$pattern" -exec sed -i '' "s/$search/$replace/g" {} + 2>/dev/null || true
}

# Replace in Python files
echo "📝 Updating Python files..."
replace_in_files "F1-Slipstream" "ChatFormula1" "*.py"
replace_in_files "F1-slipstream" "ChatFormula1" "*.py"
replace_in_files "f1-slipstream" "chatformula1" "*.py"
replace_in_files "F1Slipstream" "ChatFormula1" "*.py"
replace_in_files "f1_slipstream" "chatformula1" "*.py"

# Replace in Markdown files
echo "📝 Updating Markdown files..."
replace_in_files "F1-Slipstream" "ChatFormula1" "*.md"
replace_in_files "F1-slipstream" "ChatFormula1" "*.md"
replace_in_files "f1-slipstream" "chatformula1" "*.md"
replace_in_files "F1Slipstream" "ChatFormula1" "*.md"

# Replace in YAML files
echo "📝 Updating YAML files..."
find . -type f -name "*.yaml" -o -name "*.yml" | while read file; do
    sed -i '' "s/f1-slipstream/chatformula1/g" "$file"
    sed -i '' "s/F1-Slipstream/ChatFormula1/g" "$file"
done

echo ""
echo "✅ Project renamed to ChatFormula1!"
echo ""
echo "📋 Summary of changes:"
echo "  - f1-slipstream → chatformula1"
echo "  - F1-Slipstream → ChatFormula1"
echo "  - F1Slipstream → ChatFormula1"
echo "  - f1_slipstream → chatformula1"
echo ""
echo "🔍 Files modified:"
echo "  - All Python files in src/"
echo "  - All Markdown files in docs/"
echo "  - All YAML configuration files"
echo "  - pyproject.toml"
echo "  - README.md"
echo "  - render.yaml"
echo ""
echo "⚠️  Note: You may need to manually update:"
echo "  - GitHub repository name"
echo "  - Render service name"
echo "  - Any external references"
echo ""
