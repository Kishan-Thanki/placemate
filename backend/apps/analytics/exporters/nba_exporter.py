"""
NBA SAR Report Exporter

Generates NBA Self-Assessment Report (SAR) Table B.3a automatically.
"""

from django.http import HttpResponse
from django.utils import timezone
from apps.analytics.services.nba_calculator import NBASuccessCalculator
from apps.core.models import Program
import json


class NBAExporter:
    """
    Exports NBA compliance reports in various formats.
    """
    
    def __init__(self):
        self.calculator = NBASuccessCalculator()
    
    def generate_sar_table_b3a_json(self, program_id, academic_years=3):
        """
        Generate NBA SAR Table B.3a as JSON.
        
        Args:
            program_id: Program ID
            academic_years: Number of years to include
            
        Returns:
            dict: Table B.3a data
        """
        return self.calculator.generate_sar_table_b3a(program_id, academic_years)
    
    def generate_sar_table_b3a_csv(self, program_id, academic_years=3):
        """
        Generate NBA SAR Table B.3a as CSV.
        
        Args:
            program_id: Program ID
            academic_years: Number of years to include
            
        Returns:
            HttpResponse: CSV file response
        """
        import csv
        from io import StringIO
        
        table_data = self.calculator.generate_sar_table_b3a(program_id, academic_years)
        
        # Create CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Academic Year',
            'Batch Year',
            'Program',
            'Total Admitted',
            'Regular Admitted',
            'Lateral Admitted',
            'Graduated On Time (No Backlog)',
            'Graduated On Time (With Backlog)',
            'Success Index (%)',
            'API'
        ])
        
        # Data rows
        for row in table_data['table_data']:
            writer.writerow([
                row['academic_year'],
                row['batch_year'],
                row['program_name'],
                row['total_admitted'],
                row['regular_admitted'],
                row['lateral_admitted'],
                row['graduated_on_time_no_backlog'],
                row['graduated_on_time_with_backlog'],
                row['success_index'],
                row['api'],
            ])
        
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="NBA_SAR_Table_B3a_{program_id}_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        return response

