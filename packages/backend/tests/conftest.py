"""pytest scaffolding.

Intentionally minimal — true unit tests must not depend on env, DB,
or any external service. If a fixture needs a DB URL, add it under
`tests/integration/` with the `integration` marker instead.
"""

import pytest
from cryptography.hazmat.primitives.asymmetric import rsa


@pytest.fixture
def rsa_keypair():
    """Generate a one-time RSA key pair for JWT signing tests."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    return private_key, private_key.public_key()
