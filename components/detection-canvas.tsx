'use client';

import { useRef, useEffect } from 'react';
import { Detection, drawDetections } from '@/lib/yolo-utils';

interface DetectionCanvasProps {
  image: HTMLImageElement | null;
  video?: HTMLVideoElement | null;
  detections: Detection[];
  isLive?: boolean;
}

export function DetectionCanvas({ image, video, detections, isLive }: DetectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Determinamos la fuente (video o imagen)
    const source = isLive ? video : image;
    if (!source) return;

    // Inicializamos las dimensiones a 0
    let sourceWidth = 0;
    let sourceHeight = 0;

    // Obtenemos dimensiones de forma SEGURA y ROBUSTA
    if (isLive && video) {
      // Para video, confiamos en `videoWidth`, que se llena tras `loadedmetadata`.
      sourceWidth = video.videoWidth;
      sourceHeight = video.videoHeight;
    } else if (!isLive && image) {
      // Para imagen estática, SÓLO obtenemos dimensiones si está COMPLETAMENTE CARGADA
      if (image.complete && image.naturalWidth > 0) {
        sourceWidth = image.naturalWidth;
        sourceHeight = image.naturalHeight;
      }
    }

    // Comprobación de seguridad final: si alguna dimensión es 0, no dibujamos nada.
    if (sourceWidth === 0 || sourceHeight === 0) {
      // DESCOMENTA ESTA LÍNEA PARA DEPURAR:
      // console.log(`Detección saltada: sourceWidth=${sourceWidth}, sourceHeight=${sourceHeight}, isLive=${isLive}`);
      return; 
    }

    // --- A PARTIR DE AQUÍ EL CÓDIGO ES EL MISMO PARA EL TAMAÑO Y DIBUJO ---

    // Set canvas size to match container while maintaining aspect ratio
    const containerRect = container.getBoundingClientRect();
    const aspectRatio = sourceWidth / sourceHeight;
    
    let canvasWidth = containerRect.width;
    let canvasHeight = containerRect.width / aspectRatio;

    if (canvasHeight > containerRect.height) {
      canvasHeight = containerRect.height;
      canvasWidth = containerRect.height * aspectRatio;
    }

    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // CORRECCIÓN: Dibuja el video si estamos en vivo, o la imagen si es estática
    // Usamos el tamaño del canvas como destino para un estiramiento correcto
    if (isLive && video) {
      // console.log('Dibujando frame de video en vivo'); // DESCOMENTA PARA DEPURAR
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else if (!isLive && image) {
      // console.log('Dibujando imagen estática cargada'); // DESCOMENTA PARA DEPURAR
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    drawDetections(ctx, detections, sourceWidth, sourceHeight);
  }, [image, video, detections, isLive]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-secondary/20 rounded-lg overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
      />
    </div>
  );
}