'use client';

import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with ONNX runtime
const ObjectDetector = dynamic(
  () => import('@/components/object-detector').then(mod => mod.ObjectDetector),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Object Detector...</p>
        </div>
      </div>
    )
  }
);

export default function Home() {
  return <ObjectDetector />;
}
