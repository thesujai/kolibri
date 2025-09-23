import logging
import traceback
from unittest.mock import patch

from django.db import IntegrityError
from django.test import RequestFactory
from django.test import TestCase

from ..constants import BACKEND
from ..middleware import ErrorReportingMiddleware
from ..models import ErrorReport


class ErrorReportingMiddlewareTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @patch(
        "kolibri.core.error_reports.middleware.get_request_time_to_error",
        return_value=0.0,
    )
    @patch(
        "kolibri.core.error_reports.middleware.get_python_version", return_value="3.9.9"
    )
    @patch(
        "kolibri.core.error_reports.middleware.get_packages",
        return_value=["Django==3.2.25"],
    )
    @patch.object(ErrorReport, "insert_or_update_error")
    @patch.object(logging.Logger, "error")
    def test_process_exception(
        self,
        mock_logger_error,
        mock_insert_or_update_error,
        mock_get_packages,
        mock_get_python_version,
        mock_get_request_time_to_error,
    ):
        middleware = ErrorReportingMiddleware(lambda r: None)
        request = self.factory.get("/")
        exception = Exception("Test Exception")
        try:
            raise exception
        except Exception as e:
            middleware.process_exception(request, exception=e)
        # I am just coverting exception.__traceback__ to string
        expected_traceback_info = "".join(
            traceback.format_exception(
                type(exception), exception, exception.__traceback__
            )
        )

        call_args = mock_insert_or_update_error.call_args[0]
        context = call_args[3]

        assert call_args[0] == BACKEND
        assert call_args[1] == str(exception)
        assert call_args[2] == expected_traceback_info

        request_info = context["request_info"]
        assert request_info["url"] == "http://testserver/"
        assert request_info["method"] == "GET"
        assert request_info["query_params"] == {}
        assert request_info["body"] is None
        assert isinstance(request_info["headers"], dict)

        assert context["server"] == {"host": "testserver", "port": "80"}
        assert context["packages"] == ["Django==3.2.25"]
        assert context["python_version"] == "3.9.9"
        assert context["avg_request_time_to_error"] == 0.0

    @patch.object(ErrorReport, "insert_or_update_error")
    @patch.object(logging.Logger, "error")
    def test_process_exception_integrity_error(
        self, mock_logger_error, mock_insert_or_update_error
    ):
        middleware = ErrorReportingMiddleware(lambda r: None)
        request = self.factory.get("/")
        request.start_time = 0.0
        exception = Exception("Test Exception")
        mock_insert_or_update_error.side_effect = IntegrityError("Some Integrity Error")
        middleware.process_exception(request, exception)

        mock_logger_error.assert_any_call(
            "Error occurred while saving error report to the database: %s",
            str(mock_insert_or_update_error.side_effect),
        )
