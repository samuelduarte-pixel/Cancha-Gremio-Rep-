from datetime import time
from pydantic import BaseModel, ConfigDict


class TarifaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    day_type: str
    start_time: time
    end_time: time
    price_min: float
    price_max: float
    price: float
    notes: str | None = None
    is_active: bool | None = None


class TarifaCalculada(BaseModel):
    tier: TarifaResponse | None
    tier_name: str | None
    price_per_hour: float
    hours: float
    total_price: float