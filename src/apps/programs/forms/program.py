from django import forms
from django.core.exceptions import ValidationError
from apps.programs.models import Program


class ProgramForm(forms.ModelForm):
    class Meta:
        model = Program
        fields = ["program_name"]
        widgets = {
            "program_name": forms.TextInput(attrs={"placeholder": "例: 朝の集中セット"}),
        }

    def clean_program_name(self):
        name = (self.cleaned_data.get("program_name") or "").strip()
        if not name:
            raise ValidationError("プログラム名は必須です。")
        if len(name) > 100:
            raise ValidationError("プログラム名は100文字以内にしてください。")
        return name
