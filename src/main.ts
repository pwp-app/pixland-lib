import axios from 'axios';
import crc32 from 'crc/mjs/crc32';
import { PixlandConfig, DEFAULT_CONFIG } from './constants';
import { PixlandUserData, PixlandUserStorage, UserDataResponse } from './types';
import { InvalidError } from './types/error';
import { defenseWrongDataType } from './utils/defense';
import { signRequest } from './utils/sign';
import {
  clearUserStorage,
  createEmptyUserData,
  decryptUserData,
  encryptUserData,
  enhancePassword,
  getUserKey,
  getUserStorage,
  saveUserStorage,
} from './utils/user';

export default class Pixland {
  private config: PixlandConfig;
  private userStorage: PixlandUserStorage | null;

  protected constructor(config: PixlandConfig) {
    this.config = config || DEFAULT_CONFIG;
    this.userStorage = getUserStorage();
    if (this.userStorage?.userKey) {
      window.dispatchEvent(new Event('pixland_user-login'));
    }
  }

  public isLogin() {
    return !!this.userStorage && this.userStorage?.userKey;
  }

  public async register(username: string, password: string, confirmPassword: string) {
    if (!username || !password) {
      throw new Error('Invalid user info.');
    }
    if (password !== confirmPassword) {
      throw new Error('Invalid confirm password.');
    }
    const enhancedPassword = await enhancePassword(password);
    const userKey = await getUserKey(username, enhancedPassword);
    if (await this.userDataExists(userKey)) {
      throw new Error('User exists.');
    }
    // create user data and upload
    this.userStorage = {
      username,
      password: enhancedPassword,
      userKey,
    };
    await this.uploadUserData(createEmptyUserData(username));
    saveUserStorage(this.userStorage);
    window.dispatchEvent(new Event('pixland_user-login'));
  }

  public async login(username: string, password: string) {
    if (!username || !password) {
      throw new Error('Invalid user info.');
    }
    const enhancedPassword = await enhancePassword(password);
    const userKey = await getUserKey(username, enhancedPassword);
    if (!(await this.userDataExists(userKey))) {
      throw new Error('User does not exist.');
    }
    this.userStorage = {
      username,
      password: enhancedPassword,
      userKey,
    };
    saveUserStorage(this.userStorage);
    window.dispatchEvent(new Event('pixland_user-login'));
  }

  public async logout() {
    this.userStorage = null;
    clearUserStorage();
    window.dispatchEvent(new Event('pixland_user-logout'));
  }

  public async getUserData() {
    const userKey = this.userStorage?.userKey;
    const password = this.userStorage?.password;
    if (!userKey || !password) {
      throw new InvalidError('Invalid or empty user info.');
    }
    const res = await axios.get(this.getFileUrl(userKey));
    const encrypted = res.data;
    const decrypted = decryptUserData(encrypted, password);
    return defenseWrongDataType(decrypted);
  }

  public async updateUserData(userData: PixlandUserData) {
    await this.uploadUserData(userData);
  }

  private getFileUrl(userKey: string) {
    return `https://${this.config.fileHost}/userData/${userKey}`;
  }

  private async userDataExists(userKey: string) {
    const fileUrl = this.getFileUrl(userKey);
    try {
      const res = await axios.head(fileUrl);
      return res.status === 200;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          return false;
        }
        throw err;
      }
      throw err;
    }
  }

  private async uploadUserData(userData: PixlandUserData) {
    const userKey = this.userStorage?.userKey;
    const username = this.userStorage?.username || '';
    const password = this.userStorage?.password || '';
    if (!userKey || !password) {
      throw new InvalidError('Invalid or empty user info in user storage.');
    }
    const nowTs = Date.now();
    const fileData = encryptUserData(
      {
        ...userData,
        lastUpdateAt: nowTs,
      },
      password,
    );
    await axios.put(this.getFileUrl(userKey), fileData, {
      headers: {
        'x-pixland-n': username,
        'x-pixland-a': password,
        'x-pixland-t': `${nowTs}`,
        'x-pixland-s': await signRequest({
          payload: {
            username,
            password,
          },
          timestamp: nowTs,
        }),
      },
    });
  }
}
