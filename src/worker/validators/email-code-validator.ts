import { ValidationResult } from "./validator-types";
import { EMAIL_PIN_POLICY } from "../../shared/config/email-auth-policy.ts"

function emailCodeValidator(code: string): ValidationResult {
    const codeRegex = new RegExp(`^[0-9]{${EMAIL_PIN_POLICY.PIN_LENGTH}}$`);
    if (typeof code !== "string" || !codeRegex.test(code)) {
        return {error: "Invalid verification code", status: 400};
    }
    return null;
}

export { emailCodeValidator };