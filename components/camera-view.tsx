'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Play, Square, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraViewProps {
  onFrame: (video: HTMLVideoElement) => Promise<void>;
  isDetecting: boolean;
  disabled?: boolean;
}

export function CameraView({ onFrame, isDetecting, disabled }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setIsStreaming(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Could not access camera. Please ensure permissions are granted.');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const toggleDetection = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      setIsRunning(true);
    }
  }, [isRunning]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  // Detection loop
  useEffect(() => {
    if (!isRunning || !videoRef.current || !isDetecting) return;

    let lastTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const detect = async (timestamp: number) => {
      if (!isRunning) return;

      if (timestamp - lastTime >= frameInterval) {
        lastTime = timestamp;
        if (videoRef.current && videoRef.current.readyState >= 2) {
          await onFrame(videoRef.current);
        }
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    animationRef.current = requestAnimationFrame(detect);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, isDetecting, onFrame]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video bg-secondary/30 rounded-lg overflow-hidden border border-border">
        <video
          ref={videoRef}
          className={cn(
            'w-full h-full object-cover',
            !isStreaming && 'hidden'
          )}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {error ? (
              <div className="text-center p-4">
                <CameraOff className="w-12 h-12 mx-auto mb-3 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : (
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Camera not active</p>
              </div>
            )}
          </div>
        )}

        {isRunning && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1 bg-destructive/90 rounded-md">
            <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
            <span className="text-xs font-medium text-destructive-foreground">LIVE</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!isStreaming ? (
          <Button 
            onClick={startCamera} 
            disabled={disabled}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            {/* FIXED: Wrapped bare text in span */}
            <span>Start Camera</span>
          </Button>
        ) : (
          <>
            <Button
              variant={isRunning ? 'destructive' : 'default'}
              onClick={toggleDetection}
              disabled={disabled || !isDetecting}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  {/* FIXED: Wrapped bare text in span */}
                  <span>Stop Detection</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {/* FIXED: Wrapped bare text in span */}
                  <span>Start Detection</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={switchCamera}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={stopCamera}>
              <CameraOff className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}