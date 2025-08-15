#!/usr/bin/env python3
"""
Setup script for Dua & Zikr Backend API
This script helps with initial project setup
"""

import os
import subprocess
import sys


def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False


def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version {sys.version.split()[0]} is compatible")
    return True


def create_virtual_environment():
    """Create virtual environment if it doesn't exist"""
    if os.path.exists("venv"):
        print("✅ Virtual environment already exists")
        return True
    
    return run_command("python -m venv venv", "Creating virtual environment")


def install_dependencies():
    """Install project dependencies"""
    if os.name == 'nt':  # Windows
        pip_cmd = "venv\\Scripts\\pip install -r requirements.txt"
    else:  # Unix/Linux/macOS
        pip_cmd = "venv/bin/pip install -r requirements.txt"
    
    return run_command(pip_cmd, "Installing dependencies")


def run_migrations():
    """Run Django migrations"""
    if os.name == 'nt':  # Windows
        python_cmd = "venv\\Scripts\\python manage.py"
    else:  # Unix/Linux/macOS
        python_cmd = "venv/bin/python manage.py"
    
    # Make migrations
    if not run_command(f"{python_cmd} makemigrations", "Creating database migrations"):
        return False
    
    # Run migrations
    if not run_command(f"{python_cmd} migrate", "Running database migrations"):
        return False
    
    return True


def populate_sample_data():
    """Populate database with sample data"""
    if os.name == 'nt':  # Windows
        python_cmd = "venv\\Scripts\\python manage.py"
    else:  # Unix/Linux/macOS
        python_cmd = "venv/bin/python manage.py"
    
    return run_command(f"{python_cmd} populate_sample_data", "Populating sample data")


def create_superuser():
    """Create Django superuser"""
    print("👤 Would you like to create a superuser? (y/n): ", end="")
    response = input().lower().strip()
    
    if response in ['y', 'yes']:
        if os.name == 'nt':  # Windows
            python_cmd = "venv\\Scripts\\python manage.py"
        else:  # Unix/Linux/macOS
            python_cmd = "venv/bin/python manage.py"
        
        return run_command(f"{python_cmd} createsuperuser", "Creating superuser")
    
    print("⏭️  Skipping superuser creation")
    return True


def main():
    """Main setup function"""
    print("🚀 Setting up Dua & Zikr Backend API")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create virtual environment
    if not create_virtual_environment():
        print("❌ Failed to create virtual environment")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Run migrations
    if not run_migrations():
        print("❌ Failed to run migrations")
        sys.exit(1)
    
    # Populate sample data
    if not populate_sample_data():
        print("❌ Failed to populate sample data")
        sys.exit(1)
    
    # Create superuser
    if not create_superuser():
        print("❌ Failed to create superuser")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Activate virtual environment:")
    if os.name == 'nt':  # Windows
        print("   venv\\Scripts\\activate")
    else:  # Unix/Linux/macOS
        print("   source venv/bin/activate")
    
    print("2. Run the development server:")
    print("   python manage.py runserver")
    
    print("3. Access the API at: http://localhost:8000/api/")
    print("4. Access admin panel at: http://localhost:8000/admin/")
    
    print("\n📚 For more information, check the README.md file")
    print("🔧 For help, check the Django documentation")


if __name__ == "__main__":
    main()
