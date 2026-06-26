# draft作成のためのサービス層
from django.db import transaction
from apps.runs.models import ProgramRun, TimerRun
from apps.programs.models import ProgramTimer
from django.forms.models import model_to_dict

@transaction.atomic
def create_runs_draft(*, user, program):
    program_run = ProgramRun.objects.create(
        user=user,
        program=program,
        program_name_snapshot=program.program_name,
        status=ProgramRun.Status.DRAFT,
    )

    program_timers = (
        ProgramTimer.objects
        .select_related('timer', 'timer__sound')
        .filter(program=program)
        .order_by('order_index')
    )

    timer_runs = []
    for pt in program_timers:
        t = pt.timer
        timer_runs.append(
            TimerRun(
                program_run=program_run,
                order_index_snapshot=pt.order_index,
                timer_name_snapshot=t.name,
                duration_sec_snapshot=t.duration_seconds,
                category_snapshot=t.category,
                sound_file_snapshot=(t.sound.file_path if t.sound else ''),
                status=TimerRun.Status.PENDING,
            )
        )
    TimerRun.objects.bulk_create(timer_runs)
