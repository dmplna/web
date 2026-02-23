from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages  # импортируем messages
from .models import Asset # Импортируем модель, чтобы спрашивать данные
from .forms import AssetForm # Импортируем нашу новую форму
import base64
from django.core.files.base import ContentFile # Обертка для сохранения файлов

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
            # 1. Создаем объект, но пока НЕ сохраняем в базу (commit=False)
            new_asset = form.save(commit=False)

            # 2. Обрабатываем картинку из скрытого поля
            image_data = request.POST.get('image_data') # Получаем строку Base64

            if image_data:
                # Формат строки: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
                # Нам нужно отрезать заголовок "data:image/jpeg;base64,"
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1] # получаем "jpeg"

                # Декодируем текст в байты
                data = base64.b64decode(imgstr)

                # Создаем имя файла (берем имя модели + .jpg)
                file_name = f"{new_asset.title}_thumb.{ext}"

                # Сохраняем байты в поле image
                # ContentFile превращает байты в объект, который понимает Django FileField
                new_asset.image.save(file_name, ContentFile(data), save=False)

            # 3. Финальное сохранение в БД
            new_asset.save()
            messages.success(request, 'Файл успешно загружен!') # Сообщение об успешной загрузке
            return redirect('upload')
    else:
        # Сценарий: Пользователь просто зашел на страницу (GET)
        form = AssetForm() # Создаем пустую форму

    return render(request, 'gallery/upload.html', {'form': form})