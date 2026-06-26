from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin

from apps.timers.forms.timer import TimerForm
from apps.timers.views.mixins import TimerRowsMixin
from apps.timers.models import Timer         
from apps.timers.models.sound import Sound    


class TimerListCreateView(LoginRequiredMixin, TimerRowsMixin, View):
    template_name = "timers/timers.html"
    login_url = "users:login"
    redirect_field_name = "next"

    def get(self, request):
        create_form = TimerForm(prefix="create")
        rows = self.build_rows(user=request.user)
        sounds = Sound.objects.all().order_by("id")  

        return render(request, self.template_name, {
            "create_form": create_form,
            "rows": rows,
            "category_choices": Timer.Category.choices,
            "sounds": sounds,  
        })

    def post(self, request):
        create_form = TimerForm(request.POST, prefix="create")
        if create_form.is_valid():
            create_form.save(user=request.user)
            return redirect("timers:list")

        rows = self.build_rows(user=request.user)
        sounds = Sound.objects.all().order_by("id")  

        return render(request, self.template_name, {
            "create_form": create_form,
            "rows": rows,
            "category_choices": Timer.Category.choices,
            "sounds": sounds,  
        })







