from django.shortcuts import render
from django.http import HttpResponse
from .models import Asset # Импортируем модель, чтобы спрашивать данные

# request — это "письмо" от браузера с данными о пользователе
def home(request):
    # ORM Запрос: "Дай мне все объекты Asset из базы"
    # all() возвращает хаос.
    # order_by('-created_at') сортирует по полю created_at.
    # Минус (-) означает "по убыванию" (DESC).
    assets = Asset.objects.all().order_by('-created_at')

    context_data = {
        'page_title': 'Главная Галерея',
        'assets': assets, # Передаем реальный список
    }

    return render(request, 'gallery/index.html', context_data)

def about(request):
    context_data = {
        'page_title': 'О проекте',
    }

    return render(request, 'gallery/about.html', context_data)  