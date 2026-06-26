# プログラムのprogress（定期保存）（POST）
import json
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from ...selectors.program_runs import selector_progress_programRun_timerRun
from ...services.program_runs.progress import runs_progress
from ...serializers.program_runs import serialize_progress_runs

class ProgramProgressView(LoginRequiredMixin, View):
    def post(self, request, program_run_id):
        if not request.body:
            return JsonResponse({'error': 'リクエストボディが空です'}, status=400)
        try:
            body = json.loads(request.body)
            current_timer_run_id = body.get('current_timer_run_id')
            elapsed_sec = int(body.get('elapsed_sec'))
            runs_progress(program_run_id, current_timer_run_id, elapsed_sec)
            program_run, timer_run = selector_progress_programRun_timerRun(program_run_id, current_timer_run_id)
            runs_data = serialize_progress_runs(program_run, timer_run)
            return JsonResponse({'runs_data': runs_data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
