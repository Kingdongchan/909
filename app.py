from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, BigInteger, Text, DateTime, Float, String, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# .env 로드 및 설정
load_dotenv()
DATABASE_URL = os.getenv("DB_URL")

# --- SQLAlchemy 설정 ---
engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 10})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# DB 세션 의존성 주입 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 모델 정의 (스키마) ---
class Profile(Base):
    __tablename__ = 'profiles'
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(Text, unique=True, nullable=False)
    nickname = Column(Text, unique=True, nullable=False)
    profile_img_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Feed(Base):
    __tablename__ = 'feeds'
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id'), nullable=False)
    title = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text)
    place_name = Column(Text)
    road_address_name = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    category_code = Column(String(10))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Like(Base):
    __tablename__ = 'likes'
    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.id'), nullable=False)
    feed_id = Column(BigInteger, ForeignKey('feeds.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (UniqueConstraint('user_id', 'feed_id', name='unique_user_feed_like'),)

# DB 테이블 생성
Base.metadata.create_all(bind=engine)

# --- FastAPI 앱 설정 ---
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 및 템플릿 설정
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")

# --- Pydantic 모델 (입력 데이터 양식) ---
class MessageRequest(BaseModel):
    message: str

# --- 라우트 (API) ---

# ✅ Supabase Auth: 로그인 페이지
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        "login.html", 
        {
            "request": request,
            "supabase_url": os.getenv('SUPABASE_URL'),      # ← 추가!
            "supabase_key": os.getenv('SUPABASE_ANON_KEY')  # ← 추가!
        }
    )

# ✅ Supabase Auth: 회원가입 페이지
@app.get("/signup", response_class=HTMLResponse)
async def signup(request: Request):
    return templates.TemplateResponse(
        "signup.html", 
        {
            "request": request,
            "supabase_url": os.getenv('SUPABASE_URL'),      # ← 추가!
            "supabase_key": os.getenv('SUPABASE_ANON_KEY')  # ← 추가!
        }
    )

@app.post("/db_create")
async def db_create(data: MessageRequest, db: Session = Depends(get_db)):
    return {"result": "success", "message": f"'{data.message}' 잘 받았어요!"}

@app.get("/db_read")
async def db_read(db: Session = Depends(get_db)):
    feeds = db.query(Feed).all()
    return feeds

@app.get("/map", response_class=HTMLResponse)
async def map_page(request: Request):
    return templates.TemplateResponse("map.html", {"request": request})

@app.get("/community/{place_name}", response_class=HTMLResponse)
async def community_page(request: Request, place_name: str):
    return templates.TemplateResponse("community.html", {"request": request, "place_name": place_name})

@app.get("/api/hello")
async def api_hello():
    return {"message": "Success!"}

@app.get("/api/fail")
async def api_fail():
    raise HTTPException(status_code=404, detail="요청하신 페이지를 찾을 수 없습니다!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5909)