#!/usr/bin/env python
"""
Debug login flow - trace what's actually being sent and received.
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"
TEST_EMAIL = "admin@examora.edu"
TEST_PASSWORD = "password"

def debug_login():
    print("Debug Login Flow")
    print("=" * 50)

    # First check if server is responding
    try:
        health = requests.get(f"{BASE_URL}/health/")
        print(f"Health check: {health.status_code} - {health.text}")
    except requests.exceptions.ConnectionError:
        print("ERROR: Cannot connect to backend. Is Django running on port 8000?")
        return

    print("\n1. Testing direct login endpoint with different payloads:")
    print("-" * 50)

    # Test 1: What frontend is sending (according to authService.js)
    payload_frontend = {
        "username": TEST_EMAIL,
        "password": TEST_PASSWORD
    }

    print(f"Frontend payload (authService.js): {json.dumps(payload_frontend)}")
    try:
        resp1 = requests.post(f"{BASE_URL}/auth/login/",
                             json=payload_frontend,
                             headers={"Content-Type": "application/json"})
        print(f"Response status: {resp1.status_code}")
        print(f"Response body: {resp1.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 2: What might be the issue - email vs username
    print("\n2. Testing with email field (maybe Django User model expects email?):")
    print("-" * 50)

    payload_email_field = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }

    print(f"Payload with email field: {json.dumps(payload_email_field)}")
    try:
        resp2 = requests.post(f"{BASE_URL}/auth/login/",
                             json=payload_email_field,
                             headers={"Content-Type": "application/json"})
        print(f"Response status: {resp2.status_code}")
        print(f"Response body: {resp2.text[:200]}")
    except Exception as e:
        print(f"Error: {e}")

    # Test 3: Test actual response format
    print("\n3. Checking if we can get any users from database (if endpoints exist):")
    print("-" * 50)
    try:
        # Try to see if there's a users endpoint
        resp3 = requests.get(f"{BASE_URL}/auth/users/")
        print(f"Users endpoint: {resp3.status_code} - {resp3.text[:100]}")
    except Exception as e:
        print(f"Users endpoint not available or error: {e}")

if __name__ == "__main__":
    debug_login()