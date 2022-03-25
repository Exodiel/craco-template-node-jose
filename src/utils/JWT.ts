import { JWS, JWE, JWK } from 'node-jose';
import faker from 'faker';
import moment from 'moment';
import { REACT_APP_EXPIRY_DAYS, REACT_APP_PRIVATE_KEY } from '../constants';

const encryptionAndContentAlg = 'A256GCM';
const signAlg = 'RS256';
const encryptionAlg = 'RSA-OAEP-256';
const fileFormat = 'pem';

const jwtData = {
  headers: {
    alg: 'RS256',
    typ: 'JWT'
  },
  payload: {
    aud: 'companyProduct',
    exp: 0,
    content: {
      channel: 'WEB',
      appId: 'PRODUCT',
      appModule: 'ProductModule',
      ip: faker.internet.ip(),
      transactionId: faker.datatype.uuid(),
      lastAccessDate: '',
      lang: 'ES',
      //isValid: true,
      user: {
        uId: faker.datatype.uuid(),
        userName: `${faker.name.firstName()} ${faker.name.lastName()}`,
        userNickname: '',
        groupId: '445566',
        countryId: 'CO',
        docId: '2589186',
        docType: 'CC',
        email: faker.internet.email(),
        cellphone: faker.phone.phoneNumber()
      }
    }
  }
}

const prepareKeys = async (): Promise<{
  privateToSign: JWK.Key;
  publicToVerify: JWK.Key;
  publicToEncrypt: JWK.Key;
  privateToDecrypt: JWK.Key;
}> => {
  const keyStore = JWK.createKeyStore();
  const privateToSign = await keyStore.add(REACT_APP_PRIVATE_KEY, fileFormat, { alg: "RS256", kid: "private-to-sign" });
  const publicToVerify = await keyStore.add(REACT_APP_PRIVATE_KEY, fileFormat, { alg: "RS256", kid: "public-to-verify" });
  const publicToEncrypt = await keyStore.add(REACT_APP_PRIVATE_KEY, fileFormat, { alg: "RSA-OAEP-256", kid: "public-to-encrypt" });
  const privateToDecrypt = await keyStore.add(REACT_APP_PRIVATE_KEY, fileFormat, { alg: "RSA-OAEP-256", kid: "private-to-decrypt" });


  return {
    privateToSign,
    publicToVerify,
    publicToEncrypt,
    privateToDecrypt
  }
}

const sign = async (privateToSign: JWK.Key, data: {
  payload: {
    content: string;
    aud: string;
    exp: number;
  };
  headers: {
    alg: string;
    typ: string;
  };
}): Promise<JWS.CreateSignResult> => {
  const signed = await JWS
    .createSign({
      alg: signAlg,
      fields: data.headers,
      format: 'compact'
    }, privateToSign)
    .update(JSON.stringify(data.payload))
    .final()

  return signed
}

const encrypt = async (publicToEncrypt: JWK.Key, data: JWS.CreateSignResult): Promise<string> => {
  const encrypted = await JWE
    .createEncrypt({
      contentAlg: encryptionAndContentAlg,
      format: 'compact',
      fields: {
        alg: encryptionAlg,
        cty: 'JWT',
        enc: encryptionAndContentAlg,
        iss: 'JIP'
      }
    }, publicToEncrypt)
    .update(data)
    .final()

  return encrypted
}

export const decrypt = async (privateToDecrypt: JWK.Key, encryptedJWT: string): Promise<JWE.DecryptResult> => {
  const decrypted = await JWE.createDecrypt(privateToDecrypt).decrypt(encryptedJWT);
  return decrypted;
}

export const verify = async (publicToVerify: JWK.Key, input: string): Promise<JWS.VerificationResult> => {
  const verified = await JWS.createVerify(publicToVerify).verify(input)
  return verified;
}

export const generateJWT = async (userId: string): Promise<void> => {
  const currenDate = new Date()
  const newPayload = jwtData.payload

  /** Override all the necesary current values of the jwtData */
  newPayload.exp = moment(currenDate).add(parseInt(REACT_APP_EXPIRY_DAYS, 10), 'days').unix()
  newPayload.content.lastAccessDate = moment(currenDate).format('yyyyMMddHHmmss')
  newPayload.content.user.userNickname = userId

  const newJwt = {
    ...jwtData,
    payload: {
      ...jwtData.payload,
      content: JSON.stringify(newPayload.content)
    }
  }


  const generatedKeys = await prepareKeys();
  const signedJWT = await sign(generatedKeys.privateToSign, newJwt);
  const encryptedJWT = await encrypt(generatedKeys.publicToEncrypt, signedJWT);

  console.log('DEV-PREJWT', JSON.stringify(newJwt))
  console.log('DEV-SIGNED', signedJWT)
  console.log('DEV-ENC-JWT', encryptedJWT)

  const et = await decrypt(generatedKeys.privateToDecrypt, encryptedJWT);
  const st = await verify(generatedKeys.publicToVerify, et.payload.toString());

  console.log('DEV-DEC-JWT', et.payload.toString())
  console.log('DEV-SIGNED-VERIFY', JSON.parse(JSON.parse(st.payload.toString()).content))

  // return encryptedJWT
}
