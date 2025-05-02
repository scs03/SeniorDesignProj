import strawberry
from datetime import datetime
from typing import List, Optional

from groups.models import Assignment, Class
from accounts.schema.types import UserType  # ✅ Import the single source of truth

# ✅ 1. Assignment type
@strawberry.django.type(Assignment)
class AssignmentType:
    id: strawberry.ID
    name: str
    prompt: Optional[str]
    due_date: datetime
    created_at: datetime

# ✅ 2. Class type, includes teacher and assignments
@strawberry.django.type(Class)
class ClassType:
    id: strawberry.ID
    name: str
    created_at: datetime
    teacher: UserType
    assignments: List[AssignmentType]
    student_count: int  # Calculated separately if needed

# ✅ 3. Submission metadata for detailed feedback/grade views
@strawberry.type
class SubmissionMeta:
    submission_id: int
    student_id: int
    student_name: str
    assignment_id: int
    assignment_name: str
    class_id: int
    class_name: str
    submission_date: str
    ai_grade: Optional[float]
    human_grade: Optional[float]
    feedback: Optional[str]
    graded_by_ai: bool
