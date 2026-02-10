from django.contrib import admin
from django.urls import path

# Импортируем нашу функцию из приложения gallery
from gallery.views import home
from gallery.views import about
from gallery.views import upload
# Импорты для настройки медиа
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Пустая строка '' означает главную страницу сайта (http://localhost:8000/)
    path('', home, name='home'),
    path('about/', about, name='about'),
    path('upload/', upload, name='upload'),
]

# ВНИМАНИЕ: Эта магия работает только если DEBUG = True (режим разработки)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)