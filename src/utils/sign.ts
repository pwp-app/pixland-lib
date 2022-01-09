import { createSHA256, createHMAC } from 'hash-wasm';

export const signRequest = async ({ payload, timestamp }: { payload: unknown; timestamp: number }) => {
  const toSign = `${JSON.stringify(payload)}_${timestamp}`;
  return await (await createHMAC(createSHA256(), 'pixland')).update(toSign).digest('hex');
};
