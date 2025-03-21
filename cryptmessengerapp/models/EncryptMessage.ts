export type EncryptMessage = {
  ConnectionId: string;
  UserName: string;
  IV: Uint8Array;
  Message: ArrayBuffer;
};
