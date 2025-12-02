from django.db import models


class ControlPlan(models.Model):
    name = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    config = models.JSONField(default=dict)

    def __str__(self):
        return self.name
