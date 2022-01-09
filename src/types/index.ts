export interface PixlandUserStorage {
  username: string;
  password: string;
  userKey: string;
}

export interface PixlandUserData {
  history: number[]; // pic ids
  collection: number[]; // pic ids
  picData: unknown[]; // full pic data
  username: string;
  createAt: number;
}

export interface APIResponse {
  ret: number;
  data: unknown;
  err_msg: string;
}

export interface UserDataResponse extends APIResponse {
  data: {
    upload_token: string;
  };
}
