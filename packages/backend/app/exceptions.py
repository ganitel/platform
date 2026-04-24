"""
Ganitel V2 Backend - Custom Exceptions
"""
from fastapi import status


class GanitelException(Exception):
    """Base exception for Ganitel application"""
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class ServiceNotFoundError(GanitelException):
    """Service not found exception"""
    def __init__(self, message: str = "Service not found"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)

class UserNotFoundError(GanitelException):
    """User not found exception"""
    def __init__(self, message: str = "User not found"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)

class BookingNotFoundError(GanitelException):
    """Booking not found exception"""
    def __init__(self, message: str = "Booking not found"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)

class AuthorizationError(GanitelException):
    """Authorization error exception"""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)

class ValidationError(GanitelException):
    """Validation error exception"""
    def __init__(self, message: str = "Validation error"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)

class InvalidBookingStatusError(GanitelException):
    """Invalid booking status error"""
    def __init__(self, message: str = "Invalid booking status"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)

class BookingConflictError(GanitelException):
    """Booking conflict error (dates overlap)"""
    def __init__(self, message: str = "Booking dates conflict with existing booking"):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)

class ConflictError(GanitelException):
    """Conflict error (resource already exists)"""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)

class NotFoundError(GanitelException):
    """Generic not found exception"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)

class PaymentError(GanitelException):
    """Payment processing error"""
    def __init__(self, message: str = "Payment processing failed"):
        super().__init__(message, status_code=status.HTTP_402_PAYMENT_REQUIRED)

