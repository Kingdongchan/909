# dependencies.py

from fastapi import Cookie, HTTPException, Request, status
from typing import Optional

async def require_login(
    request: Request,
    sb_access_token: Optional[str] = Cookie(None, alias="sb-access-token")
):
    """
    로그인 필수 Dependency
    """
    print(f"🔍 쿠키 확인: {sb_access_token}")
    
    if not sb_access_token:
        print("❌ 토큰 없음 → HTTPException 발생!")
        raise HTTPException(  # ← return이 아니라 raise!
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="로그인이 필요합니다"
        )
    
    print("✅ 토큰 있음 → 통과!")
    return {"token": sb_access_token}


async def optional_login(
    sb_access_token: Optional[str] = Cookie(None, alias="sb-access-token")
):
    """
    로그인 선택 Dependency (나중에 사용)
    """
    if not sb_access_token:
        return None
    
    return {"token": sb_access_token}