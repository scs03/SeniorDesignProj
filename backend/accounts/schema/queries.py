import strawberry
from strawberry.types import Info
from typing import Optional
from accounts.schema.types import UserType
from accounts.models import CustomUser
from groups.schema.types import AssignmentType


@strawberry.type
class Query:
    @strawberry.field
    def me(self, info: Info) -> Optional[UserType]:
        user = info.context.request.user
        return UserType.from_instance(user)

    @strawberry.field
    def curr_user_info(self, info: Info) -> Optional[UserType]:
        user = info.context.request.user
        return UserType.from_instance(user)
    
    

@strawberry.field
def class_assignments(self, info: Info, class_id: int) -> list[AssignmentType]:
    user = info.context.request.user

    if not user.is_authenticated or user.role != "student":
        raise Exception("Only authenticated students can view assignments.")

    try:
        class_obj = Class.objects.get(id=class_id, students=user)
    except Class.DoesNotExist:
        raise Exception("Class not found or you're not enrolled in it.")

    return list(class_obj.assignments.all())


