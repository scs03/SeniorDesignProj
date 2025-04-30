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


@strawberry.type
class SubmissionMeta:
    submission_id: int
    student_id: int
    student_name: str
    assignment_id: int
    assignment_name: str  # ✅ ADD THIS
    class_id: int
    class_name: str       # ✅ AND THIS
    submission_date: str
    ai_grade: Optional[float]
    human_grade: Optional[float]
    feedback: Optional[str]
    graded_by_ai: bool