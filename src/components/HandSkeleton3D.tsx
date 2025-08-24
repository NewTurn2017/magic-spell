import React, { useRef, useEffect } from 'react';
import type { HandData } from '../types/hand';

interface Props {
  handData: HandData | null;
}

const CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring finger
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17]
];

const FINGER_COLORS = {
  thumb: '#ff6b6b',     // Red
  index: '#4ecdc4',     // Cyan
  middle: '#45b7d1',    // Blue
  ring: '#96ceb4',      // Green
  pinky: '#ffeaa7',     // Yellow
  palm: '#dfe6e9'       // Gray
};

export const HandSkeleton3D: React.FC<Props> = ({ handData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (handData && handData.keypoints) {
        const { keypoints } = handData;

        // Draw connections (bones)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fff';

        CONNECTIONS.forEach(([start, end]) => {
          const startPoint = keypoints[start];
          const endPoint = keypoints[end];

          // Determine color based on finger
          let color = FINGER_COLORS.palm;
          if (end <= 4) color = FINGER_COLORS.thumb;
          else if (end <= 8) color = FINGER_COLORS.index;
          else if (end <= 12) color = FINGER_COLORS.middle;
          else if (end <= 16) color = FINGER_COLORS.ring;
          else if (end <= 20) color = FINGER_COLORS.pinky;

          // Draw gradient line
          const gradient = ctx.createLinearGradient(
            startPoint.x, startPoint.y,
            endPoint.x, endPoint.y
          );
          gradient.addColorStop(0, color + 'aa');
          gradient.addColorStop(1, color + 'ff');

          ctx.strokeStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
        });

        // Draw joints (keypoints)
        keypoints.forEach((point, index) => {
          // Determine color based on finger
          let color = FINGER_COLORS.palm;
          if (index <= 4) color = FINGER_COLORS.thumb;
          else if (index <= 8) color = FINGER_COLORS.index;
          else if (index <= 12) color = FINGER_COLORS.middle;
          else if (index <= 16) color = FINGER_COLORS.ring;
          else if (index <= 20) color = FINGER_COLORS.pinky;

          // Draw outer glow
          ctx.fillStyle = color + '40';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 12, 0, Math.PI * 2);
          ctx.fill();

          // Draw joint
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
          ctx.fill();

          // Draw inner highlight
          ctx.fillStyle = '#ffffff90';
          ctx.beginPath();
          ctx.arc(point.x - 2, point.y - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Draw gesture label
        if (handData.gesture && handData.gesture !== 'none') {
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#000';
          
          const centerX = keypoints[9].x; // Middle finger base
          const centerY = keypoints[0].y - 50; // Above wrist
          
          // Draw background
          const text = `Gesture: ${handData.gesture.toUpperCase()}`;
          const metrics = ctx.measureText(text);
          ctx.fillStyle = '#00000080';
          ctx.fillRect(
            centerX - metrics.width / 2 - 10,
            centerY - 20,
            metrics.width + 20,
            35
          );
          
          // Draw text
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, centerX, centerY);
        }

        // Draw confidence meter
        const confidence = handData.confidence;
        const meterWidth = 200;
        const meterHeight = 10;
        const meterX = 20;
        const meterY = canvas.height - 30;

        // Background
        ctx.fillStyle = '#00000060';
        ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

        // Confidence bar
        const confColor = confidence > 0.8 ? '#4caf50' : confidence > 0.5 ? '#ff9800' : '#f44336';
        ctx.fillStyle = confColor;
        ctx.fillRect(meterX, meterY, meterWidth * confidence, meterHeight);

        // Label
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`Confidence: ${Math.round(confidence * 100)}%`, meterX, meterY - 5);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handData]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20"
      style={{ mixBlendMode: 'lighten' }}
    />
  );
};