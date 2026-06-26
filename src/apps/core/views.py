from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def health_check(request):
    """ヘルスチェック用エンドポイント（ALB用）"""
    return JsonResponse({'status': 'healthy'}, status=200)
