from django.conf import settings
from django.db import models


class Timer(models.Model):
    class Category(models.TextChoices):
        FOCUS = "focus", "集中"
        BREAK = "break", "休憩"
        REFRESH = "refresh", "リフレッシュ"

    name = models.CharField(max_length=50)

    category = models.CharField(
        max_length=20,
        choices=Category.choices,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="timers",
    )

    # 内部は秒で保持
    duration_seconds = models.PositiveIntegerField()

    # Soundは開発側で用意。削除されたらタイマー側はNULL
    sound = models.ForeignKey(
        "timers.Sound",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="timers",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "timers"

    def __str__(self) -> str:
        return self.name
