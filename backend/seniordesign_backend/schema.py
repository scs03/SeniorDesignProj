import strawberry
from strawberry import Schema
from strawberry.tools import merge_types

from strawberry.schema.config import StrawberryConfig
from accounts.schema.queries import Query as UserQueries
from accounts.schema.mutations import Mutation as UserMutations



queries = (
    UserQueries,
)

mutations = (
    UserMutations,
)

# Merge them into full root types
Query = merge_types('Query', queries)
Mutation = merge_types('Mutation', mutations)

print("Merged Query fields:", Query.__dict__.keys())
print("Merged Mutation fields:", Mutation.__dict__.keys())

# Create schema
schema = strawberry.Schema(
    query=Query,
    mutation=Mutation,
    config=StrawberryConfig(auto_camel_case=False),
)
