import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_SECRET ? process.env.ENCRYPTION_SECRET : "2345tbefweop324it5t4932384tiugfi90328r74gfreuf39208r4tygfrhewdr")
    .digest();

  encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(payload: string): string {
    const data = Buffer.from(payload, 'base64');

    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const text = data.subarray(28);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(text).toString() + decipher.final('utf8');
  }
}
