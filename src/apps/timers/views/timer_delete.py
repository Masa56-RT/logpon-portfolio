from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin

from apps.timers.models import Timer
from apps.timers.forms.timer import TimerForm
from apps.timers.views.mixins import TimerRowsMixin

class TimerDeleteView(LoginRequiredMixin, TimerRowsMixin, View):
    template_name = "timers/timers.html"

    def post(self, request, timer_id: int, *args, **kwargs):
        deleted, _ = Timer.objects.filter(id=timer_id, user=request.user).delete()

        if deleted:
            return redirect("timers:list")

        create_form = TimerForm(prefix="create")
        rows = self.build_rows(user=request.user)
        return render(request, self.template_name, {
            "create_form": create_form,
            "rows": rows,
            "delete_error": "削除対象のタイマーが見つかりませんでした",
            "open_delete_id": timer_id,
        })

    def get(self, request, timer_id: int, *args, **kwargs):
        return redirect("timers:list")


