import strawberry
from typing import Optional
from datetime import datetime, timedelta
from strawberry.file_uploads import Upload
from strawberry.types import Info
from django.utils.timezone import now, is_naive, make_aware
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.contrib.auth import authenticate, login as django_login

from groups.models import Assignment, Class, Submission
from accounts.models import CustomUser
from groups.schema.types import ClassType
from accounts.schema.types import UserType  # ✅ Make sure this includes profile_picture


@strawberry.type
class Mutation:
    @strawberry.mutation
    def login(self, info: Info, email: str, password: str) -> UserType:
        request = info.context.request
        user = authenticate(request=request, email=email, password=password)

        if not user:
            raise Exception("Invalid email or password")

        django_login(request, user)
        return user  # ✅ Returned as UserType with profile_picture

    @strawberry.mutation
    def create_assignment(
        self,
        info: Info,
        class_id: int,
        name: str,
        due_date: Optional[datetime] = None,
        prompt: Optional[str] = None,
        rubric_image: Optional[Upload] = None,
    ) -> str:
        request = info.context.request
        user = request.user

        if not user.is_authenticated or user.role != "teacher":
            raise Exception("Only teachers can create assignments.")

        try:
            class_obj = Class.objects.get(id=class_id, teacher=user)
        except Class.DoesNotExist:
            raise Exception("This class does not exist or you are not the assigned teacher.")

        now_dt = now()

        if due_date is None:
            due_date = now_dt + timedelta(days=1)
            due_date = due_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif is_naive(due_date):
            due_date = make_aware(due_date)

        if due_date < now_dt:
            raise Exception("Due date must be in the future.")

        Assignment.objects.create(
            class_assigned=class_obj,
            name=name,
            due_date=due_date,
            prompt=prompt,
            rubric_image=rubric_image,
        )

        return f"Assignment '{name}' created successfully."

    @strawberry.mutation
    def create_class(self, info: Info, name: str) -> ClassType:
        user = info.context.request.user

        if not user.is_authenticated or user.role != 'teacher':
            raise Exception("Only authenticated teachers can create classes.")

        new_class = Class.objects.create(name=name, teacher=user)
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
    def submit_assignment(self, info: Info, assignment_id: int, submission_file: Upload) -> str:
        request = info.context.request
        user: CustomUser = request.user

        if not user.is_authenticated or user.role != "student":
            raise Exception("Only students can submit assignments.")

        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            raise Exception("Assignment not found.")

        # Build file name and path
        file_name = f"{user.user_id}_{assignment.id}_{submission_file.name}"
        relative_path = os.path.join("submissions", file_name)
        full_path = default_storage.save(relative_path, ContentFile(submission_file.read()))

        Submission.objects.create(
            assignment=assignment,
            student=user,
            submission_file=relative_path,
        )

        return f"Submission uploaded successfully to {relative_path}"

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

        return list(user.classes.all())

    @strawberry.mutation
    def update_submission(
        self,
        info: Info,
        submission_id: int,
        human_grade: Optional[float] = None,
        feedback: Optional[str] = None
    ) -> str:
        user = info.context.request.user
        if not user.is_authenticated or user.role != "teacher":
            raise Exception("Only teachers can update submissions.")

        try:
            submission = Submission.objects.get(id=submission_id, assignment__class_assigned__teacher=user)
        except Submission.DoesNotExist:
            raise Exception("Submission not found or not owned by your class.")

        if human_grade is not None:
            submission.human_grade = human_grade
        if feedback is not None:
            submission.feedback = feedback

        submission.save()
        return "Submission updated successfully."

    @strawberry.mutation
    def upload_profile_picture(self, info: Info, file: Upload) -> str:
        request = info.context.request
        user: CustomUser = request.user

        if not user.is_authenticated:
            raise Exception("Not authenticated")

        filename = f"profile_pics/{user.user_id}_{file.name}"
        saved_path = default_storage.save(filename, ContentFile(file.read()))

        user.profile_picture = saved_path
        user.save()

        return f"Uploaded to {saved_path}"
