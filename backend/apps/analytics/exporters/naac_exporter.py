"""
NAAC Data Template Exporter

Generates NAAC Metric 5.2.1 Excel template with proof links.
"""

from django.http import HttpResponse
from django.utils import timezone
from apps.analytics.models.compliance_models import PlacementOffer
from apps.students.models import StudentProfile
from datetime import datetime
import io


class NAACExporter:
    """
    Exports NAAC compliance data in required Excel format.
    """
    
    def generate_metric_5_2_1_excel(self, academic_years=5):
        """
        Generate NAAC Metric 5.2.1 Excel template.
        
        Columns:
        - Year
        - Name
        - Program Graduated From
        - Name of Employer
        - Pay Package
        - Link to relevant document
        
        Args:
            academic_years: Number of years to include (default 5)
            
        Returns:
            HttpResponse: Excel file response
        """
        try:
            import pandas as pd
            from openpyxl import Workbook
            from openpyxl.styles import Font, Alignment
        except ImportError:
            # Fallback to CSV if pandas/openpyxl not available
            return self._generate_csv_fallback(academic_years)
        
        # Get placement data
        current_year = timezone.now().year
        data_rows = []
        
        for i in range(academic_years):
            year = current_year - i
            batch_year = year - 4  # Assuming 4-year program
            
            # Get placed students for this batch
            students = StudentProfile.objects.filter(
                joining_year=batch_year,
                is_placed=True
            ).select_related('user', 'program')
            
            for student in students:
                # Get placement offer
                offer = PlacementOffer.objects.filter(
                    student=student,
                    outcome_type='PLACEMENT',
                    is_verified=True
                ).first()
                
                if offer:
                    # Generate secure proof link
                    proof_link = self._generate_proof_link(offer)
                    
                    data_rows.append({
                        'Year': year,
                        'Name': student.user.get_full_name() or student.user.email,
                        'Program Graduated From': student.program.name if student.program else 'N/A',
                        'Name of Employer': offer.job.company_drive.company.name if offer.job else 'N/A',
                        'Pay Package (LPA)': float(offer.total_ctc) if offer.total_ctc else 0.0,
                        'Link to relevant document': proof_link,
                    })
        
        # Create DataFrame
        df = pd.DataFrame(data_rows)
        
        # Create Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='NAAC Metric 5.2.1', index=False)
            
            # Format worksheet
            worksheet = writer.sheets['NAAC Metric 5.2.1']
            
            # Header formatting
            for cell in worksheet[1]:
                cell.font = Font(bold=True)
                cell.alignment = Alignment(horizontal='center')
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="NAAC_Metric_5.2.1_{timezone.now().strftime("%Y%m%d")}.xlsx"'
        
        return response
    
    def _generate_proof_link(self, offer):
        """
        Generate secure proof link for offer letter.
        
        Args:
            offer: PlacementOffer instance
            
        Returns:
            str: Secure URL to offer letter
        """
        if offer.offer_letter_url:
            return offer.offer_letter_url
        
        # Generate signed URL if using Cloudinary
        if offer.offer_letter:
            # In production, this would generate a signed Cloudinary URL
            # For now, return a placeholder
            return f"/api/v1/analytics/offers/{offer.id}/proof/"
        
        return "N/A"
    
    def _generate_csv_fallback(self, academic_years):
        """
        Fallback CSV generation if pandas not available.
        
        Returns:
            HttpResponse: CSV file response
        """
        import csv
        from io import StringIO
        
        output = StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'Year',
            'Name',
            'Program Graduated From',
            'Name of Employer',
            'Pay Package (LPA)',
            'Link to relevant document'
        ])
        
        # Get data
        current_year = timezone.now().year
        
        for i in range(academic_years):
            year = current_year - i
            batch_year = year - 4
            
            students = StudentProfile.objects.filter(
                joining_year=batch_year,
                is_placed=True
            ).select_related('user', 'program')
            
            for student in students:
                offer = PlacementOffer.objects.filter(
                    student=student,
                    outcome_type='PLACEMENT',
                    is_verified=True
                ).first()
                
                if offer:
                    proof_link = self._generate_proof_link(offer)
                    writer.writerow([
                        year,
                        student.user.get_full_name() or student.user.email,
                        student.program.name if student.program else 'N/A',
                        offer.job.company_drive.company.name if offer.job else 'N/A',
                        float(offer.total_ctc) if offer.total_ctc else 0.0,
                        proof_link,
                    ])
        
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="NAAC_Metric_5.2.1_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        return response
    
    def generate_bulk_proof_download(self, academic_year):
        """
        Generate ZIP file with all proof documents for an academic year.
        
        Args:
            academic_year: Academic year (e.g., "2023-24")
            
        Returns:
            HttpResponse: ZIP file response
        """
        import zipfile
        from io import BytesIO
        
        # This would require actual file download from Cloudinary
        # For now, return a placeholder response
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Add placeholder file
            zip_file.writestr('README.txt', f'Proof documents for {academic_year}\n\nThis feature requires Cloudinary file download implementation.')
        
        zip_buffer.seek(0)
        
        response = HttpResponse(
            zip_buffer.read(),
            content_type='application/zip'
        )
        response['Content-Disposition'] = f'attachment; filename="NAAC_Proofs_{academic_year.replace("-", "_")}.zip"'
        
        return response

