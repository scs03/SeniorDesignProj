from django.db import models
from assignments.models import Assignment

class Grade(models.Model):
    grade_id = models.AutoField(primary_key=True)
    assignment = models.OneToOneField(Assignment, on_delete=models.CASCADE)
    ai_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    manual_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    final_score = models.DecimalField(max_digits=5, decimal_places=2, editable=False, null=True)
    feedback = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        self.final_score = self.manual_score if self.manual_score is not None else self.ai_score
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Grade for {self.assignment.title}"
