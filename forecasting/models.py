from django.db import models


class Forecast(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    horizon = models.IntegerField(help_text='Forecast horizon in minutes')
    result = models.JSONField(default=dict)

    def __str__(self):
        return f"Forecast {self.id} ({self.horizon}m)"
