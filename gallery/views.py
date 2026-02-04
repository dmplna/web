from django.shortcuts import render
from django.http import HttpResponse
# request — это "письмо" от браузера с данными о пользователе
def home(request):
    # Имитация данных из базы (список словарей)
    fake_database = [
        {'id': 1, 'name': 'Sci-Fi Helmet', 'file_size': '15 MB'},
        {'id': 2, 'name': 'Old Chair', 'file_size': '2 MB'},
        {'id': 3, 'name': 'Cyber Truck', 'file_size': '10 MB'},
        {'id': 4, 'name': 'Glass Bottle', 'file_size': '3 MB'},
    ]

    context_data = {
        'page_title': 'Главная Галерея',
        'assets': fake_database, # Передаем весь список
        'models_count': 4,
    }

    return render(request, 'gallery/index.html', context_data)

def about(request):
    context_data = {
        'page_title': 'О проекте',
    }

    return render(request, 'gallery/about.html', context_data)  