import pytest
from decimal import Decimal
from apps.users.models import User, Role
from rest_framework.test import APIClient
from apps.core.models import Degree, Program
from apps.students.models import StudentProfile

pytestmark = pytest.mark.django_db

@pytest.fixture
def api_client():
    """Basic, unauthenticated API client."""
    return APIClient()

@pytest.fixture
def setup_users(db):
    """Creates two separate students and all required dependencies."""
    student_role = Role.objects.create(name="Student")
    
    degree = Degree.objects.create(name="Test Degree", abbreviation="TD")
    program = Program.objects.create(
        name="Test Program", 
        abbreviation="TP", 
        degree=degree,
        degree_level="UG",
        duration_years=4
    )
    
    student_a = User.objects.create_user(
        email="student.a@test.com",
        password="pass123",
        phone_number="1111111111"
    )
    student_a.roles.add(student_role)
    StudentProfile.objects.create(
        user=student_a, 
        enrollment_number="A001", 
        program=program,
        current_cgpa=Decimal('8.5'),
        tenth_percentage=Decimal('90.0'),
        twelfth_percentage=Decimal('90.0')
    )

    student_b = User.objects.create_user(
        email="student.b@test.com",
        password="pass123",
        phone_number="2222222222"
    )
    student_b.roles.add(student_role)
    StudentProfile.objects.create(
        user=student_b, 
        enrollment_number="B002", 
        program=program
    )
    
    return {"student_a": student_a, "student_b": student_b}


@pytest.fixture
def authenticated_student_client(api_client, setup_users):
    """
    Logs in as 'student_a' using the real JWT /token/ endpoint
    and sets the auth cookie on the client for all subsequent requests.
    """
    response = api_client.post("/api/v1/token/", {
        "email": "student.a@test.com",
        "password": "pass123"
    })
    
    assert response.status_code == 200, "Test setup failed: Could not log in to get JWT."
    
    api_client.cookies = response.cookies
    return api_client


def test_student_cannot_access_other_student_profile(authenticated_student_client, setup_users):
    """
    SECURITY TEST (IDOR):
    Uses the JWT-authenticated client.
    """
    student_b = setup_users["student_b"]
    
    response_get = authenticated_student_client.get(f"/api/v1/students/profiles/{student_b.id}/")
    response_patch = authenticated_student_client.patch(f"/api/v1/students/profiles/{student_b.id}/", {"current_cgpa": 9.0})

    assert response_get.status_code in [403, 404]
    assert response_patch.status_code in [403, 404]


def test_student_cannot_set_admin_fields_on_own_profile(authenticated_student_client, setup_users):
    """
    SECURITY TEST (Mass Assignment):
    Uses the JWT-authenticated client.
    """
    student_a = setup_users["student_a"]
    
    response = authenticated_student_client.patch("/api/v1/students/me/", {
        "current_cgpa": 9.9,
        "is_verified": True,
        "is_placed": True
    })
    
    assert response.status_code == 200
    
    student_a.refresh_from_db()
    profile = student_a.studentprofile
    
    assert profile.current_cgpa == Decimal('9.9')
    assert profile.is_verified is False
    assert profile.is_placed is False