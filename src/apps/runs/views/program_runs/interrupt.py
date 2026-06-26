# プログラムのinterrupt（中断）（POST）
import json
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from ...selectors.program_runs import selector_interrupt_programRun_timerRun
from ...services.program_runs.lifecycle import status_interrupt
from ...serializers.program_runs import serialize_interrupt_runs

@method_decorator(csrf_exempt, name='dispatch')
class ProgramInterruptView(LoginRequiredMixin, View):
    def post(self, request, program_run_id):
        if not request.body:
            return JsonResponse({'error': 'リクエストボディが空です'}, status=400)
        try:
            body = json.loads(request.body)
            timer_run_id = body.get('timer_run_id')
            elapsed_sec = int(body.get('elapsed_sec'))
            status_interrupt(program_run_id, timer_run_id, elapsed_sec)
            program_run, timer_run = selector_interrupt_programRun_timerRun(program_run_id, timer_run_id)
            runs_data = serialize_interrupt_runs(program_run, timer_run)
            return JsonResponse({'runs_data': runs_data})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
