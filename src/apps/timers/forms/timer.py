from decimal import Decimal, ROUND_HALF_UP
from django import forms

from apps.timers.models import Timer


class TimerForm(forms.ModelForm):
  
    duration_minutes = forms.IntegerField(
        label="時間（分）",
        min_value=1,
        max_value=1440,
        required=True,
        widget=forms.NumberInput(attrs={"min": "1", "step": "1"}),
    )

    class Meta:
        model = Timer
        fields = ["name", "category", "duration_minutes", "sound"]
        labels = {
            "name": "タイマー名",
            "category": "カテゴリー",
            "sound": "サウンド",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 編集画面用：DBの秒→分（整数）にして初期表示
        if self.instance and self.instance.pk and self.instance.duration_seconds is not None:
            minutes = (Decimal(self.instance.duration_seconds) / Decimal("60")).to_integral_value(
                rounding=ROUND_HALF_UP
            )
            self.fields["duration_minutes"].initial = int(minutes)

    def save(self, *, user=None, commit=True):
        obj: Timer = super().save(commit=False)

        minutes = int(self.cleaned_data["duration_minutes"])
        obj.duration_seconds = minutes * 60

        # 作成時は user 必須、更新時は既存の obj.user を維持
        if obj.pk is None:
            if user is None:
                raise TypeError("TimerForm.save() missing required keyword-only argument: 'user'")
            obj.user = user

        if commit:
            obj.save()
            self.save_m2m()
        return obj


