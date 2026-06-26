from django.db.models import QuerySet
from apps.timers.models import Timer

def get_timer_list_qs(*, user, include_inactive: bool = False) -> QuerySet[Timer]:
    qs = Timer.objects.select_related("sound").order_by("-id").filter(user=user)
    return qs
