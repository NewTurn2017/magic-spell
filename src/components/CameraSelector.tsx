import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  devices: Array<{ deviceId: string; label: string }>;
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
  isLoading?: boolean;
}

export const CameraSelector: React.FC<Props> = ({ 
  devices, 
  selectedDeviceId, 
  onDeviceChange,
  isLoading = false
}) => {
  if (devices.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-purple-400 font-bold text-sm">Camera Device</span>
        {isLoading && (
          <span className="text-white/60 text-xs">Loading...</span>
        )}
      </div>
      
      <select
        value={selectedDeviceId}
        onChange={(e) => onDeviceChange(e.target.value)}
        disabled={isLoading}
        className="w-full bg-black/50 text-white border border-purple-500/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
      >
        {devices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
            {device.label.toLowerCase().includes('logitech') && ' ⭐'}
          </option>
        ))}
      </select>
      
      {devices.find(d => d.deviceId === selectedDeviceId)?.label.toLowerCase().includes('logitech') && (
        <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
          <span>✓</span>
          <span>Logitech camera selected</span>
        </div>
      )}
    </motion.div>
  );
};