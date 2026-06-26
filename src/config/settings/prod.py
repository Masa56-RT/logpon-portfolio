from .base import *
import os

DEBUG = False
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', '').split(',')

# ========================================
# プロキシ設定（重要！）
# ========================================

# ALBのX-Forwarded-Protoヘッダーを信頼
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# ========================================
# CSRF設定
# ========================================

CSRF_TRUSTED_ORIGINS = [
            'https://logpon.com',
                'https://*.logpon.com',
                ]

CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_AGE = 31536000
CSRF_COOKIE_SECURE = True  # ← これが使えるようになる
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'

# ========================================
# セッション設定
# ========================================

SESSION_COOKIE_AGE = 1209600
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_NAME = 'logpon_sessionid'
SESSION_COOKIE_SECURE = True  # ← これも使えるようになる
SESSION_COOKIE_SAMESITE = 'Lax'

# ========================================
# その他のセキュリティ設定
# ========================================

SECURE_SSL_REDIRECT = False  # ALBでリダイレクト済み
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ========== ログ設定 ==========
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

# ========== AWS S3設定 ==========
USE_S3 = os.getenv('USE_S3', 'False') == 'True'

if USE_S3:
    AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'ap-northeast-1')
    AWS_S3_CUSTOM_DOMAIN = os.getenv(
        'AWS_S3_CUSTOM_DOMAIN',
        f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    )
    SOUNDS_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME', 'logpon-sounds')

# ========== 静的ファイル ==========
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

# ========== データベース接続プーリング ==========
DATABASES['default']['CONN_MAX_AGE'] = 60

# ========== セッション設定 ==========
SESSION_COOKIE_AGE = 1209600
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_NAME = 'logpon_sessionid'

# ========== CSRF設定 ==========
CSRF_COOKIE_NAME = 'csrftoken'
CSRF_COOKIE_AGE = 31536000
