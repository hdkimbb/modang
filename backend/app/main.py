from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import meeting_events, meetings, owner, places, ratings

settings = get_settings()

app = FastAPI(
    title="Modang API",
    description="모여라 당근으로 — neighborhood awards API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(places.router)
app.include_router(meetings.router)
app.include_router(meeting_events.router)
app.include_router(owner.router)
app.include_router(ratings.router)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello Modang"}
