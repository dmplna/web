from django.db import models

class Asset(models.Model):
    # Поле для названия (строка до 200 символов)
    title = models.CharField(max_length=200, verbose_name="Название модели")

    # Поле для файла. upload_to указывает подпапку, куда сохранять файлы.
    # Внимание: Файл не ложится в базу! В базе лежит путь "3d_assets/имя_файла.glb"
    file = models.FileField(upload_to='3d_assets/', verbose_name="3D Файл")

    # blank=True - разрешаем пустые значения (на случай, если скриншот не удался)
    image = models.ImageField(upload_to='thumbnails/', blank=True, null=True, verbose_name="Превью")

    # Дата создания. auto_now_add=True ставит время автоматически в момент создания.
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата загрузки")

    # Магический метод __str__.
    # Без него в админке объекты будут называться "Asset object (1)", "Asset object (2)".
    # А с ним: "Шлем космодесантника", "Стул".
    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "3D Модель"
        verbose_name_plural = "3D Модели"