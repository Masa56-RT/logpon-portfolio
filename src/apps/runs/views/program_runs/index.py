# /program-runs/のGET（表示）, program_idのPOST（draft作成）
import json
from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.urls import reverse
from ...models.program_run import ProgramRun
from ....programs.models.program import Program
from ...selectors.program_runs import selector_exist_programs
from ...serializers.program_runs import serialize_exist_programs
from ...services.program_runs.create_draft import create_runs_draft

class ProgramRunsView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        user_id = self.request.user.id
        programs = selector_exist_programs(user_id)
        dict_programs = serialize_exist_programs(programs)
        return render(request, 'runs/program-runs.html', context={'dict_programs': dict_programs})

    def post(self, request, *args, **kwargs):
        if not request.body:
            return JsonResponse({'error': 'リクエストボディが空です'}, status=400)
        try:
            body = json.loads(request.body)
            program_id = body.get('program_id')
            user = request.user

            program = Program.objects.filter(id=program_id, user=user).first()
            if program is None:
                return JsonResponse({'error': 'invalid program'}, status=400)
            create_runs_draft(user=user, program=program)

            id_dict = ProgramRun.objects.filter(program_id=program_id).order_by('-updated_at').values('id').first()
            program_run_id = id_dict.get('id')
            url = reverse('runs:program-runs-detail', kwargs={'program_run_id': program_run_id})
            return JsonResponse({'redirect_url': url})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
