import strawberry
from accounts.schema.types import UserType
from accounts.models import CustomUser
from typing import Optional
from strawberry.types import Info
from django.contrib.auth import authenticate, login as django_login, logout as django_logout


@strawberry.type
class Mutation:
    @strawberry.mutation
    def register_user(self, name: str, email: str, password: str, role: str) -> UserType:
        if CustomUser.objects.filter(email=email).exists():
            raise Exception("A user with this email already exists.")

        user = CustomUser.objects.create_user(
            name=name,
            email=email,
            password=password,
            role=role
        )

        return UserType.from_instance(user)

    @strawberry.mutation
    def login(self, info: Info, email: str, password: str) -> Optional[UserType]:
        request = info.context["request"]
        user = authenticate(request, email=email, password=password)

        if user is not None:
            django_login(request, user)
            return UserType(
                user_id=user.user_id,
                name=user.name,
                email=user.email,
                role=user.role,
                created_at=user.created_at,
            )
        return None


    @strawberry.mutation
    def logout(self, info: Info) -> bool:
        request = info.context["request"]
        django_logout(request)
        return True
