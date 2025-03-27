import strawberry
from accounts.schema.types import UserType
from accounts.models import CustomUser

@strawberry.type
class Mutation:
    @strawberry.mutation
    def register_user(self, name: str, email: str, password: str, role: str) -> UserType:
        user = CustomUser.objects.create_user(name=name, email=email, password=password, role=role)
        return UserType.from_instance(user)
