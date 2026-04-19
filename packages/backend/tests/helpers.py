"""
Test Helper Functions
"""
from uuid import uuid4
import random


def unique_email():
    """Generate a unique email for testing"""
    return f"test_{uuid4().hex[:8]}@example.com"


def unique_phone():
    """Generate a unique phone number for testing"""
    # Generate a unique phone number in Cameroon format
    return f"+2376900{random.randint(10000, 99999)}"
