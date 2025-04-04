import strawberry
from accounts.schema.types import UserType
from accounts.models import CustomUser
from typing import Optional

@strawberry.type
class Mutation:
    @strawberry.mutation
    def register_user(self, name: str, email: str, password: str, role: str) -> UserType:
        user = CustomUser.objects.create_user(name=name, email=email, password=password, role=role)
        return UserType.from_instance(user)

    @strawberry.mutation
    def login(self, email: str, password: str) -> Optional[UserType]:
        try:
            user = CustomUser.objects.get(email=email)
            if user.check_password(password):
                return UserType(
                    user_id=user.user_id,
                    name=user.name,
                    email=user.email,
                    role=user.role,
                    created_at=user.created_at,
                )
        except CustomUser.DoesNotExist:
            return None