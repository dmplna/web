import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 2. Экспортируем главную функцию
// Она принимает ID HTML-элемента, в который нужно вставить 3D
export function loadModel(containerId, modelUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // --- А. СЦЕНА ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // Светло-серый фон

    // --- Б. КАМЕРА ---
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    // --- В. РЕНДЕРЕР (Художник) ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // antialias - сглаживание
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Вставляем "холст" (canvas) внутрь нашего div
    container.innerHTML = ''; // Очищаем текст "Wait..."
    container.appendChild(renderer.domElement);

    // --- Г. СВЕТ ---
    const dirLight = new THREE.DirectionalLight(0xffffff, 2); // Солнце
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Добавим еще мягкий свет, чтобы тени не были черными
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // --- Г. ЗАГРУЗКА МОДЕЛИ ---
    const loader = new GLTFLoader();

    loader.load(
        modelUrl, // URL, который пришел из Django
        (gltf) => {
            // --- SUCCESS ---
            const model = gltf.scene;
            
            // Здесь будет магия центровки (Шаг 2)
            fitCameraToObject(camera, model, 1.5);
            scene.add(model);
        },
        undefined, // Progress (можно пропустить)
        (error) => {
            // --- ERROR ---
            console.error('Ошибка загрузки:', error);
            container.innerHTML = '❌ Error';
        }
    );

    // --- Е. АНИМАЦИЯ (Loop) ---
    function animate() {
        requestAnimationFrame(animate); // Запрашиваем следующий кадр
        // Рисуем кадр
        renderer.render(scene, camera);
        scene.rotation.y += 0.005;
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

function fitCameraToObject(camera, object, offset = 1.25) {
    // 1. Вычисляем Bounding Box (коробку, в которую влезает модель)
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

    // 2. Находим центр этой коробки и её размер
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // 3. Самая длинная сторона модели (чтобы точно влезла)
    const maxDim = Math.max(size.x, size.y, size.z);

    // 4. Смещаем саму модель так, чтобы её центр стал в 0,0,0
    // Вместо того чтобы двигать камеру за моделью, проще притянуть модель к центру мира
    object.position.x = -center.x;
    object.position.y = -center.y; // Теперь модель стоит на "полу" центра
    object.position.z = -center.z;

    // 5. Отодвигаем камеру назад
    // Немного тригонометрии: вычисляем дистанцию в зависимости от угла обзора (FOV)
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    // Умножаем на коэффициент (offset), чтобы модель не упиралась в края экрана
    cameraZ *= offset;
    // Устанавливаем камеру
    camera.position.set(0, maxDim * 0.5, cameraZ); // Чуть выше центра
    // Камера должна смотреть в центр мира (где теперь стоит модель)
    camera.lookAt(0, 0, 0);
    // Обновляем параметры камеры
    camera.updateProjectionMatrix();
}