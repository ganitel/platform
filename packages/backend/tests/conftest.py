"""pytest scaffolding.

Intentionally minimal — true unit tests must not depend on env, DB,
or any external service. If a fixture needs a DB URL, add it under
`tests/integration/` with the `integration` marker instead.
"""

import pytest
from cryptography.hazmat.primitives.asymmetric import ec, rsa


@pytest.fixture
def rsa_keypair():
    """Generate a one-time RSA key pair for JWT signing tests."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    return private_key, private_key.public_key()


@pytest.fixture
def ec_keypair():
    """Generate a one-time EC P-256 key pair (matches Supabase asymmetric-key default)."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    return private_key, private_key.public_key()
