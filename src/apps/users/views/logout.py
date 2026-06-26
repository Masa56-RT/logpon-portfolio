import logging
from django.contrib import messages
from django.contrib.auth.views import LogoutView

logger = logging.getLogger(__name__)

class UserLogoutView(LogoutView):
    def dispatch(self, request, *args, **kwargs):
        logger.info(
            '[logout] dispatch method=%s user_authenticated=%s',
            request.method,
            request.user.is_authenticated,
        )

        if request.user.is_authenticated:
            messages.success(request, 'ログアウトしました。')
        
        return super().dispatch(request, *args, **kwargs)
    