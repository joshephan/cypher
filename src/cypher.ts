import { v4 as uuidv4 } from 'uuid';
import * as CryptoJS from 'crypto-js';
import { CryptoUtils } from './crypto';
import {
  Metadata,
  EncryptedUploadResult,
  EncryptedFileRecord,
  CustomFile
} from './types';

export class Cypher {
  private masterKey: string;
  private storage: Map<string, EncryptedFileRecord>;

  constructor(masterKey: string) {
    this.masterKey = masterKey;
    this.storage = new Map();
  }

  async encryptAndUpload(file: File, metadata: Metadata): Promise<EncryptedUploadResult> {
    const fileId = uuidv4();
    const metadataId = uuidv4();

    // Derive file key
    const fileKey = await CryptoUtils.deriveFileKey(this.masterKey, fileId);

    // Encrypt file content (Base64 인코딩)
    const fileContent = await this.readFileAsArrayBuffer(file);
    const fileContentBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(new Uint8Array(fileContent)));
    const encryptedFile = await CryptoUtils.encrypt(
      fileContentBase64,
      fileKey
    );

    // Encrypt metadata
    const encryptedMetadata = await CryptoUtils.encrypt(
      JSON.stringify(metadata),
      fileKey
    );

    // Store encrypted data
    this.storage.set(fileId, {
      fileId,
      metadataId,
      fileKeyMap: {},
      encryptedFile,
      encryptedMetadata
    });

    return { fileId, metadataId };
  }

  async downloadAndDecrypt(fileId: string): Promise<CustomFile> {
    const record = this.storage.get(fileId);
    if (!record) {
      throw new Error('File not found');
    }

    const fileKey = await CryptoUtils.deriveFileKey(this.masterKey, fileId);

    // 복호화 후 Base64 디코딩
    const decryptedContentBase64 = await CryptoUtils.decrypt(
      record.encryptedFile.encryptedData,
      fileKey,
      record.encryptedFile.iv
    );
    const wordArray = CryptoJS.enc.Base64.parse(decryptedContentBase64);
    const uint8Array = new Uint8Array(wordArray.words.length * 4);
    for (let i = 0; i < wordArray.words.length; i++) {
      const word = wordArray.words[i];
      uint8Array[i * 4] = (word >>> 24) & 0xff;
      uint8Array[i * 4 + 1] = (word >>> 16) & 0xff;
      uint8Array[i * 4 + 2] = (word >>> 8) & 0xff;
      uint8Array[i * 4 + 3] = word & 0xff;
    }

    const metadata = JSON.parse(
      await CryptoUtils.decrypt(
        record.encryptedMetadata.encryptedData,
        fileKey,
        record.encryptedMetadata.iv
      )
    ) as Metadata;

    // 문자열로 파싱된 경우 Date 객체로 변환
    if (typeof metadata.modifiedAt === 'string') {
      metadata.modifiedAt = new Date(metadata.modifiedAt);
    }
    if (typeof metadata.createdAt === 'string') {
      metadata.createdAt = new Date(metadata.createdAt);
    }

    // 원본 파일 크기만큼 slice
    const file = new File(
      [uint8Array.slice(0, metadata.size)],
      metadata.filename,
      { type: metadata.mimetype }
    );

    // Add additional properties
    Object.defineProperties(file, {
      lastModified: {
        value: metadata.modifiedAt.getTime(),
        writable: false
      },
      webkitRelativePath: {
        value: '',
        writable: false
      }
    });

    return file as unknown as CustomFile;
  }

  async shareFile(fileId: string, recipientPublicKey: string): Promise<void> {
    const record = this.storage.get(fileId);
    if (!record) {
      throw new Error('File not found');
    }

    const fileKey = await CryptoUtils.deriveFileKey(this.masterKey, fileId);
    // PEM 문자열을 그대로 전달
    const publicKeyBytes = new TextEncoder().encode(recipientPublicKey);

    const encryptedFileKey = await CryptoUtils.encryptFileKey(
      fileKey,
      publicKeyBytes
    );

    if (!record.fileKeyMap) {
      record.fileKeyMap = {};
    }

    record.fileKeyMap[recipientPublicKey] = {
      encryptedKey: encryptedFileKey,
      publicKey: recipientPublicKey
    };
  }

  async revokeAccess(fileId: string, recipientId: string): Promise<void> {
    const record = this.storage.get(fileId);
    if (!record) {
      throw new Error('File not found');
    }

    if (!record.fileKeyMap) {
      throw new Error('File not found');
    }

    delete record.fileKeyMap[recipientId];
  }

  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
} 