"""
Mapper registry regression tests.
"""

import subprocess
import sys
from pathlib import Path


def test_mapper_configuration_with_amenity_import_only():
    repo_root = Path(__file__).resolve().parents[1]
    script = "\n".join(
        [
            "from sqlalchemy.orm import configure_mappers",
            "from app.domain.entities.amenity import Amenity",
            "from app.domain.entities.amenity_category import AmenityCategory",
            "from app.domain.entities.location import Location",
            "from app.domain.entities.property_type import PropertyType",
            "from app.domain.entities.property import Property",
            "from app.domain.entities.property_amenity import PropertyAmenity",
            "configure_mappers()",
            "print('ok')",
        ]
    )

    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=str(repo_root),
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert "ok" in result.stdout
