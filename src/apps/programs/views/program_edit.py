from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import redirect, get_object_or_404, render
from django.urls import reverse
from django.views import View

from apps.programs.models import Program, ProgramTimer
from apps.programs.forms import ProgramForm
from apps.timers.models import Timer


class ProgramEditView(LoginRequiredMixin, View):
    template_name = "programs/programs.html"
    login_url = "users:login"
    redirect_field_name = "next"

    def get(self, request, program_id):
        return redirect("programs:list")  # 1画面運用

    def post(self, request, program_id):
        program = get_object_or_404(Program, id=program_id, user=request.user)
        form = ProgramForm(request.POST, instance=program, prefix=f"edit_{program_id}")

        if form.is_valid():
            form.save()
            return redirect(f"{reverse('programs:list')}?selected={program_id}")

        # エラー時：同じ画面に該当行だけエラー付きで返す
        create_form = ProgramForm(prefix="create")
        programs = Program.objects.filter(user=request.user).order_by("-id")

        # 追加：program_timers をまとめて取得して rows に付与
        pts = (
            ProgramTimer.objects
            .select_related("timer")
            .filter(program__in=programs)
            .order_by("program_id", "order_index")
        )
        pt_map = {}
        for pt in pts:
            pt_map.setdefault(pt.program_id, []).append(pt)

        rows = []
        for p in programs:
            rows.append({
                "program": p,
                "form": form if p.id == program_id else ProgramForm(instance=p, prefix=f"edit_{p.id}"),
                "program_timers": pt_map.get(p.id, []),
            })

        my_timers = Timer.objects.filter(user=request.user).order_by("-id")

        return render(request, self.template_name, {
            "create_form": create_form,
            "rows": rows,
            "my_timers": my_timers,
            "selected_program_id": program_id,  # ★選択維持

            # エラー時にモーダルを開いたままにするフラグ
            "open_upsert_modal": True,
            "upsert_mode": "edit",
        })

