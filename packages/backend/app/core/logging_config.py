"""
Ganitel V2 Backend - Logging Configuration
"""
import logging


def configure_logging(debug: bool = False) -> None:
    root_logger = logging.getLogger()
    if root_logger.handlers:
        return

    logging.basicConfig(
        level=logging.DEBUG if debug else logging.INFO,
        format=(
            "%(asctime)s "
            "level=%(levelname)s "
            "logger=%(name)s "
            "message=%(message)s"
        ),
    )
