from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth import get_user_model

User = get_user_model()

class UserPasswordResetForm(PasswordResetForm):
    def get_users(self, email):
        return User._default_manager.filter(email__iexact=email, is_active=True,)