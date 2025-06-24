#!/bin/bash

# Development Setup Script for Outbound Assistant
# This script helps set up and manage the development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command_exists python3; then
        print_warning "Python 3 is not installed. Backend functionality may not work."
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Dependencies installed"
    else
        print_status "Dependencies already installed. Run 'npm install' to update."
    fi
    
    # Install Python dependencies if requirements.txt exists
    if [ -f "requirements.txt" ] && command_exists pip3; then
        print_status "Installing Python dependencies..."
        pip3 install -r requirements.txt
        print_success "Python dependencies installed"
    fi
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_warning "Created .env.local from .env.example. Please update with your actual values."
        else
            print_warning "No .env.example found. Please create .env.local manually."
        fi
    else
        print_status ".env.local already exists"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    if [ -f "prisma/schema.prisma" ]; then
        print_status "Generating Prisma client..."
        npx prisma generate
        
        print_status "Running database migrations..."
        npx prisma migrate dev --name init || print_warning "Migration failed - database might already be set up"
        
        print_success "Database setup completed"
    else
        print_warning "No Prisma schema found. Skipping database setup."
    fi
}

# Check ports
check_ports() {
    print_status "Checking if ports are available..."
    
    if lsof -i :3000 >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use. You may need to stop the existing process."
        lsof -i :3000
    fi
    
    if lsof -i :8000 >/dev/null 2>&1; then
        print_warning "Port 8000 is already in use. You may need to stop the existing process."
        lsof -i :8000
    fi
}

# Health check
health_check() {
    print_status "Running health check..."
    
    # Check if we can start the development server briefly
    timeout 10s npm run dev:frontend > /dev/null 2>&1 &
    DEV_PID=$!
    sleep 5
    
    if kill -0 $DEV_PID 2>/dev/null; then
        kill $DEV_PID
        print_success "Frontend can start successfully"
    else
        print_error "Frontend failed to start. Check your configuration."
    fi
}

# Main setup function
main() {
    echo "🚀 Outbound Assistant Development Setup"
    echo "======================================"
    
    check_prerequisites
    install_dependencies
    setup_environment
    setup_database
    check_ports
    
    print_success "Setup completed! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env.local file with actual values"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Visit http://localhost:3000 to see your app"
    echo ""
    echo "Available commands:"
    echo "  npm run dev          - Start both frontend and backend"
    echo "  npm run dev:frontend - Start only frontend (Next.js)"
    echo "  npm run dev:backend  - Start only backend (FastAPI)"
    echo "  npm run build        - Build for production"
    echo "  npx prisma studio    - Open database browser"
    echo ""
}

# Handle command line arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "check")
        check_prerequisites
        check_ports
        ;;
    "deps")
        install_dependencies
        ;;
    "db")
        setup_database
        ;;
    "health")
        health_check
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup   - Full setup (default)"
        echo "  check   - Check prerequisites and ports"
        echo "  deps    - Install dependencies only"
        echo "  db      - Setup database only"
        echo "  health  - Run health check"
        echo "  help    - Show this help"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0 help' for available commands"
        exit 1
        ;;
esac 