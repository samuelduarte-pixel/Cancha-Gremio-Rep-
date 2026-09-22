from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

EVENT_TYPES_RE = "^(MAINTENANCE|TOURNAMENT|LEAGUE|SPECIAL|PRIVATE_EVENT)$"


class EventBase(BaseModel):
    field_id: int = Field(gt=0)
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = Field(default="", max_length=1000)
    start_time: datetime
    end_time: datetime
    event_type: str = Field(default="MAINTENANCE", pattern=EVENT_TYPES_RE)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    field_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=2, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    start_time: datetime | None = None
    end_time: datetime | None = None
    event_type: str | None = Field(default=None, pattern=EVENT_TYPES_RE)


class EventResponse(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True