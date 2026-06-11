# YOLOv8 Object Detector

Aplicación web para la detección de objetos en tiempo real directamente en el navegador utilizando el modelo YOLOv8.

## 🚀 Características

* **Detección en el Navegador**: Ejecuta el modelo YOLOv8 localmente en el navegador, lo que garantiza privacidad y un procesamiento rápido sin necesidad de enviar datos a un servidor.
* **Múltiples Fuentes de Entrada**:
  * Subida de imágenes de forma sencilla (Drag & Drop o explorador de archivos).
  * Análisis de video en vivo utilizando la cámara web.
* **Ajustes de Detección (Detection Settings)**:
  * Control deslizante para ajustar el umbral de confianza (Confidence Threshold).
* **Filtro de Clases (Class Filter)**:
  * Capacidad para filtrar las detecciones entre 80 clases diferentes de COCO.
  * Categorías organizadas (Personas, Vehículos, Animales, Deportes, Comida, Cocina, Muebles, Electrónica, etc.) para facilitar la selección.
* **Interfaz Moderna**: Interfaz de usuario intuitiva en modo oscuro (Dark Mode) con indicadores de estado del modelo.

## 🛠️ Tecnologías Utilizadas

Basado en la estructura del proyecto, se utilizan las siguientes tecnologías:
* **Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Librería UI**: [React](https://reactjs.org/)
* **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
* **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
* **Modelo**: YOLOv8 (ejecutado en el entorno web)

## ⚙️ Instalación y Uso local

Sigue estos pasos para ejecutar el proyecto en tu máquina local:

1. **Clonar el repositorio**
   ```bash
   git clone [https://github.com/lourdesaybxr/YOLOv8ObjectDetector.git](https://github.com/lourdesaybxr/YOLOv8ObjectDetector.git)
   cd YOLOv8ObjectDetector

2. **Navega al directorio del proyecto:**

   ```Bash
   cd YOLOv8ObjectDetector

3. **Instala las dependencias:**
   Usando npm, yarn o pnpm:
   ```Bash
    npm install
    # o
    yarn install
    # o
    pnpm install
   
4. **Inicia el servidor de desarrollo:**
   ```Bash
   npm run dev
   # o
   yarn dev
   
5. **Abre la aplicación:
Navega a http://localhost:3000 en tu navegador para ver la interfaz.**


YOLOv8ObjectDetector/
 
├── app/           
# Rutas y páginas de Next.js (App Router)
├── components/   
# Componentes reutilizables de React (UI, controles)
├── hooks/ 


# Custom hooks de React (lógica de estado, webcam)
├── lib/               # Utilidades, configuración del modelo YOLOv8
├── public/            # Archivos estáticos y modelos exportados
└── styles/            # Estilos globales (Tailwind)



