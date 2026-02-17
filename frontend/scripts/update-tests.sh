#!/bin/bash

# Script to help update tests with i18n support
# This script provides utilities to batch-update test files

echo "🔧 Test Update Helper Script"
echo "=============================="
echo ""

# Function to show test failures summary
show_failures() {
    echo "📊 Running tests to show current failures..."
    npm test 2>&1 | grep "tests |" | grep "failed"
}

# Function to run specific test file
run_test() {
    if [ -z "$1" ]; then
        echo "❌ Please provide a test file name"
        echo "Usage: ./scripts/update-tests.sh run <test-file-name>"
        exit 1
    fi
    
    echo "🧪 Running test: $1"
    npm test -- "$1" --run
}

# Function to find all test files with failures
find_failing_tests() {
    echo "🔍 Finding all test files..."
    find src -name "*.test.ts" -o -name "*.test.tsx" | sort
}

# Function to show help
show_help() {
    echo "Available commands:"
    echo ""
    echo "  failures    - Show summary of test failures"
    echo "  run <file>  - Run a specific test file"
    echo "  list        - List all test files"
    echo "  help        - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/update-tests.sh failures"
    echo "  ./scripts/update-tests.sh run SideNavigation.test.tsx"
    echo "  ./scripts/update-tests.sh list"
}

# Main script logic
case "$1" in
    failures)
        show_failures
        ;;
    run)
        run_test "$2"
        ;;
    list)
        find_failing_tests
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
