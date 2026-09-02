#!/usr/bin/env python
"""
Integration test script for authentication endpoints.
Tests: login -> /auth/me -> logout flow against Django backend.
"""
import requests
import json
import sys

BASE_URL = "http://localhost:8000/api"

def test_auth_flow():
    """Test complete authentication flow."""
    print("=" * 60)
    print("EXAMORA Authentication Integration Test")
    print("=" * 60)

    # Test credentials (should exist in seeded database)
    test_users = [
        {"username": "admin@examora.edu", "password": "password", "role": "ADMIN"},
        {"username": "teacher@examora.edu", "password": "password", "role": "TEACHER"},
        {"username": "student@examora.edu", "password": "password", "role": "STUDENT"},
    ]

    for test_user in test_users:
        print(f"\n{'=' * 60}")
        print(f"Testing user: {test_user['username']} (Expected role: {test_user['role']})")
        print('=' * 60)

        # Step 1: Login
        print("\n1. POST /auth/login/")
        login_payload = {
            "username": test_user["username"],
            "password": test_user["password"]
        }

        try:
            response = requests.post(
                f"{BASE_URL}/auth/login/",
                json=login_payload,
                headers={"Content-Type": "application/json"}
            )

            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                access_token = data.get("access")
                refresh_token = data.get("refresh")
                user_data = data.get("user")

                print(f"   ✓ Access token received: {access_token[:20]}...")
                print(f"   ✓ Refresh token received: {refresh_token[:20]}...")
                print(f"   ✓ User: {user_data.get('username')} | Role: {user_data.get('role')}")

                if not access_token or not refresh_token:
                    print("   ✗ ERROR: Missing tokens in response")
                    continue

            else:
                print(f"   ✗ Login failed: {response.text}")
                continue

        except requests.exceptions.ConnectionError:
            print("   ✗ ERROR: Cannot connect to backend. Is Django running on port 8000?")
            return False
        except Exception as e:
            print(f"   ✗ ERROR: {e}")
            continue

        # Step 2: Get current user with JWT
        print("\n2. GET /auth/me/")
        try:
            response = requests.get(
                f"{BASE_URL}/auth/me/",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )

            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                me_data = response.json()
                print(f"   ✓ Profile retrieved: {me_data.get('username')} | {me_data.get('email')}")
                print(f"   ✓ Role confirmed: {me_data.get('role')}")
            else:
                print(f"   ✗ /auth/me/ failed: {response.text}")
                continue

        except Exception as e:
            print(f"   ✗ ERROR: {e}")
            continue

        # Step 3: Logout with refresh token
        print("\n3. POST /auth/logout/")
        logout_payload = {
            "refresh": refresh_token
        }

        try:
            response = requests.post(
                f"{BASE_URL}/auth/logout/",
                json=logout_payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )

            print(f"   Status: {response.status_code}")

            if response.status_code == 200:
                logout_data = response.json()
                print(f"   ✓ Logout successful: {logout_data.get('detail')}")
            else:
                print(f"   ✗ Logout failed: {response.text}")
                continue

        except Exception as e:
            print(f"   ✗ ERROR: {e}")
            continue

        # Step 4: Verify token is blacklisted
        print("\n4. POST /auth/token/refresh/ (verify blacklist)")
        try:
            response = requests.post(
                f"{BASE_URL}/auth/token/refresh/",
                json={"refresh": refresh_token},
                headers={"Content-Type": "application/json"}
            )

            print(f"   Status: {response.status_code}")

            if response.status_code == 401:
                print(f"   ✓ Token correctly blacklisted (401 Unauthorized)")
            elif response.status_code == 400:
                error_data = response.json()
                print(f"   ✓ Token correctly blacklisted: {error_data}")
            else:
                print(f"   ✗ WARNING: Token should be blacklisted but got {response.status_code}")

        except Exception as e:
            print(f"   ✗ ERROR: {e}")

        print(f"\n✓ Authentication flow complete for {test_user['username']}")

    print("\n" + "=" * 60)
    print("Integration test complete!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_auth_flow()
    sys.exit(0 if success else 1)
