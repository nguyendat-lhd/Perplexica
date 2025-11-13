/**
 * Custom Error Types for MCP Server
 */

export class MCPTimeoutError extends Error {
  constructor(
    message: string,
    public duration: number,
    public operation?: string
  ) {
    super(message);
    this.name = 'MCPTimeoutError';
  }
}

export class MCPNetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPNetworkError';
  }
}

export class MCPToolError extends Error {
  constructor(
    message: string,
    public toolName: string,
    public cause?: any
  ) {
    super(message);
    this.name = 'MCPToolError';
  }
}

export function isTimeoutError(error: any): error is MCPTimeoutError {
  return error.name === 'MCPTimeoutError' || error.cause?.type === 'TIMEOUT';
}

export function isNetworkError(error: any): error is MCPNetworkError {
  return error.name === 'MCPNetworkError' || error.cause?.status !== undefined;
}