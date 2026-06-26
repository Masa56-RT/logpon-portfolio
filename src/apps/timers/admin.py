from django.contrib import admin
from apps.timers.models import Sound, Timer


@admin.register(Sound)
class SoundAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "file_path","created_at")
    search_fields = ("name",)


@admin.register(Timer)
class TimerAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "duration_seconds", "sound","created_at")
    search_fields = ("name",)
    list_filter = ("category",)
