# start/resume/pause/skip/step_next/interruptの状態変更サービス層
from django.db import transaction
from django.utils import timezone
from apps.runs.models import ProgramRun, TimerRun

# プログラムstart（初回実行）
@transaction.atomic
def status_start(program_run_id, timer_run_id):
    now = timezone.now()
    program_run = ProgramRun.objects.select_for_update().get(id=program_run_id)
    program_run.status = ProgramRun.Status.RUNNING
    program_run.started_at = now
    program_run.updated_at = now
    program_run.save()

    timer_run = TimerRun.objects.select_for_update().get(id=timer_run_id, program_run_id=program_run_id)
    timer_run.status = TimerRun.Status.RUNNING
    timer_run.started_at = now
    timer_run.updated_at = now
    timer_run.save()

# プログラムpause（一時停止）
@transaction.atomic
def status_pause(program_run_id, timer_run_id, elapsed_sec:int):
    now = timezone.now()
    program_run = ProgramRun.objects.select_for_update().get(id=program_run_id)
    timer_run = TimerRun.objects.select_for_update().get(id=timer_run_id, program_run_id=program_run_id)

    program_run.status = ProgramRun.Status.PAUSED
    program_run.paused_at = now
    program_run.total_elapsed_sec += max(0, elapsed_sec - timer_run.elapsed_sec)
    program_run.updated_at = now
    program_run.save()

    timer_run.status = TimerRun.Status.PAUSED
    timer_run.paused_at = now
    timer_run.elapsed_sec = elapsed_sec
    timer_run.updated_at = now
    timer_run.save()

# プログラムresume（再開）
@transaction.atomic
def status_resume(program_run_id, timer_run_id):
    now = timezone.now()
    program_run = ProgramRun.objects.select_for_update().get(id=program_run_id)
    program_run.status = ProgramRun.Status.RUNNING
    program_run.updated_at = now
    program_run.save()

    timer_run = TimerRun.objects.select_for_update().get(id=timer_run_id, program_run_id=program_run_id)
    timer_run.status = TimerRun.Status.RUNNING
    timer_run.updated_at = now
    timer_run.save()

# プログラムnext（自動遷移）
@transaction.atomic
def status_next(program_run_id, finished_timer_run_id, elapsed_sec:int, next_timer_run_id):
    now = timezone.now()
    program_run = ProgramRun.objects.select_for_update().get(id=program_run_id)
    timer_run = TimerRun.objects.select_for_update().get(id=finished_timer_run_id, program_run_id=program_run_id)

    program_run.total_elapsed_sec += max(0, elapsed_sec - timer_run.elapsed_sec)

    timer_run.status = TimerRun.Status.FINISHED
    timer_run.ended_at = now
    timer_run.elapsed_sec = elapsed_sec
    timer_run.updated_at = now
    timer_run.save()

    if next_timer_run_id:
        program_run.status = ProgramRun.Status.RUNNING
        next_timer = TimerRun.objects.select_for_update().get(id=next_timer_run_id, program_run_id=program_run_id)
        next_timer.status = TimerRun.Status.RUNNING
        next_timer.started_at = now
        next_timer.updated_at = now
        next_timer.save()

    else:
        program_run.status = ProgramRun.Status.FINISHED
        program_run.ended_at = now

    program_run.updated_at = now
    program_run.save()

# プログラムskip（スキップ）
@transaction.atomic
def status_skip(program_run_id, finished_timer_run_id, elapsed_sec:int, next_timer_run_id):
    now = timezone.now()
    program_run = ProgramRun.objects.select_for_update().get(id=program_run_id)
    timer_run = TimerRun.objects.select_for_update().get(id=finished_timer_run_id, program_run_id=program_run_id)

    program_run.total_elapsed_sec += max(0, elapsed_sec - timer_run.elapsed_sec)

    timer_run.status = TimerRun.Status.SKIPPED
    timer_run.ended_at = now
    timer_run.elapsed_sec = elapsed_sec
    timer_run.updated_at = now
    timer_run.save()

    if next_timer_run_id:
        next_timer = TimerRun.objects.select_for_update().get(id=next_timer_run_id, program_run_id=program_run_id)
        if program_run.status == ProgramRun.Status.RUNNING:
            next_timer.status = TimerRun.Status.RUNNING
        elif program_run.status == ProgramRun.Status.PAUSED:
            next_timer.status = TimerRun.Status.PAUSED

        next_timer.started_at = now
        next_timer.updated_at = now
        next_timer.save()

    else:
        program_run.status = ProgramRun.Status.FINISHED
        program_run.ended_at = now

    program_run.updated_at = now
    program_run.save()

# プログラムinterrupt（中断）
@transaction.atomic
def status_interrupt(program_run_id, timer_run_id, elapsed_sec:int):
    now = timezone.now()
    program_run = ProgramRun.objects.select_for_update().get(id=program_run_id)
    timer_run = TimerRun.objects.select_for_update().get(id=timer_run_id, program_run_id=program_run_id)

    program_run.status = ProgramRun.Status.INTERRUPTED
    program_run.paused_at = now
    program_run.total_elapsed_sec += max(0, elapsed_sec - timer_run.elapsed_sec)
    program_run.updated_at = now
    program_run.save()

    timer_run.status = TimerRun.Status.INTERRUPTED
    timer_run.paused_at = now
    timer_run.elapsed_sec = elapsed_sec
    timer_run.updated_at = now
    timer_run.save()
