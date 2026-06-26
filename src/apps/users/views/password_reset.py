import logging
from django.contrib.auth.views import PasswordResetView
from django.urls import reverse_lazy
from django.contrib import messages
from ..forms.password_reset import UserPasswordResetForm

logger = logging.getLogger(__name__)

class UserPasswordResetView(PasswordResetView):
    form_class = UserPasswordResetForm
    template_name = 'users/password-reset.html' # パスワードリセットフォーム画面
    email_template_name = 'users/password-reset-email.txt' # メール本文
    subject_template_name = 'users/password-reset-subject.txt' # メールの件名

    success_url = reverse_lazy('users:password-reset-done')

    def form_valid(self, form):
        logger.warning('Password reset requested for email=%s', form.cleaned_data.get('email'))
        messages.success(self.request, 'パスワード再設定用のメールを送信しました。')
        return super().form_valid(form)
