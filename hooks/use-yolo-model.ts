'use client';

import { useState, useCallback, useRef } from 'react';
import * as ort from 'onnxruntime-web';

export interface ModelState {
  model: ort.InferenceSession | null;
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
}

export function useYoloModel() {
  const [state, setState] = useState<ModelState>({
    model: null,
    isLoading: false,
    loadingProgress: 0,
    error: null
  });
  
  const modelRef = useRef<ort.InferenceSession | null>(null);

  const loadModel = useCallback(async (modelUrl: string) => {
    if (modelRef.current) {
      return modelRef.current;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, loadingProgress: 0 }));

    try {
      // Configure ONNX runtime for WebAssembly
      ort.env.wasm.numThreads = 4;
      ort.env.wasm.simd = true;
      
      // Fetch model with progress tracking
      const response = await fetch(modelUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        receivedLength += value.length;
        
        if (total > 0) {
          const progress = Math.round((receivedLength / total) * 100);
          setState(prev => ({ ...prev, loadingProgress: progress }));
        }
      }

      // Combine chunks
      const modelData = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        modelData.set(chunk, position);
        position += chunk.length;
      }

      setState(prev => ({ ...prev, loadingProgress: 95 }));

      // Create inference session
      const session = await ort.InferenceSession.create(modelData.buffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });

      modelRef.current = session;
      
      setState({
        model: session,
        isLoading: false,
        loadingProgress: 100,
        error: null
      });

      return session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        model: null,
        isLoading: false,
        loadingProgress: 0,
        error: errorMessage
      });
      throw error;
    }
  }, []);

  const runInference = useCallback(async (inputTensor: ort.Tensor): Promise<ort.Tensor | null> => {
    if (!modelRef.current) {
      console.error('Model not loaded');
      return null;
    }

    try {
      const feeds = { images: inputTensor };
      const results = await modelRef.current.run(feeds);
      return results.output0 as ort.Tensor;
    } catch (error) {
      console.error('Inference error:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    loadModel,
    runInference
  };
}
