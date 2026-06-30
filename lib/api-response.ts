import { NextResponse } from "next/server";

// Standard Custom API Error class
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// Success Response template
export function successResponse(data: any, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

// Error Response template
export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code: code || "BAD_REQUEST",
      },
    },
    { status }
  );
}

// Global API Request Logger helper for debug transparency
export function logRequest(method: string, path: string, extra?: any) {
  console.log(`[API REQUEST] ${new Date().toISOString()} | ${method} ${path}`, extra ? JSON.stringify(extra) : "");
}
