# DB検索、取得（読み取り専用）
from ...programs.models import Program, ProgramTimer
from ..models.program_run import ProgramRun
from ..models.timer_run import TimerRun

# 既存のすべてのprograms取得
def selector_exist_programs(user_id):
    programs = Program.objects.filter(user_id=user_id).values().all()
    return programs

# 既存のprogram_runs, timer_runs取得
def selector_exist_runs(program_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'program_id',
        'status',
        ).first()
    timer_runs = TimerRun.objects.filter(program_run_id=program_run_id).values(
        'id',
        'order_index_snapshot',
        'timer_name_snapshot',
        'duration_sec_snapshot',
        'sound_file_snapshot',
        'category_snapshot',
        'status',
        'elapsed_sec',
        'memo',
        )
    return (program_run, timer_runs)

# start
def selector_start_programRun_timerRun(program_run_id, timer_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'status',
        'started_at',
    ).first()
    timer_run = TimerRun.objects.filter(id=timer_run_id, program_run_id=program_run_id).values(
        'id',
        'status',
        'started_at',
    ).first()
    return (program_run, timer_run)

# pause
def selector_pause_programRun_timerRun(program_run_id, timer_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'status',
    ).first()
    timer_run = TimerRun.objects.filter(id=timer_run_id, program_run_id=program_run_id).values(
        'id',
        'status',
    ).first()
    return (program_run, timer_run)

# resume
def selector_resume_programRun_timerRun(program_run_id, timer_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'status',
    ).first()
    timer_run = TimerRun.objects.filter(id=timer_run_id, program_run_id=program_run_id).values(
        'id',
        'status',
    ).first()
    return (program_run, timer_run)

# next
def selector_next_programRun_timerRun(program_run_id, finished_timer_run_id, next_timer_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'status',
    ).first()
    finished_timer = TimerRun.objects.filter(id=finished_timer_run_id, program_run_id=program_run_id).values(
        'id',
        'status',
        'ended_at',
    ).first()
    if next_timer_run_id:
        next_timer = TimerRun.objects.filter(id=next_timer_run_id, program_run_id=program_run_id).values(
            'id',
            'status',
            'started_at'
        ).first()
    else:
        next_timer = None
    return (program_run, finished_timer, next_timer)

# progress
def selector_progress_programRun_timerRun(program_run_id, current_timer_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'status',
    ).first()
    timer_run = TimerRun.objects.filter(id=current_timer_run_id, program_run_id=program_run_id).values(
        'id',
        'status',
    ).first()
    return (program_run, timer_run)

# skip
def selector_skip_programRun_timerRun(program_run_id, finished_timer_run_id, next_timer_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'status',
    ).first()
    skipped_timer = TimerRun.objects.filter(id=finished_timer_run_id, program_run_id=program_run_id).values(
        'id',
        'status',
        'ended_at',
    ).first()
    if next_timer_run_id:
        next_timer = TimerRun.objects.filter(id=next_timer_run_id, program_run_id=program_run_id).values(
            'id',
            'status',
            'started_at'
        ).first()
    else:
        next_timer = None
    return (program_run, skipped_timer, next_timer)

# interrupt
def selector_interrupt_programRun_timerRun(program_run_id, timer_run_id):
    program_run = ProgramRun.objects.filter(id=program_run_id).values(
        'id',
        'status',
        'paused_at',
    ).first()
    timer_run = TimerRun.objects.filter(id=timer_run_id, program_run_id=program_run_id).values(
        'id',
        'status',
        'paused_at',
    ).first()
    return (program_run, timer_run)
