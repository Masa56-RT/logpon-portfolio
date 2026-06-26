from django.urls import path
from apps.programs.views.program_timer import ProgramTimerSaveView

app_name = "program_timers"

urlpatterns = [
    path("<int:program_id>/", ProgramTimerSaveView.as_view(), name="save"),
]
