// 기본 타입 정의
export interface Metadata {
  filename: string;
  mimetype: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

export interface EncryptedMetadata {
  encryptedData: string;
  iv: string;
}

export interface EncryptedFile {
  encryptedData: string;
  iv: string;
}

export interface EncryptedUploadResult {
  fileId: string;
  metadataId: string;
}

export interface FileKeyMap {
  [recipientId: string]: {
    encryptedKey: string;
    publicKey: string;
  };
}

export interface EncryptedFileRecord {
  fileId: string;
  metadataId: string;
  fileKeyMap: FileKeyMap;
  encryptedFile: EncryptedFile;
  encryptedMetadata: EncryptedMetadata;
}

// File API 타입 정의
export type CustomFile = File & {
  lastModified: number;
  name: string;
  size: number;
  type: string;
  webkitRelativePath: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  stream(): ReadableStream;
  text(): Promise<string>;
};

// Blob 타입 정의
export interface Blob {
  readonly size: number;
  readonly type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  slice(start?: number, end?: number, contentType?: string): Blob;
  text(): Promise<string>;
  stream(): ReadableStream;
}

// ReadableStream 타입 정의
export interface ReadableStream {
  readonly locked: boolean;
  cancel(reason?: any): Promise<void>;
  getReader(): ReadableStreamDefaultReader;
  pipeThrough(transform: { writable: WritableStream; readable: ReadableStream }, options?: StreamPipeOptions): ReadableStream;
  pipeTo(dest: WritableStream, options?: StreamPipeOptions): Promise<void>;
  tee(): [ReadableStream, ReadableStream];
}

export interface ReadableStreamDefaultReader {
  readonly closed: Promise<void>;
  cancel(reason?: any): Promise<void>;
  read(): Promise<ReadableStreamReadResult>;
  releaseLock(): void;
}

export interface ReadableStreamReadResult {
  done: boolean;
  value: any;
}

export interface WritableStream {
  readonly locked: boolean;
  abort(reason?: any): Promise<void>;
  getWriter(): WritableStreamDefaultWriter;
}

export interface WritableStreamDefaultWriter {
  readonly closed: Promise<void>;
  readonly desiredSize: number | null;
  readonly ready: Promise<void>;
  abort(reason?: any): Promise<void>;
  close(): Promise<void>;
  releaseLock(): void;
  write(chunk: any): Promise<void>;
}

export interface StreamPipeOptions {
  preventAbort?: boolean;
  preventCancel?: boolean;
  preventClose?: boolean;
  signal?: AbortSignal;
} 