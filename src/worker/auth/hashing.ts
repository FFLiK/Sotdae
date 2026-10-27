async function createHMACKey(pepper: string): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(pepper),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

async function createHmacCode(codeMessage: string, pepper: string): Promise<string> {
    const key = await createHMACKey(pepper);
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(codeMessage));
    return toHex(new Uint8Array(mac));
}

async function verifyHmacCode(codeMessage: string, pepper: string, hmacHex: string): Promise<boolean> {
    const key = await createHMACKey(pepper);
    return crypto.subtle.verify("HMAC", key, fromHex(hmacHex), new TextEncoder().encode(codeMessage));
}

async function createSHA256Hash(data: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    return toHex(new Uint8Array(hashBuffer));
}

function toHex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error("Invalid HMAC format");
  }

  return new Uint8Array(
    hex.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16)),
  );
}

export { createHmacCode, verifyHmacCode, createSHA256Hash };