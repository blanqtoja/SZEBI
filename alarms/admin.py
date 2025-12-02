from django.contrib import admin
from .models import Alarm


@admin.register(Alarm)
class AlarmAdmin(admin.ModelAdmin):
    list_display = ('level', 'created_at', 'acknowledged')
