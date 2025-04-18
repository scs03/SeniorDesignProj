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

    @strawberry.mutation
    def add_students_to_class(
        self,
        info: Info,
        class_id: int,
        student_ids: list[int]
    ) -> str:
        user: CustomUser = info.context.request.user

        if not user.is_authenticated or user.role != 'teacher':
            raise Exception("Only teachers can add students to classes.")

        try:
            class_obj = Class.objects.get(id=class_id, teacher=user)
        except Class.DoesNotExist:
            raise Exception("Class not found or not owned by you.")

        students = CustomUser.objects.filter(user_id__in=student_ids, role='student')
        if not students.exists():
            raise Exception("No valid student IDs found.")

        class_obj.students.add(*students)

        return f"Added {students.count()} student(s) to class '{class_obj.name}'"


    @strawberry.mutation
    def submit_assignment(
        self,
        info: Info,
        assignment_id: int,
        submission_file: str  # or Upload if you're doing files
    ) -> str:
        user: CustomUser = info.context.request.user

        if not user.is_authenticated or user.role != 'student':
            raise Exception("Only authenticated students can submit assignments.")

        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            raise Exception("Assignment not found.")

        # Prevent duplicate submissions (optional)
        existing = Submission.objects.filter(assignment=assignment, student=user).first()
        if existing:
            raise Exception("You have already submitted this assignment.")

        Submission.objects.create(
            assignment=assignment,
            student=user,
            submission_file=submission_file
        )

        return f"Assignment '{assignment.name}' submitted successfully."

    @strawberry.field
    def my_classes(self, info: Info) -> list["ClassType"]:
        user: CustomUser = info.context.request.user

        if not user.is_authenticated or user.role != 'student':
            raise Exception("Only authenticated students can view their enrolled classes.")

        return list(user.enrolled_classes.all())
    
    @strawberry.field
    def my_created_classes(self, info: Info) -> list["ClassType"]:
        user: CustomUser = info.context.request.user

        if not user.is_authenticated or user.role != 'teacher':
            raise Exception("Only teachers can view their created classes.")

        return list(user.classes.all())  # from related_name='classes' on teacher FK

    # @strawberry.field
    # def my_assignments(self, info: Info) -> list["AssignmentType"]:
    #     user: CustomUser = info.context.request.user

    #     if not user.is_authenticated or user.role != 'student':
    #         raise Exception("Only authenticated students can view their assignments.")

    #     assignments = Assignment.objects.filter(
    #         class_assigned__in=user.enrolled_classes.all()
    #     ).order_by("due_date")

    #     return list(assignments)

