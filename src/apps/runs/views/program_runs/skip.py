# プログラムのskip（スキップ）（POST）
import json
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from ...selectors.program_runs import selector_skip_programRun_timerRun
from ...services.program_runs.lifecycle import status_skip
from ...serializers.program_runs import serialize_skip_runs

class ProgramSkipView(LoginRequiredMixin, View):
    def post(self, request, program_run_id):
        if not request.body:
            return JsonResponse({'error': 'リクエストボディが空です'}, status=400)
        try:
            body = json.loads(request.body)
            finished_timer_run_id = body.get('finished_timer_run_id')
            elapsed_sec = int(body.get('elapsed_sec'))
            next_timer_run_id = body.get('next_timer_run_id')
            status_skip(program_run_id, finished_timer_run_id, elapsed_sec, next_timer_run_id)
            program_run, skipped_timer, next_timer = selector_skip_programRun_timerRun(program_run_id, finished_timer_run_id, next_timer_run_id)
            runs_data = serialize_skip_runs(program_run, skipped_timer, next_timer)
            return JsonResponse({'runs_data': runs_data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
