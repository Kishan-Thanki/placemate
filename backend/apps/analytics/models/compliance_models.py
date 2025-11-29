"""
Compliance Models for NBA, NAAC, and NIRF Reporting

These models track granular data required for accreditation compliance.
"""

from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField


class BacklogHistory(models.Model):
    """
    Transactional record of student backlog history.
    Critical for NBA Success Index calculation.
    
    Tracks when a subject was failed and when it was cleared,
    allowing distinction between "Success without backlog" vs
    "Success within stipulated time with cleared backlogs".
    """
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='backlog_history'
    )
    semester = models.IntegerField(help_text="Semester when backlog occurred")
    subject_code = models.CharField(max_length=20)
    subject_name = models.CharField(max_length=255)
    fail_date = models.DateField(help_text="Date when subject was failed")
    clear_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when backlog was cleared. Null if still active."
    )
    is_cleared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Backlog History"
        verbose_name_plural = "Backlog Histories"
        ordering = ['student', 'semester', 'fail_date']
        indexes = [
            models.Index(fields=['student', 'semester']),
            models.Index(fields=['is_cleared']),
        ]
    
    def __str__(self):
        status = "Cleared" if self.is_cleared else "Active"
        return f"{self.student.enrollment_number} - {self.subject_code} ({status})"


class AcademicRecord(models.Model):
    """
    Semester-wise academic performance tracking.
    Required for NBA cohort analysis and Success Index calculation.
    """
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='academic_records'
    )
    semester = models.IntegerField()
    sgpa = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Semester GPA"
    )
    total_credits = models.IntegerField(default=0)
    earned_credits = models.IntegerField(default=0)
    backlog_count = models.IntegerField(default=0)
    academic_year = models.CharField(max_length=10, help_text="e.g., 2023-24")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Academic Record"
        verbose_name_plural = "Academic Records"
        unique_together = ['student', 'semester']
        ordering = ['student', 'semester']
        indexes = [
            models.Index(fields=['student', 'semester']),
        ]
    
    def __str__(self):
        return f"{self.student.enrollment_number} - Sem {self.semester} (SGPA: {self.sgpa})"


