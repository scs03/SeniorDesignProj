import strawberry
from accounts.models import CustomUser
from datetime import datetime
from django.conf import settings
from typing import Optional

@strawberry.type
class UserType:
    user_id: int
    name: str
    email: str
    role: str
    created_at: datetime

    _instance: CustomUser = strawberry.private  # 👈 private Django model instance

    @strawberry.field
    def profile_picture_url(self) -> Optional[str]:
        if self._instance.profile_picture:
            return f"{settings.MEDIA_URL}{self._instance.profile_picture.name}"
        return None

    @staticmethod
    def from_instance(user: CustomUser) -> "UserType":
        return UserType(
            user_id=user.user_id,
            name=user.name,
            email=user.email,
            role=user.role,
            created_at=user.created_at,
            _instance=user
        )
    