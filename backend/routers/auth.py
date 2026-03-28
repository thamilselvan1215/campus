"""
routers/auth.py — Lightweight mock auth for hackathon demo.
Accepts role + name, returns a mock token stored in frontend localStorage.
No real JWT verification needed — this is a UI guard for demo purposes.
"""
import secrets
from fastapi import APIRouter
from schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    """
    Demo login endpoint. Returns a mock token and role.
    No password required — role picker only.
    """
    allowed_roles = {"student", "staff", "admin"}
    role = body.role.lower()
    if role not in allowed_roles:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {allowed_roles}")

    mock_token = secrets.token_hex(16)
    return LoginResponse(token=mock_token, role=role, name=body.name)


@router.post("/logout")
def logout():
    """
    Dummy logout endpoint (actual logout is handled client-side via localStorage).
    """
    return {"message": "Logged out successfully."}
