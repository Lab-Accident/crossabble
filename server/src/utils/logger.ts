import pino from 'pino';
import { config } from '../config';
import path from 'path';

// Define log levels
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Configure detail level for call site information
export enum CallSiteDetailLevel {
  NONE = 'none',         // No call site information
  FUNCTION = 'function', // Function name only
  FULL = 'full'          // File, line and function name
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  prettyPrint: boolean;
  callSiteDetail: CallSiteDetailLevel;
}

// Default config values
const defaultConfig: LoggerConfig = {
  level: config.environment === 'production' ? 'info' : 'debug',
  prettyPrint: config.environment !== 'production',
  callSiteDetail: config.environment === 'production' 
    ? CallSiteDetailLevel.NONE 
    : CallSiteDetailLevel.FUNCTION
};

// Load configuration
const loggerConfig: LoggerConfig = {
  ...defaultConfig,
  // Override with environment variables if provided
  level: (process.env.LOG_LEVEL as LogLevel) || defaultConfig.level,
  prettyPrint: process.env.LOG_PRETTY === 'true' || defaultConfig.prettyPrint,
  callSiteDetail: (process.env.LOG_CALLSITE_DETAIL as CallSiteDetailLevel) || defaultConfig.callSiteDetail
};

// Create the pino logger instance
const pinoLogger = pino({
  level: loggerConfig.level,
  transport: loggerConfig.prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        }
      }
    : undefined,
  base: {
    // app: 'crossable-server',
    // env: config.environment
  }
});

// Function to extract call site information based on detail level
function getCallSiteInfo(): Record<string, any> {
  if (loggerConfig.callSiteDetail === CallSiteDetailLevel.NONE) {
    return {};
  }

  try {
    // Create error to capture stack trace
    const err = new Error();
    const stack = err.stack?.split('\n') || [];
    
    // Skip first 3 stack frames (Error constructor, getCallSiteInfo, and logger method)
    const callerFrame = stack[3] || '';
    
    // Extract information based on detail level
    if (loggerConfig.callSiteDetail === CallSiteDetailLevel.FUNCTION) {
      // Just extract function name
      const match = callerFrame.match(/at\s+(.*)\s+\(/);
      if (match && match[1]) {
        const fnName = match[1].split('.').pop() || 'unknown';
        return { fn: fnName };
      }
    } else if (loggerConfig.callSiteDetail === CallSiteDetailLevel.FULL) {
      // Extract file path, line number and function name
      const fileMatch = callerFrame.match(/\(([^:]+):(\d+):(\d+)\)/) || 
                        callerFrame.match(/at\s+([^:]+):(\d+):(\d+)/);
                        
      const fnMatch = callerFrame.match(/at\s+(.*)\s+\(/);
      
      if (fileMatch) {
        const filePath = fileMatch[1];
        const fileName = path.basename(filePath);
        const lineNumber = fileMatch[2];
        
        // Get function name if available
        let fnName = 'unknown';
        if (fnMatch && fnMatch[1]) {
          fnName = fnMatch[1].split('.').pop() || 'unknown';
        }
        
        return {
          file: fileName,
          line: lineNumber,
          fn: fnName,
          path: filePath
        };
      }
    }
    
    return { call: 'unknown' };
  } catch (err) {
    return { call: 'error' };
  }
}

// Create wrapper logger with call site detection
const logger = {
  trace: (obj: Record<string, any> | string, msg?: string) => {
    const callSite = getCallSiteInfo();
    if (typeof obj === 'string') {
      pinoLogger.trace({ ...callSite }, obj);
    } else {
      pinoLogger.trace({ ...obj, ...callSite }, msg);
    }
  },
  
  debug: (obj: Record<string, any> | string, msg?: string) => {
    const callSite = getCallSiteInfo();
    if (typeof obj === 'string') {
      pinoLogger.debug({ ...callSite }, obj);
    } else {
      pinoLogger.debug({ ...obj, ...callSite }, msg);
    }
  },
  
  info: (obj: Record<string, any> | string, msg?: string) => {
    const callSite = getCallSiteInfo();
    if (typeof obj === 'string') {
      pinoLogger.info({ ...callSite }, obj);
    } else {
      pinoLogger.info({ ...obj, ...callSite }, msg);
    }
  },
  
  warn: (obj: Record<string, any> | string, msg?: string) => {
    const callSite = getCallSiteInfo();
    if (typeof obj === 'string') {
      pinoLogger.warn({ ...callSite }, obj);
    } else {
      pinoLogger.warn({ ...obj, ...callSite }, msg);
    }
  },
  
  error: (obj: Record<string, any> | Error | string, msg?: string, extraObj?: Record<string, any>) => {
    const callSite = getCallSiteInfo();
    
    if (obj instanceof Error) {
      pinoLogger.error({
        ...callSite,
        err: {
          stack: obj.stack,
          ...obj
        },
        ...extraObj
      }, msg || obj.message);
    } else if (typeof obj === 'string') {
      pinoLogger.error({ ...callSite }, obj);
    } else {
      pinoLogger.error({ ...obj, ...callSite }, msg);
    }
  },
  
  fatal: (obj: Record<string, any> | string, msg?: string) => {
    const callSite = getCallSiteInfo();
    if (typeof obj === 'string') {
      pinoLogger.fatal({ ...callSite }, obj);
    } else {
      pinoLogger.fatal({ ...obj, ...callSite }, msg);
    }
  },
  
  // Allow runtime configuration changes
  setDetailLevel: (level: CallSiteDetailLevel) => {
    loggerConfig.callSiteDetail = level;
  },
  
  // Get current configuration
  getConfig: () => ({ ...loggerConfig })
};

// Log startup configuration 
logger.info({ 
  level: loggerConfig.level,
  prettyPrint: loggerConfig.prettyPrint,
  callSiteDetail: loggerConfig.callSiteDetail
}, 'Logger initialized');

export default logger;