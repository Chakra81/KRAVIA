from django.contrib import admin
from .models import LiveSession, SessionMaterial

@admin.register(LiveSession)
class LiveSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'start_time', 'duration_display', 'status', 'created_by')
    list_filter = ('status', 'course', 'start_time')
    search_fields = ('title', 'meeting_id')

    def duration_display(self, obj):
        try:
            return f"{(obj.end_time - obj.start_time).total_seconds() / 60} mins"
        except:
            return "-"
    duration_display.short_description = "Duration"

@admin.register(SessionMaterial)
class SessionMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'session', 'uploaded_at')
    search_fields = ('title', 'session__title')
