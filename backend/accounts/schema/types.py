from datetime import datetime
from typing import Optional
import strawberry
from strawberry_django import type as django_type

from accounts.models import CustomUser

@django_type(CustomUser)
class UserType:
    user_id: int
    name: str
    email: str
    role: str
    created_at: datetime

    @strawberry.field
    def profile_picture(self) -> Optional[str]:
        # Access the underlying Django model instance safely
        pic = getattr(self, "profile_picture", None)
        if pic and hasattr(pic, "url"):
            return pic.url
        return None
