from django.http import JsonResponse

class HealthCheckMiddleware:
    """
    /health/ へのリクエストをミドルウェアで処理し、
    ALLOWED_HOSTSの検証をバイパスする
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == '/health/':
            return JsonResponse({'status': 'healthy'}, status=200)
        return self.get_response(request)
