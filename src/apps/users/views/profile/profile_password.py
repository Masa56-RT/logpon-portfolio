from django.contrib import messages
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.contrib.messages.views import SuccessMessageMixin
from django.views import View
from django.contrib.auth.views import PasswordChangeView
from django.contrib.auth.mixins import LoginRequiredMixin

def _push_form_errors(request, form):
    for field, errors in form.errors.items():
        for e in errors:
            if field == '__all__':
                messages.error(request, e)
            else:
                messages.error(request, f'{form.fields[field].label or field}: {e}')

class ProfilePasswordView(LoginRequiredMixin, SuccessMessageMixin, PasswordChangeView):
    success_url = reverse_lazy('users:profile')
    success_message = 'パスワードの変更が完了しました'

    def form_invalid(self, form):
        _push_form_errors(self.request, form)
        return redirect('users:profile')