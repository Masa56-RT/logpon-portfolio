# 進捗保存/自動保存
from django.db import transaction
from django.utils import timezone
from apps.runs.models import ProgramRun, TimerRun

# プログラムprogress（自動保存）
@transaction.atomic
def runs_progress(program_run_id, timer_run_id, elapsed_sec:int):
    now = timezone.now()
    program_run = ProgramRun.objects.select_for_update().get(id=program_run_id)
    timer_run = TimerRun.objects.select_for_update().get(id=timer_run_id, program_run_id=program_run_id)

    program_run.total_elapsed_sec += max(0, elapsed_sec - timer_run.elapsed_sec)
    program_run.updated_at = timezone.now()
    program_run.save()

    timer_run.elapsed_sec = elapsed_sec
    timer_run.updated_at = timezone.now()
    timer_run.save()
