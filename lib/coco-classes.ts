// 80 COCO dataset classes for YOLOv8
export const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
] as const;

export type CocoClass = typeof COCO_CLASSES[number];

// Generate distinct colors for each class using HSL
export const CLASS_COLORS: Record<string, string> = {};
COCO_CLASSES.forEach((className, index) => {
  const hue = (index * 360 / COCO_CLASSES.length) % 360;
  CLASS_COLORS[className] = `hsl(${hue}, 85%, 55%)`;
});

// Grouped categories for easier filtering
export const CLASS_CATEGORIES = {
  'People': ['person'],
  'Vehicles': ['bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat'],
  'Animals': ['bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe'],
  'Sports': ['frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket'],
  'Food': ['banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake'],
  'Kitchen': ['bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator'],
  'Furniture': ['chair', 'couch', 'potted plant', 'bed', 'dining table', 'toilet'],
  'Electronics': ['tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone'],
  'Accessories': ['backpack', 'umbrella', 'handbag', 'tie', 'suitcase'],
  'Outdoor': ['traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench'],
  'Other': ['book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush']
} as const;
