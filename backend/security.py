from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def get_current_user_role(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        role: str = payload.get("role")
        if role is None:
            raise credentials_exception
        return role
    except JWTError:
        raise credentials_exception

def require_admin(role: str = Depends(get_current_user_role)) -> bool:
    if role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return True

def require_staff_or_admin(role: str = Depends(get_current_user_role)) -> bool:
    if role not in ["staff", "admin"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return True
