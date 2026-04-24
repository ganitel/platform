"""
Ganitel V2 Backend - OAuth Client for Google and Facebook
"""

import httpx

from app.config import get_settings

settings = get_settings()


class GoogleOAuthClient:
    """Google OAuth client"""

    @staticmethod
    async def get_authorization_url() -> str:
        """Generate Google OAuth authorization URL"""
        from urllib.parse import urlencode

        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent"
        }

        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    @staticmethod
    async def get_access_token(code: str) -> dict:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Get user information from Google"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()


class FacebookOAuthClient:
    """Facebook OAuth client"""

    @staticmethod
    async def get_authorization_url() -> str:
        """Generate Facebook OAuth authorization URL"""
        from urllib.parse import urlencode

        params = {
            "client_id": settings.FACEBOOK_APP_ID,
            "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
            "response_type": "code",
            "scope": "email,public_profile"
        }

        return f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode(params)}"

    @staticmethod
    async def get_access_token(code: str) -> dict:
        """Exchange authorization code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": settings.FACEBOOK_APP_ID,
                    "client_secret": settings.FACEBOOK_APP_SECRET,
                    "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                    "code": code
                }
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    async def get_user_info(access_token: str) -> dict:
        """Get user information from Facebook"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.facebook.com/v18.0/me",
                params={
                    "fields": "id,name,email,picture",
                    "access_token": access_token
                }
            )
            response.raise_for_status()
            data = response.json()

            # Format picture URL
            if "picture" in data and "data" in data["picture"]:
                data["picture_url"] = data["picture"]["data"]["url"]

            return data

