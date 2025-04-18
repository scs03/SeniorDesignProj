import strawberry
from typing import Optional
from datetime import datetime, timedelta
from strawberry.file_uploads import Upload
from groups.models import Assignment, Class
from accounts.models import CustomUser
from strawberry.types import Info
from groups.schema.types import ClassType
from django.utils.timezone import now


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_assignment(
        self,
        info,
        class_id: int,
        name: str,
        rubric_image: Optional[Upload] = None,  
        due_date: Optional[datetime] = None,
        prompt: Optional[str] = None,
    ) -> str:
        request = info.context.request
        user: CustomUser = request.user

        if not user.is_authenticated or user.role != "teacher":
            raise Exception("Only teachers can create assignments.")

        try:
            class_obj = Class.objects.get(id=class_id, teacher=user)
        except Class.DoesNotExist:
            raise Exception("This class does not exist or you are not the assigned teacher.")

        # Set default due_date to next-day midnight if not provided
        if due_date is None:
            now_dt = now()
            next_day = now_dt + timedelta(days=1)
            due_date = next_day.replace(hour=0, minute=0, second=0, microsecond=0)

        if due_date < now():
            raise Exception("Due date must be in the future.")

        assignment = Assignment.objects.create(
            class_assigned=class_obj,
            name=name,
            due_date=due_date,
            rubric_image=rubric_image,
            prompt=prompt
        )

        return f"Assignment '{assignment.name}' created successfully."


    @strawberry.mutation
    def create_class(self, info: Info, name: str) -> ClassType:
        user = info.context.request.user

        if not user.is_authenticated or user.role != 'teacher':
            raise Exception("Only authenticated teachers can create classes.")

        new_class = Class.objects.create(
            name=name,
            teacher=user
        )
        return new_class
