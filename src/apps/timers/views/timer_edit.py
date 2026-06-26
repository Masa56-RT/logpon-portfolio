from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin

from apps.timers.models import Timer
from apps.timers.forms.timer import TimerForm
from apps.timers.views.mixins import TimerRowsMixin


class TimerEditView(LoginRequiredMixin, TimerRowsMixin, View):
    template_name = "timers/timers.html"
    login_url = "users:login"

    def post(self, request, timer_id: int):
        timer = get_object_or_404(Timer, pk=timer_id, user=request.user)

        edit_form = TimerForm(request.POST, instance=timer, prefix=f"edit_{timer_id}")
        if edit_form.is_valid():
            edit_form.save(user=request.user)
            return redirect("timers:list")

        create_form = TimerForm(prefix="create")
        rows = self.build_rows(
            user=request.user,
            invalid_edit_id=timer_id,
            invalid_edit_form=edit_form,
        )
        return render(
            request,
            self.template_name,
            {"create_form": create_form, "rows": rows, "open_edit_id": timer_id},
        )

    def get(self, request, timer_id: int):
        return redirect("timers:list")

    





