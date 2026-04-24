"""
Ganitel V2 Backend - Cron Jobs Service
"""
import asyncio
import logging
from collections.abc import Callable
from datetime import datetime

logger = logging.getLogger(__name__)


class CronJob:
    """Cron job definition"""

    def __init__(
        self,
        name: str,
        schedule: str,  # Cron expression
        func: Callable,
        enabled: bool = True
    ):
        self.name = name
        self.schedule = schedule
        self.func = func
        self.enabled = enabled
        self.last_run: datetime = None
        self.next_run: datetime = None


class CronService:
    """Service for managing cron jobs"""

    def __init__(self):
        self.jobs: list[CronJob] = []
        self.running = False

    def register_job(self, job: CronJob):
        """Register a cron job"""
        self.jobs.append(job)
        logger.info(f"Registered cron job: {job.name}")

    async def run_job(self, job: CronJob):
        """Run a single cron job"""
        try:
            logger.info(f"Running cron job: {job.name}")
            job.last_run = datetime.utcnow()
            if asyncio.iscoroutinefunction(job.func):
                await job.func()
            else:
                job.func()
            logger.info(f"Completed cron job: {job.name}")
        except Exception as e:
            logger.error(f"Error running cron job {job.name}: {e}")

    async def start(self):
        """Start the cron service"""
        self.running = True
        logger.info("Cron service started")
        # In production, use a proper cron scheduler like APScheduler
        # For now, this is a placeholder

    async def stop(self):
        """Stop the cron service"""
        self.running = False
        logger.info("Cron service stopped")

