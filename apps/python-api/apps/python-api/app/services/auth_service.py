"""
Authentication Service - JWT token management and user authentication
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.f1_models import User
from app.schemas.f1_schemas import BaseF1Schema
from config.settings import settings
from pydantic import BaseModel


class TokenData(BaseModel):
    username: Optional[str] = None


class AuthService:
    """Service for user authentication and JWT token management"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.secret_key
        self.algorithm = settings.algorithm
        self.access_token_expire_minutes = settings.access_token_expire_minutes

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash a password"""
        return self.pwd_context.hash(password)

    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[TokenData]:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username: str = payload.get("sub")
            if username is None:
                return None
            token_data = TokenData(username=username)
            return token_data
        except JWTError:
            return None

    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate a user with username and password"""
        user = await self.get_user_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """Get a user by username"""
        query = select(User).where(User.username == username)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email"""
        query = select(User).where(User.email == email)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_user(self, username: str, email: str, password: str) -> User:
        """Create a new user"""
        hashed_password = self.get_password_hash(password)

        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=False,
            api_calls_count=0
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_user_login(self, user: User) -> None:
        """Update user's last login timestamp"""
        user.last_login = datetime.utcnow()
        await self.db.commit()

    async def increment_api_calls(self, user: User) -> None:
        """Increment user's API call count"""
        user.api_calls_count += 1
        await self.db.commit()

    async def deactivate_user(self, username: str) -> bool:
        """Deactivate a user account"""
        user = await self.get_user_by_username(username)
        if not user:
            return False

        user.is_active = False
        user.updated_at = datetime.utcnow()
        await self.db.commit()
        return True

    async def activate_user(self, username: str) -> bool:
        """Activate a user account"""
        user = await self.get_user_by_username(username)
        if not user:
            return False

        user.is_active = True
        user.updated_at = datetime.utcnow()
        await self.db.commit()
        return True

    async def change_password(self, username: str, old_password: str, new_password: str) -> bool:
        """Change a user's password"""
        user = await self.authenticate_user(username, old_password)
        if not user:
            return False

        user.hashed_password = self.get_password_hash(new_password)
        user.updated_at = datetime.utcnow()
        await self.db.commit()
        return True

    async def reset_password(self, email: str) -> Optional[str]:
        """Generate a password reset token"""
        user = await self.get_user_by_email(email)
        if not user:
            return None

        # Generate reset token (valid for 1 hour)
        reset_token = self.create_access_token(
            data={"sub": user.username, "type": "password_reset"},
            expires_delta=timedelta(hours=1)
        )

        return reset_token

    async def confirm_password_reset(self, token: str, new_password: str) -> bool:
        """Confirm password reset with token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username: str = payload.get("sub")
            token_type: str = payload.get("type")

            if username is None or token_type != "password_reset":
                return False

            user = await self.get_user_by_username(username)
            if not user:
                return False

            user.hashed_password = self.get_password_hash(new_password)
            user.updated_at = datetime.utcnow()
            await self.db.commit()
            return True

        except JWTError:
            return False

    def generate_api_key(self, user_id: int) -> str:
        """Generate an API key for a user"""
        # Create a deterministic but secure API key
        key_data = f"{user_id}:{self.secret_key}:{datetime.utcnow().date()}"
        api_key = hashlib.sha256(key_data.encode()).hexdigest()
        return f"f1api_{api_key[:32]}"

    async def validate_api_key(self, api_key: str) -> Optional[User]:
        """Validate an API key and return the associated user"""
        if not api_key.startswith("f1api_"):
            return None

        # Extract key part
        key_part = api_key[6:]  # Remove "f1api_" prefix

        # This is a simplified validation - in production, you'd store API keys in DB
        # For now, we'll validate against user IDs
        query = select(User).where(User.is_active == True)
        result = await self.db.execute(query)
        users = result.scalars().all()

        for user in users:
            expected_key = self.generate_api_key(user.id)
            if api_key == expected_key:
                return user

        return None

    async def get_user_permissions(self, user: User) -> Dict[str, bool]:
        """Get user permissions"""
        permissions = {
            "read_data": user.is_active,
            "write_data": user.is_active and user.is_admin,
            "manage_users": user.is_admin,
            "access_admin_endpoints": user.is_admin
        }

        return permissions