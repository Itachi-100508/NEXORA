#!/usr/bin/env python
"""
Complete end-to-end test of Students CRUD operations.
Tests all operations to verify the fix is working correctly.
"""

import os
import sys
import json
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import Client

User = get_user_model()

def get_test_client():
    """Get authenticated test client with JWT token"""
    user = User.objects.get(username='admin')
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    headers = {'HTTP_AUTHORIZATION': f'Bearer {access}', 'CONTENT_TYPE': 'application/json'}
    return Client(**headers)

def test_complete_flow():
    """Test complete CRUD flow"""
    c = get_test_client()

    print("\n" + "="*60)
    print("STUDENTS COMPLETE CRUD FLOW TEST")
    print("="*60 + "\n")

    # Test 1: LIST (GET)
    print("TEST 1: List students (GET /api/students/)")
    response = c.get('/api/students/', {'page': '1', 'page_size': '5', 'search': ''})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = json.loads(response.content)
    assert 'results' in data, "Response missing 'results' key"
    assert 'count' in data, "Response missing 'count' key"
    initial_count = data['count']
    print(f"   ✓ Status 200, found {initial_count} students\n")

    # Test 2: CREATE (POST)
    print("TEST 2: Create new student (POST /api/students/)")
    timestamp = str(datetime.now().timestamp()).replace('.', '')[:12]
    payload = {
        'username': f'newstud{timestamp}',
        'email': f'newstud{timestamp}@test.com',
        'password': 'Password123!',
        'first_name': 'New',
        'last_name': 'Student',
        'enrollment_number': f'NEW{timestamp}',
        'roll_number': '500',
    }
    response = c.post('/api/students/', data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.content.decode()}"
    created = json.loads(response.content)
    student_id = created['id']
    assert created['is_active'] == True, "New student should be active"
    print(f"   ✓ Status 201, created student ID {student_id}")
    print(f"   ✓ Name: {created['name']}, Email: {created['email']}\n")

    # Test 3: READ by ID (GET)
    print(f"TEST 3: Get student by ID (GET /api/students/{student_id}/)")
    response = c.get(f'/api/students/{student_id}/')
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    retrieved = json.loads(response.content)
    assert retrieved['id'] == student_id, "ID mismatch"
    print(f"   ✓ Status 200, retrieved: {retrieved['name']}\n")

    # Test 4: Verify in LIST
    print("TEST 4: Verify student appears in list (GET /api/students/)")
    response = c.get('/api/students/', {'page': '1', 'page_size': '100', 'search': ''})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = json.loads(response.content)
    found = any(s['id'] == student_id for s in data['results'])
    assert found, "New student not found in list"
    new_count = data['count']
    assert new_count == initial_count + 1, f"Count should increase: {initial_count} → {new_count}"
    print(f"   ✓ Student found in list")
    print(f"   ✓ Total count increased: {initial_count} → {new_count}\n")

    # Test 5: SEARCH
    print("TEST 5: Search for student")
    response = c.get('/api/students/', {'search': payload['first_name'], 'page': '1', 'page_size': '10'})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = json.loads(response.content)
    found = any(s['id'] == student_id for s in data['results'])
    assert found, "Student not found in search results"
    print(f"   ✓ Search found student by name\n")

    # Test 6: UPDATE (PATCH)
    print(f"TEST 6: Update student (PATCH /api/students/{student_id}/)")
    update_payload = {
        'first_name': 'Updated',
        'last_name': 'Student',
        'roll_number': '501',
    }
    response = c.patch(f'/api/students/{student_id}/', data=json.dumps(update_payload), content_type='application/json')
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    updated = json.loads(response.content)
    assert updated['name'] == 'Updated Student', "Name not updated"
    assert updated['roll_number'] == '501', "Roll number not updated"
    print(f"   ✓ Status 200, updated to: {updated['name']}\n")

    # Test 7: Verify UPDATE persists
    print(f"TEST 7: Verify update persisted (GET /api/students/{student_id}/)")
    response = c.get(f'/api/students/{student_id}/')
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    persisted = json.loads(response.content)
    assert persisted['name'] == 'Updated Student', "Update did not persist"
    print(f"   ✓ Update persisted: {persisted['name']}\n")

    # Test 8: DEACTIVATE (DELETE)
    print(f"TEST 8: Deactivate student (DELETE /api/students/{student_id}/)")
    response = c.delete(f'/api/students/{student_id}/')
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print(f"   ✓ Status 200, student deactivated\n")

    # Test 9: Verify deactivation
    print(f"TEST 9: Verify student is inactive (GET /api/students/{student_id}/)")
    response = c.get(f'/api/students/{student_id}/')
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    deactivated = json.loads(response.content)
    assert deactivated['is_active'] == False, "Student should be inactive"
    print(f"   ✓ Student is_active = False\n")

    # Test 10: Verify not in active list
    print("TEST 10: Verify deactivated student not in active list (GET /api/students/?is_active=true)")
    response = c.get('/api/students/', {'is_active': 'true', 'page': '1', 'page_size': '100'})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = json.loads(response.content)
    found = any(s['id'] == student_id for s in data['results'])
    assert not found, "Deactivated student should not be in active list"
    print(f"   ✓ Deactivated student not in active list\n")

    # Test 11: Test validation error - duplicate email
    print("TEST 11: Test validation - duplicate email (should return 400)")
    dup_payload = {
        'username': 'another',
        'email': payload['email'],  # Same email
        'password': 'Password123!',
        'first_name': 'Dup',
        'last_name': 'Test',
        'enrollment_number': 'DUP001',
        'roll_number': '600',
    }
    response = c.post('/api/students/', data=json.dumps(dup_payload), content_type='application/json')
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    error = json.loads(response.content)
    assert 'email' in error, "Error should mention email"
    print(f"   ✓ Status 400, error: {error}\n")

    # Test 12: Test validation error - duplicate enrollment
    print("TEST 12: Test validation - duplicate enrollment (should return 400)")
    dup_enroll = {
        'username': 'another2',
        'email': f'another2{timestamp}@test.com',
        'password': 'Password123!',
        'first_name': 'Dup',
        'last_name': 'Test',
        'enrollment_number': payload['enrollment_number'],  # Same enrollment
        'roll_number': '601',
    }
    response = c.post('/api/students/', data=json.dumps(dup_enroll), content_type='application/json')
    assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    error = json.loads(response.content)
    assert 'enrollment_number' in error, "Error should mention enrollment_number"
    print(f"   ✓ Status 400, error: {error}\n")

    print("="*60)
    print("✓ ALL TESTS PASSED")
    print("="*60 + "\n")

if __name__ == '__main__':
    try:
        test_complete_flow()
        sys.exit(0)
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ ERROR: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)
