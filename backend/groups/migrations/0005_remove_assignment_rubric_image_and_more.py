# Generated by Django 5.0.2 on 2025-04-30 23:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('groups', '0004_submission_ai_grade_submission_feedback_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='assignment',
            name='rubric_image',
        ),
        migrations.AddField(
            model_name='assignment',
            name='rubric_file',
            field=models.FileField(blank=True, null=True, upload_to='rubrics/'),
        ),
    ]
