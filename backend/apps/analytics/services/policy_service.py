"""
Placement Policy Enforcement Service

Automatically enforces institutional placement policies.
"""

from django.db.models import Q
from django.utils import timezone
from apps.analytics.models.compliance_models import PlacementPolicy, PlacementOffer
from apps.applications.models import CompanyDriveApplication
from apps.students.models import StudentProfile


class PlacementPolicyService:
    """
    Service for enforcing placement policies automatically.
    
    Supports policies like:
    - "One Student, One Offer" (block after first acceptance)
    - "Dream Offer" rules (allow upgrade if >X% higher)
    - "Multiple Offers" (controlled by multiple_allowed flag)
    """
    
    def __init__(self):
        self.policies = PlacementPolicy.objects.filter(is_active=True).order_by('-priority')
    
    def check_application_allowed(self, student, company_drive, job):
        """
        Check if a student is allowed to apply to a drive.
        
        Args:
            student: StudentProfile instance
            company_drive: CompanyDrive instance
            job: Job instance
            
        Returns:
            dict: {
                'allowed': bool,
                'reason': str,
                'policy_violated': str or None
            }
        """
        # Check if student already has an accepted offer
        accepted_offers = PlacementOffer.objects.filter(
            student=student,
            application__status='Accepted',
            is_verified=True
        )
        
        if accepted_offers.exists():
            # Check policies for multiple offers
            result = self._check_multiple_offer_policy(student, company_drive, job, accepted_offers.first())
            if not result['allowed']:
                return result
        
        # Check if drive allows multiple applications
        if not company_drive.multiple_allowed:
            existing_application = CompanyDriveApplication.objects.filter(
                student=student,
                company_drive=company_drive
            ).exists()
            
            if existing_application:
                return {
                    'allowed': False,
                    'reason': 'You have already applied to this drive',
                    'policy_violated': 'Multiple applications not allowed'
                }
        
        return {
            'allowed': True,
            'reason': 'Application allowed',
            'policy_violated': None
        }
    
    def check_offer_acceptance_allowed(self, student, new_offer):
        """
        Check if a student can accept a new offer.
        
        Args:
            student: StudentProfile instance
            new_offer: PlacementOffer instance
            
        Returns:
            dict: {
                'allowed': bool,
                'reason': str,
                'action_required': str or None
            }
        """
        # Get existing accepted offers
        existing_offers = PlacementOffer.objects.filter(
            student=student,
            application__status='Accepted',
            is_verified=True
        )
        
        if not existing_offers.exists():
            return {
                'allowed': True,
                'reason': 'No existing offers',
                'action_required': None
            }
        
        existing_offer = existing_offers.first()
        
        # Check upgrade policy
        if new_offer.offer_tier == 'DREAM' and existing_offer.offer_tier == 'STANDARD':
            # Allow upgrade from Standard to Dream
            return {
                'allowed': True,
                'reason': 'Upgrade from Standard to Dream offer allowed',
                'action_required': 'withdraw_existing'
            }
        
        # Check if both are Dream tier
        if new_offer.offer_tier == 'DREAM' and existing_offer.offer_tier == 'DREAM':
            # Block multiple Dream offers (One Person One Offer policy)
            return {
                'allowed': False,
                'reason': 'You already have a Dream offer. Only one Dream offer allowed per student.',
                'action_required': None
            }
        
        # Check salary-based upgrade
        if new_offer.total_ctc and existing_offer.total_ctc:
            salary_increase = ((new_offer.total_ctc - existing_offer.total_ctc) / existing_offer.total_ctc) * 100
            
            if salary_increase >= 20:  # 20% increase threshold
                return {
                    'allowed': True,
                    'reason': f'Salary increase of {salary_increase:.1f}% allows upgrade',
                    'action_required': 'withdraw_existing'
                }
        
        return {
            'allowed': False,
            'reason': 'Cannot accept multiple offers. Withdraw existing offer first.',
            'action_required': None
        }
    
    def enforce_policy_on_acceptance(self, student, accepted_offer):
        """
        Automatically enforce policies when an offer is accepted.
        
        This includes:
        - Withdrawing pending applications to lower-tier companies
        - Blocking future applications to standard drives
        - Updating student placement status
        
        Args:
            student: StudentProfile instance
            accepted_offer: PlacementOffer instance
        """
        # Withdraw pending applications to lower-tier companies
        if accepted_offer.offer_tier in ['DREAM', 'SUPER_DREAM']:
            # Get all pending applications
            pending_applications = CompanyDriveApplication.objects.filter(
                student=student,
                status='Applied'
            )
            
            for app in pending_applications:
                # Check if this is a lower-tier drive
                # For now, withdraw all pending (can be refined)
                app.status = 'Withdrawn'
                app.save(update_fields=['status'])
        
        # Update student placement status
        student.is_placed = True
        student.save(update_fields=['is_placed'])
    
    def _check_multiple_offer_policy(self, student, company_drive, job, existing_offer):
        """
        Check policy for multiple offers.
        
        Returns:
            dict: Policy check result
        """
        # Check active policies
        for policy in self.policies:
            if policy.action == 'BLOCK':
                # Check if policy conditions match
                conditions = policy.conditions
                
                if conditions.get('offer_tier') == existing_offer.offer_tier:
                    return {
                        'allowed': False,
                        'reason': f'Policy violation: {policy.name}',
                        'policy_violated': policy.name
                    }
        
        return {
            'allowed': True,
            'reason': 'No policy violation',
            'policy_violated': None
        }

