import strawberry
from typing import List
from strawberry.types import Info

from groups.models import Class as ClassModel
from groups.schema.types import ClassType, AssignmentType
from accounts.schema.types import UserType


@strawberry.type
class Query:

    @strawberry.field
    def teacher_classes(self, info: Info, teacher_id: int) -> List[ClassType]:
        classes = ClassModel.objects.filter(teacher__user_id=teacher_id).prefetch_related("assignments", "teacher", "students")

        return [
            ClassType(
                id=c.id,
                name=c.name,
                created_at=c.created_at,
                teacher=UserType(
                    user_id=c.teacher.user_id,
                    name=c.teacher.name,
                    email=c.teacher.email,
                    role=c.teacher.role,
                    created_at=c.teacher.created_at,
                ),
                assignments=[
                    AssignmentType(
                        id=a.id,
                        name=a.name,
                        prompt=a.prompt,
                        due_date=a.due_date,
                        created_at=a.created_at,
                    )
                    for a in c.assignments.all()
                ],
                student_count=c.students.count(),  # 🔥 Count students here
            )
            for c in classes
        ]
