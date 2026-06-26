from django.db import models
from .program_run import ProgramRun

class TimerRun(models.Model):
    class Meta:
        db_table = 'timer_runs'
    
    class Status(models.TextChoices):
        PENDING = 'pending', '初期状態'
        RUNNING = 'running', '実行中'
        PAUSED = 'paused', '一時停止中'
        FINISHED = 'finished', '完了'
        SKIPPED = 'skipped', 'スキップ'
        INTERRUPTED = 'interrupted', '中断'
    
    class Category(models.TextChoices):
        FOCUS = "focus", "集中"
        BREAK = "break", "休憩"
        REFRESH = "refresh", "リフレッシュ"
    
    order_index_snapshot = models.IntegerField()
    timer_name_snapshot = models.CharField(max_length=50)
    duration_sec_snapshot = models.PositiveIntegerField()
    sound_file_snapshot = models.CharField(max_length=255)
    category_snapshot = models.CharField(max_length=20, choices=Category.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    elapsed_sec = models.IntegerField(default=0)
    memo = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    program_run = models.ForeignKey(
        to=ProgramRun,
        on_delete=models.CASCADE,
        related_name='timer_runs',
    )

    def __str__(self) -> str:
        return self.timer_name_snapshot