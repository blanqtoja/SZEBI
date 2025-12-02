from django.contrib import admin
from .models import ControlPlan


@admin.register(ControlPlan)
class ControlPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
