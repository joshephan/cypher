import * as CryptoJS from 'crypto-js';
import { EncryptedFile, EncryptedMetadata } from './types';
import * as forge from 'node-forge';

export class CryptoUtils {
  private static readonly KEY_SIZE = 256;
  private static readonly ITERATIONS = 1000;
  private static readonly SALT_SIZE = 128;
  private static readonly IV_SIZE = 128;

  static async deriveFileKey(masterKey: string, fileId: string): Promise<string> {
    // fileId를 사용하여 결정적인 salt 생성
    const salt = CryptoJS.PBKDF2(fileId, masterKey, {
      keySize: this.SALT_SIZE / 32,
      iterations: 1
    });

    // 생성된 salt를 사용하여 파일 키 도출
    const key = CryptoJS.PBKDF2(masterKey, salt, {
      keySize: this.KEY_SIZE / 32,
      iterations: this.ITERATIONS
    });

    return key.toString();
  }

  static async encrypt(data: string, key: string): Promise<EncryptedFile | EncryptedMetadata> {
    const iv = CryptoJS.lib.WordArray.random(this.IV_SIZE / 8);
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      encryptedData: encrypted.toString(),
      iv: iv.toString()
    };
  }

  static async decrypt(encryptedData: string, key: string, iv: string): Promise<string> {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  static async encryptFileKey(fileKey: string, publicKey: Uint8Array): Promise<string> {
    try {
      // Uint8Array를 문자열로 변환
      const publicKeyPem = new TextDecoder().decode(publicKey);
      
      // PEM 형식의 공개키를 forge의 공개키 객체로 변환
      const publicKeyObj = forge.pki.publicKeyFromPem(publicKeyPem);
      
      // RSA-OAEP를 사용하여 파일 키를 암호화
      // OAEP는 Optimal Asymmetric Encryption Padding의 약자로, RSA의 보안을 강화하는 패딩 방식입니다.
      const encrypted = publicKeyObj.encrypt(fileKey, 'RSA-OAEP', {
        md: forge.md.sha256.create(), // SHA-256 해시 함수 사용
        mgf1: {
          md: forge.md.sha256.create() // MGF1에 SHA-256 사용
        }
      });
      
      // 암호화된 데이터를 Base64로 인코딩하여 반환
      return forge.util.encode64(encrypted);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to encrypt file key: ${error.message}`);
      }
      throw new Error('Failed to encrypt file key: Unknown error');
    }
  }

  static async decryptFileKey(encryptedFileKey: string, privateKey: Uint8Array): Promise<string> {
    try {
      // Uint8Array를 문자열로 변환
      const privateKeyPem = new TextDecoder().decode(privateKey);
      
      // PEM 형식의 개인키를 forge의 개인키 객체로 변환
      const privateKeyObj = forge.pki.privateKeyFromPem(privateKeyPem);
      
      // Base64로 인코딩된 암호화된 파일 키를 디코딩
      const encrypted = forge.util.decode64(encryptedFileKey);
      
      // RSA-OAEP를 사용하여 파일 키를 복호화
      const decrypted = privateKeyObj.decrypt(encrypted, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: {
          md: forge.md.sha256.create()
        }
      });
      
      return decrypted;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to decrypt file key: ${error.message}`);
      }
      throw new Error('Failed to decrypt file key: Unknown error');
    }
  }
} 