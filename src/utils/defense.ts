import { PixlandUserData } from '../types';

export const defenseWrongDataType = (userData: PixlandUserData) => {
  if (!userData.history || !Array.isArray(userData.history)) {
    userData.history = [];
  }
  if (!userData.collection || typeof userData.collection !== 'object' || !Object.keys(userData.collection).length) {
    userData.collection = {};
  }
  if (!userData.picData || userData.picData.toString() !== '[object Object]') {
    userData.picData = {};
  }
  return userData;
};
