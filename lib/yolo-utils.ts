import * as ort from 'onnxruntime-web';
import { COCO_CLASSES, CLASS_COLORS } from './coco-classes';

export interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  classId: number;
  confidence: number;
  color: string;
}

// Model input size for YOLOv8
export const MODEL_WIDTH = 640;
export const MODEL_HEIGHT = 640;

// Preprocess image for YOLOv8 inference
export async function preprocessImage(
  imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<{ tensor: ort.Tensor; originalWidth: number; originalHeight: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = MODEL_WIDTH;
  canvas.height = MODEL_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  let originalWidth: number;
  let originalHeight: number;

  if (imageSource instanceof HTMLVideoElement) {
    originalWidth = imageSource.videoWidth;
    originalHeight = imageSource.videoHeight;
  } else {
    originalWidth = imageSource.width;
    originalHeight = imageSource.height;
  }

  // Draw image scaled to model input size
  ctx.drawImage(imageSource, 0, 0, MODEL_WIDTH, MODEL_HEIGHT);

  // Get image data and normalize
  const imageData = ctx.getImageData(0, 0, MODEL_WIDTH, MODEL_HEIGHT);
  const { data } = imageData;

  // Convert to float32 and normalize to
  // YOLOv8 expects NCHW format (batch, channels, height, width)
  const redChannel = new Float32Array(MODEL_WIDTH * MODEL_HEIGHT);
  const greenChannel = new Float32Array(MODEL_WIDTH * MODEL_HEIGHT);
  const blueChannel = new Float32Array(MODEL_WIDTH * MODEL_HEIGHT);

  for (let i = 0; i < MODEL_WIDTH * MODEL_HEIGHT; i++) {
    redChannel[i] = data[i * 4] / 255;
    greenChannel[i] = data[i * 4 + 1] / 255;
    blueChannel[i] = data[i * 4 + 2] / 255;
  }

  // Combine channels into NCHW format
  const inputData = new Float32Array(3 * MODEL_WIDTH * MODEL_HEIGHT);
  inputData.set(redChannel, 0);
  inputData.set(greenChannel, MODEL_WIDTH * MODEL_HEIGHT);
  inputData.set(blueChannel, 2 * MODEL_WIDTH * MODEL_HEIGHT);

  const tensor = new ort.Tensor('float32', inputData, [1, 3, MODEL_HEIGHT, MODEL_WIDTH]);

  return { tensor, originalWidth, originalHeight };
}

// Non-Maximum Suppression
function nms(detections: Detection[], iouThreshold: number = 0.45): Detection[] {
  if (detections.length === 0) return [];

  // Sort by confidence
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const selected: Detection[] = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    selected.push(current);

    // Remove overlapping detections
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].classId === current.classId) {
        const iou = calculateIoU(current.bbox, sorted[i].bbox);
        if (iou > iouThreshold) {
          sorted.splice(i, 1);
        }
      }
    }
  }

  return selected;
}

// Calculate Intersection over Union
function calculateIoU(
  boxA: [number, number, number, number],
  boxB: [number, number, number, number]
): number {
  const [x1A, y1A, w1, h1] = boxA;
  const [x1B, y1B, w2, h2] = boxB;

  const x2A = x1A + w1;
  const y2A = y1A + h1;
  const x2B = x1B + w2;
  const y2B = y1B + h2;

  const xInter1 = Math.max(x1A, x1B);
  const yInter1 = Math.max(y1A, y1B);
  const xInter2 = Math.min(x2A, x2B);
  const yInter2 = Math.min(y2A, y2B);

  const interWidth = Math.max(0, xInter2 - xInter1);
  const interHeight = Math.max(0, yInter2 - yInter1);
  const interArea = interWidth * interHeight;

  const areaA = w1 * h1;
  const areaB = w2 * h2;
  const unionArea = areaA + areaB - interArea;

  return unionArea > 0 ? interArea / unionArea : 0;
}

// Post-process YOLOv8 output
export function postprocessOutput(
  output: ort.Tensor,
  originalWidth: number,
  originalHeight: number,
  confidenceThreshold: number,
  enabledClasses: Set<string>
): Detection[] {
  const data = output.data as Float32Array;
  const [, numFeatures, numBoxes] = output.dims;

  const detections: Detection[] = [];
  const scaleX = originalWidth / MODEL_WIDTH;
  const scaleY = originalHeight / MODEL_HEIGHT;

  for (let i = 0; i < numBoxes; i++) {
    // Get box coordinates (center x, center y, width, height)
    const cx = data[0 * numBoxes + i];
    const cy = data[1 * numBoxes + i];
    const w = data[2 * numBoxes + i];
    const h = data[3 * numBoxes + i];

    // Find class with highest confidence
    let maxConf = 0;
    let maxClassId = 0;

    for (let c = 0; c < numFeatures - 4; c++) {
      const conf = data[(4 + c) * numBoxes + i];
      if (conf > maxConf) {
        maxConf = conf;
        maxClassId = c;
      }
    }

    if (maxConf < confidenceThreshold) continue;

    const className = COCO_CLASSES[maxClassId];
    if (!enabledClasses.has(className)) continue;

    // Convert to [x, y, width, height] and scale to original image size
    const x = (cx - w / 2) * scaleX;
    const y = (cy - h / 2) * scaleY;
    const width = w * scaleX;
    const height = h * scaleY;

    detections.push({
      bbox: [x, y, width, height],
      class: className,
      classId: maxClassId,
      confidence: maxConf,
      color: CLASS_COLORS[className]
    });
  }

  // Apply NMS
  return nms(detections);
}

// Draw detections on canvas
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  canvasWidth: number,
  canvasHeight: number
): void {
  // CORRECCIÓN: Comentamos esta línea para que no borre el video/imagen de fondo
  // ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  detections.forEach((detection) => {
    const [x, y, width, height] = detection.bbox;

    // Draw bounding box
    ctx.strokeStyle = detection.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Draw label background
    const label = `${detection.class} ${(detection.confidence * 100).toFixed(1)}%`;
    ctx.font = 'bold 14px sans-serif';
    const textWidth = ctx.measureText(label).width;
    const textHeight = 18;

    ctx.fillStyle = detection.color;
    ctx.fillRect(x, y - textHeight - 4, textWidth + 8, textHeight + 4);

    // Draw label text
    ctx.fillStyle = '#000000';
    ctx.fillText(label, x + 4, y - 6);
  });
}