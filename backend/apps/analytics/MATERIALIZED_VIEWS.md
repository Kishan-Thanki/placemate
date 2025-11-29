# Materialized Views for Performance Optimization

## Overview

Materialized views pre-calculate expensive aggregations, allowing dashboards to query simple tables instead of complex joins. This dramatically improves dashboard load times.

## Available Views

### 1. `analytics_department_stats`

Department-wise placement statistics.

**Columns:**
- `department_id`: Department ID
- `department_name`: Department name
- `total_students`: Total students
- `placed_students`: Number of placed students
- `placement_rate`: Placement rate percentage
- `avg_salary`: Average salary (LPA)
- `median_salary`: Median salary (LPA)
- `max_salary`: Maximum salary (LPA)
- `min_salary`: Minimum salary (LPA)

**Usage:**
```python
from apps.analytics.services.dashboard_query_service import DashboardQueryService

service = DashboardQueryService()
dept_stats = service.get_department_performance()
```

### 2. `analytics_program_stats`

Program-wise placement statistics.

**Columns:**
- `program_id`: Program ID
- `program_name`: Program name
- `program_abbreviation`: Program abbreviation
- `degree_level`: UG/PG/Doctorate
- `total_students`: Total students
- `placed_students`: Number of placed students
- `placement_rate`: Placement rate percentage
- `avg_salary`: Average salary (LPA)
- `median_salary`: Median salary (LPA)
- `placed_with_salary`: Count of placed students with salary data

**Usage:**
```python
service = DashboardQueryService()
program_stats = service.get_program_performance()
```

### 3. `analytics_placement_summary`

Batch-wise placement summary for NBA compliance.

**Columns:**
- `batch_year`: Joining year
- `program_id`: Program ID
- `program_name`: Program name
- `total_students`: Total students in batch
- `placed_students`: Number of placed students
- `regular_admitted`: Regular entry students
- `lateral_admitted`: Lateral entry students
- `graduated_no_backlog`: Graduated without backlogs
- `graduated_with_backlog`: Graduated with cleared backlogs
- `placement_rate`: Placement rate percentage
- `avg_salary`: Average salary (LPA)
- `median_salary`: Median salary (LPA)

**Usage:**
```python
service = DashboardQueryService()
summary = service.get_batch_placement_summary(batch_year=2020, program_id=1)
```

### 4. `analytics_nirf_metrics`

NIRF-specific metrics for ranking submission.

**Columns:**
- `batch_year`: Joining year
- `program_id`: Program ID
- `program_name`: Program name
- `degree_level`: UG/PG
- `total_eligible`: Total eligible students
- `placed_count`: Number of placed students
- `higher_studies_count`: Number pursuing higher studies
- `total_outcomes`: Total outcomes (placed + higher studies)
- `gph_percentage`: GPH metric percentage
- `median_salary`: Median salary (LPA)
- `male_placed`: Male students placed
- `female_placed`: Female students placed
- `reserved_category_placed`: Reserved category students placed

**Usage:**
```python
service = DashboardQueryService()
nirf_metrics = service.get_nirf_metrics(batch_year=2020, program_id=1)
```

## Management Commands

### Create Views

```bash
# Create all views
python manage.py create_materialized_views

# Create specific view
python manage.py create_materialized_views --view analytics_department_stats
```

### Refresh Views

```bash
# Refresh all views
python manage.py refresh_materialized_views --all

# Refresh specific view
python manage.py refresh_materialized_views --view analytics_department_stats
```

### Setup Analytics System

```bash
# Complete setup (views + policies)
python manage.py setup_analytics
```

## Refresh Strategy

### Manual Refresh

Refresh views manually when needed:
```bash
python manage.py refresh_materialized_views --all
```

### Scheduled Refresh (Recommended)

Set up a cron job for automatic refresh:

```bash
# Add to crontab (refresh daily at 2 AM)
0 2 * * * cd /path/to/backend && python manage.py refresh_materialized_views --all
```

### On-Demand Refresh

Views can be refreshed programmatically:

```python
from apps.analytics.services.materialized_view_service import MaterializedViewService

service = MaterializedViewService()
service.refresh_view('analytics_department_stats')
```

## Performance Benefits

### Before Materialized Views
- Dashboard query: 2-5 seconds (complex joins, aggregations)
- Multiple queries per dashboard load
- Database load during peak hours

### After Materialized Views
- Dashboard query: <100ms (simple table scan)
- Single query per metric
- Pre-calculated data, minimal database load

## Refresh Considerations

### When to Refresh

1. **After placement updates**: When offers are accepted/rejected
2. **After student status changes**: When students are marked as placed
3. **Scheduled refresh**: Daily during off-peak hours
4. **Before report generation**: Ensure latest data for compliance reports

### Refresh Methods

1. **CONCURRENTLY**: Allows queries during refresh (requires unique index)
2. **Regular**: Faster but blocks queries during refresh

The service automatically tries CONCURRENTLY first, falls back to regular if needed.

## Integration with Services

All dashboard services automatically use materialized views when available:

```python
# KPI Calculator automatically uses views
from apps.analytics.services.kpi_calculator import KPICalculator

calculator = KPICalculator()
# This will use materialized view if available
dept_perf = calculator.get_department_performance()
```

## Troubleshooting

### View Not Found

If you get "relation does not exist" error:
```bash
python manage.py create_materialized_views
```

### Stale Data

If dashboard shows outdated data:
```bash
python manage.py refresh_materialized_views --all
```

### Performance Issues

If views are slow:
1. Check indexes: `\d+ analytics_department_stats` in psql
2. Analyze tables: `ANALYZE analytics_department_stats;`
3. Check view refresh frequency

## Best Practices

1. **Refresh Strategy**: Use daily scheduled refresh during off-peak hours
2. **Monitor Refresh Times**: Track how long refreshes take
3. **Index Maintenance**: Ensure indexes are up to date
4. **Fallback Handling**: Services automatically fall back to direct queries if views fail
5. **Testing**: Test view creation and refresh in development first

## Future Enhancements

- Automatic refresh triggers on data changes
- Incremental refresh for large datasets
- View versioning for A/B testing
- Performance monitoring dashboard

