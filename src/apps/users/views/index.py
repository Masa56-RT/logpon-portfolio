from django.shortcuts import render, redirect
from django.views import View

# Create your views here.
class IndexView(View):
    def get(self, request, *args, **kwargs):
        return render(request, 'users/index.html')

index = IndexView.as_view()
