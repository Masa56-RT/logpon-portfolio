from django.shortcuts import render, redirect
from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from ...models.users import User

class ProfileView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        template_name = 'users/profile.html'
        user_id = self.request.user.id
        user_obj = User.objects.filter(id=user_id).get()
        email = user_obj.email
        username = user_obj.username
        return render(request, template_name, context={'email': email, 'username':username})
