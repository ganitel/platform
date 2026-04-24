"""
Ganitel V2 Backend - Booking Schemas
"""
from datetime import date, datetime

from pydantic import BaseModel, Field, validator


class BookingCreateRequest(BaseModel):
    service_id: str = Field(..., description="Listing/service identifier")
    start_date: date
    end_date: date
    guests: int = Field(..., gt=0)
    notes: str | None = Field(None, max_length=500)

    @validator("end_date")
    def validate_dates(cls, end_date, values):
        start_date = values.get("start_date")
        if start_date and end_date <= start_date:
            raise ValueError("End date must be after start date")
        return end_date


class BookingResponse(BaseModel):
    id: str
    service_id: str
    user_id: str
    start_date: date
    end_date: date
    guests: int
    status: str  # Changed from BookingStatus enum to str
    total_amount: float
    negotiated_price: float | None
    currency: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_orm(cls, booking):
        """Custom from_orm to handle UUID conversion"""
        return cls(
            id=str(booking.id),
            service_id=str(booking.service_id),
            user_id=str(booking.user_id),
            start_date=booking.start_date,
            end_date=booking.end_date,
            guests=int(booking.guests),
            status=booking.status,
            total_amount=float(booking.total_amount),
            negotiated_price=float(booking.negotiated_price) if booking.negotiated_price else None,
            currency=booking.currency,
            notes=booking.notes,
            created_at=booking.created_at,
            updated_at=booking.updated_at
        )

    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    bookings: list[BookingResponse]
    total: int
    page: int
    per_page: int
    pages: int


class BookingCancelResponse(BaseModel):
    message: str
    booking: BookingResponse

