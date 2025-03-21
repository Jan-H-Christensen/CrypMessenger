export const generateKey = async () => {
    return crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  };
  
  export const encryptMessage = async (key: CryptoKey, message: string) => {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoder.encode(message)
    );
    return { iv, encrypted };
  };
  
  export const decryptMessage = async (key: CryptoKey, iv: Uint8Array, encrypted: ArrayBuffer) => {
    const decoder = new TextDecoder();
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );
    return decoder.decode(decrypted);
  };