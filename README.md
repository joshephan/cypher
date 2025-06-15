# GrayGate Cypher

> 🔐 **Why this project exists**  
> In a world where user data is routinely exposed, intercepted, or misused by cloud providers and centralized platforms, **Cypher** was created to put ownership and control back into the hands of the individual.  
> This library ensures that **only the user can access their files**, with encryption keys never leaving their device. Even metadata is protected.  
> Sharing is optional, secure, and entirely user-driven — not mediated by any server or admin.

> 🔐 **이 프로젝트가 만들어진 이유**  
> 오늘날 사용자 데이터는 클라우드 서비스나 중앙화된 플랫폼에 의해 너무 쉽게 노출되거나 악용되고 있습니다.  
> **Cypher**는 사용자에게 데이터에 대한 **진정한 소유권과 통제권을 되돌려주기 위해** 만들어졌습니다.  
> 이 라이브러리를 통해 **오직 사용자만이 자신의 파일에 접근할 수 있으며**, 암호화 키는 절대 기기를 벗어나지 않습니다.  
> 메타데이터조차도 암호화되며,  
> 공유는 필요할 때만, 안전하게, 그리고 전적으로 **사용자의 의지에 따라** 이루어집니다.

A TypeScript library for secure file encryption and sharing  
안전한 파일 암호화 및 공유를 위한 TypeScript 라이브러리

## Key Features | 주요 기능
- File and metadata encryption using AES-256-CBC  
  AES-256-CBC를 사용한 파일 및 메타데이터 암호화
- File key sharing using RSA-OAEP  
  RSA-OAEP를 사용한 파일 키 공유
- Unique key derivation per file (fileId + masterKey)  
  파일별 고유 키 파생 (fileId + masterKey)
- File key encryption using PEM format public keys  
  PEM 형식의 공개키로 파일 키 암호화
- File access control and revocation  
  파일 접근 권한 관리 및 해제
- Optimized for serverless/client-side environments  
  서버리스/클라이언트 사이드 환경에 최적화

## Installation | 설치

```bash
npm install cypher
```

## Dependencies | 의존성
- `crypto-js`: Symmetric encryption (AES)  
  대칭키 암호화 (AES)
- `node-forge`: Asymmetric encryption (RSA)  
  비대칭키 암호화 (RSA)
- `uuid`: Unique identifier generation  
  고유 식별자 생성
- (For testing) `jest`, `ts-jest`, `jest-environment-jsdom`  
  (테스트용) `jest`, `ts-jest`, `jest-environment-jsdom`

## Usage | 사용 방법

### 1. Initialization | 초기화
```typescript
import { Cypher } from 'cypher';
const masterKey = 'your-secure-master-key';
const cypher = new Cypher(masterKey);
```

### 2. File Encryption and Upload | 파일 암호화 및 업로드
```typescript
const file = new File(['Hello, World!'], 'example.txt', { type: 'text/plain' });
const metadata = {
  filename: 'example.txt',
  mimetype: 'text/plain',
  size: file.size,
  createdAt: new Date(),
  modifiedAt: new Date()
};
const { fileId, metadataId } = await cypher.encryptAndUpload(file, metadata);
```

### 3. File Download and Decryption | 파일 다운로드 및 복호화
```typescript
const decryptedFile = await cypher.downloadAndDecrypt(fileId);
```

### 4. File Sharing (using RSA public key PEM string) | 파일 공유 (RSA 공개키 PEM 문자열 사용)
```typescript
// Generate PEM public key using node-forge
// node-forge 등으로 PEM 공개키 생성
const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----`;
await cypher.shareFile(fileId, publicKeyPem);
```

### 5. Access Revocation | 접근 권한 해제
```typescript
await cypher.revokeAccess(fileId, publicKeyPem);
```

## Testing | 테스트

Tests run in Jest + jsdom environment (File, FileReader, TextEncoder/Decoder support in Node.js)  
Jest + jsdom 환경에서 테스트됩니다. (Node.js 환경에서 File, FileReader, TextEncoder/Decoder 지원)

```bash
npm install
npm test
```

## Security Considerations | 보안 고려사항
- **Master Key** must be securely stored as its compromise puts all files at risk  
  **마스터 키**는 안전하게 보관해야 하며, 유출 시 모든 파일이 위험합니다
- Each file is encrypted with a unique key derived from fileId and masterKey  
  각 파일은 fileId와 masterKey로부터 고유하게 파생된 키로 암호화됩니다
- File key sharing is only possible using PEM format RSA public keys  
  파일 키 공유는 PEM 형식의 RSA 공개키로만 가능합니다
- Files and metadata are encrypted using AES-256-CBC  
  파일/메타데이터는 모두 AES-256-CBC로 암호화됩니다
- Date fields are converted to Date objects during decryption  
  복호화 시 날짜 필드는 Date 객체로 변환됩니다

## API Documentation | API 문서

### Cypher Class | Cypher 클래스

#### Constructor | 생성자
```typescript
constructor(masterKey: string)
```

#### Methods | 메서드

##### encryptAndUpload
```typescript
async encryptAndUpload(file: File, metadata: Metadata): Promise<EncryptedUploadResult>
```
- Encrypts and uploads a file  
  파일을 암호화하고 업로드합니다
- Returns: `{ fileId: string, metadataId: string }`  
  반환값: `{ fileId: string, metadataId: string }`

##### downloadAndDecrypt
```typescript
async downloadAndDecrypt(fileId: string): Promise<CustomFile>
```
- Downloads and decrypts an encrypted file  
  암호화된 파일을 다운로드하고 복호화합니다
- Returns: Decrypted `File` object  
  반환값: 복호화된 `File` 객체

##### shareFile
```typescript
async shareFile(fileId: string, recipientPublicKey: string): Promise<void>
```
- Encrypts and shares file key using PEM format RSA public key  
  PEM 형식의 RSA 공개키로 파일 키를 암호화하여 공유합니다

##### revokeAccess
```typescript
async revokeAccess(fileId: string, recipientId: string): Promise<void>
```
- Revokes file access  
  파일 접근 권한을 해제합니다

## Example Test Code | 예제 테스트 코드

See `src/cypher.test.ts` (Jest-based)  
`src/cypher.test.ts` 참고 (Jest 기반)

## License | 라이선스

MIT 