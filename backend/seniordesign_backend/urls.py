from django.contrib import admin
from django.urls import path, include
from strawberry.django.views import GraphQLView
from django.conf import settings
from django.conf.urls.static import static
from .schema import schema

urlpatterns = [
    path("admin/", admin.site.urls),
    path("graphql", GraphQLView.as_view(schema=schema, graphiql=True)),
    path("", include("accounts.urls")),
]

# ✅ Serve media files in development only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
