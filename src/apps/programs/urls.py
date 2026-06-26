from django.urls import path
from apps.programs.views.program_list_create import ProgramListCreateView
from apps.programs.views.program_edit import ProgramEditView
from apps.programs.views.program_delete import ProgramDeleteView

app_name = "programs"

urlpatterns = [
    path("", ProgramListCreateView.as_view(), name="list"),                # GET/POST(create)
    path("<int:program_id>/", ProgramEditView.as_view(), name="edit"),             # POST(update) ※1画面運用
    path("<int:program_id>/delete/", ProgramDeleteView.as_view(), name="delete"),  # POST(delete)
]
