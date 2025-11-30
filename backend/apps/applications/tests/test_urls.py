"""
TEST SUITE: Applications App - URLs
Test Suite ID: APPLICATIONS-URL-001

Tests for URL routing and endpoint accessibility.
"""
from django.test import TestCase
from django.urls import reverse, resolve
from apps.applications.views import CompanyDriveApplicationViewSet


class ApplicationsURLTest(TestCase):
    """
    TEST SUITE: Applications URL Routing
    Test Suite ID: APPLICATIONS-URL-001-001
    """
    
    def test_applications_list_url(self):
        """
        Test Case ID: APPLICATIONS-URL-001-001-001
        Test applications list URL resolves to correct view
        """
        url = reverse('applications-list')
        self.assertEqual(resolve(url).func.cls, CompanyDriveApplicationViewSet)
    
    def test_applications_detail_url(self):
        """
        Test Case ID: APPLICATIONS-URL-001-001-002
        Test applications detail URL resolves to correct view
        """
        url = reverse('applications-detail', kwargs={'pk': 1})
        self.assertEqual(resolve(url).func.cls, CompanyDriveApplicationViewSet)
    
    def test_withdraw_action_url(self):
        """
        Test Case ID: APPLICATIONS-URL-001-001-003
        Test withdraw action URL pattern
        """
        url = '/api/v1/applications/1/withdraw/'
        resolved = resolve(url)
        self.assertEqual(resolved.func.cls, CompanyDriveApplicationViewSet)
        self.assertEqual(resolved.kwargs['pk'], '1')
    
    def test_accept_offer_action_url(self):
        """
        Test Case ID: APPLICATIONS-URL-001-001-004
        Test accept offer action URL pattern
        """
        url = '/api/v1/applications/1/accept_offer/'
        resolved = resolve(url)
        self.assertEqual(resolved.func.cls, CompanyDriveApplicationViewSet)
        self.assertEqual(resolved.kwargs['pk'], '1')
    
    def test_offer_job_action_url(self):
        """
        Test Case ID: APPLICATIONS-URL-001-001-005
        Test offer job action URL pattern
        """
        url = '/api/v1/applications/1/offer_job/'
        resolved = resolve(url)
        self.assertEqual(resolved.func.cls, CompanyDriveApplicationViewSet)
        self.assertEqual(resolved.kwargs['pk'], '1')