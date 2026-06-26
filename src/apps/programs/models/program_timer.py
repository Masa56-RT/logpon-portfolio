from django.db import models
from django.db.models import UniqueConstraint
from apps.timers.models import Timer

class ProgramTimer(models.Model):
    program = models.ForeignKey("programs.Program", on_delete=models.CASCADE)
    timer = models.ForeignKey("timers.Timer", on_delete=models.CASCADE)
    order_index = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "program_timers"
        constraints = [
            UniqueConstraint(fields=["program", "order_index"], name="uq_program_order_index"),
        ]
        ordering = ["order_index"]

    def __str__(self):
        return f"{self.program_id}:{self.order_index}"

