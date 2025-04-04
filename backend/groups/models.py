from django.db import models
from accounts.models import CustomUser

class Class(models.Model):
    name = models.CharField(max_length=255)
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classes')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Assignment(models.Model):
    class_assigned = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    name = models.CharField(max_length=255)
    prompt = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField()
    rubric_image = models.ImageField(upload_to='rubrics/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    submission_file = models.TextField()  # Use FileField if you plan to support actual uploads
    submission_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.name} - {self.assignment.name}"
