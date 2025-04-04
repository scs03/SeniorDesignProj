import strawberry
from accounts.models import CustomUser
from datetime import datetime

@strawberry.type
class UserType:
    user_id: int
    name: str
    email: str
    role: str
    created_at: datetime

    @staticmethod
    def from_instance(user: CustomUser) -> "UserType":
        return UserType(
            user_id=user.user_id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=str(user.created_at)
        )
