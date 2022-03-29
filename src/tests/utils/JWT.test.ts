import { describe, test, beforeAll, expect } from 'vitest';
import { JWS, JWK } from 'node-jose';
import { sign, verify, encrypt, decrypt, prepareKeys, preparePayload } from '../../utils/JWT';

describe('When user request a token', () => {
  let keys: {
    privateToSign: JWK.Key;
    publicToVerify: JWK.Key;
    publicToEncrypt: JWK.Key;
    privateToDecrypt: JWK.Key;
  };
  let newJwt: {
    payload: {
        content: string;
        aud: string;
        exp: number;
    };
    headers: {
        alg: string;
        typ: string;
    };
  }
  let signedJWT: JWS.CreateSignResult
  let encryptedJWT: string
  beforeAll(async () => {
    keys = await prepareKeys();
    newJwt = preparePayload('client0001');
    signedJWT = await sign(keys.privateToSign, newJwt);
    encryptedJWT = await encrypt(keys.publicToEncrypt, signedJWT);
  });
  test('should sign his information', async () => {
    expect(signedJWT).toBeTruthy();
  });
  test('should encrypt his token', async () => {
    expect(encryptedJWT).toBeTruthy();
  });
  test('should decrypt his information', async () => {
    const tokenDecrypted = await decrypt(keys.privateToDecrypt, encryptedJWT);
    const payload = tokenDecrypted.payload.toString();
    expect(payload).toEqual(signedJWT);
  });
  test('should verify his token', async () => {
    const tokenDecrypted = await decrypt(keys.privateToDecrypt, encryptedJWT);
    const token = tokenDecrypted.payload.toString();
    const verified = await verify(keys.publicToVerify, token);
    const content = JSON.parse(JSON.parse(verified.payload.toString())['content']);
    const contentNjwt = JSON.parse(newJwt.payload.content);
    expect(content).toStrictEqual(contentNjwt);
  });
});