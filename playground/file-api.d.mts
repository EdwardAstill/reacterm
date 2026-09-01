import type { IncomingMessage, ServerResponse } from "node:http";

export interface FileApi {
  allowedRoot: string;
  token: string;
  maxFileBytes: number;
}

export interface CreateFileApiOptions {
  allowedRoot: string;
  token?: string;
  maxFileBytes?: number;
}

export const DEFAULT_MAX_FILE_BYTES: number;
export function createFileApi(options: CreateFileApiOptions): FileApi;
export function handleFileApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  api: FileApi,
): boolean;
