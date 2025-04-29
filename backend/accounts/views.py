from django.contrib.auth import authenticate, login
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    body = json.loads(request.body)
    email = body.get("email")
    password = body.get("password")

    user = authenticate(request, email=email, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({
            "success": True,
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat()
            }
        })
    else:
        return JsonResponse({"error": "Invalid credentials"}, status=401)
