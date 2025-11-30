"""
Report Export Views

Provides endpoints for generating and downloading compliance reports.
"""

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsPlacementTeam, IsAdminRole
from apps.core.response import SuccessResponse
from apps.analytics.exporters.nba_exporter import NBAExporter
from apps.analytics.exporters.naac_exporter import NAACExporter
from apps.analytics.exporters.pdf_exporter import PDFExporter


class NBASARReportView(APIView):
    """
    NBA SAR Table B.3a Report Generator
    
    GET /api/v1/analytics/reports/nba/sar/?program_id=1&format=json
    """
    permission_classes = [IsAuthenticated, IsPlacementTeam]
    
    def get(self, request):
        """
        Generate NBA SAR Table B.3a report.
        
        Query Parameters:
        - program_id: Program ID (required)
        - format: 'json' or 'csv' (default: json)
        - academic_years: Number of years (default: 3)
        """
        program_id = request.query_params.get('program_id')
        format_type = request.query_params.get('format', 'json')
        academic_years = int(request.query_params.get('academic_years', 3))
        
        if not program_id:
            return SuccessResponse(
                data={},
                message="program_id is required",
                success=False
            )
        
        exporter = NBAExporter()
        
        if format_type == 'csv':
            return exporter.generate_sar_table_b3a_csv(program_id, academic_years)
        else:
            data = exporter.generate_sar_table_b3a_json(program_id, academic_years)
            return SuccessResponse(
                data=data,
                message="NBA SAR Table B.3a generated successfully"
            )


class NAACReportView(APIView):
    """
    NAAC Metric 5.2.1 Report Generator
    
    GET /api/v1/analytics/reports/naac/metric-5-2-1/?academic_years=5
    """
    permission_classes = [IsAuthenticated, IsPlacementTeam]
    
    def get(self, request):
        """
        Generate NAAC Metric 5.2.1 Excel template.
        
        Query Parameters:
        - academic_years: Number of years (default: 5)
        """
        academic_years = int(request.query_params.get('academic_years', 5))
        
        exporter = NAACExporter()
        return exporter.generate_metric_5_2_1_excel(academic_years)


class NAACBulkProofDownloadView(APIView):
    """
    NAAC Bulk Proof Documents Download
    
    GET /api/v1/analytics/reports/naac/bulk-proofs/?academic_year=2023-24
    """
    permission_classes = [IsAuthenticated, IsPlacementTeam]
    
    def get(self, request):
        """
        Download all proof documents for an academic year as ZIP.
        
        Query Parameters:
        - academic_year: Academic year (e.g., "2023-24")
        """
        academic_year = request.query_params.get('academic_year')
        
        if not academic_year:
            return SuccessResponse(
                data={},
                message="academic_year is required",
                success=False
            )
        
        exporter = NAACExporter()
        return exporter.generate_bulk_proof_download(academic_year)


class PlacementBookView(APIView):
    """
    Annual Placement Report PDF Generator
    
    GET /api/v1/analytics/reports/placement-book/?academic_year=2023-24
    """
    permission_classes = [IsAuthenticated, IsPlacementTeam]
    
    def get(self, request):
        """
        Generate Annual Placement Report PDF.
        
        Query Parameters:
        - academic_year: Academic year (optional)
        """
        academic_year = request.query_params.get('academic_year')
        
        exporter = PDFExporter()
        return exporter.generate_placement_book(academic_year)

