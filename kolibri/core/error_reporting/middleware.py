import logging
import traceback

from django.db import IntegrityError

from .db_utils import insert_or_update_error

"""
!!!This is not the exact implementation for Middleware!!!
It should be to code standards
"""


class ErrorReportingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)

    def process_exception(self, request, exception):
        error_message = str(exception)
        traceback_info = traceback.format_exc()
        self.logger.info("Error message: %s", error_message)
        self.logger.info("Traceback info: %s", traceback_info)

        try:
            insert_or_update_error("Backend", error_message, traceback_info)
        except IntegrityError:
            self.logger.error(
                "Error occurred while saving error report to the database."
            )
