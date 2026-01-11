#!/bin/bash

# Install dependencies
echo "Installing dependencies..."
python3.9 -m pip install -r requirements.txt

# Run migrations (optional, but good for safety)
echo "Running migrations..."
python3.9 manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python3.9 manage.py collectstatic --noinput --clear
