// lib/logger.ts
export function debugLog(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${message}`, data || "");
    }
  }
  
  export function errorLog(message: string, error?: any) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, error || "");
    }
  }