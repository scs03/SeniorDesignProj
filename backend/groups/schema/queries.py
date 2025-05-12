import strawberry
from typing import List
from strawberry.types import Info

from groups.models import Class as ClassModel
from groups.models import Submission
from groups.schema.types import ClassType, AssignmentType, SubmissionMeta
from accounts.schema.types import UserType



@strawberry.type
class Query:

    @strawberry.field
    def assignment_by_id(self, info: Info, assignment_id: int) -> AssignmentType:
        from groups.models import Assignment

        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            raise Exception("Assignment not found.")

        return AssignmentType(
            id=assignment.id,
            name=assignment.name,
            prompt=assignment.prompt,
            due_date=assignment.due_date,
            created_at=assignment.created_at,
            rubric_file=assignment.rubric_file.url if assignment.rubric_file else None,
        )


    @strawberry.field
    def student_classes(self, student_id: int) -> List[ClassType]:
        classes = ClassModel.objects.filter(students__user_id=student_id).prefetch_related("assignments", "teacher", "students")
        
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
                        rubric_file=a.rubric_file.url if a.rubric_file else None,
                    ) for a in c.assignments.all()
                ],
                student_count=c.students.count()
            ) for c in classes
        ]

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
                        rubric_file=a.rubric_file.url if a.rubric_file else None,
                    )
                    for a in c.assignments.all()
                ],
                student_count=c.students.count(),  # 🔥 Count students here
            )
            for c in classes
        ]

    @strawberry.field
    def all_submissions(self, info: Info) -> List[SubmissionMeta]:
        user = info.context.request.user
        if not user.is_authenticated or user.role != "teacher":
            raise Exception("Only authenticated teachers can view all submissions.")

        submissions = Submission.objects.select_related(
            "assignment__class_assigned", "student"
        ).filter(assignment__class_assigned__teacher=user)

        return [
            SubmissionMeta(
                submission_id=s.id,
                student_id=s.student.pk,
                student_name=s.student.name,
                assignment_id=s.assignment.id,
                assignment_name=s.assignment.name,
                class_id=s.assignment.class_assigned.id,
                class_name=s.assignment.class_assigned.name,
                submission_date=s.submission_date.isoformat(),
                ai_grade=s.ai_grade,
                human_grade=s.human_grade,
                feedback=s.feedback,
                graded_by_ai=s.graded_by_ai,
                submission_file=s.submission_file.url if s.submission_file else None,
            )
            for s in submissions
        ]





    @strawberry.field
    def my_submissions(info) -> List[SubmissionMeta]:
        user = info.context.request.user
        if not user.is_authenticated or user.role != "student":
            raise Exception("Only students can view their submissions.")

        submissions = Submission.objects.select_related(
            "assignment", "assignment__class_assigned"
        ).filter(student=user)

        return [
            SubmissionMeta(
                submission_id=sub.id,
                student_id=sub.student.user_id,
                student_name=sub.student.name,
                class_id=sub.assignment.class_assigned.id,
                class_name=sub.assignment.class_assigned.name,
                assignment_id=sub.assignment.id,
                assignment_name=sub.assignment.name,
                submission_date=sub.submission_date,
                ai_grade=sub.ai_grade,
                human_grade=sub.human_grade,
                feedback=sub.feedback,
                graded_by_ai=sub.graded_by_ai,
                submission_file=sub.submission_file.url if sub.submission_file else None,

            )
            for sub in submissions
        ]

