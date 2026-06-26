# /program-runs/<id>/ GET (実行画面)
from django.shortcuts import render, redirect
from django.views import View
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from ...selectors.program_runs import selector_exist_runs, selector_exist_programs
from ...serializers.program_runs import serialize_exist_runs, serialize_exist_programs

class ProgramPagesView(LoginRequiredMixin, View):
    def get(self, request, program_run_id):
        user_id = self.request.user.id
        programs = selector_exist_programs(user_id)
        dict_programs = serialize_exist_programs(programs)
        return render(request, 'runs/program-runs.html', context={'dict_programs': dict_programs, 'program_run_id': program_run_id})

class ProgramRunApiView(LoginRequiredMixin, View):
    def get(self, request, program_run_id):
        program_run, timer_runs = selector_exist_runs(program_run_id)
        runs_data = serialize_exist_runs(program_run, timer_runs)
        return JsonResponse({'runs_data': runs_data})

