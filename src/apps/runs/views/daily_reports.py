from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render
from django.utils import timezone
from django.views import View

from apps.runs.models import TimerRun


@dataclass(frozen=True)
class Range:
    start: datetime
    end: datetime


def _calc_daily_range_3am(now_local: datetime) -> Range:
    """
    03:00区切り
    - 0:00〜2:59 のとき → 前日03:00〜当日03:00
    - 3:00〜23:59 のとき → 当日03:00〜翌日03:00
    """
    base = now_local.replace(hour=3, minute=0, second=0, microsecond=0)
    start = base - timedelta(days=1) if now_local.hour < 3 else base
    end = start + timedelta(days=1)
    return Range(start=start, end=end)


def _to_hhmm(dt) -> str:
    if not dt:
        return "--:--"
    try:
        d = timezone.localtime(dt)
        return d.strftime("%H:%M")
    except Exception:
        return "--:--"


def _format_duration_min(sec: int) -> str:
    sec = max(0, int(sec or 0))
    m = sec // 60
    h = m // 60
    mm = m % 60
    if h > 0:
        return f"{h}時間{mm}分"
    return f"{m}分"


def _build_daily_report_text(timer_runs: list[TimerRun], r: Range) -> str:
    if not timer_runs:
        return "本日の実施記録がありません。"

    lines: list[str] = []
    lines.append("")
    
    # started_at → id順
    timer_runs = sorted(timer_runs, key=lambda tr: ((tr.started_at or r.start), tr.id))

    for tr in timer_runs:
        started_at = getattr(tr, "started_at", None)
        ended_at = getattr(tr, "ended_at", None)
        paused_at = getattr(tr, "paused_at", None)
        updated_at = getattr(tr, "updated_at", None)
        status = getattr(tr, "status", None)

        start_str = _to_hhmm(started_at)

        # 終了時刻の決定（statusに応じて安全に）
        if ended_at:
            end_dt = ended_at
        elif status in (TimerRun.Status.PAUSED, TimerRun.Status.INTERRUPTED):
            end_dt = paused_at or updated_at or timezone.now()
        elif status == TimerRun.Status.RUNNING:
            end_dt = None # “今”にしたくないなら None にして --:-- にできる
        else:
            end_dt =paused_at or updated_at or timezone.now()

        end_str = _to_hhmm(end_dt)

        name = getattr(tr, "timer_name_snapshot", None) or "（無名タイマー）"
        elapsed = int(getattr(tr, "elapsed_sec", 0) or 0)
        memo = (getattr(tr, "memo", "") or "").strip()
        if status in (TimerRun.Status.RUNNING, TimerRun.Status.PAUSED):
            # 時刻が取れてるなら「HH:MM（途中）」、取れないなら「途中」
            end_str = f"{end_str}（途中）" if end_str != "--:--" else "途中"

        lines.append(f"・{start_str} ~ {end_str}（{_format_duration_min(elapsed)}） {name}")
        if memo:
            lines.append(f"  - {memo}")

    
    return "\n".join(lines)




class DailyReportsView(LoginRequiredMixin, View):
    template_name = "runs/daily-reports.html"
    login_url = "users:login"

    def get(self, request):
        now_local = timezone.localtime(timezone.now())
        r = _calc_daily_range_3am(now_local)
        MIN_REPORT_SEC = 120  # 2分未満は日報に載せない
        qs = (
            TimerRun.objects.select_related("program_run")
            .filter(program_run__user=request.user)
            .filter(started_at__isnull=False)
            .filter(started_at__gte=r.start, started_at__lt=r.end)

            .filter(category_snapshot=TimerRun.Category.FOCUS)
            .filter(elapsed_sec__gte=MIN_REPORT_SEC) 
            #pending（初期状態）だけ除外 → running/paused/finished/skipped/interrupted は出す
            .exclude(status=TimerRun.Status.PENDING)

            .order_by("started_at", "id")
        )

        timer_runs = list(qs)

        #合計も「表示対象（pending以外）」の elapsed_sec 合計
        total_sec = sum(int(tr.elapsed_sec or 0) for tr in timer_runs)
        total_hours = total_sec // 3600
        total_minutes = (total_sec % 3600) // 60

        

        return render(request, self.template_name, {
            "total_hours": total_hours,
            "total_minutes": total_minutes,
            "daily_report_text": _build_daily_report_text(timer_runs, r),
        })