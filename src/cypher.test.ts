import { Cypher } from './cypher';
import { Metadata } from './types';

// Node.js 환경에서 TextEncoder/TextDecoder 지원
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as any;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as any;
}

describe('Cypher', () => {
  const masterKey = 'test-master-key';
  let cypher: Cypher;
  let testFile: File;
  let testMetadata: Metadata;

  beforeEach(() => {
    cypher = new Cypher(masterKey);
    testFile = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' });
    testMetadata = {
      filename: 'test.txt',
      mimetype: 'text/plain',
      size: testFile.size,
      createdAt: new Date(),
      modifiedAt: new Date()
    };
  });

  describe('encryptAndUpload', () => {
    it('should encrypt and upload a file successfully', async () => {
      const result = await cypher.encryptAndUpload(testFile, testMetadata);
      
      expect(result).toHaveProperty('fileId');
      expect(result).toHaveProperty('metadataId');
      expect(typeof result.fileId).toBe('string');
      expect(typeof result.metadataId).toBe('string');
    });

    it('should generate different IDs for different files', async () => {
      const file2 = new File(['Different content'], 'test2.txt', { type: 'text/plain' });
      const metadata2: Metadata = { 
        ...testMetadata, 
        filename: 'test2.txt',
        createdAt: new Date(),
        modifiedAt: new Date()
      };

      const result1 = await cypher.encryptAndUpload(testFile, testMetadata);
      const result2 = await cypher.encryptAndUpload(file2, metadata2);

      expect(result1.fileId).not.toBe(result2.fileId);
      expect(result1.metadataId).not.toBe(result2.metadataId);
    });
  });

  describe('downloadAndDecrypt', () => {
    it('should decrypt a file successfully', async () => {
      const { fileId } = await cypher.encryptAndUpload(testFile, testMetadata);
      const decryptedFile = await cypher.downloadAndDecrypt(fileId);

      expect(decryptedFile).toBeInstanceOf(File);
      expect(decryptedFile.name).toBe(testMetadata.filename);
      expect(decryptedFile.type).toBe(testMetadata.mimetype);
      expect(decryptedFile.size).toBe(testFile.size);
    });

    it('should throw error for non-existent file', async () => {
      await expect(cypher.downloadAndDecrypt('non-existent-id'))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('shareFile', () => {
    it('should share a file successfully', async () => {
      const { fileId } = await cypher.encryptAndUpload(testFile, testMetadata);
      
      // 테스트용 RSA 키쌍 생성
      const { publicKey } = await generateTestKeyPair();
      
      await expect(cypher.shareFile(fileId, publicKey))
        .resolves
        .not
        .toThrow();
    });

    it('should throw error when sharing non-existent file', async () => {
      const { publicKey } = await generateTestKeyPair();
      
      await expect(cypher.shareFile('non-existent-id', publicKey))
        .rejects
        .toThrow('File not found');
    });
  });

  describe('revokeAccess', () => {
    it('should revoke access successfully', async () => {
      const { fileId } = await cypher.encryptAndUpload(testFile, testMetadata);
      const { publicKey } = await generateTestKeyPair();
      
      await cypher.shareFile(fileId, publicKey);
      await expect(cypher.revokeAccess(fileId, publicKey))
        .resolves
        .not
        .toThrow();
    });

    it('should throw error when revoking access for non-existent file', async () => {
      const { publicKey } = await generateTestKeyPair();
      
      await expect(cypher.revokeAccess('non-existent-id', publicKey))
        .rejects
        .toThrow('File not found');
    });
  });
});

// 테스트용 RSA 키쌍 생성 함수
async function generateTestKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const forge = require('node-forge');
  const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  
  return {
    publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
    privateKey: forge.pki.privateKeyToPem(keypair.privateKey)
  };
} 