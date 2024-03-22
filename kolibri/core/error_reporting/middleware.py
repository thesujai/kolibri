import logging
import traceback

from django.db import IntegrityError

from kolibri.core.device.models import ErrorReport

"""
!!!This is not the exact implementation for Middleware!!!
Things remaining in this are:
1) To check if the error is duplicate or not:
    i) if yes, then just increase the noOfErrors by 1
    ii) else just insert to database
2) Surround this insert operation with try except block
    if any error occurs while inserting to database(error in the model)
    just add to a json file in local storage (While pinging see for availability of this json file, if available then set the errorFrom filed to Database)
"""


class ErrorReportingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        error_message = str(exception)
        traceback_info = traceback.format_exc()
        self.logger.info("Error message: ", error_message)
        self.logger.info("Traceback inf: ", traceback_info)
        try:
            existing_report = ErrorReport.objects.filter(
                error_message=error_message, traceback=traceback_info
            ).exists()

            if not existing_report:
                ErrorReport.objects.create(
                    error_message=error_message, traceback=traceback_info
                )
            else:
                self.logger.warning(
                    "Duplicate error report detected: %s", error_message
                )
        except IntegrityError:
            self.logger.error(
                "Error occurred while saving error report to the database."
            )
