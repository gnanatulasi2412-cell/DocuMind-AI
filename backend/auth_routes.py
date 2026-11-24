
import re
import sqlite3

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

from .database import get_connection
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

security = HTTPBearer(auto_error=False)


class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Please log in to continue."
        )

    user_id = decode_access_token(credentials.credentials)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired login token."
        )

    connection = get_connection()

    try:
        user = connection.execute(
            "SELECT id, name, email FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()

        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User account not found."
            )

        return dict(user)

    finally:
        connection.close()


@router.post("/signup", status_code=201)
def signup(request: SignupRequest):

    name = request.name.strip()
    email = request.email.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty."
        )

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address."
        )

    hashed_password = hash_password(request.password)

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
            """,
            (name, email, hashed_password)
        )

        connection.commit()
        user_id = cursor.lastrowid

        token = create_access_token(user_id)

        return {
            "message": "Account created successfully!",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "name": name,
                "email": email
            }
        }

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists."
        )

    finally:
        connection.close()


@router.post("/login")
def login(request: LoginRequest):

    email = request.email.strip().lower()

    connection = get_connection()

    try:
        user = connection.execute(
            """
            SELECT id, name, email, password_hash
            FROM users
            WHERE email = ?
            """,
            (email,)
        ).fetchone()

        if (
            user is None
            or not user["password_hash"]
            or not verify_password(
                request.password,
                user["password_hash"]
            )
        ):
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password."
            )

        token = create_access_token(user["id"])

        return {
            "message": "Login successful!",
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"]
            }
        }

    finally:
        connection.close()


@router.get("/me")
def get_my_account(user: dict = Depends(get_current_user)):
    return {
        "user": user
    }
