from django.urls import path, reverse_lazy
from django.contrib.auth import views as auth_views
from .views import index, login, logout, password_reset, signup
from .views.profile import profile, profile_email, profile_username, profile_password

app_name = 'users'
urlpatterns = [
    path('', index.IndexView.as_view(), name='index'),
    path('login/', login.UserLoginView.as_view(), name='login'),
    path('logout/', logout.UserLogoutView.as_view(), name='logout'),
    path('signup/', signup.SignupView.as_view(), name='signup'),

    # ①メール入力送信
    path('password-reset/', password_reset.UserPasswordResetView.as_view(), name='password-reset'),
    # ②送信完了
    path('password-reset/done/', auth_views.PasswordResetDoneView.as_view(
        template_name='users/password-reset-done.html'),
        name='password-reset-done'
        ),
    # ③メールのリンク先（新パスワード入力）
    path('password-reset/confirm/<uidb64>/<token>/', auth_views.PasswordResetConfirmView.as_view(
        template_name='users/password-reset-confirm.html',
        success_url=reverse_lazy('users:password-reset-complete')),
        name='password-reset-confirm'
        ),
    # ④完了
    path('password-reset/complete/',auth_views.PasswordResetCompleteView.as_view(
        template_name='users/password-reset-complete.html',),
        name='password-reset-complete'
        ),
    path('profile/', profile.ProfileView.as_view(), name='profile'),
    path('profile/<int:pk>/email/', profile_email.ProfileEmailView.as_view(), name='profile-email'),
    path('profile/<int:pk>/username/', profile_username.ProfileUsernameView.as_view(), name='profile-username'),
    path('profile/<int:pk>/password/', profile_password.ProfilePasswordView.as_view(), name='profile-password'),
]
