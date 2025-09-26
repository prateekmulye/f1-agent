"""
Database configuration and connection management
"""
import asyncio
from typing import Optional
import asyncpg
from databases import Database
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config.settings import settings

# Database instance
database = Database(settings.database_url)

# SQLAlchemy setup
engine = create_engine(settings.database_url.replace("postgresql://", "postgresql+psycopg2://"))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

# Metadata for reflection
metadata = MetaData()


class DatabaseManager:
    """Database connection manager"""

    def __init__(self):
        self.database = database
        self._connection_pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Connect to the database"""
        try:
            await self.database.connect()
            print("✅ Connected to database successfully")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            raise

    async def disconnect(self):
        """Disconnect from the database"""
        try:
            await self.database.disconnect()
            if self._connection_pool:
                await self._connection_pool.close()
            print("✅ Disconnected from database")
        except Exception as e:
            print(f"❌ Database disconnection failed: {e}")

    async def create_connection_pool(self):
        """Create an asyncpg connection pool for high-performance operations"""
        try:
            self._connection_pool = await asyncpg.create_pool(
                settings.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            print("✅ Database connection pool created")
        except Exception as e:
            print(f"❌ Connection pool creation failed: {e}")
            raise

    async def get_pool_connection(self):
        """Get a connection from the pool"""
        if not self._connection_pool:
            await self.create_connection_pool()
        return await self._connection_pool.acquire()

    async def release_pool_connection(self, connection):
        """Release a connection back to the pool"""
        if self._connection_pool:
            await self._connection_pool.release(connection)

    async def execute_query(self, query: str, values: dict = None):
        """Execute a raw SQL query"""
        try:
            if values:
                return await self.database.fetch_all(query, values)
            else:
                return await self.database.fetch_all(query)
        except Exception as e:
            print(f"❌ Query execution failed: {e}")
            raise

    async def execute_single(self, query: str, values: dict = None):
        """Execute a query and return a single result"""
        try:
            if values:
                return await self.database.fetch_one(query, values)
            else:
                return await self.database.fetch_one(query)
        except Exception as e:
            print(f"❌ Single query execution failed: {e}")
            raise

    async def health_check(self) -> bool:
        """Check if database is healthy"""
        try:
            result = await self.database.fetch_one("SELECT 1 as health")
            return result is not None
        except Exception:
            return False


# Global database manager instance
db_manager = DatabaseManager()


async def get_database():
    """Dependency to get database instance"""
    return db_manager.database


def get_session():
    """Get SQLAlchemy session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()