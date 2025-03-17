export function logAccess(message: string) {
  console.log(`[Access] ${new Date().toISOString()}: ${message}`);
}

export function logError(message: string) {
  console.error(`[Error] ${new Date().toISOString()}: ${message}`);
}
