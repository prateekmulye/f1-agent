"""
Race Status Management Service
Handles automatic updating of race completion status and calendar state
"""
import asyncio
from datetime import datetime, date
from typing import List, Dict, Optional
from config.database import db_manager
from config.settings import settings


class RaceStatusService:
    """Service for managing race status and calendar state"""

    def __init__(self):
        self.db = db_manager

    async def update_race_statuses(self) -> Dict[str, int]:
        """
        Update race completion status based on current date
        Returns: Dictionary with counts of updated races
        """
        current_date = date.today()

        try:
            # Update races that have passed but aren't marked as completed
            update_completed_query = """
                UPDATE races
                SET
                    race_completed = TRUE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE race_date < :current_date
                    AND race_completed = FALSE
                RETURNING id, name, race_date
            """

            completed_races = await self.db.execute_query(
                update_completed_query,
                {"current_date": current_date}
            )

            # Update races that are in the future but marked as completed (data correction)
            update_upcoming_query = """
                UPDATE races
                SET
                    race_completed = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE race_date >= :current_date
                    AND race_completed = TRUE
                RETURNING id, name, race_date
            """

            upcoming_races = await self.db.execute_query(
                update_upcoming_query,
                {"current_date": current_date}
            )

            result = {
                "completed_updated": len(completed_races),
                "upcoming_updated": len(upcoming_races),
                "total_updated": len(completed_races) + len(upcoming_races)
            }

            if result["total_updated"] > 0:
                print(f"🏁 Race status update: {result['completed_updated']} marked completed, {result['upcoming_updated']} marked upcoming")

            return result

        except Exception as e:
            print(f"❌ Error updating race statuses: {e}")
            raise

    async def get_race_calendar_stats(self, season: int = 2025) -> Dict[str, any]:
        """
        Get comprehensive race calendar statistics
        """
        current_date = date.today()

        try:
            stats_query = """
                SELECT
                    COUNT(*) as total_races,
                    COUNT(CASE WHEN race_date > :current_date THEN 1 END) as upcoming_races,
                    COUNT(CASE WHEN race_date <= :current_date THEN 1 END) as completed_races,
                    COUNT(CASE WHEN race_completed = TRUE THEN 1 END) as verified_completed,
                    MIN(CASE WHEN race_date > :current_date THEN race_date END) as next_race_date,
                    MIN(CASE WHEN race_date > :current_date THEN id END) as next_race_id,
                    MIN(CASE WHEN race_date > :current_date THEN name END) as next_race_name
                FROM races
                WHERE season = :season
            """

            stats = await self.db.execute_single(
                stats_query,
                {"current_date": current_date, "season": season}
            )

            # Calculate days to next race
            days_to_next_race = 0
            if stats and stats["next_race_date"]:
                next_race_date = stats["next_race_date"]
                if isinstance(next_race_date, str):
                    next_race_date = datetime.strptime(next_race_date, "%Y-%m-%d").date()
                days_to_next_race = (next_race_date - current_date).days

            return {
                "season": season,
                "total_races": stats["total_races"] if stats else 0,
                "upcoming_races": stats["upcoming_races"] if stats else 0,
                "completed_races": stats["completed_races"] if stats else 0,
                "verified_completed": stats["verified_completed"] if stats else 0,
                "next_race": {
                    "id": stats["next_race_id"] if stats else None,
                    "name": stats["next_race_name"] if stats else None,
                    "date": stats["next_race_date"] if stats else None,
                    "days_away": days_to_next_race
                },
                "last_updated": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"❌ Error getting calendar stats: {e}")
            raise

    async def get_race_status(self, race_id: str) -> Optional[Dict[str, any]]:
        """
        Get detailed status for a specific race
        """
        current_date = date.today()

        try:
            query = """
                SELECT
                    r.id,
                    r.name,
                    r.season,
                    r.round,
                    r.race_date,
                    r.race_time,
                    r.race_completed,
                    r.weather_conditions,
                    c.name as circuit_name,
                    c.country,
                    CASE
                        WHEN r.race_date > :current_date THEN 'upcoming'
                        WHEN r.race_date = :current_date THEN 'today'
                        WHEN r.race_date < :current_date AND r.race_completed = TRUE THEN 'completed'
                        WHEN r.race_date < :current_date AND r.race_completed = FALSE THEN 'past_pending'
                        ELSE 'unknown'
                    END as status,
                    ABS(EXTRACT(days FROM (r.race_date - :current_date))) as days_difference
                FROM races r
                LEFT JOIN circuits c ON r.circuit_id = c.id
                WHERE r.id = :race_id
            """

            race = await self.db.execute_single(
                query,
                {"race_id": race_id, "current_date": current_date}
            )

            if not race:
                return None

            return dict(race)

        except Exception as e:
            print(f"❌ Error getting race status for {race_id}: {e}")
            raise

    async def sync_race_data_with_json(self) -> Dict[str, any]:
        """
        Sync database race data with JSON files (for the current system)
        This ensures consistency between the database and the JSON fallback
        """
        import json
        import os

        try:
            # Path to race data
            data_dir = os.path.join(os.path.dirname(__file__), "../../../../../data")
            races_json_path = os.path.join(data_dir, "races.json")

            if not os.path.exists(races_json_path):
                print("⚠️ races.json not found, skipping sync")
                return {"synced": False, "reason": "races.json not found"}

            # Load JSON data
            with open(races_json_path, 'r') as f:
                json_races = json.load(f)

            updated_count = 0
            current_date = date.today()

            # Update each race's completion status
            for race in json_races:
                if "date" in race and "id" in race:
                    race_date = datetime.strptime(race["date"], "%Y-%m-%d").date()
                    is_completed = race_date < current_date

                    # Update database
                    update_query = """
                        UPDATE races
                        SET
                            race_completed = :is_completed,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = :race_id AND race_completed != :is_completed
                    """

                    result = await self.db.execute_query(
                        update_query,
                        {"race_id": race["id"], "is_completed": is_completed}
                    )

                    if result:
                        updated_count += 1

            return {
                "synced": True,
                "races_processed": len(json_races),
                "races_updated": updated_count,
                "sync_date": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"❌ Error syncing race data: {e}")
            return {"synced": False, "error": str(e)}

    async def get_races_by_status(self, status: str, season: int = 2025, limit: int = 10) -> List[Dict]:
        """
        Get races filtered by status (upcoming, completed, today)
        """
        current_date = date.today()

        status_conditions = {
            "upcoming": "r.race_date > :current_date",
            "completed": "r.race_date < :current_date",
            "today": "r.race_date = :current_date",
            "all": "1=1"
        }

        if status not in status_conditions:
            raise ValueError(f"Invalid status: {status}. Must be one of {list(status_conditions.keys())}")

        try:
            query = f"""
                SELECT
                    r.id,
                    r.name,
                    r.season,
                    r.round,
                    r.race_date,
                    r.race_time,
                    r.race_completed,
                    c.name as circuit_name,
                    c.country,
                    CASE
                        WHEN r.race_date > :current_date THEN 'upcoming'
                        WHEN r.race_date = :current_date THEN 'today'
                        ELSE 'completed'
                    END as computed_status,
                    ABS(EXTRACT(days FROM (r.race_date - :current_date))) as days_difference
                FROM races r
                LEFT JOIN circuits c ON r.circuit_id = c.id
                WHERE r.season = :season AND {status_conditions[status]}
                ORDER BY
                    CASE WHEN :status = 'upcoming' THEN r.race_date END ASC,
                    CASE WHEN :status = 'completed' THEN r.race_date END DESC,
                    r.round ASC
                LIMIT :limit
            """

            races = await self.db.execute_query(
                query,
                {
                    "current_date": current_date,
                    "season": season,
                    "status": status,
                    "limit": limit
                }
            )

            return [dict(race) for race in races] if races else []

        except Exception as e:
            print(f"❌ Error getting races by status {status}: {e}")
            raise


# Global service instance
race_status_service = RaceStatusService()


async def update_all_race_statuses():
    """Convenience function to update all race statuses"""
    return await race_status_service.update_race_statuses()


async def get_calendar_stats(season: int = 2025):
    """Convenience function to get calendar statistics"""
    return await race_status_service.get_race_calendar_stats(season)