from apps.timers.forms.timer import TimerForm
from apps.timers.selectors.timer_list import get_timer_list_qs

class TimerRowsMixin:
    def build_rows(self, *, user, invalid_edit_id=None, invalid_edit_form=None):
        rows = []
        for t in get_timer_list_qs(user=user):
            if invalid_edit_id == t.id and invalid_edit_form is not None:
                form = invalid_edit_form
            else:
                form = TimerForm(instance=t, prefix=f"edit_{t.id}")
            rows.append({"timer": t, "form": form})
        return rows
