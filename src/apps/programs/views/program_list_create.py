from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views import View

from apps.programs.models import Program, ProgramTimer
from apps.programs.forms import ProgramForm
from apps.timers.models import Timer


class ProgramListCreateView(LoginRequiredMixin, View):
    template_name = "programs/programs.html"
    login_url = "users:login"
    redirect_field_name = "next"

    def _build_rows(self, invalid_edit_id=None, invalid_edit_form=None):
        programs = Program.objects.filter(user=self.request.user).order_by("-id")

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
            if invalid_edit_id == p.id and invalid_edit_form is not None:
                form = invalid_edit_form
            else:
                form = ProgramForm(instance=p, prefix=f"edit_{p.id}")

            rows.append({
                "program": p,
                "form": form,
                "program_timers": pt_map.get(p.id, []),
            })
        return rows

    def _resolve_selected_program_id(self, request, rows):
        selected = request.GET.get("selected")
        program_ids = [r["program"].id for r in rows]

        if selected and selected.isdigit() and int(selected) in program_ids:
            return int(selected)
        return program_ids[0] if program_ids else None

    def get(self, request):
        create_form = ProgramForm(prefix="create")
        rows = self._build_rows()
        my_timers = Timer.objects.filter(user=request.user).order_by("-id")

        selected_program_id = self._resolve_selected_program_id(request, rows)

        return render(request, self.template_name, {
            "create_form": create_form,
            "rows": rows,
            "my_timers": my_timers,
            "selected_program_id": selected_program_id,  # ★追加

            # 通常時はモーダルを閉じるようにするフラグ
            "open_upsert_modal": False,
            "upsert_mode": None,
        })

    def post(self, request):
        create_form = ProgramForm(request.POST, prefix="create")
        if create_form.is_valid():
            program = create_form.save(commit=False)
            program.user = request.user
            program.save()
            # ★作成したprogramを選択状態で戻す
            return redirect(f"{reverse('programs:list')}?selected={program.id}")

        rows = self._build_rows()
        my_timers = Timer.objects.filter(user=request.user).order_by("-id")
        selected_program_id = self._resolve_selected_program_id(request, rows)

        return render(request, self.template_name, {
            "create_form": create_form,
            "rows": rows,
            "my_timers": my_timers,
            "selected_program_id": selected_program_id,

            # 作成失敗時に作成モーダルを開いたままにするフラグ
            "open_upsert_modal": True,
            "upsert_mode": "create",
        })



