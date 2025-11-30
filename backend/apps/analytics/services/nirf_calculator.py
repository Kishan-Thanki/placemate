"""
NIRF Calculator for Graduation Outcomes

Implements NIRF ranking metrics:
- GPH: Combined Metric for Placement and Higher Studies
- GMS: Metric for Median Salary
- OI: Outreach and Inclusivity metrics
"""

from django.db.models import Count, Avg, Q, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from decimal import Decimal
import statistics
from apps.analytics.models.compliance_models import PlacementOffer
from apps.students.models import StudentProfile


class NIRFCalculator:
    """
    Calculates NIRF-specific metrics for ranking submission.
    
    Key Metrics:
    - Median Salary (GMS) - not average (critical distinction)
    - Placement + Higher Studies Rate (GPH)
    - Diversity metrics (Gender, Regional, Social)
    """
    
    def calculate_median_salary(self, batch_year, program_id=None, degree_level=None):
        """
        Calculate median salary for NIRF GMS metric.
        
        Uses median (not average) to prevent outlier skewing.
        
        Args:
            batch_year: Graduation year
            program_id: Optional program filter
            degree_level: 'UG' or 'PG'
            
        Returns:
            dict: {
                'median_salary': float,
                'average_salary': float,
                'total_placed': int,
                'salary_distribution': list
            }
        """
        # Get placed students
        queryset = StudentProfile.objects.filter(
            is_placed=True,
            joining_year=batch_year - 4  # Assuming 4-year program
        )
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        if degree_level:
            queryset = queryset.filter(program__degree_level=degree_level)
        
        # Get placement offers with salary data
        offers = PlacementOffer.objects.filter(
            student__in=queryset,
            outcome_type='PLACEMENT',
            is_verified=True
        ).select_related('student', 'job')
        
        if not offers.exists():
            return {
                'median_salary': 0.0,
                'average_salary': 0.0,
                'total_placed': 0,
                'salary_distribution': [],
            }
        
        # Extract salaries
        salaries = []
        for offer in offers:
            if offer.total_ctc:
                salaries.append(float(offer.total_ctc))
        
        if not salaries:
            return {
                'median_salary': 0.0,
                'average_salary': 0.0,
                'total_placed': 0,
                'salary_distribution': [],
            }
        
        # Calculate median (NIRF requirement)
        median_salary = statistics.median(salaries)
        average_salary = statistics.mean(salaries)
        
        return {
            'median_salary': round(median_salary, 2),
            'average_salary': round(average_salary, 2),
            'total_placed': len(salaries),
            'salary_distribution': sorted(salaries),
            'min_salary': min(salaries),
            'max_salary': max(salaries),
        }
    
    def calculate_gph_metric(self, batch_year, program_id=None):
        """
        Calculate GPH (Combined Metric for Placement and Higher Studies).
        
        GPH = (Placed + Higher Studies) / Total Eligible
        
        Args:
            batch_year: Graduation year
            program_id: Optional program filter
            
        Returns:
            dict: GPH metrics
        """
        queryset = StudentProfile.objects.filter(
            joining_year=batch_year - 4
        )
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        total_eligible = queryset.count()
        
        # Count placed
        placed_count = queryset.filter(is_placed=True).count()
        
        # Count higher studies (from PlacementOffer with outcome_type='HIGHER_STUDIES')
        higher_studies_count = PlacementOffer.objects.filter(
            student__in=queryset,
            outcome_type='HIGHER_STUDIES',
            is_verified=True
        ).count()
        
        total_outcomes = placed_count + higher_studies_count
        gph_percentage = (total_outcomes / total_eligible * 100) if total_eligible > 0 else 0.0
        
        return {
            'gph_percentage': round(gph_percentage, 2),
            'total_eligible': total_eligible,
            'placed_count': placed_count,
            'higher_studies_count': higher_studies_count,
            'total_outcomes': total_outcomes,
        }
    
    def calculate_diversity_metrics(self, batch_year, program_id=None):
        """
        Calculate diversity metrics for NIRF OI (Outreach and Inclusivity) parameter.
        
        Returns:
            dict: {
                'gender_distribution': dict,
                'regional_distribution': dict,
                'social_category_distribution': dict,
                'placed_by_demographics': dict
            }
        """
        queryset = StudentProfile.objects.filter(
            joining_year=batch_year - 4
        )
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        # Gender distribution
        gender_dist = queryset.values('gender').annotate(
            count=Count('id'),
            placed_count=Count('id', filter=Q(is_placed=True))
        )
        
        # Regional distribution (by domicile state)
        regional_dist = queryset.values('domicile_state').annotate(
            count=Count('id'),
            placed_count=Count('id', filter=Q(is_placed=True))
        )
        
        # Social category distribution
        social_dist = queryset.values('social_category').annotate(
            count=Count('id'),
            placed_count=Count('id', filter=Q(is_placed=True))
        )
        
        # Calculate placement rates by demographics
        placed_by_gender = {}
        for item in gender_dist:
            gender = item['gender'] or 'Not Specified'
            total = item['count']
            placed = item['placed_count']
            placed_by_gender[gender] = {
                'total': total,
                'placed': placed,
                'placement_rate': round((placed / total * 100) if total > 0 else 0, 2)
            }
        
        placed_by_region = {}
        for item in regional_dist:
            state = item['domicile_state'] or 'Not Specified'
            total = item['count']
            placed = item['placed_count']
            placed_by_region[state] = {
                'total': total,
                'placed': placed,
                'placement_rate': round((placed / total * 100) if total > 0 else 0, 2)
            }
        
        placed_by_category = {}
        for item in social_dist:
            category = item['social_category'] or 'Not Specified'
            total = item['count']
            placed = item['placed_count']
            placed_by_category[category] = {
                'total': total,
                'placed': placed,
                'placement_rate': round((placed / total * 100) if total > 0 else 0, 2)
            }
        
        return {
            'gender_distribution': list(gender_dist),
            'regional_distribution': list(regional_dist),
            'social_category_distribution': list(social_dist),
            'placed_by_gender': placed_by_gender,
            'placed_by_region': placed_by_region,
            'placed_by_category': placed_by_category,
        }
    
    def calculate_gender_pay_gap(self, batch_year, program_id=None):
        """
        Calculate gender pay gap for diversity reporting.
        
        Returns:
            dict: Gender pay gap analysis
        """
        queryset = StudentProfile.objects.filter(
            is_placed=True,
            joining_year=batch_year - 4
        )
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        # Get offers by gender
        male_offers = PlacementOffer.objects.filter(
            student__in=queryset.filter(gender='Male'),
            outcome_type='PLACEMENT',
            is_verified=True
        )
        
        female_offers = PlacementOffer.objects.filter(
            student__in=queryset.filter(gender='Female'),
            outcome_type='PLACEMENT',
            is_verified=True
        )
        
        male_salaries = [float(o.total_ctc) for o in male_offers if o.total_ctc]
        female_salaries = [float(o.total_ctc) for o in female_offers if o.total_ctc]
        
        male_median = statistics.median(male_salaries) if male_salaries else 0
        female_median = statistics.median(female_salaries) if female_salaries else 0
        
        pay_gap_percentage = 0.0
        if male_median > 0:
            pay_gap_percentage = ((male_median - female_median) / male_median) * 100
        
        return {
            'male_median_salary': round(male_median, 2),
            'female_median_salary': round(female_median, 2),
            'pay_gap_percentage': round(pay_gap_percentage, 2),
            'male_count': len(male_salaries),
            'female_count': len(female_salaries),
        }

