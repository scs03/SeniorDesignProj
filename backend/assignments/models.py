from django.db import models
from accounts.models import CustomUser

class Assignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='assignments_as_student')
    teacher = models.ForeignKey(CustomUser, null=True, blank=True, on_delete=models.SET_NULL, related_name='assignments_as_teacher')
    title = models.CharField(max_length=255)
    submission_file = models.TextField()  # Store path/URL to file
    submission_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.student.name}"
