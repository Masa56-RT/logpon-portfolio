from django.db import models
from django.conf import settings
from ...programs.models.program import Program

class ProgramRun(models.Model):
    class Meta:
        db_table = 'program_runs'
    
    class Status(models.TextChoices):
        # value, labelのタプル形式
        DRAFT = 'draft', '下書き'
        RUNNING = 'running', '実行中'
        PAUSED = 'paused', '一時停止中'
        FINISHED = 'finished', '完了'
        INTERRUPTED = 'interrupted', '中断'

    program_name_snapshot = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    total_elapsed_sec = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='program_runs',
    )

    program = models.ForeignKey(
        Program,
        on_delete=models.SET_NULL,
        related_name='program_runs',
        null=True,
        blank=True,
    )

    def __str__(self) -> str:
        return self.program_name_snapshot
