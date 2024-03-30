"""
This will be place where API will write the error to DB
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .db_utils import insert_or_update_error


class ErrorReportAPIView(APIView):
    """
    TO DO:
    1) Implement some sort of validator like a
    2) Implement Permissions
    3) Implement Filters
    4) Implement Write Method that will write into DB
    """

    def post(self, request):
        try:
            error_message = request.data.get("error_message", "")
            traceback_info = request.data.get("traceback", "")

            insert_or_update_error("FRONTEND", error_message, traceback_info)

            return Response(
                {"message": "Error report added successfully"},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
