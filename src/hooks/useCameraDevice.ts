import { useState, useEffect, useCallback, useRef } from 'react';

interface CameraDevice {
  deviceId: string;
  label: string;
}

export const useCameraDevice = () => {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Get list of available cameras
  const loadDevices = useCallback(async () => {
    try {
      // Request permission first if needed - then immediately stop the stream
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop()); // Stop the temporary stream
      
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.substring(0, 5)}...`
        }));
      
      setDevices(videoDevices);
      
      // Try to find and select Logitech camera by default
      const logitechDevice = videoDevices.find(device => 
        device.label.toLowerCase().includes('logitech') || 
        device.label.toLowerCase().includes('logi')
      );
      
      if (logitechDevice) {
        setSelectedDeviceId(logitechDevice.deviceId);
      } else if (videoDevices.length > 0) {
        // If no Logitech found, select the first non-FaceTime camera
        const nonFaceTimeDevice = videoDevices.find(device => 
          !device.label.toLowerCase().includes('facetime')
        );
        setSelectedDeviceId(nonFaceTimeDevice?.deviceId || videoDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error('Failed to load camera devices:', err);
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
      } else if (err.name === 'NotFoundError') {
        setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err.name === 'NotReadableError') {
        setError('카메라가 다른 프로그램에서 사용 중입니다. 다른 프로그램을 종료하고 다시 시도해주세요.');
      } else {
        setError(`카메라 접근 실패: ${err.message || 'Unknown error'}`);
      }
    }
  }, []);

  // Initialize camera stream with selected device
  const initializeCamera = useCallback(async (deviceId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId || selectedDeviceId ? { exact: deviceId || selectedDeviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user'
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setStream(newStream);
      setIsLoading(false);
      
      return newStream;
    } catch (err: any) {
      console.error('Failed to initialize camera:', err);
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
      } else if (err.name === 'NotFoundError') {
        setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else if (err.name === 'NotReadableError') {
        setError('카메라가 다른 프로그램에서 사용 중입니다. 다른 프로그램을 종료하고 다시 시도해주세요.');
      } else if (err.name === 'OverconstrainedError') {
        setError('요청한 카메라 설정을 지원하지 않습니다.');
      } else {
        setError(`카메라 시작 실패: ${err.message || 'Unknown error'}`);
      }
      setIsLoading(false);
      return null;
    }
  }, [selectedDeviceId]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  // Change camera device
  const changeDevice = useCallback(async (deviceId: string) => {
    if (deviceId !== selectedDeviceId) {
      setSelectedDeviceId(deviceId);
      if (streamRef.current) {
        await initializeCamera(deviceId);
      }
    }
  }, [initializeCamera, selectedDeviceId]);

  // Load devices on mount
  useEffect(() => {
    loadDevices();

    // Listen for device changes
    const handleDeviceChange = () => {
      loadDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [loadDevices]);

  return {
    devices,
    selectedDeviceId,
    stream,
    isLoading,
    error,
    initializeCamera,
    stopCamera,
    changeDevice,
    loadDevices
  };
};