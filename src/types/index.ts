export interface PixlandUserStorage {
  username: string;
  password: string;
  userKey: string;
}

export interface RecordItem {
  i: number;
  t: number;
}

export interface PixlandUserData {
  history: RecordItem[]; // pic ids
  collection: RecordItem[]; // pic ids
  picData: Record<string | number, unknown>; // full pic data
  username: string;
  createAt: number;
  lastUpdateAt: number;
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
