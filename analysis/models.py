from django.db import models


class Report(models.Model):
    title = models.CharField(max_length=200)
    generated_at = models.DateTimeField(auto_now_add=True)
    payload = models.JSONField(default=dict)

    def __str__(self):
        return self.title
