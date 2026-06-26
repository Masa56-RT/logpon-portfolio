import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.utils import timezone

from apps.runs.models import TimerRun


def _iso_local(dt):
    if not dt:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return timezone.localtime(dt).isoformat()


class TimerRunsMemoView(LoginRequiredMixin, View):
    def _get_run(self, request, timer_run_id: int) -> TimerRun:
        return get_object_or_404(
            TimerRun.objects.select_related("program_run"),
            id=timer_run_id,
            program_run__user=request.user,
        )

    def get(self, request, timer_run_id: int):
        run = self._get_run(request, timer_run_id)
        return JsonResponse({
            "timer_run_id": run.id,
            "memo": run.memo,
            "updated_at": _iso_local(getattr(run, "updated_at", None)),
        })

    def post(self, request, timer_run_id: int):
        run = self._get_run(request, timer_run_id)

        ct = request.headers.get("Content-Type", "")
        if ct.startswith("application/json"):
            try:
                payload = json.loads(request.body.decode("utf-8") or "{}")
            except json.JSONDecodeError:
                return JsonResponse({"error": "JSONが不正です"}, status=400)
            memo = (payload.get("memo") or "").strip()
        else:
            memo = (request.POST.get("memo") or "").strip()

        if len(memo) > 5000:
            return JsonResponse({"error": "メモが長すぎます"}, status=400)

        run.memo = memo

        # updated_at を更新したいなら update_fields に含める（auto_nowでも update_fields で落ちることがある）
        fields = ["memo"]
        if hasattr(run, "updated_at"):
            fields.append("updated_at")

        run.save(update_fields=fields)

        return JsonResponse({
            "timer_run_id": run.id,
            "memo": run.memo,
            "updated_at": _iso_local(getattr(run, "updated_at", None)),
        })

