import strawberry
from typing import Optional
from strawberry.types import Info
from strawberry.file_uploads import Upload

from accounts.models import CustomUser
from accounts.schema.types import UserType
from groups.models import Submission


@strawberry.type
class Mutation:
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

    @strawberry.mutation
    def upload_profile_picture(self, info: Info, file: Upload) -> UserType:
        request = info.context.request
        user: CustomUser = request.user

        if not user.is_authenticated:
            raise Exception("You must be logged in to upload a profile picture.")

        # ✅ Save the uploaded file using the correct attribute
        user.profile_picture.save(file.name, file.file, save=True)

        return user
