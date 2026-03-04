import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// 2. Экспортируем главную функцию
// Она принимает ID HTML-элемента, в который нужно вставить 3D
export function loadModel(containerId, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // --- А. СЦЕНА ---
    const scene = new THREE.Scene();
    scene.background = null;

    // --- Б. КАМЕРА ---
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        100
    );

    // --- В. РЕНДЕРЕР (Художник) ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // antialias - сглаживание
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Для четкости на Retina экранах
    
    // --- ВАЖНЫЕ НАСТРОЙКИ ЦВЕТА ---
    // 1. Говорим, что текстуры и свет должны быть конвертированы под монитор
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // 2. Включаем Tone Mapping (как в кино)
    // ACESFilmic - это стандарт индустрии (Unreal Engine использует его же)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // 3. Настраиваем экспозицию (яркость)
    renderer.toneMappingExposure = 1.0;

    // Вставляем "холст" (canvas) внутрь нашего div
    container.innerHTML = ''; // Очищаем текст "Wait..."
    container.appendChild(renderer.domElement);
    
    // Устанавливаем градиент фона на сам canvas
    renderer.domElement.style.background = 'radial-gradient(circle, #ffffff, #ececec)';

    // --- Г. УПРАВЛЕНИЕ ---
    const controls = new OrbitControls(camera, renderer.domElement);

    // Включаем инерцию (damping), чтобы вращение было плавным, как в Sketchfab
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Включаем зум
    controls.enableZoom = true;

    // Ограничиваем зум (чтобы не улететь сквозь модель)
    controls.minDistance = 1.5;
    controls.maxDistance = 50;
    controls.zoomSpeed = 2.0;

    // --- Д. СВЕТ ---
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Создаем нейтральную "комнату"
    const roomEnvironment = new RoomEnvironment();

    // Говорим сцене: "Используй эту комнату как источник света и отражений"
    scene.environment = pmremGenerator.fromScene(roomEnvironment).texture;

    // --- Е. ЗАГРУЗКА МОДЕЛИ ---
    // --- 1. Генерируем HTML лоадера программно ---
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'loader-overlay';
    loaderDiv.innerHTML = `
        <div style="color: #666; font-size: 0.9rem;">Loading...</div>
        <div class="progress-bar">
            <div class="progress-fill"></div>
        </div>
    `;
    container.appendChild(loaderDiv);

    // Находим полоску, чтобы менять её ширину
    const progressFill = loaderDiv.querySelector('.progress-fill');

    // --- 2. Обновляем вызов загрузчика ---
    const loader = new GLTFLoader();

    loader.load(
        modelUrl,

        // A. ON LOAD (Успех)
        (gltf) => {
            const model = gltf.scene;
            fitCameraToObject(camera, model, controls, 1.5);
            scene.add(model);

            // Скрываем лоадер
            loaderDiv.style.opacity = '0';
            setTimeout(() => {
                loaderDiv.remove(); // Удаляем из DOM через 0.3 сек
            }, 300);
        },

        // B. ON PROGRESS (Прогресс)
        (xhr) => {
            // xhr.total - общий вес файла в байтах
            // xhr.loaded - сколько скачалось
            if (xhr.total > 0) {
                const percent = (xhr.loaded / xhr.total) * 100;
                progressFill.style.width = percent + '%';
            }
        },

        // C. ON ERROR (Ошибка)
        (error) => {
            console.error('Ошибка загрузки:', error);
            loaderDiv.innerHTML = `<div class="error-msg">❌ Ошибка загрузки<br><small>Проверьте файл</small></div>`;
        }
    );

    // --- Ж. АНИМАЦИЯ (Loop) ---
    function animate() {
        requestAnimationFrame(animate); // Запрашиваем следующий кадр

        // ОБЯЗАТЕЛЬНО: Обновляем контроллер в каждом кадре
        controls.update();

        renderer.render(scene, camera);
    }

    // Запуск
    animate();
    console.log("3D сцена запущена в", containerId);

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        // Обновляем параметры камеры
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        
        // Обновляем размер холста
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

function fitCameraToObject(camera, object, controls) {
    // 1. Вычисляем Bounding Box (коробку, в которую влезает модель)
    const boundingBox = new THREE.Box3().setFromObject(object);

    // 2. Находим центр этой коробки и её размер
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // 3. Самая длинная сторона модели (чтобы точно влезла)
    const maxDim = Math.max(size.x, size.y, size.z);

    // Масштабируем модель, чтобы она имела одинаковый размер с другими
    const targetSize = 20; // Целевой размер для всех моделей
    const scale = targetSize / maxDim;
    object.scale.multiplyScalar(scale);
    
    // Пересчитываем Bounding Box после масштабирования
    const boundingBoxScaled = new THREE.Box3().setFromObject(object);
    const centerScaled = boundingBoxScaled.getCenter(new THREE.Vector3());
    const sizeScaled = boundingBoxScaled.getSize(new THREE.Vector3());
    const maxDimScaled = Math.max(sizeScaled.x, sizeScaled.y, sizeScaled.z);

    // 4. Смещаем саму модель так, чтобы её центр стал в 0,0,0
    object.position.x = -centerScaled.x;
    object.position.y = -centerScaled.y;
    object.position.z = -centerScaled.z;

    // 5. Отодвигаем камеру назад
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDimScaled / 2 / Math.tan(fov / 2)) * 1.5;

    // Устанавливаем камеру
    camera.position.set(cameraZ, cameraZ * 0.5, cameraZ); // Чуть выше центра
    // Камера должна смотреть в центр мира (где теперь стоит модель)
    camera.lookAt(0, 0, 0);
    // Обновляем цель контроллера, чтобы вращение было вокруг центра модели
    controls.target.set(0, 0, 0);
    controls.update();
}