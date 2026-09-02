#!/usr/bin/env python
"""
Test login fix - verify frontend demo accounts work with backend.
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_login_fix():
    print("=" * 60)
    print("EXAMORA Login Fix Verification")
    print("=" * 60)

    # Test the demo accounts from frontend Login.jsx
    test_cases = [
        {"username": "admin@examora.edu", "password": "password", "role": "ADMIN"},
        {"username": "teacher@examora.edu", "password": "password", "role": "TEACHER"},
        {"username": "student@examora.edu", "password": "password", "role": "STUDENT"},
    ]

    all_passed = True

    for test_case in test_cases:
        print(f"\nTesting {test_case['username']} ({test_case['role']})")
        print("-" * 40)

        # Send login request (same as authService.js)
        payload = {
            "username": test_case["username"],
            "password": test_case["password"]
        }

        print(f"Request payload: {json.dumps(payload)}")

        try:
            response = requests.post(
                f"{BASE_URL}/auth/login/",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            print(f"HTTP Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print(f"✓ Login successful!")

                # Check tokens
                if "access" in data and "refresh" in data:
                    print(f"  Access token: {data['access'][:20]}...")
                    print(f"  Refresh token: {data['refresh'][:20]}...")
                else:
                    print(f"  ✗ Missing tokens in response")
                    all_passed = False

                # Check user data
                if "user" in data:
                    user = data["user"]
                    print(f"  User: {user.get('username')} | Email: {user.get('email')} | Role: {user.get('role')}")

                    if user.get("role") != test_case["role"]:
                        print(f"  ✗ Role mismatch: expected {test_case['role']}, got {user.get('role')}")
                        all_passed = False
                else:
                    print(f"  ✗ Missing user data in response")
                    all_passed = False

            else:
                print(f"✗ Login failed: {response.text}")
                all_passed = False

        except requests.exceptions.ConnectionError:
            print("✗ ERROR: Cannot connect to backend. Is Django running on port 8000?")
            all_passed = False
        except Exception as e:
            print(f"✗ ERROR: {e}")
            all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL LOGIN TESTS PASSED!")
        print("Frontend demo accounts now work with backend!")
    else:
        print("✗ SOME TESTS FAILED")
    print("=" * 60)

    return all_passed

if __name__ == "__main__":
    success = test_login_fix()
    sys.exit(0 if success else 1)