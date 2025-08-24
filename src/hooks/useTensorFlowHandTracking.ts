import { useEffect, useRef, useState, useCallback } from 'react';
import * as handpose from '@tensorflow-models/handpose';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

import type { HandKeypoint, HandData, HandPoseAnnotation } from '../types/hand';

const KEYPOINT_NAMES = [
  'wrist',
  'thumb_cmc', 'thumb_mcp', 'thumb_ip', 'thumb_tip',
  'index_mcp', 'index_pip', 'index_dip', 'index_tip',
  'middle_mcp', 'middle_pip', 'middle_dip', 'middle_tip',
  'ring_mcp', 'ring_pip', 'ring_dip', 'ring_tip',
  'pinky_mcp', 'pinky_pip', 'pinky_dip', 'pinky_tip'
];

export const useTensorFlowHandTracking = (stream: MediaStream | null) => {
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handData, setHandData] = useState<HandData | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Gesture detection based on finger positions
  const detectGesture = useCallback((landmarks: number[][]): string => {
    if (!landmarks || landmarks.length === 0) return 'none';

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Calculate if fingers are extended
    const isThumbExtended = thumbTip[1] < landmarks[2][1];
    const isIndexExtended = indexTip[1] < landmarks[6][1];
    const isMiddleExtended = middleTip[1] < landmarks[10][1];
    const isRingExtended = ringTip[1] < landmarks[14][1];
    const isPinkyExtended = pinkyTip[1] < landmarks[18][1];

    const extendedCount = [
      isThumbExtended,
      isIndexExtended,
      isMiddleExtended,
      isRingExtended,
      isPinkyExtended
    ].filter(Boolean).length;

    // Gesture patterns for spell casting
    if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'fist'; // Charging power
    }
    
    if (extendedCount === 5) {
      return 'palm'; // Release spell
    }
    
    if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'point'; // Fire spell
    }
    
    if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
      return 'peace'; // Water spell
    }
    
    if (isThumbExtended && isIndexExtended && isPinkyExtended && !isMiddleExtended && !isRingExtended) {
      return 'rock'; // Lightning spell
    }

    return 'unknown';
  }, []);

  // Initialize TensorFlow and load model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        
        // Set TensorFlow backend
        await tf.setBackend('webgl');
        await tf.ready();
        
        // Load the handpose model
        const loadedModel = await handpose.load({
          detectionConfidence: 0.8,
          iouThreshold: 0.3,
          scoreThreshold: 0.75
        });
        
        setModel(loadedModel);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load TensorFlow model:', err);
        setError('Failed to load hand tracking model');
        setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Use provided stream instead of creating a new one
  const startVideo = useCallback(async (video: HTMLVideoElement) => {
    try {
      if (!stream) {
        setError('No camera stream available');
        return;
      }
      
      video.srcObject = stream;
      videoRef.current = video;
      
      return new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
    } catch (err) {
      console.error('Failed to start video:', err);
      setError('Failed to use camera stream');
    }
  }, [stream]);

  // Detect hands in video stream
  const detectHands = useCallback(async () => {
    if (!model || !videoRef.current || !videoRef.current.readyState) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    try {
      const predictions = await model.estimateHands(videoRef.current);
      
      if (predictions.length > 0) {
        const hand = predictions[0] as HandPoseAnnotation;
        const landmarks = hand.landmarks;
        
        // Get video dimensions
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Calculate scale factors
        const scaleX = windowWidth / videoWidth;
        const scaleY = windowHeight / videoHeight;
        
        // Convert landmarks to screen coordinates with mirroring
        const keypoints: HandKeypoint[] = landmarks.map((landmark, index) => ({
          x: windowWidth - (landmark[0] * scaleX), // Mirror horizontally
          y: landmark[1] * scaleY,
          z: landmark[2] || 0,
          name: KEYPOINT_NAMES[index]
        }));

        // Detect gesture
        const gesture = detectGesture(landmarks);
        
        // Calculate bounding box in screen coordinates
        const xs = keypoints.map(p => p.x);
        const ys = keypoints.map(p => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        setHandData({
          keypoints,
          gesture,
          confidence: hand.handInViewConfidence || 1,
          boundingBox: {
            topLeft: [minX, minY],
            bottomRight: [maxX, maxY]
          }
        });
      } else {
        setHandData(null);
      }
    } catch (err) {
      console.error('Hand detection error:', err);
    }

    animationFrameRef.current = requestAnimationFrame(detectHands);
  }, [model, detectGesture]);

  // Start detection when video is ready
  const initialize = useCallback(async (video: HTMLVideoElement) => {
    if (!video) return;
    
    await startVideo(video);
    detectHands();
  }, [startVideo, detectHands]);

  // Stop detection (no longer stops the stream as it's managed externally)
  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Don't stop the stream as it's managed by the parent component
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  return {
    handData,
    isLoading,
    error,
    initialize,
    stop,
    isModelReady: !!model
  };
};