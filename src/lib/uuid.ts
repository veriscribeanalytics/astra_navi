// Browser-compatible UUID generator
// Works in both browser and Node.js environments

export function generateUUID(): string {
  // Check if we're in Node.js environment
  if (typeof window === 'undefined' && typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Browser-compatible UUID v4 generator
  // Based on RFC4122 version 4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
