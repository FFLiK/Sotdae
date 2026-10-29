async function createAESGCMKey(key: string): Promise<CryptoKey> {
    const keyBytes = Uint8Array.from(
        key.match(/.{2}/g)!,
        byte => parseInt(byte, 16)
    );
    return await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptAESGCM(plainText: string, key: string): Promise<{ cipherText: string; iv: string }> {
    const cryptoKey = await createAESGCMKey(key);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherText = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        new TextEncoder().encode(plainText)
    );
    return { cipherText: base64EncodeFromArrayBuffer(cipherText), iv: base64EncodeFromUint8Array(iv) };
}

async function decryptAESGCM(cipherText: string, iv: string, key: string): Promise<string> {
    const cryptoKey = await createAESGCMKey(key);
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64DecodeToUint8Array(iv) },
        cryptoKey,
        base64DecodeToArrayBuffer(cipherText)
    );
    return new TextDecoder().decode(decryptedBuffer);
}

function base64EncodeFromArrayBuffer(arrayBuffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
}

function base64EncodeFromUint8Array(uint8Array: Uint8Array): string {
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
}

function base64DecodeToArrayBuffer(base64String: string): ArrayBuffer {
    const binaryString = atob(base64String);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array.buffer;
}

function base64DecodeToUint8Array(base64String: string): Uint8Array {
    const binaryString = atob(base64String);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
}

export { encryptAESGCM, decryptAESGCM };