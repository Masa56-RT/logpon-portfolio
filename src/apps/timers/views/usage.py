from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Min

from apps.timers.models import Timer
from apps.programs.models import ProgramTimer


class TimerUsageView(LoginRequiredMixin, View):
    def get(self, request, timer_id: int):
        timer = get_object_or_404(Timer, id=timer_id, user=request.user)

        # ProgramTimerを「プログラム単位」に潰して集計（重複排除）
        rows = (
            ProgramTimer.objects
            .filter(timer=timer, program__user=request.user)
            .values("program_id")
            .annotate(program_name=Min("program__program_name"))  # program_name のフィールド名は合わせて
            .order_by("program_id")
        )

        used_count = rows.count()
        top = list(rows[:3])
        program_names = [r["program_name"] for r in top]
        remain_count = max(used_count - len(program_names), 0)

        return JsonResponse({
            "used_count": used_count,
            "program_names": program_names,
            "remain_count": remain_count,
        })