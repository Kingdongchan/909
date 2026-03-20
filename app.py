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
from pydantic import BaseModel # 데이터 검증용
from typing import Optional

# .env 로드 및 설정
load_dotenv()
DATABASE_URL = os.getenv("DB_URL")

# --- [DB 설정] SQLAlchemy 연결 설정 ---
engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 10})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# [의존성 주입] DB 세션 생성 및 종료 관리 함수
# API 요청 시 세션을 열고, 응답 후 자동으로 닫습니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- [모델 정의] DB 테이블 스키마 ---
class Profile(Base):
    __tablename__ = 'profiles'
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(Text, unique=True, nullable=False)
    nickname = Column(Text, unique=True, nullable=False)
    profile_img_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# 게시글(Feed) 테이블 정의
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

# --- [FastAPI 앱 설정] ---
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

# --- [Pydantic 모델] 요청 데이터 검증 스키마 ---
class MessageRequest(BaseModel):
    message: str


# 게시글 작성 요청 데이터 (POST)
class UserInput(BaseModel):
    title: str 
    content: str
    user_id: str # 작성자 ID (클라이언트에서 전달받음)
    image_url: Optional[str] = None # 이미지 URL (없을 수도 있음)

# 게시글 수정 요청 데이터 (PATCH)
class FeedUpdate(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None

# --- 라우트 (API) ---

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # Flask의 render_template과 비슷하지만 request를 같이 넘겨야 함
    return templates.TemplateResponse("login.html", {"request": request})

# 테스트용 DB 생성 API
@app.post("/db_create")
async def db_create(data: MessageRequest, db: Session = Depends(get_db)):
    # request body 데이터를 Pydantic 모델(data)로 받아 처리
    # Human 모델이 정의되어 있지 않아 예시 코드로 대체 (Feed 등으로 활용 가능)
    # new_data = Feed(content=data.message, ...) 
    # db.add(new_data)
    # db.commit()
    return {"result": "success", "message": f"'{data.message}' 잘 받았어요!"}

@app.get("/db_read")
async def db_read(db: Session = Depends(get_db)):
    # 전체 조회 예시 (Human 모델 대신 Feed 예시)
    feeds = db.query(Feed).all()
    return feeds

@app.get("/map", response_class=HTMLResponse)
async def map_page(request: Request):
    return templates.TemplateResponse("map.html", {"request": request})


# [커뮤니티 페이지] 특정 장소의 커뮤니티 화면 렌더링
@app.get("/community/{place_name}", response_class=HTMLResponse)
async def community_page(request: Request, place_name: str):
    return templates.TemplateResponse("community.html", {"request": request, "place_name": place_name})


# [API] 게시글 작성 (Create)
@app.post("/user_input")
async def user_input(data: UserInput, db: Session = Depends(get_db)):
    print(f"제목: {data.title}, 내용: {data.content}, 이미지: {data.image_url}")
    
    new_feed = Feed(          # Feed 모델에 값 담기
        title=data.title,
        content=data.content,
        user_id=data.user_id,
        image_url=data.image_url
    )
    
    db.add(new_feed)     # DB에 올리기
    db.commit()          # 저장 확정
    db.refresh(new_feed) # 자동값 반영
    
    return {
        "id": new_feed.id,
        "user_id": str(new_feed.user_id),
        "title": new_feed.title,
        "content": new_feed.content,
        "image_url": new_feed.image_url
    }

# [API] 게시글 수정 (Update)
@app.patch("/feed/{feed_id}")
async def update_feed(feed_id: int, data: FeedUpdate, db: Session = Depends(get_db)):
    feed = db.query(Feed).filter(Feed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    
    feed.title = data.title
    feed.content = data.content
    feed.image_url = data.image_url
    
    db.commit()
    db.refresh(feed)
    
    return {
        "id": feed.id,
        "user_id": str(feed.user_id),
        "title": feed.title,
        "content": feed.content,
        "image_url": feed.image_url
    }

# [API] 게시글 목록 조회 (Read)
@app.get("/get_data")
async def get_data(db: Session = Depends(get_db)):
    feeds = db.query(Feed).all()
    return feeds



if __name__ == "__main__":
    import uvicorn
    # Flask의 app.run 대신 uvicorn 사용
    uvicorn.run(app, host="0.0.0.0", port=5909)