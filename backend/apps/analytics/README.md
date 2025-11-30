# Placemate Analytics & Reporting System

Professional-grade analytics and reporting system for placement management with NBA, NAAC, and NIRF compliance.

## Overview

The analytics system provides:

1. **Role-Based Dashboards**
   - TPO Command Center (Operational + Strategic views)
   - Student Career Portal
   - Admin Accreditation Dashboard

2. **Compliance Reporting**
   - NBA SAR Table B.3a (Success Index calculation)
   - NAAC Metric 5.2.1 Excel template
   - NIRF Median Salary and Diversity metrics

3. **Automated Policy Enforcement**
   - Placement policy engine
   - Dream offer rules
   - Multiple offer management

4. **Professional Report Generation**
   - PDF Placement Book
   - Excel compliance templates
   - Bulk document exports

## Architecture

### Models

- **BacklogHistory**: Transactional backlog tracking for NBA Success Index
- **AcademicRecord**: Semester-wise academic performance
- **PlacementOffer**: Detailed offer tracking with salary breakdown
- **PlacementPolicy**: Configurable placement policies
- **DocumentVerification**: NAAC evidence tracking

### Services

- **KPICalculator**: Standardized KPI calculations
- **NBASuccessCalculator**: NBA Success Index and SAR generation
- **NIRFCalculator**: NIRF metrics (median salary, diversity)
- **TPODashboardService**: TPO dashboard data aggregation
- **StudentDashboardService**: Student dashboard data
- **PlacementPolicyService**: Policy enforcement

### Exporters

- **NBAExporter**: NBA SAR reports (JSON, CSV)
- **NAACExporter**: NAAC Excel templates and bulk proof downloads
- **PDFExporter**: Professional PDF reports (Placement Book)

## API Endpoints

### Dashboards

- `GET /api/v1/analytics/tpo/dashboard/` - TPO dashboard (view=operational|strategic|both)
- `GET /api/v1/analytics/student/dashboard/` - Student dashboard
- `GET /api/v1/analytics/admin/dashboard/` - Admin dashboard

### Reports

- `GET /api/v1/analytics/reports/nba/sar/` - NBA SAR Table B.3a (format=json|csv)
- `GET /api/v1/analytics/reports/naac/metric-5-2-1/` - NAAC Excel template
- `GET /api/v1/analytics/reports/naac/bulk-proofs/` - Bulk proof ZIP download
- `GET /api/v1/analytics/reports/placement-book/` - Annual Placement Report PDF

## Usage Examples

### TPO Dashboard

```python
# Get operational view
GET /api/v1/analytics/tpo/dashboard/?view=operational

# Get strategic view
GET /api/v1/analytics/tpo/dashboard/?view=strategic

# Get both views
GET /api/v1/analytics/tpo/dashboard/
```

### NBA Report

```python
# Generate NBA SAR Table B.3a as JSON
GET /api/v1/analytics/reports/nba/sar/?program_id=1&format=json

# Generate as CSV
GET /api/v1/analytics/reports/nba/sar/?program_id=1&format=csv&academic_years=3
```

### NAAC Report

```python
# Generate NAAC Metric 5.2.1 Excel
GET /api/v1/analytics/reports/naac/metric-5-2-1/?academic_years=5

# Download bulk proofs
GET /api/v1/analytics/reports/naac/bulk-proofs/?academic_year=2023-24
```

## Key Features

### NBA Compliance

- **Success Index Calculation**: Automatic calculation with lateral entry support
- **Backlog Ledger**: Transactional tracking of backlog history
- **SAR Table B.3a**: Auto-generated compliance tables

### NAAC Compliance

- **Evidence Repository**: Secure document storage with verification workflow
- **Excel Templates**: Auto-generated NAAC Metric 5.2.1 templates
- **Proof Links**: Secure URLs for audit documentation

### NIRF Compliance

- **Median Salary**: Accurate median calculation (not average)
- **Diversity Metrics**: Gender, regional, and social category reporting
- **GPH Metric**: Combined Placement and Higher Studies metric

### Policy Engine

- **Configurable Policies**: JSON-based policy definitions
- **Automatic Enforcement**: Withdraws applications on offer acceptance
- **Tier Management**: Dream/Standard offer rules

## Performance Optimization

- **Materialized Views**: Pre-calculated metrics for dashboard performance
- **Caching**: Dashboard cache for frequently accessed data
- **Query Optimization**: Select related and prefetch related usage

## Dependencies

- `pandas`: Data manipulation for Excel exports
- `openpyxl`: Excel file generation
- `weasyprint`: PDF generation

## Future Enhancements

- Resume parsing integration
- Skill gap analysis
- Placement probability prediction
- Real-time interview tracking
- Advanced materialized view refresh strategies

