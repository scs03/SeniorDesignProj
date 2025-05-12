from django.db import models
from accounts.models import CustomUser

class Class(models.Model):
    name = models.CharField(max_length=255)
    teacher = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='classes')
    created_at = models.DateTimeField(auto_now_add=True)
    students = models.ManyToManyField(CustomUser, related_name='enrolled_classes', blank=True)

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
    rubric_file = models.FileField(upload_to='rubrics/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Submission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    submission_file = models.FileField(upload_to='submissions/')  # ✅ Save files to MEDIA_ROOT/submissions/
    submission_date = models.DateTimeField(auto_now_add=True)
    human_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    ai_grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    graded_by_ai = models.BooleanField(default=False)
    feedback = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.student.name} - {self.assignment.name}"
