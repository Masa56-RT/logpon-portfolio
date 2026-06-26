import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin

from apps.programs.models import Program
from apps.programs.services.program_timer import replace_program_timers


class ProgramTimerSaveView(LoginRequiredMixin, View):
    def post(self, request, program_id: int):
        program = get_object_or_404(Program, id=program_id, user=request.user)

        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"ok": False, "error": "JSONが不正です"}, status=400)

        timer_ids = payload.get("timer_ids", None)
        if not isinstance(timer_ids, list):
            return JsonResponse({"ok": False, "error": "timer_idsが不正です"}, status=400)

        try:
            replace_program_timers(program=program, timer_ids=timer_ids)
        except ValueError as e:
            return JsonResponse({"ok": False, "error": str(e)}, status=400)

        return JsonResponse({"ok": True})
