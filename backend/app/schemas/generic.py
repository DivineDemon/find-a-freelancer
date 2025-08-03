from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")

class ResponseModel(BaseModel, Generic[T]):
    status: int = 200
    data: T | None = None
    message: str = "Success"


class UserJWT(BaseModel):
  sub: str
  user_id: int

  model_config = ConfigDict(from_attributes=True, extra="forbid")
