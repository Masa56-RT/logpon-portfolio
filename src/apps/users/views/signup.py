from django.views.generic.edit import CreateView
from django.urls import reverse_lazy
from django.contrib import messages
from django.contrib.messages.views import SuccessMessageMixin
from django.contrib.auth import login
from ..forms.signup import SignUpForm
import logging

logger = logging.getLogger(__name__)


class SignupView(SuccessMessageMixin, CreateView):
    template_name = 'users/signup.html'
    form_class = SignUpForm
    success_url = reverse_lazy('runs:program-runs')
    success_message = '新規登録が完了しました。'

    def dispatch(self, request, *args, **kwargs):
        logger.warning("SignupView dispatch: method=%s path=%s", request.method, request.path)
        return super().dispatch(request, *args, **kwargs)
    
    def form_invalid(self, form):
        logger.warning("Signup invalid. errors=%s", form.errors)
        logger.warning("POST=%s", self.request.POST)
        response = super().form_invalid(form)
        return response

    def form_valid(self, form):
        logger.warning("Signup valid. cleaned_data=%s", form.cleaned_data)
        response = super().form_valid(form)
        logger.warning("Created user pk=%s email=%s", self.object.pk, self.object.email)
        login(self.request, self.object)
        return response # success_urlにレスポンス
