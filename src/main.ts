import axios from 'axios';
import crc32 from 'crc/crc32';
import { PixlandConfig, DEFAULT_CONFIG } from './constants';
import { PixlandUserData, PixlandUserStorage, UserDataResponse } from './types';
import { InvalidError } from './types/error';
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
  }

  public async logout() {
    this.userStorage = null;
    clearUserStorage();
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
    return decrypted;
  }

  public async updateUserData(userData: PixlandUserData) {
    await this.uploadUserData(userData);
  }

  private getFileUrl(userKey: string) {
    return `https://${this.config.fileHost}/userdata/${userKey}.json`;
  }

  private getFileKey(userKey: string) {
    return `userdata/${userKey}.json`;
  }

  private getApiUrl(apiName: string) {
    return `https://${this.config.apiHost}/${apiName}`;
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

  private async getUploadToken() {
    const now = Date.now();
    const payload = {
      username: this.userStorage?.username,
      password: this.userStorage?.password,
    };
    const res = await axios.post<UserDataResponse>(this.getApiUrl('userdata/getUploadToken'), {
      data: payload,
      timestamp: now,
      sign: await signRequest({ payload, timestamp: now }),
    });
    return res.data.data.upload_token;
  }

  private async uploadUserData(userData: PixlandUserData) {
    const uploadToken = await this.getUploadToken();
    const userKey = this.userStorage?.userKey;
    const password = this.userStorage?.password;
    if (!userKey || !password) {
      throw new InvalidError('Invalid or empty user info in user storage.');
    }
    const fileData = encryptUserData(
      {
        ...userData,
        lastUpdateAt: Date.now(),
      },
      password,
    );
    const formData = new FormData();
    formData.append('resource_key', this.getFileKey(userKey));
    formData.append('upload_token', uploadToken);
    formData.append('fileName', `${userKey}.json`);
    formData.append('fileBinaryData', fileData);
    formData.append('crc32', crc32(fileData).toString(16));
    await axios.post('https://up-as0.qiniup.com/', formData, {
      headers: {
        Authorization: `Uptoken ${uploadToken}`,
        'X-Reqid': userKey,
      },
    });
  }
}
