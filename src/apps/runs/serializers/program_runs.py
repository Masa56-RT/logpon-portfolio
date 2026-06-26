# JSON形式整形ファイル

# 既存programsの整形
def serialize_exist_programs(programs):
    data = {}
    data['programs'] = list(programs)
    return data

# 既存runsの整形
def serialize_exist_runs(program_run, timer_runs):
    data = {}
    data['program_run'] = program_run
    data['timer_runs'] = list(timer_runs)
    return data

# start時の整形
def serialize_start_runs(program_run, timer_run):
    data = {}
    data['program_run'] = program_run
    data['current_timer'] = timer_run
    return data

# pause時の整形
def serialize_pause_runs(program_run, timer_run):
    data = {}
    data['program_run'] = program_run
    data['paused_timer'] = timer_run
    return data

# resume時の整形
def serialize_resume_runs(program_run, timer_run):
    data = {}
    data['program_run'] = program_run
    data['paused_timer'] = timer_run
    return data

# next時の整形
def serialize_next_runs(program_run, finished_timer, next_timer):
    data = {}
    data['program_run'] = program_run
    data['finished_timer'] = finished_timer
    data['next_timer'] = next_timer
    return data

# progress時の整形
def serialize_progress_runs(program_run, timer_run):
    data = {}
    data['program_run'] = program_run
    data['current_timer'] = timer_run
    return data

# skip時の整形
def serialize_skip_runs(program_run, skipped_timer, next_timer):
    data = {}
    data['program_run'] = program_run
    data['skipped_timer'] = skipped_timer
    data['next_timer'] = next_timer
    return data

# interrupt時の整形
def serialize_interrupt_runs(program_run, timer_run):
    data = {}
    data['program_run'] = program_run
    data['interrupted_timer'] = timer_run
    return data
