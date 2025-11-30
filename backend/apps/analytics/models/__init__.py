"""
Analytics Models Package
"""

from .compliance_models import (
    BacklogHistory,
    AcademicRecord,
    PlacementOffer,
    PlacementPolicy,
    DocumentVerification,
)
from .dashboard_models import *

__all__ = [
    'BacklogHistory',
    'AcademicRecord',
    'PlacementOffer',
    'PlacementPolicy',
    'DocumentVerification',
]
