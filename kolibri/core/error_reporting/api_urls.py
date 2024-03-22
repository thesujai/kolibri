"""
END POINT Where frontend will send request to
"""
from rest_framework import routers

from .api import ErrorViewSet

router = routers.SimpleRouter()

router.register(r"^error-report-frontend/", ErrorViewSet, basename="errorviewset")
