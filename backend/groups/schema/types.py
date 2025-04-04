# groups/schema/types.py
import strawberry
from datetime import datetime
from accounts.schema.types import UserType  # assuming you have this

@strawberry.type
class ClassType:
    id: strawberry.ID
    name: str
    created_at: datetime
    teacher: UserType
