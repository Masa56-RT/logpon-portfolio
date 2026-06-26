from django.db import transaction
from django.db.models import Max

from apps.programs.models import ProgramTimer
from apps.timers.models import Timer


def replace_program_timers(*, program, timer_ids: list[int]) -> None:
    """
    Program内のProgramTimerを、timer_idsの順で「全置換」する。
    ・追加/削除/並び替えをまとめて確定する用途
    ・timer_idsは重複OK（重複NGにしたいならここで弾く）
    """
    if not isinstance(timer_ids, list):
        raise ValueError("timer_ids must be list")

    # 空配列は「全削除」として許可
    if any((not isinstance(x, int)) for x in timer_ids):
        raise ValueError("timer_ids must be list[int]")

    # 所有チェック（Timerは自分のものだけ）
    unique_ids = set(timer_ids)
    timers = Timer.objects.filter(user=program.user, id__in=unique_ids)
    timer_map = {t.id: t for t in timers}
    if unique_ids != set(timer_map.keys()):
        raise ValueError("invalid timer_ids")

    with transaction.atomic():
        ProgramTimer.objects.filter(program=program).delete()
        ProgramTimer.objects.bulk_create([
            ProgramTimer(program=program, timer=timer_map[tid], order_index=i)
            for i, tid in enumerate(timer_ids, start=1)
        ])

