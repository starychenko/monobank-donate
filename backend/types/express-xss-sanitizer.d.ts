declare module 'express-xss-sanitizer' {
  import { RequestHandler } from 'express';
  
  /**
   * Options for xss sanitizer
   */
  interface XssOptions {
    /** Set to true to also santize nested objects in req.body, req.query, and req.params */
    sanitizeRecursively?: boolean;
    /** Names of additional properties to sanitize */
    additionalProperties?: string[];
  }
  
  /**
   * Middleware function to sanitize user input in request body, query, and params
   */
  export function xss(options?: XssOptions): RequestHandler;
} 