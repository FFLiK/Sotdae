import type { ValidationResult } from "./validator-types";

function emailValidator(email: string) : ValidationResult {
    const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (typeof email !== "string" || !emailRegex.test(email)) {
        return {error: "Invalid email address", status: 400};
    }
    if (email.length > 254) {
        return {error: "Email address is too long", status: 400};
    }
    return null;
}

export { emailValidator };