export interface HandKeypoint {
  x: number;
  y: number;
  z: number;
  name: string;
}

export interface HandData {
  keypoints: HandKeypoint[];
  gesture: string;
  confidence: number;
  boundingBox: {
    topLeft: [number, number];
    bottomRight: [number, number];
  };
}

export interface HandPoseAnnotation {
  handInViewConfidence: number;
  landmarks: number[][];
  boundingBox: {
    topLeft: [number, number];
    bottomRight: [number, number];
  };
}