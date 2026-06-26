from django.contrib import admin
from .models.program_run import ProgramRun
from .models.timer_run import TimerRun

# Register your models here.
admin.site.register(ProgramRun)
admin.site.register(TimerRun)
