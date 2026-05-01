'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Cpu, Loader2, AlertCircle, ImageIcon, Video, Settings2 } from 'lucide-react';
import { useYoloModel } from '@/hooks/use-yolo-model';
import { preprocessImage, postprocessOutput, Detection } from '@/lib/yolo-utils';
import { COCO_CLASSES, CLASS_CATEGORIES } from '@/lib/coco-classes';
import { ClassFilter } from './class-filter';
import { ImageDropzone } from './image-dropzone';
import { CameraView } from './camera-view';
import { DetectionCanvas } from './detection-canvas';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


const MODEL_URL = '/yolov8n.onnx';

export function ObjectDetector() {
  const { model, isLoading, loadingProgress, error, loadModel, runInference } = useYoloModel();

  const [enabledClasses, setEnabledClasses] = useState<Set<string>>(new Set(COCO_CLASSES));
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('image');
  const [showSidebar, setShowSidebar] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load model on mount
  useEffect(() => {
    loadModel(MODEL_URL).catch(console.error);
  }, [loadModel]);

  // Handle class toggle
  const handleClassToggle = useCallback((className: string) => {
    setEnabledClasses(prev => {
      const next = new Set(prev);
      if (next.has(className)) {
        next.delete(className);
      } else {
        next.add(className);
      }
      return next;
    });
  }, []);

  // Select all classes
  const handleSelectAll = useCallback(() => {
    setEnabledClasses(new Set(COCO_CLASSES));
  }, []);

  // Deselect all classes
  const handleDeselectAll = useCallback(() => {
    setEnabledClasses(new Set());
  }, []);

  // Toggle category selection
  const handleSelectCategory = useCallback((category: string) => {
    const classes = CLASS_CATEGORIES[category as keyof typeof CLASS_CATEGORIES];
    setEnabledClasses(prev => {
      const next = new Set(prev);
      const allSelected = classes.every(c => next.has(c));

      if (allSelected) {
        classes.forEach(c => next.delete(c));
      } else {
        classes.forEach(c => next.add(c));
      }

      return next;
    });
  }, []);

  // Process image
  const processImage = useCallback(async (imageSource: HTMLImageElement | HTMLVideoElement) => {
    if (!model || isProcessing) return;

    setIsProcessing(true);

    try {
      const { tensor, originalWidth, originalHeight } = await preprocessImage(imageSource);
      const output = await runInference(tensor);

      if (output) {
        const results = postprocessOutput(
          output,
          originalWidth,
          originalHeight,
          confidenceThreshold,
          enabledClasses
        );
        setDetections(results);
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [model, isProcessing, runInference, confidenceThreshold, enabledClasses]);

  // Handle image selection
  const handleImageSelect = useCallback((image: HTMLImageElement) => {
    setCurrentImage(image);
    setDetections([]);
    if (model) {
      processImage(image);
    }
  }, [model, processImage]);

  // Handle image clear
  const handleImageClear = useCallback(() => {
    setCurrentImage(null);
    setDetections([]);
  }, []);

  // Handle video frame processing
  const handleVideoFrame = useCallback(async (video: HTMLVideoElement) => {
    videoRef.current = video;
    await processImage(video);
  }, [processImage]);

  // Re-process image when filters change
  useEffect(() => {
    if (currentImage && model && activeTab === 'image') {
      processImage(currentImage);
    }
  }, [confidenceThreshold, enabledClasses]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        
        'h-full border-r border-border bg-card transition-all duration-300 shrink-0',
        showSidebar ? 'w-64' : 'w-0 overflow-hidden'
      )}>
        <ClassFilter
          enabledClasses={enabledClasses}
          onClassToggle={handleClassToggle}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onSelectCategory={handleSelectCategory}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Settings2 className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">YOLOv8 Object Detector</h1>
              <p className="text-sm text-muted-foreground">Real-time object detection in browser</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {model ? (
              <div className="flex items-center gap-2 text-sm text-primary">
                <Cpu className="w-4 h-4" />
                <span>Model Ready</span>
              </div>
            ) : isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading model...</span>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Error loading model</span>
              </div>
            ) : null}
          </div>
        </header>

        {/* Loading Progress */}
        {isLoading && (
          <div className="px-6 py-3 bg-secondary/30 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-foreground">Downloading YOLOv8n model...</span>
              <span className="text-sm text-muted-foreground">{loadingProgress}%</span>
            </div>
            <Progress value={loadingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              This may take a moment (~6MB download)
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => loadModel(MODEL_URL)}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Controls */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detection Settings</CardTitle>
                <CardDescription>Adjust confidence threshold for detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {/* Corrección Tailwind 2: Cambiado de min-w-[120px] a min-w-30 */}
                  <span className="text-sm text-muted-foreground min-w-30">
                    Confidence: {(confidenceThreshold * 100).toFixed(0)}%
                  </span>
                  <Slider
                    value={[confidenceThreshold]}
                    onValueChange={([value]) => setConfidenceThreshold(value)}
                    min={0.1}
                    max={0.9}
                    step={0.05}
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="image" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Image Upload
                </TabsTrigger>
                <TabsTrigger value="webcam" className="gap-2">
                  <Video className="w-4 h-4" />
                  Live Webcam
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <ImageDropzone
                      onImageSelect={handleImageSelect}
                      onClear={handleImageClear}
                      hasImage={!!currentImage}
                      disabled={!model || isLoading}
                    />

                    {currentImage && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-foreground">
                            Detection Results
                          </h3>
                          {isProcessing ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {detections.length} object{detections.length !== 1 ? 's' : ''} detected
                            </span>
                          )}
                        </div>

                        <div className="aspect-video">
                          <DetectionCanvas
                            image={currentImage}
                            detections={detections}
                          />
                        </div>

                        {/* Detection List */}
                        {detections.length > 0 && (
                          <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                            <h4 className="text-xs font-medium text-muted-foreground mb-2">
                              Detected Objects
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {detections.map((det, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 px-2 py-1 bg-card rounded-md text-sm"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: det.color }}
                                  />
                                  <span className="text-foreground capitalize">{det.class}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {(det.confidence * 100).toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="webcam" className="mt-0">
                <Card>
                  <CardContent className="p-6">
                    <div className="relative">
                      <CameraView
                        onFrame={handleVideoFrame}
                        isDetecting={!!model && !isLoading}
                        disabled={!model || isLoading}
                      />

                      {/* Overlay canvas for live detection */}
                      {videoRef.current && detections.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                          <DetectionCanvas
                            // Corrección TypeScript: pasamos image en null explícitamente
                            image={null as unknown as HTMLImageElement} 
                            video={videoRef.current}
                            detections={detections}
                            isLive
                          />
                        </div>
                      )}
                    </div>

                    {/* Live Detection Stats */}
                    {activeTab === 'webcam' && detections.length > 0 && (
                      <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">
                          Live Detection ({detections.length} objects)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {detections.map((det, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-2 py-1 bg-card rounded-md text-sm"
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: det.color }}
                              />
                              <span className="text-foreground capitalize">{det.class}</span>
                              <span className="text-muted-foreground text-xs">
                                {(det.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}