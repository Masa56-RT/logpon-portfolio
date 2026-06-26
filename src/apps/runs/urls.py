from django.urls import path

from .views.program_runs import (
    ProgramRunsView,
    ProgramPagesView,
    ProgramRunApiView,
    ProgramStartView,
    ProgramResumeView,
    ProgramPauseView,
    ProgramSkipView,
    ProgramNextView,
    ProgramInterruptView,
    ProgramProgressView,
)

from .views.records import RecordsView
from .views import timer_runs, records, daily_reports

app_name = 'runs'
urlpatterns = [
    # プログラム実行初期画面表示（GET）、プログラムタイマー複製（POST）
    path('program-runs/', ProgramRunsView.as_view(), name='program-runs'),
    # 指定プログラム実行画面表示（GET）
    path('program-runs/<int:program_run_id>/', ProgramPagesView.as_view(), name='program-runs-detail'),
    path('api/program-runs/<int:program_run_id>/', ProgramRunApiView.as_view(), name='program-runs-api'),
    # プログラム状態遷移（POST）
    path('program-runs/<int:program_run_id>/start/', ProgramStartView.as_view(), name='program-runs-start'),
    path('program-runs/<int:program_run_id>/resume/', ProgramResumeView.as_view(), name='program-runs-resume'),
    path('program-runs/<int:program_run_id>/pause/', ProgramPauseView.as_view(), name='program-runs-pause'),
    path('program-runs/<int:program_run_id>/skip/', ProgramSkipView.as_view(), name ='program-runs-skip'),
    path('program-runs/<int:program_run_id>/next/', ProgramNextView.as_view(), name ='program-runs-next'),
    path('program-runs/<int:program_run_id>/interrupt/', ProgramInterruptView.as_view(), name ='program-runs-interrupt'),
    path('program-runs/<int:program_run_id>/progress/', ProgramProgressView.as_view(), name ='program-runs-progress'),

    # タイマーメモ（POST）
    path('timer-runs/<int:timer_run_id>/memo/', timer_runs.memo.TimerRunsMemoView.as_view(), name='timer-runs-memo'),

    # 実施記録確認
    path('records/', records.RecordsView.as_view(), name='records'),
    path('records/data', records.RecordsDataView.as_view(), name='records-data'),  # 追加


    # 日報
    path('daily-reports/', daily_reports.DailyReportsView.as_view(), name='daily-reports'),
]
