import { base32nopad } from "@scure/base";

async function generateOtpCode(otpKey: string, timeInterval: number) {
    const secretBytes = base32nopad.decode(otpKey);    
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        secretBytes,
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
    );

    if (!Number.isSafeInteger(timeInterval) || timeInterval < 0) {
        throw new RangeError("Invalid HOTP counter");
    }

    const counter = new ArrayBuffer(8);
    new DataView(counter).setBigUint64(0, BigInt(timeInterval), false);

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, counter);
    const hash = new Uint8Array(signature);

    const offset = hash[hash.length - 1] & 0x0f;
    const binaryCode =
        ((hash[offset] & 0x7f) << 24) |
        (hash[offset + 1] << 16) |
        (hash[offset + 2] << 8) |
        hash[offset + 3];

    return (binaryCode % 1_000_000).toString().padStart(6, "0");
}

export { generateOtpCode };