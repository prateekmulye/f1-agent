"""
Automated Scheduler for F1 Data Updates and Model Training
Implements cron jobs for regular data synchronization and ML model retraining
"""
import asyncio
from datetime import datetime, timedelta
import logging
from typing import Dict, Any, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.ext.asyncio import AsyncSession

from .data_ingestion import F1DataPipeline
from .prediction_engine import F1PredictionEngine
from .cache_service import get_cache_service

logger = logging.getLogger(__name__)


class F1Scheduler:
    """Main scheduler for F1 data operations"""

    def __init__(self, db_session: AsyncSession):
        self.scheduler = AsyncIOScheduler()
        self.db = db_session
        self.cache = get_cache_service()
        self.data_pipeline = F1DataPipeline(db_session)
        self.prediction_engine = F1PredictionEngine(db_session)

        # Track job execution
        self.job_history = {}
        self.active_jobs = set()

    def setup_jobs(self):
        """Setup all scheduled jobs"""
        logger.info("Setting up F1 data scheduler jobs")

        # ============ DATA INGESTION JOBS ============

        # Daily data sync - runs every day at 6 AM UTC
        self.scheduler.add_job(
            self.daily_data_sync,
            CronTrigger(hour=6, minute=0),
            id='daily_data_sync',
            name='Daily F1 Data Sync',
            max_instances=1,
            coalesce=True
        )

        # Weekly full sync - runs every Sunday at 2 AM UTC
        self.scheduler.add_job(
            self.weekly_full_sync,
            CronTrigger(day_of_week=6, hour=2, minute=0),  # Sunday = 6
            id='weekly_full_sync',
            name='Weekly Full Data Sync',
            max_instances=1,
            coalesce=True
        )

        # Real-time race day updates - runs every 30 seconds on race days
        self.scheduler.add_job(
            self.race_day_updates,
            IntervalTrigger(seconds=30),
            id='race_day_updates',
            name='Race Day Real-time Updates',
            max_instances=1,
            coalesce=True
        )

        # ============ PREDICTION JOBS ============

        # Generate predictions for upcoming races - runs daily at 8 AM UTC
        self.scheduler.add_job(
            self.generate_upcoming_predictions,
            CronTrigger(hour=8, minute=0),
            id='generate_predictions',
            name='Generate Race Predictions',
            max_instances=1,
            coalesce=True
        )

        # Update weather forecasts - runs every 6 hours
        self.scheduler.add_job(
            self.update_weather_forecasts,
            IntervalTrigger(hours=6),
            id='weather_updates',
            name='Weather Forecast Updates',
            max_instances=1,
            coalesce=True
        )

        # ============ MODEL TRAINING JOBS ============

        # Retrain models after race completion - runs Monday at 4 AM UTC
        self.scheduler.add_job(
            self.retrain_models_after_race,
            CronTrigger(day_of_week=0, hour=4, minute=0),  # Monday = 0
            id='retrain_models',
            name='Model Retraining',
            max_instances=1,
            coalesce=True
        )

        # Model performance evaluation - runs monthly on 1st at 1 AM UTC
        self.scheduler.add_job(
            self.evaluate_model_performance,
            CronTrigger(day=1, hour=1, minute=0),
            id='model_evaluation',
            name='Model Performance Evaluation',
            max_instances=1,
            coalesce=True
        )

        # ============ MAINTENANCE JOBS ============

        # Cache cleanup - runs daily at midnight UTC
        self.scheduler.add_job(
            self.cache_maintenance,
            CronTrigger(hour=0, minute=0),
            id='cache_cleanup',
            name='Cache Maintenance',
            max_instances=1,
            coalesce=True
        )

        # Database maintenance - runs weekly on Saturday at 3 AM UTC
        self.scheduler.add_job(
            self.database_maintenance,
            CronTrigger(day_of_week=5, hour=3, minute=0),  # Saturday = 5
            id='database_maintenance',
            name='Database Maintenance',
            max_instances=1,
            coalesce=True
        )

    async def start(self):
        """Start the scheduler"""
        logger.info("Starting F1 scheduler")
        self.setup_jobs()
        self.scheduler.start()

        # Schedule initial jobs if needed
        await self._schedule_initial_jobs()

    async def stop(self):
        """Stop the scheduler"""
        logger.info("Stopping F1 scheduler")
        self.scheduler.shutdown(wait=True)

    # ============ JOB IMPLEMENTATIONS ============

    async def daily_data_sync(self):
        """Daily data synchronization job"""
        job_id = 'daily_data_sync'
        logger.info(f"Starting job: {job_id}")

        try:
            self.active_jobs.add(job_id)

            # Update recent race results
            await self._update_recent_results()

            # Update driver/team standings
            await self.data_pipeline.run_daily_job()

            # Refresh cached data for upcoming races
            await self._refresh_upcoming_race_cache()

            # Log successful completion
            await self._log_job_completion(job_id, 'success')

        except Exception as e:
            logger.error(f"Daily data sync failed: {e}")
            await self._log_job_completion(job_id, 'error', error=str(e))
            raise
        finally:
            self.active_jobs.discard(job_id)

    async def weekly_full_sync(self):
        """Weekly full data synchronization job"""
        job_id = 'weekly_full_sync'
        logger.info(f"Starting job: {job_id}")

        try:
            self.active_jobs.add(job_id)

            # Full season data sync
            stats = await self.data_pipeline.run_weekly_job()

            # Clear relevant cache entries
            self.cache.invalidate_season(2025)
            self.cache.invalidate_season(2024)

            # Update historical statistics
            await self._update_historical_stats()

            await self._log_job_completion(job_id, 'success', records_processed=sum(stats.values()) if isinstance(stats, dict) else 0)

        except Exception as e:
            logger.error(f"Weekly full sync failed: {e}")
            await self._log_job_completion(job_id, 'error', error=str(e))
            raise
        finally:
            self.active_jobs.discard(job_id)

    async def race_day_updates(self):
        """Real-time updates during race days"""
        job_id = 'race_day_updates'

        # Check if today is a race day
        if not await self._is_race_day():
            return

        try:
            self.active_jobs.add(job_id)

            # Update live timing data
            await self._update_live_timing()

            # Update weather conditions
            await self._update_current_weather()

            # Clear real-time cache entries
            await self._invalidate_real_time_cache()

        except Exception as e:
            logger.error(f"Race day updates failed: {e}")
        finally:
            self.active_jobs.discard(job_id)

    async def generate_upcoming_predictions(self):
        """Generate predictions for upcoming races"""
        job_id = 'generate_predictions'
        logger.info(f"Starting job: {job_id}")

        try:
            self.active_jobs.add(job_id)

            # Get upcoming races (next 3 races)
            upcoming_races = await self._get_upcoming_races(limit=3)

            predictions_generated = 0

            for race in upcoming_races:
                race_id = race['id']

                # Check if predictions already exist and are recent
                cached_predictions = self.cache.get_predictions(race_id)
                if cached_predictions and await self._predictions_are_recent(race_id):
                    continue

                # Generate new predictions
                try:
                    predictions = await self.prediction_engine.predict_race(race_id, include_explanation=True)
                    predictions_generated += len(predictions)
                    logger.info(f"Generated {len(predictions)} predictions for race {race_id}")
                except Exception as e:
                    logger.error(f"Failed to generate predictions for race {race_id}: {e}")

            await self._log_job_completion(job_id, 'success', records_processed=predictions_generated)

        except Exception as e:
            logger.error(f"Prediction generation failed: {e}")
            await self._log_job_completion(job_id, 'error', error=str(e))
        finally:
            self.active_jobs.discard(job_id)

    async def update_weather_forecasts(self):
        """Update weather forecasts for upcoming races"""
        job_id = 'weather_updates'

        try:
            self.active_jobs.add(job_id)

            upcoming_races = await self._get_upcoming_races(limit=5)
            forecasts_updated = 0

            for race in upcoming_races:
                try:
                    # Update weather forecast
                    weather_data = await self.data_pipeline.ingestion.ingest_weather_forecast(
                        race['id'], race.get('location', '')
                    )
                    if weather_data:
                        forecasts_updated += 1
                except Exception as e:
                    logger.error(f"Failed to update weather for race {race['id']}: {e}")

            logger.info(f"Updated {forecasts_updated} weather forecasts")

        except Exception as e:
            logger.error(f"Weather forecast update failed: {e}")
        finally:
            self.active_jobs.discard(job_id)

    async def retrain_models_after_race(self):
        """Retrain ML models after race completion with new data"""
        job_id = 'retrain_models'
        logger.info(f"Starting job: {job_id}")

        try:
            self.active_jobs.add(job_id)

            # Check if there are new race results to train on
            new_results_available = await self._check_new_results_available()
            if not new_results_available:
                logger.info("No new race results available for training")
                return

            # Prepare training data with latest results
            training_data = await self._prepare_training_data()

            if len(training_data) < 100:
                logger.warning("Insufficient training data for model retraining")
                return

            # Train models with new data
            performance_metrics = self.prediction_engine.train_models(training_data)

            # Compare with previous model performance
            improvement = await self._evaluate_model_improvement(performance_metrics)

            # Update model version if improvement is significant
            if improvement.get('significant_improvement', False):
                await self._deploy_new_model_version()

            await self._log_job_completion(
                job_id, 'success',
                records_processed=len(training_data),
                performance_metrics=performance_metrics
            )

        except Exception as e:
            logger.error(f"Model retraining failed: {e}")
            await self._log_job_completion(job_id, 'error', error=str(e))
        finally:
            self.active_jobs.discard(job_id)

    async def evaluate_model_performance(self):
        """Evaluate model performance on recent predictions vs actual results"""
        job_id = 'model_evaluation'
        logger.info(f"Starting job: {job_id}")

        try:
            self.active_jobs.add(job_id)

            # Get completed races from last month
            completed_races = await self._get_completed_races_last_month()

            total_accuracy_metrics = {
                'races_evaluated': 0,
                'avg_position_mae': 0.0,
                'avg_points_accuracy': 0.0,
                'correct_winners': 0,
                'correct_podium_predictions': 0
            }

            for race in completed_races:
                race_id = race['id']

                try:
                    accuracy = await self.prediction_engine.analyze_prediction_accuracy(race_id)

                    if 'error' not in accuracy:
                        total_accuracy_metrics['races_evaluated'] += 1
                        total_accuracy_metrics['avg_position_mae'] += accuracy.get('position_mae', 0)
                        total_accuracy_metrics['avg_points_accuracy'] += accuracy.get('points_accuracy', 0)

                        if accuracy.get('correct_winner', False):
                            total_accuracy_metrics['correct_winners'] += 1

                        total_accuracy_metrics['correct_podium_predictions'] += accuracy.get('correct_podium_count', 0)

                except Exception as e:
                    logger.error(f"Failed to evaluate race {race_id}: {e}")

            # Calculate averages
            if total_accuracy_metrics['races_evaluated'] > 0:
                races_count = total_accuracy_metrics['races_evaluated']
                total_accuracy_metrics['avg_position_mae'] /= races_count
                total_accuracy_metrics['avg_points_accuracy'] /= races_count

            # Store evaluation results
            await self._store_evaluation_results(total_accuracy_metrics)

            logger.info(f"Model evaluation completed: {total_accuracy_metrics}")

            await self._log_job_completion(job_id, 'success', performance_metrics=total_accuracy_metrics)

        except Exception as e:
            logger.error(f"Model evaluation failed: {e}")
            await self._log_job_completion(job_id, 'error', error=str(e))
        finally:
            self.active_jobs.discard(job_id)

    async def cache_maintenance(self):
        """Perform cache maintenance and cleanup"""
        job_id = 'cache_cleanup'

        try:
            self.active_jobs.add(job_id)

            # Clear expired entries
            expired_patterns = [
                'f1:weather:*',  # Weather data expires quickly
                'f1:predictions:*_old_*',  # Old prediction entries
                'f1:temp:*'  # Temporary cache entries
            ]

            total_cleared = 0
            for pattern in expired_patterns:
                cleared = self.cache.clear_pattern(pattern)
                total_cleared += cleared

            # Get cache statistics
            cache_stats = self.cache.get_stats()

            logger.info(f"Cache maintenance completed. Cleared {total_cleared} entries. Stats: {cache_stats}")

        except Exception as e:
            logger.error(f"Cache maintenance failed: {e}")
        finally:
            self.active_jobs.discard(job_id)

    async def database_maintenance(self):
        """Perform database maintenance tasks"""
        job_id = 'database_maintenance'
        logger.info(f"Starting job: {job_id}")

        try:
            self.active_jobs.add(job_id)

            # Archive old predictions
            await self._archive_old_predictions()

            # Update statistical aggregations
            await self._update_driver_circuit_stats()
            await self._update_team_circuit_stats()

            # Clean up old ETL job logs
            await self._cleanup_old_etl_logs()

            logger.info("Database maintenance completed")

            await self._log_job_completion(job_id, 'success')

        except Exception as e:
            logger.error(f"Database maintenance failed: {e}")
            await self._log_job_completion(job_id, 'error', error=str(e))
        finally:
            self.active_jobs.discard(job_id)

    # ============ HELPER METHODS ============

    async def _schedule_initial_jobs(self):
        """Schedule any one-time initial jobs"""
        # Check if we need initial data sync
        last_sync = await self._get_last_sync_time()
        if not last_sync or (datetime.utcnow() - last_sync).days > 7:
            logger.info("Scheduling initial data sync")
            self.scheduler.add_job(
                self.weekly_full_sync,
                'date',
                run_date=datetime.utcnow() + timedelta(seconds=30),
                id='initial_sync'
            )

    async def _is_race_day(self) -> bool:
        """Check if today is a race day"""
        today = datetime.utcnow().date()
        # This would query the database for races today
        return False  # Simplified for now

    async def _get_upcoming_races(self, limit: int = 3) -> List[Dict[str, Any]]:
        """Get upcoming races"""
        # This would query the database
        return []  # Simplified for now

    async def _predictions_are_recent(self, race_id: str) -> bool:
        """Check if predictions are recent enough to not regenerate"""
        # Check timestamp of cached predictions
        return False  # Always regenerate for now

    async def _log_job_completion(self, job_id: str, status: str, **kwargs):
        """Log job completion to database and memory"""
        completion_record = {
            'job_id': job_id,
            'status': status,
            'completed_at': datetime.utcnow(),
            'duration_seconds': kwargs.get('duration_seconds', 0),
            'records_processed': kwargs.get('records_processed', 0),
            'error_message': kwargs.get('error', None),
            'performance_metrics': kwargs.get('performance_metrics', {}),
        }

        # Store in memory for now (would insert into database)
        self.job_history[job_id] = completion_record

        logger.info(f"Job {job_id} completed with status {status}")

    # Additional helper methods (simplified implementations)
    async def _update_recent_results(self): pass
    async def _refresh_upcoming_race_cache(self): pass
    async def _update_historical_stats(self): pass
    async def _update_live_timing(self): pass
    async def _update_current_weather(self): pass
    async def _invalidate_real_time_cache(self): pass
    async def _check_new_results_available(self) -> bool: return True
    async def _prepare_training_data(self) -> List[Dict[str, Any]]: return []
    async def _evaluate_model_improvement(self, metrics: Dict) -> Dict[str, Any]: return {}
    async def _deploy_new_model_version(self): pass
    async def _get_completed_races_last_month(self) -> List[Dict[str, Any]]: return []
    async def _store_evaluation_results(self, results: Dict): pass
    async def _archive_old_predictions(self): pass
    async def _update_driver_circuit_stats(self): pass
    async def _update_team_circuit_stats(self): pass
    async def _cleanup_old_etl_logs(self): pass
    async def _get_last_sync_time(self) -> Optional[datetime]: return None


