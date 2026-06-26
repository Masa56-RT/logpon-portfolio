from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect, get_object_or_404
from django.urls import reverse
from django.views import View

from apps.programs.models import Program


class ProgramDeleteView(LoginRequiredMixin, View):
    def post(self, request, program_id):
        program = get_object_or_404(Program, id=program_id, user=request.user)
        program.delete()

        next_program = Program.objects.filter(user=request.user).order_by("-id").first()
        if next_program:
            return redirect(f"{reverse('programs:list')}?selected={next_program.id}")
        return redirect("programs:list")


