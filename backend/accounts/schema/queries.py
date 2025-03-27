import strawberry
from strawberry.types import Info
from typing import Optional
from accounts.schema.types import UserType
from accounts.models import CustomUser

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
    def login(self, email: str, password: str, info: Info) -> bool:
        try:
            user = CustomUser.objects.get(email=email)
            return user.check_password(password)
        except CustomUser.DoesNotExist:
            return False