class PlacementOffer(models.Model):
    """
    Tracks placement offers with detailed salary breakdown.
    Critical for NIRF Median Salary calculation and NAAC evidence.
    
    Separates Fixed, Variable, and Bonus components to ensure
    accurate median salary calculation (NIRF requirement).
    """
    application = models.OneToOneField(
        'applications.CompanyDriveApplication',
        on_delete=models.CASCADE,
        related_name='placement_offer'
    )
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='placement_offers'
    )
    job = models.ForeignKey(
        'placements.Job',
        on_delete=models.CASCADE,
        related_name='placement_offers'
    )
    
    # Salary Breakdown (Critical for NIRF)
    salary_fixed = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Fixed component of CTC (LPA)"
    )
    salary_variable = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Variable component of CTC (LPA)"
    )
    salary_bonus = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Signing/Joining bonus (LPA)"
    )
    total_ctc = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total Cost to Company (LPA) - for NIRF median calculation"
    )
    
    # Offer Details
    OFFER_TIER_CHOICES = [
        ('STANDARD', 'Standard'),
        ('DREAM', 'Dream'),
        ('SUPER_DREAM', 'Super Dream'),
    ]
    offer_tier = models.CharField(
        max_length=20,
        choices=OFFER_TIER_CHOICES,
        default='STANDARD',
        help_text="Offer tier for placement policy enforcement"
    )
    offer_date = models.DateField()
    joining_date = models.DateField(null=True, blank=True)
    
    # NAAC Evidence
    offer_letter = CloudinaryField(
        'raw',
        folder='offer_letters',
        resource_type='raw',
        blank=True,
        null=True,
        help_text="Uploaded offer letter for NAAC compliance"
    )
    offer_letter_url = models.URLField(
        blank=True,
        null=True,
        help_text="Secure signed URL for offer letter (NAAC evidence link)"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="TPO verification status (required for NAAC)"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_offers'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Higher Studies / Entrepreneurship (NBA)
    OUTCOME_TYPE_CHOICES = [
        ('PLACEMENT', 'Placement'),
        ('HIGHER_STUDIES', 'Higher Studies'),
        ('ENTREPRENEURSHIP', 'Entrepreneurship'),
    ]
    outcome_type = models.CharField(
        max_length=20,
        choices=OUTCOME_TYPE_CHOICES,
        default='PLACEMENT',
        help_text="NBA requires equal weight to Placement, Higher Studies, Entrepreneurship"
    )
    higher_studies_proof = CloudinaryField(
        'raw',
        folder='higher_studies_proof',
        resource_type='raw',
        blank=True,
        null=True,
        help_text="Admission letter for higher studies (NBA evidence)"
    )
    entrepreneurship_proof = CloudinaryField(
        'raw',
        folder='entrepreneurship_proof',
        resource_type='raw',
        blank=True,
        null=True,
        help_text="GST Registration or Startup Certificate (NBA evidence)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Placement Offer"
        verbose_name_plural = "Placement Offers"
        ordering = ['-offer_date']
        indexes = [
            models.Index(fields=['student', 'offer_date']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['outcome_type']),
            models.Index(fields=['total_ctc']),  # For median calculation
        ]
    
    def __str__(self):
        return f"{self.student.enrollment_number} - {self.job.title} ({self.total_ctc} LPA)"
    
    def calculate_total_ctc(self):
        """Calculate total CTC from components"""
        total = 0
        if self.salary_fixed:
            total += self.salary_fixed
        if self.salary_variable:
            total += self.salary_variable
        if self.salary_bonus:
            total += self.salary_bonus
        return total


class PlacementPolicy(models.Model):
    """
    Configurable placement policies for automated enforcement.
    
    Supports policies like:
    - "One Student, One Offer" (block after first acceptance)
    - "Dream Offer" rules (allow upgrade if >X% higher)
    - "Multiple Offers" (controlled by multiple_allowed flag)
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Policy Conditions (JSON)
    conditions = models.JSONField(
        default=dict,
        help_text="Policy conditions: {'offer_tier': 'DREAM', 'action': 'BLOCK_SIMILAR_TIER'}"
    )
    
    # Policy Actions
    ACTION_CHOICES = [
        ('ALLOW', 'Allow'),
        ('BLOCK', 'Block'),
        ('WITHDRAW_PENDING', 'Withdraw Pending Applications'),
        ('REQUIRE_APPROVAL', 'Require Admin Approval'),
    ]
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        default='ALLOW'
    )
    
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(
        default=0,
        help_text="Higher priority policies are evaluated first"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Placement Policy"
        verbose_name_plural = "Placement Policies"
        ordering = ['-priority', 'name']
    
    def __str__(self):
        status = "Active" if self.is_active else "Inactive"
        return f"{self.name} ({status})"


class DocumentVerification(models.Model):
    """
    Tracks verification status of student documents.
    Required for NAAC evidence-based compliance.
    """
    student = models.ForeignKey(
        'students.StudentProfile',
        on_delete=models.CASCADE,
        related_name='document_verifications'
    )
    
    DOCUMENT_TYPE_CHOICES = [
        ('TENTH_MARKSHEET', '10th Marksheet'),
        ('TWELFTH_MARKSHEET', '12th Marksheet'),
        ('SEMESTER_GRADE_CARD', 'Semester Grade Card'),
        ('OFFER_LETTER', 'Offer Letter'),
        ('HIGHER_STUDIES_ADMISSION', 'Higher Studies Admission Letter'),
        ('ENTREPRENEURSHIP_PROOF', 'Entrepreneurship Certificate'),
    ]
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)
    
    document_file = CloudinaryField(
        'raw',
        folder='verified_documents',
        resource_type='raw',
        blank=True,
        null=True
    )
    
    VERIFICATION_STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('AUTO_VERIFIED', 'Auto-Verified'),
        ('MANUAL_REVIEW', 'Needs Manual Review'),
        ('VERIFIED', 'Verified'),
        ('REJECTED', 'Rejected'),
    ]
    verification_status = models.CharField(
        max_length=20,
        choices=VERIFICATION_STATUS_CHOICES,
        default='PENDING'
    )
    
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_documents'
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Document Verification"
        verbose_name_plural = "Document Verifications"
        unique_together = ['student', 'document_type']
        ordering = ['-verified_at', '-created_at']
        indexes = [
            models.Index(fields=['student', 'verification_status']),
        ]
    
    def __str__(self):
        return f"{self.student.enrollment_number} - {self.get_document_type_display()} ({self.verification_status})"

