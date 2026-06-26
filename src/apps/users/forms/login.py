from django import forms
from django.contrib.auth.forms import AuthenticationForm

class LoginForm(AuthenticationForm):
    """
    ログイン用フォーム
    USERNAME_FIELD = 'email' の場合、
    usernameフィールドは email として扱われる
    """

    username = forms.EmailField(
        label='メールアドレス',
        widget=forms.EmailInput(attrs={
            'placeholder': 'email@example.com',
            'autocomplete': 'email',
        }),
        )
    password = forms.CharField(
        label='パスワード',
        widget=forms.PasswordInput(attrs={
            'autocomplete': 'current-password'
        }),
        )
