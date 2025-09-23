import json
import logging
import time
import traceback
from sys import version_info


if version_info < (3, 10):
    from importlib_metadata import distributions
else:
    from importlib.metadata import distributions

from django.core.exceptions import MiddlewareNotUsed
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from .constants import BACKEND
from .models import ErrorReport

from kolibri.plugins.error_reports.kolibri_plugin import ErrorReportsPlugin
from kolibri.core.error_reports.utils.scrubber import scrub_data
from kolibri.plugins.registry import registered_plugins


def _extract_json_body(request):
    if hasattr(request, "data") and request.data:
        return request.data
    elif hasattr(request, "json") and request.json:
        return request.json
    else:
        try:
            raw_body = request.body
            if raw_body:
                return json.loads(raw_body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError, AttributeError):
            return "<body not available - already consumed>"
    return None


def _extract_text_body(request):
    try:
        raw_body = request.body
        if raw_body:
            body_str = raw_body.decode("utf-8", errors="replace")
            if len(body_str) > 10000:
                body_str = body_str[:10000] + "... [truncated]"
            return body_str
    except (UnicodeDecodeError, AttributeError):
        return "<body not available - already consumed>"
    return None


def _get_request_body(request):
    content_type = request.headers.get("Content-Type", "").lower()

    if "application/json" in content_type:
        try:
            return _extract_json_body(request)
        except Exception:
            return "<body not available - parsing failed>"
    else:
        return _extract_text_body(request)


def get_request_info(request):
    context = {
        "url": request.build_absolute_uri(),
        "method": request.method,
        "headers": dict(request.headers),
        "query_params": dict(request.GET),
        "body": _get_request_body(request),
    }

    scrub_data(context)
    return context


def get_server_info(request):
    return {"host": request.get_host(), "port": request.get_port()}


def get_packages():
    packages = [f"{dist.metadata['Name']}=={dist.version}" for dist in distributions()]
    return packages


def get_python_version():
    return ".".join(str(v) for v in version_info[:3])


def get_request_time_to_error(request):
    return time.time() - request.start_time


class ErrorReportingMiddleware:
    """
    Middleware to log exceptions to the database.
    """

    def __init__(self, get_response):
        if ErrorReportsPlugin not in registered_plugins:
            raise MiddlewareNotUsed("ErrorReportsPlugin is not enabled.")
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        error_message = str(exception)
        traceback_info = traceback.format_exc()
        context = {
            "request_info": get_request_info(request),
            "server": get_server_info(request),
            "packages": get_packages(),
            "python_version": get_python_version(),
            "avg_request_time_to_error": get_request_time_to_error(request),
        }
        self.logger.error("Unexpected Error: %s", error_message)
        try:
            self.logger.error("Saving error report to the database.")
            ErrorReport.insert_or_update_error(
                BACKEND,
                error_message,
                traceback_info,
                context,
            )
        except (IntegrityError, ValidationError) as e:
            self.logger.error(
                "Error occurred while saving error report to the database: %s", str(e)
            )


class PreRequestMiddleware:
    def __init__(self, get_response):
        if ErrorReportsPlugin not in registered_plugins:
            raise MiddlewareNotUsed("ErrorReportsPlugin is not enabled.")
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        request.start_time = time.time()
