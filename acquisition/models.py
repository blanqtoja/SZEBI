from django.db import models


class DataPoint(models.Model):
    timestamp = models.DateTimeField()
    source = models.CharField(max_length=128)
    value = models.FloatField()

    def __str__(self):
        return f"{self.source} @ {self.timestamp.isoformat()}"
