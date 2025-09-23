from unittest.mock import patch

import pytest
from django.test import TestCase

from kolibri.core.discovery.utils.network.errors import NetworkLocationConnectionFailure
from kolibri.core.discovery.utils.network.errors import NetworkLocationResponseFailure
from kolibri.core.discovery.utils.network.errors import NetworkLocationResponseTimeout
from kolibri.core.error_reports.models import ErrorReport
from kolibri.core.error_reports.tasks import ping_error_reports


class TestPingErrorReports(TestCase):
    databases = "__all__"

    def setUp(self):
        ErrorReport.objects.create(
            category="frontend",
            error_message="Test Error",
            traceback="Test Traceback",
            context={
                "browser": {},
                "os": {},
                "component": "HeaderComponent",
                "device": {
                    "is_touch_device": True,
                    "screen": {
                        "width": 1920,
                        "height": 1080,
                        "available_width": 1920,
                        "available_height": 1040,
                    },
                },
            },
        )
        ErrorReport.objects.create(
            category="backend",
            error_message="Test Error",
            traceback="Test Traceback",
            context={
                "request_info": {
                    "url": "/api/test",
                    "method": "GET",
                    "headers": {"User-Agent": "TestAgent"},
                    "body": "",
                    "query_params": {"test": "true"},
                },
                "server": {"host": "localhost", "port": "8000"},
                "packages": ["Django==3.2.25"],
                "python_version": "3.9.1",
                "request_time_to_error": 0.0,
            },
        )

    @patch("kolibri.core.error_reports.tasks.NetworkClient")
    @patch(
        "kolibri.core.error_reports.tasks.serialize_error_reports_to_json_response",
        return_value="[]",
    )
    def test_ping_error_reports(self, mock_serializer, mock_network_client_class):
        mock_client = mock_network_client_class.return_value
        ping_error_reports("http://testserver", "test-pingback-id")
        mock_client.post.assert_called_with(
            "http://testserver/api/v1/errors/report/",
            data="[]",
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(ErrorReport.objects.filter(reported=True).count(), 2)

    @patch("kolibri.core.error_reports.tasks.NetworkClient")
    def test_ping_error_reports_connection_error(self, mock_network_client_class):
        mock_client = mock_network_client_class.return_value
        mock_client.post.side_effect = NetworkLocationConnectionFailure()
        with pytest.raises(NetworkLocationConnectionFailure):
            ping_error_reports("http://testserver", "test-pingback-id")
        self.assertEqual(ErrorReport.objects.filter(reported=True).count(), 0)

    @patch("kolibri.core.error_reports.tasks.NetworkClient")
    def test_ping_error_reports_timeout(self, mock_network_client_class):
        mock_client = mock_network_client_class.return_value
        mock_client.post.side_effect = NetworkLocationResponseTimeout()
        with pytest.raises(NetworkLocationResponseTimeout):
            ping_error_reports("http://testserver", "test-pingback-id")
        self.assertEqual(ErrorReport.objects.filter(reported=True).count(), 0)

    @patch("kolibri.core.error_reports.tasks.NetworkClient")
    def test_ping_error_reports_request_exception(self, mock_network_client_class):
        mock_client = mock_network_client_class.return_value
        mock_client.post.side_effect = NetworkLocationResponseFailure("Test error")
        with pytest.raises(NetworkLocationResponseFailure):
            ping_error_reports("http://testserver", "test-pingback-id")
        self.assertEqual(ErrorReport.objects.filter(reported=True).count(), 0)

    def tearDown(self):
        from django.db import connections

        connections.close_all()
