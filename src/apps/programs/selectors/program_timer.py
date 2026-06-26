from django.db.models import Prefetch

from apps.programs.models import ProgramTimer


def prefetch_program_timers(programs_qs):
    """
    Program一覧に対して program_timers(+timer) をまとめてprefetchする
    """
    return programs_qs.prefetch_related(
        Prefetch(
            "program_timers",
            queryset=ProgramTimer.objects.select_related("timer").order_by("order_index"),
        )
    )
