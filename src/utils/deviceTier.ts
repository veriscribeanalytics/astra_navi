/**
 * Device Tier Detection Utility
 * Classifies device performance based on CPU cores, memory, and GPU capabilities
 */

export type DeviceTier = 'low' | 'mid' | 'high';

export interface DeviceCapabilities {
  cpuCores: number;
  deviceMemory: number; // GB
  hasGPUAcceleration: boolean;
  supportsWillChange: boolean;
  prefersReducedMotion: boolean;
}

/**
 * Detects device tier based on hardware capabilities
 * @returns DeviceTier classification ('low', 'mid', or 'high')
 */
export function detectDeviceTier(): DeviceTier {
  // Fallback values for unsupported browsers
  const cpuCores = navigator.hardwareConcurrency || 2;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  
  // Calculate device score
  let score = 0;
  
  // CPU score
  if (cpuCores >= 8) {
    score += 3;
  } else if (cpuCores >= 4) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Memory score
  if (deviceMemory >= 8) {
    score += 3;
  } else if (deviceMemory >= 4) {
    score += 2;
  } else {
    score += 1;
  }
  
  // GPU acceleration check (basic support detection)
  const hasGPUAcceleration = checkGPUSupport();
  if (hasGPUAcceleration) {
    score += 2;
  }
  
  // Classify device tier
  if (score >= 7) {
    return 'high';
  } else if (score >= 4) {
    return 'mid';
  } else {
    return 'low';
  }
}

/**
 * Checks if GPU acceleration is supported
 * @returns boolean indicating GPU support
 */
function checkGPUSupport(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/**
 * Gets comprehensive device capabilities
 * @returns DeviceCapabilities object
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  const cpuCores = navigator.hardwareConcurrency || 2;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  const hasGPUAcceleration = checkGPUSupport();
  const supportsWillChange = CSS.supports('will-change', 'transform');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    cpuCores,
    deviceMemory,
    hasGPUAcceleration,
    supportsWillChange,
    prefersReducedMotion,
  };
}
