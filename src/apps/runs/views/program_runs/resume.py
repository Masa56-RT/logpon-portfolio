# プログラムのresume（再開）（POST）
import json
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from ...selectors.program_runs import selector_resume_programRun_timerRun
from ...services.program_runs.lifecycle import status_resume
from ...serializers.program_runs import serialize_resume_runs

class ProgramResumeView(LoginRequiredMixin, View):
    def post(self, request, program_run_id):
        if not request.body:
            return JsonResponse({'error': 'リクエストボディが空です'}, status=400)
        try:
            body = json.loads(request.body)
            timer_run_id = body.get('timer_run_id')
            status_resume(program_run_id, timer_run_id)
            program_run, timer_run = selector_resume_programRun_timerRun(program_run_id, timer_run_id)
            runs_data = serialize_resume_runs(program_run, timer_run)
            return JsonResponse({'runs_data': runs_data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
