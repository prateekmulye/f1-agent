"""
Authentication Controller - API endpoints for user authentication
"""
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from app.services.auth_service import AuthService
from app.models.f1_models import User
from config.database import get_database
from app.middleware.rate_limiting import apply_rate_limit

auth_router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
security = HTTPBearer()


# Request/Response models
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    is_admin: bool
    api_calls_count: int
    created_at: str

    class Config:
        from_attributes = True


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


async def get_auth_service(db: AsyncSession = Depends(get_database)) -> AuthService:
    """Get authentication service instance"""
    return AuthService(db)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """Get current authenticated user"""
    token_data = auth_service.verify_token(credentials.credentials)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await auth_service.get_user_by_username(token_data.username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


@auth_router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account"
)
@apply_rate_limit("auth")
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user"""
    try:
        # Check if username already exists
        existing_user = await auth_service.get_user_by_username(user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )

        # Check if email already exists
        existing_email = await auth_service.get_user_by_email(user_data.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create user
        user = await auth_service.create_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password
        )

        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            is_admin=user.is_admin,
            api_calls_count=user.api_calls_count,
            created_at=user.created_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )


@auth_router.post(
    "/login",
    response_model=Token,
    summary="User login",
    description="Authenticate user and return access token"
)
@apply_rate_limit("auth")
async def login(
    user_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Authenticate user and return access token"""
    try:
        user = await auth_service.authenticate_user(user_data.username, user_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token_expires = timedelta(minutes=auth_service.access_token_expire_minutes)
        access_token = auth_service.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )

        # Update last login
        await auth_service.update_user_login(user)

        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=auth_service.access_token_expire_minutes * 60
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error during authentication: {str(e)}"
        )


@auth_router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get current authenticated user information"
)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        is_admin=current_user.is_admin,
        api_calls_count=current_user.api_calls_count,
        created_at=current_user.created_at.isoformat()
    )


@auth_router.post(
    "/password-reset",
    summary="Request password reset",
    description="Request a password reset token"
)
@apply_rate_limit("auth")
async def request_password_reset(
    reset_data: PasswordReset,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Request password reset"""
    try:
        reset_token = await auth_service.reset_password(reset_data.email)
        if not reset_token:
            # Don't reveal if email exists or not for security
            return {"message": "If the email exists, a reset token has been sent"}

        # In production, send this token via email
        # For now, return it directly (NOT recommended for production)
        return {
            "message": "Password reset token generated",
            "reset_token": reset_token  # Remove this in production
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing password reset: {str(e)}"
        )


@auth_router.post(
    "/password-reset/confirm",
    summary="Confirm password reset",
    description="Confirm password reset with token"
)
@apply_rate_limit("auth")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Confirm password reset with token"""
    try:
        success = await auth_service.confirm_password_reset(
            reset_data.token, reset_data.new_password
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )

        return {"message": "Password reset successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error confirming password reset: {str(e)}"
        )


@auth_router.post(
    "/password-change",
    summary="Change password",
    description="Change current user's password"
)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Change current user's password"""
    try:
        success = await auth_service.change_password(
            current_user.username,
            password_data.old_password,
            password_data.new_password
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )

        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error changing password: {str(e)}"
        )


@auth_router.get(
    "/api-key",
    summary="Get API key",
    description="Generate or retrieve API key for current user"
)
async def get_api_key(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Generate API key for current user"""
    try:
        api_key = auth_service.generate_api_key(current_user.id)
        return {
            "api_key": api_key,
            "usage": f"Include 'X-API-Key: {api_key}' in request headers"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating API key: {str(e)}"
        )


@auth_router.get(
    "/permissions",
    summary="Get user permissions",
    description="Get current user's permissions"
)
async def get_permissions(
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    """Get user permissions"""
    try:
        permissions = await auth_service.get_user_permissions(current_user)
        return {
            "user_id": current_user.id,
            "username": current_user.username,
            "permissions": permissions
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving permissions: {str(e)}"
        )