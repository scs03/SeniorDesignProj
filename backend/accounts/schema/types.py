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
    def from_instance(user) -> "UserType":
        created_at = user.created_at
        if isinstance(created_at, str):  # guard against corrupted field
            created_at = datetime.fromisoformat(created_at)

        return UserType(
            user_id=user.user_id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=created_at,
        )   
