from django import forms
from django.contrib.auth.forms import UserCreationForm
from ..models.users import User

class SignUpForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('email', 'username',) # password1/password2はUserCreationFormが提供
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('このメールアドレスは既に登録されています')
        return email.lower().strip()

    # UserCreationFormのusernameのUnique設定解除
    def clean_username(self):
        username = self.cleaned_data.get('username')
        return username
