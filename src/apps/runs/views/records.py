from __future__ import annotations

from collections import defaultdict
from datetime import datetime, time, timedelta, date as date_type

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views import View

from apps.runs.models import ProgramRun, TimerRun


# 集中のみ（DB値に合わせて調整）
FOCUS_CATEGORY_VALUES = {"focus", "集中"}


def _iso_local(dt):
    """JSONに返す時刻はJST(+09:00)で返す"""
    if not dt:
        return None
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, timezone.get_current_timezone())
    return timezone.localtime(dt).isoformat()


def _safe_int(v, default=0) -> int:
    try:
        return int(v)
    except Exception:
        return default


class RecordsView(LoginRequiredMixin, View):
    template_name = "runs/records.html"
    login_url = "users:login"
    redirect_field_name = "next"

    def get(self, request):
        return render(request, self.template_name)


class RecordsDataView(LoginRequiredMixin, View):
    login_url = "users:login"
    redirect_field_name = "next"

    def get(self, request):
        # date クエリ（無ければ今日）
        q = (request.GET.get("date") or "").strip()
        target_date: date_type | None = parse_date(q) if q else None
        if target_date is None:
            target_date = timezone.localdate()

        # recordsは0時区切り：[00:00, 24:00)（JST）
        tz = timezone.get_current_timezone()
        range_from = timezone.make_aware(datetime.combine(target_date, time.min), tz)
        range_to = range_from + timedelta(days=1)

        # TimerRun抽出：当日開始・pending除外・集中のみ
        tr_qs = (
            TimerRun.objects
            .select_related("program_run")
            .filter(program_run__user=request.user)
            .filter(started_at__isnull=False)
            .filter(started_at__gte=range_from, started_at__lt=range_to)
            # ★ pending（初期状態）だけ除外 → running/paused/finished/skipped/interrupted は返す
            .exclude(status=TimerRun.Status.PENDING)
           
        )

        # 集中のみ（休憩など除外）
        if hasattr(TimerRun, "category_snapshot"):
            tr_qs = tr_qs.filter(category_snapshot__in=FOCUS_CATEGORY_VALUES)

        timer_runs_list = list(tr_qs.order_by("program_run_id", "id"))

        if not timer_runs_list:
            return JsonResponse({
                "date": target_date.isoformat(),
                "programs": [],
                "timer_runs": [],
                "daily_total_elapsed_sec": 0,
            })

        # 対象TimerRunから program_run を逆算
        program_run_ids = sorted({tr.program_run_id for tr in timer_runs_list})
        program_runs = list(
            ProgramRun.objects
            .filter(user=request.user, id__in=program_run_ids)
            .order_by("-started_at", "-id")
        )

        # programごとの合計秒 & 日合計秒（このレスポンスに含めるタイマーだけで計算）
        totals_by_program = defaultdict(int)
        daily_total = 0
        for tr in timer_runs_list:
            sec = _safe_int(getattr(tr, "elapsed_sec", 0) or 0)
            totals_by_program[tr.program_run_id] += sec
            daily_total += sec

        # programs
        programs = []
        for pr in program_runs:
            program_name = (
                getattr(pr, "program_name_snapshot", None)
                or getattr(pr, "program_name", None)
                or "（no name）"
            )
            programs.append({
                "program_run_id": pr.id,
                "program_name": program_name,
                "total_elapsed_sec": totals_by_program.get(pr.id, 0),
                "updated_at": (
                    _iso_local(getattr(pr, "updated_at", None))
                    or _iso_local(getattr(pr, "ended_at", None))
                    or _iso_local(getattr(pr, "started_at", None))
                ),
            })

        # timer_runs
        # 方針：
        # - ended_at が null の場合、フロントで "--:--" 表示
        # - ended_at が null で paused_at がある場合、フロントが paused_at を代替表示できるよう paused_at を返す
        timer_runs = []
        for tr in timer_runs_list:
            timer_name = getattr(tr, "timer_name_snapshot", None) or "（no name）"
            started = getattr(tr, "started_at", None)
            ended = getattr(tr, "ended_at", None)
            paused = getattr(tr, "paused_at", None)

            timer_runs.append({
                "program_run_id": tr.program_run_id,
                "timer_run_id": tr.id,
                "timer_name": timer_name,

                # 開始時刻（キー名は started_at に統一）
                "started_at": _iso_local(started),

                # 完了時刻（無ければ null のまま返す）
                "ended_at": _iso_local(ended),

                "updated_at": (
                    _iso_local(getattr(tr, "updated_at", None))
                    or _iso_local(ended)
                    or _iso_local(started)
                ),
                "elapsed_sec": _safe_int(getattr(tr, "elapsed_sec", 0) or 0),
                "memo": getattr(tr, "memo", None),

                "status": tr.status,
                "status_label": tr.get_status_display(),  
            })

        return JsonResponse({
            "date": target_date.isoformat(),
            "programs": programs,
            "timer_runs": timer_runs,
            "daily_total_elapsed_sec": int(daily_total),
        })

