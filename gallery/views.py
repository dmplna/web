from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages  # импортируем messages
from .models import Asset # Импортируем модель, чтобы спрашивать данные
from .forms import AssetForm # Импортируем нашу новую форму

# request — это "письмо" от браузера с данными о пользователе
def home(request):
    # ORM Запрос: "Дай мне все объекты Asset из базы"
    # all() возвращает хаос.
    # order_by('-created_at') сортирует по полю created_at.
    # Минус (-) означает "по убыванию" (DESC).
    assets = Asset.objects.all().order_by('-created_at')

    context_data = {
        'page_title': 'Главная галерея',
        'assets': assets, # Передаем реальный список
    }

    return render(request, 'gallery/index.html', context_data)

def about(request):
    context_data = {
        'page_title': 'О проекте',
    }

    return render(request, 'gallery/about.html', context_data)

def upload(request):
    if request.method == 'POST':
        # Сценарий: Пользователь нажал "Отправить"
        # ВАЖНО: Передаем request.FILES, иначе файл потеряется!
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            # Если все поля заполнены верно - сохраняем в БД
            form.save()
            messages.success(request, 'Файл успешно загружен!')
            # И перекидываем пользователя на главную
            return redirect('upload')
    else:
        # Сценарий: Пользователь просто зашел на страницу (GET)
        form = AssetForm() # Создаем пустую форму

    return render(request, 'gallery/upload.html', {'form': form})