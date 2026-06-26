from django.forms import ModelForm
from ...models.users import User

class ProfileEmailForm(ModelForm):
    class Meta:
        model = User
        fields = ['email']
