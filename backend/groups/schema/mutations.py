import strawberry
from typing import Optional
from datetime import datetime, timedelta
from strawberry.file_uploads import Upload
from groups.models import Assignment, Class, Submission
from accounts.models import CustomUser
from strawberry.types import Info
from groups.schema.types import ClassType
from django.utils.timezone import now
from django.utils.timezone import is_naive, make_aware, now
import os
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

import sys
import os
current_dir = os.path.dirname(__file__)
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
sys.path.append(project_root)

from lib.auto_grader import trigger_auto_grading_pipeline


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_assignment(
        self,
        info: Info,
        class_id: int,
        name: str,
        due_date: Optional[datetime] = None,
        prompt: Optional[str] = None,
        rubric_file: Optional[Upload] = None,
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

        existing = Assignment.objects.filter(class_assigned=class_obj, name=name).first()
        if existing:
            if rubric_file and existing.rubric_file:
                existing.rubric_file.delete()
            existing.due_date = due_date
            existing.prompt = prompt
            if rubric_file:
                existing.rubric_file = rubric_file
            existing.save()
            return f"Assignment '{name}' updated successfully."
        else:
            Assignment.objects.create(
                class_assigned=class_obj,
                name=name,
                due_date=due_date,
                prompt=prompt,
                rubric_file=rubric_file,
            )
            return f"Assignment '{name}' created successfully."


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

        # Check for existing submission and update it, or create a new one
        submission = Submission.objects.filter(assignment=assignment, student=user).first()

        if submission:
            submission.submission_file = relative_path
            submission.submission_date = now()
            submission.human_grade = None
            submission.ai_grade = None
            submission.graded_by_ai = False
            submission.feedback = None
            submission.save()
        else:
            submission = Submission.objects.create(
                assignment=assignment,
                student=user,
                submission_file=relative_path,
            )

        # Trigger AI grading pipeline after saving the submission
        rubric_path = assignment.rubric_file.path if assignment.rubric_file else None
        essay_path = default_storage.path(relative_path)

        if rubric_path:
            try:
                trigger_auto_grading_pipeline(
                    submission=submission,
                    rubric_path=rubric_path,
                    essay_path=essay_path
                )
            except Exception as e:
                print(f"Grading pipeline error: {e}")

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

        # UPDATE FIELDS
        if human_grade is not None:
            submission.human_grade = human_grade
        if feedback is not None:
            submission.feedback = feedback

        submission.save()
        return "Submission updated successfully."
