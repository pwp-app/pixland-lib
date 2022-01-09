import { createHMAC, createSHA1, createSHA256 } from 'hash-wasm';
import { USER_STORAGE_KEY } from '../constants';
import { PixlandUserData, PixlandUserStorage } from '../types';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

export const getUserKey = async (username: string, password: string) => {
  const hmac = (await createHMAC(createSHA256(), 'pixland')).update(`${username}_${password}`).digest('hex');
  return (await createHMAC(createSHA1(), 'pixland')).update(hmac).digest('hex');
};

export const enhancePassword = async (password: string) => {
  const sha = await createSHA256();
  let res = password;
  for (let i = 0; i < 16; i++) {
    res = sha.update(res).digest('hex');
  }
  return res;
};

export const getUserStorage = () => {
  const storage = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!storage) {
    return null;
  }
  return JSON.parse(storage) as PixlandUserStorage;
};

export const saveUserStorage = (userStorage: PixlandUserStorage) => {
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userStorage));
};

export const clearUserStorage = () => {
  window.localStorage.removeItem(USER_STORAGE_KEY);
};

export const createEmptyUserData = (username: string): PixlandUserData => {
  return {
    history: [],
    collection: [],
    picData: [],
    username,
    createAt: Date.now(),
    lastUpdateAt: Date.now(),
  };
};

export const encryptUserData = (userData: PixlandUserData, enhancedPassword: string) => {
  return AES.encrypt(JSON.stringify(userData), enhancedPassword).toString();
};

export const decryptUserData = (encrypted: string, enhancedPassword: string) => {
  const decrypted = AES.decrypt(encrypted, enhancedPassword);
  return JSON.parse(decrypted.toString(Utf8)) as PixlandUserData;
};
