from django.forms import ModelForm
from ...models.users import User

class ProfileUsernameForm(ModelForm):
    class Meta:
        model = User
        fields = ['username']

