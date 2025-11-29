"""
PDF Report Exporter

Generates professional PDF reports using WeasyPrint.
"""

from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from apps.analytics.services.kpi_calculator import KPICalculator
from apps.analytics.services.nirf_calculator import NIRFCalculator
from apps.placements.models import CompanyDrive
from apps.companies.models import Company


class PDFExporter:
    """
    Exports professional PDF reports for placement book and other documents.
    """
    
    def __init__(self):
        self.kpi_calculator = KPICalculator()
        self.nirf_calculator = NIRFCalculator()
    
    def generate_placement_book(self, academic_year=None):
        """
        Generate Annual Placement Report PDF (Placement Book).
        
        A professional 20-page brochure containing:
        - Director's message
        - Batch statistics
        - Major recruiters
        - Statistical highlights
        
        Args:
            academic_year: Optional academic year filter
            
        Returns:
            HttpResponse: PDF file response
        """
        try:
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration
        except ImportError:
            # Fallback to HTML if WeasyPrint not available
            return self._generate_html_fallback(academic_year)
        
        # Get data
        season_summary = self.kpi_calculator.get_season_summary(academic_year)
        
        # Get top recruiters
        top_recruiters = self._get_top_recruiters(academic_year)
        
        # Get program-wise statistics
        program_stats = self.kpi_calculator.get_program_wise_placement()
        
        # Render HTML template
        context = {
            'academic_year': academic_year or f"{timezone.now().year-1}-{str(timezone.now().year)[-2:]}",
            'season_summary': season_summary,
            'top_recruiters': top_recruiters,
            'program_stats': program_stats,
            'generated_at': timezone.now(),
        }
        
        html_string = render_to_string('analytics/reports/placement_book.html', context)
        
        # Generate PDF
        font_config = FontConfiguration()
        html = HTML(string=html_string)
        css = CSS(string=self._get_placement_book_css())
        
        pdf_file = html.write_pdf(stylesheets=[css], font_config=font_config)
        
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Placement_Book_{context["academic_year"].replace("-", "_")}.pdf"'
        
        return response
    
    def _get_top_recruiters(self, academic_year=None, limit=20):
        """
        Get top recruiters by number of offers.
        
        Returns:
            list: Top recruiters with statistics
        """
        from apps.analytics.models.compliance_models import PlacementOffer
        from django.db.models import Count
        
        offers = PlacementOffer.objects.filter(
            outcome_type='PLACEMENT',
            is_verified=True
        ).select_related('job', 'job__company_drive', 'job__company_drive__company')
        
        if academic_year:
            # Filter by academic year
            pass  # TODO: Implement academic year filtering
        
        # Group by company
        company_stats = {}
        for offer in offers:
            company_name = offer.job.company_drive.company.name
            if company_name not in company_stats:
                company_stats[company_name] = {
                    'name': company_name,
                    'offers_count': 0,
                    'avg_salary': 0.0,
                    'salaries': [],
                }
            
            company_stats[company_name]['offers_count'] += 1
            if offer.total_ctc:
                company_stats[company_name]['salaries'].append(float(offer.total_ctc))
        
        # Calculate averages
        for company in company_stats.values():
            if company['salaries']:
                company['avg_salary'] = sum(company['salaries']) / len(company['salaries'])
        
        # Sort by offers count
        top_recruiters = sorted(
            company_stats.values(),
            key=lambda x: x['offers_count'],
            reverse=True
        )[:limit]
        
        return top_recruiters
    
    def _get_placement_book_css(self):
        """
        Get CSS styles for placement book PDF.
        
        Returns:
            str: CSS string
        """
        return """
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        h1 {
            color: #1a1a1a;
            border-bottom: 3px solid #0066cc;
            padding-bottom: 10px;
        }
        
        h2 {
            color: #0066cc;
            margin-top: 30px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background-color: #0066cc;
            color: white;
        }
        
        .stat-box {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        """
    
    def _generate_html_fallback(self, academic_year):
        """
        Fallback HTML generation if WeasyPrint not available.
        
        Returns:
            HttpResponse: HTML response
        """
        season_summary = self.kpi_calculator.get_season_summary(academic_year)
        top_recruiters = self._get_top_recruiters(academic_year)
        
        context = {
            'academic_year': academic_year or f"{timezone.now().year-1}-{str(timezone.now().year)[-2:]}",
            'season_summary': season_summary,
            'top_recruiters': top_recruiters,
        }
        
        html_string = render_to_string('analytics/reports/placement_book.html', context)
        
        response = HttpResponse(html_string, content_type='text/html')
        response['Content-Disposition'] = f'attachment; filename="Placement_Book_{context["academic_year"].replace("-", "_")}.html"'
        
        return response

