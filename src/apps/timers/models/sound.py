from django.db import models


class Sound(models.Model):
    name = models.CharField(max_length=50)
    file_path = models.CharField(max_length=255)  # 例: "sounds/bell.mp3"
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "sounds"

    def __str__(self) -> str:
        return self.name
