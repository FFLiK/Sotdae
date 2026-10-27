function generateVerificationCode(length: number): string {
    let code = "";
    while (code.length < length) {
        const byte = crypto.getRandomValues(new Uint8Array(1))[0];
        if (byte >= 250) continue;
        code += (byte % 10).toString();
    }
    return code;
}

function codeMessage(email: string, challenge_id: string, code: string) {
  return `sotdae-auth-v1\0${email}\0${challenge_id}\0${code}`;
}

export { generateVerificationCode, codeMessage };