class SchedulerManager:
    """Manager class for F1 scheduler lifecycle"""

    def __init__(self, db_session: AsyncSession):
        self.scheduler = F1Scheduler(db_session)
        self.running = False

    async def start(self):
        """Start the scheduler manager"""
        if not self.running:
            await self.scheduler.start()
            self.running = True
            logger.info("F1 Scheduler Manager started")

    async def stop(self):
        """Stop the scheduler manager"""
        if self.running:
            await self.scheduler.stop()
            self.running = False
            logger.info("F1 Scheduler Manager stopped")

    async def get_job_status(self) -> Dict[str, Any]:
        """Get current job status and history"""
        return {
            'running': self.running,
            'active_jobs': list(self.scheduler.active_jobs),
            'job_history': dict(list(self.scheduler.job_history.items())[-10:]),  # Last 10 jobs
            'next_jobs': self._get_next_scheduled_jobs()
        }

    def _get_next_scheduled_jobs(self) -> List[Dict[str, Any]]:
        """Get information about next scheduled jobs"""
        jobs = []
        for job in self.scheduler.scheduler.get_jobs():
            next_run = job.next_run_time
            if next_run:
                jobs.append({
                    'id': job.id,
                    'name': job.name,
                    'next_run': next_run.isoformat()
                })
        return sorted(jobs, key=lambda x: x['next_run'])[:5]  # Next 5 jobs


# Global scheduler instance
scheduler_manager: Optional[SchedulerManager] = None


def get_scheduler_manager(db_session: AsyncSession) -> SchedulerManager:
    """Get or create the global scheduler manager instance"""
    global scheduler_manager
    if scheduler_manager is None:
        scheduler_manager = SchedulerManager(db_session)
    return scheduler_manager