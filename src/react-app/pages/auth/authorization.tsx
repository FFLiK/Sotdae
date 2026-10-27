import { useState, useRef, useEffect, FormEvent } from "react";
import { CheckIcon } from "@heroicons/react/16/solid";
import { EMAIL_PIN_POLICY } from "../../../shared/config/email-auth-policy";

type AuthorizationProps = {
    email: string;
    enterCode: (code: string) => void;
    resendCode: (email: string) => void;
    error: string | null;
    retryAt: number | null;
    now: number | null;
}

function AuthorizationPage({ email, enterCode, resendCode, error, retryAt, now }: AuthorizationProps) {
    const [code, setCode] = useState("");
    const codeInputElement = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const activeIndex = Math.min(code.length, EMAIL_PIN_POLICY.PIN_LENGTH - 1);

    const normalizedEmail = email.substring(0, 3) + "****" 
        + email.substring(email.indexOf("@"), Math.min(email.length, email.indexOf("@") + 10)) 
        + (email.length > email.indexOf("@") + 10 ? "..." : "");

    function handleCodeChange(rawValue: string) {
        const nomalizedValue = rawValue.replace(/[^0-9]/g, "").slice(0, EMAIL_PIN_POLICY.PIN_LENGTH);
        setCode(nomalizedValue);
    }

    useEffect(() => {
        codeInputElement.current?.focus();
    }, []);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (code.length !== EMAIL_PIN_POLICY.PIN_LENGTH) return;
        enterCode(code);
        setCode("");
        codeInputElement.current?.focus();
    }

    const digits = Array.from({ length: EMAIL_PIN_POLICY.PIN_LENGTH }, (_, i) => code[i] || "");

    const timeLeft = retryAt && now ? Math.max(0, Math.ceil((retryAt - now) / 1000)) : null;
    const timeLeftMin = timeLeft ? Math.floor(timeLeft / 60) : null;
    const timeLeftSec = timeLeft ? timeLeft % 60 : null;

    return (
        <div className="flex flex-1 h-full flex-col items-start justify-center gap-8 border-border-strong p-8">
            <div className="flex flex-col items-start justify-center gap-2">
                <p className="text-2xl"><span className="font-bold">{normalizedEmail}</span>로</p>
                <p className="text-2xl">인증 코드를 보냈어요</p>
            </div>
            <div className="flex flex-col items-start justify-center gap-2">
                <form className="flex flex-col justify-start gap-2 items-stretch" onSubmit={handleSubmit}>
                    <div className="relative flex">
                        <input
                            className="absolute inset-0 z-100 h-full w-full 
                            bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent" 
                            type="text" 
                            inputMode="numeric" 
                            pattern={`[0-9]{${EMAIL_PIN_POLICY.PIN_LENGTH}}`}
                            autoComplete="one-time-code" 
                            maxLength={EMAIL_PIN_POLICY.PIN_LENGTH} 
                            value={code} 
                            onChange={
                                (e) => handleCodeChange(e.currentTarget.value)
                            }
                            aria-label="인증 코드 입력"
                            ref={codeInputElement}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            />
                        <div aria-hidden="true" className="pointer-events-none flex gap-[5px] px-[5px] border-border-strong border-2 bg-transparent">
                            {digits.map((digit, index) => {
                                const isActive = isFocused && index === activeIndex;
                                return (
                                    <div key={index} className="relative flex items-center justify-center w-[50px] h-[50px] border-border-strong border-x-2">
                                    <span className="text-4xl text-text font-black">{digit}</span>

                                    {isActive && code.length < EMAIL_PIN_POLICY.PIN_LENGTH && (
                                        <span
                                        className="
                                            pointer-events-none absolute
                                            left-1/2 top-1/2
                                            h-8 w-[1.5px]
                                            -translate-x-1/2 -translate-y-1/2
                                            bg-text
                                            motion-safe:animate-[caret-blink_600ms_step-end_infinite]
                                        "
                                        />
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                    <button type="submit" 
                        className="flex flex-row items-center justify-center bg-foreground border-border-strong border-2 p-2 gap-1
                        hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200"
                    >
                        <span className="text-lg font-medium text-text-inverse">확인</span>
                        <CheckIcon aria-hidden="true" className="size-5 text-text-inverse"/>
                    </button>
                </form>
                {error && !retryAt && <p className="text-sm text-error">{error}</p>}
                <div className="flex flex-row items-center justify-start gap-2">
                    {retryAt && (
                        <p className="text-sm text-text">{
                            (timeLeftMin !== null && timeLeftMin > 0) ? `${timeLeftMin}분 ${timeLeftSec}초` : `${timeLeftSec}초`
                        } 후에 코드를 다시 받을 수 있어요.</p>
                    )}
                    {!retryAt && (
                        <span className="text-sm text-text">코드를 받지 못했나요?</span>
                    )}
                    {!retryAt && (
                        <button className="text-sm text-text underline hover:text-text/80 active:text-text/60 transition-colors duration-200" 
                        onClick={(e) => {
                            e.preventDefault();
                            resendCode(email);
                        }}>다시 보내기</button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AuthorizationPage