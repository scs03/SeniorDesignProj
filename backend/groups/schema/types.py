import strawberry
from datetime import datetime
from typing import List, Optional
from accounts.schema.types import UserType  # Assuming this exists

@strawberry.type
class AssignmentType:
    id: strawberry.ID
    name: str
    prompt: Optional[str]
    due_date: datetime
    created_at: datetime

@strawberry.type
class ClassType:
    id: strawberry.ID
    name: str
    created_at: datetime
    teacher: UserType
    assignments: List[AssignmentType]
    student_count: int 
