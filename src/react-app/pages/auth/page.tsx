import { useState, useEffect } from "react";
import Main from "./main";
import Authorization from "./authorization";
import Success from "./success";
import { EMAIL_AUTH_POLICY } from "../../../shared/config/email-auth-policy";
import { useNavigate } from "react-router";

type AuthStep = "sessionChecking" | "main" | "authorization" | "success";

class SendError extends Error {
    constructor(message: string, readonly retryAt?: number) {
        super(message);
        this.name = "SendError";
    }
}

class VerificationError extends Error {
    constructor(message: string, readonly attempts?: number) {
        super(message);
        this.name = "VerificationError";
    }
}

function AuthPage() {
    const [content, setContent] = useState<AuthStep>("sessionChecking");
    const [email, setEmail] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [retryAt, setRetryAt] = useState<number | null>(null);
    const [now, setNow] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const navigate = useNavigate();

    useEffect(() => {
        const checkSession = async () => {
            try {
                await fetch("/api/otp", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(async (response) => {
                    const data = await response.json() as {
                        user_id?: string;
                        error?: string;
                    };
                    if (!response.ok) {
                        if (response.status !== 401) {
                            throw data.error || "Unknown error occurred";
                        }
                        setContent("main");
                    } else {
                        navigate("/");
                    }
                })
            } catch (error) {
                switch (error) {
                    default:
                        console.error("Error occurred while fetching OTP:", error);
                        navigate("/error");
                }
            }
        }
        checkSession();
    }, []);

    useEffect(() => {
        if (retryAt === null) return;
        const updateNow = () => {
            const current = Date.now();
            setNow(current);

            if (current >= retryAt) {
                window.clearInterval(intervalId);
                setRetryAt(null);
            }
        };
        const intervalId = window.setInterval(updateNow, 1000);
        updateNow();
        return () => window.clearInterval(intervalId);
    }, [retryAt]);

    const sendEmail = async (email: string) => {
        try {
            setLoading(true);
            await fetch("/api/auth/challenges", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email})
            }).then (async (response) => {
                const data = await response.json() as {
                    message?: string;
                    error?: string;
                    retryAt?: number;
                };

                if (!response.ok) {
                    throw new SendError(data.error ?? "Unknown error occurred", response.status === 429 ? data.retryAt : undefined);
                }
                setRetryAt(data.retryAt ?? null);
                setError(null);
            })
            return true;
        } catch (error : unknown) {
            if (error instanceof SendError) {
                switch (error.message) {
                    case "Invalid email address":
                        setError("유효하지 않은 이메일 주소에요.");
                        break;
                    case "Email address is too long":
                        setError("이메일 주소가 너무 길어요.");
                        break;
                    case "Too many requests. (Cooldown limit)":
                        if (error.retryAt) {
                            setRetryAt(error.retryAt);
                            setNow(Date.now());
                        }
                        setError("인증 코드를 너무 많이 요청했어요. 잠시 후 다시 시도해주세요.");
                        break;
                    case "Too many requests. (Window limit)":
                        if (error.retryAt) {
                            setRetryAt(error.retryAt);
                            setNow(Date.now());
                        }
                        setError("인증 코드를 너무 많이 요청했어요. 잠시 후 다시 시도해주세요.");
                        break;
                    default:
                        setError("알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
                        break;
                }
            } else {
                setError("알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
            }
            return false;
        } finally {
            setLoading(false);
            setNow(Date.now());
        }
    }

    const changeToAuthorization = async (email : string) => {
        const result = await sendEmail(email);
        if (result) {
            setContent("authorization");
            setEmail(email);
        }
        return result;
    }

    const submitCode = async (code: string) => {
        try {
            setLoading(true);
            await fetch("/api/auth/challenges/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email, code})
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string;
                    error?: string;
                    attempts?: number;
                };
                if (!response.ok) {
                    throw new VerificationError(data.error ?? "Unknown error occurred", data.attempts);
                }
                setContent("success");
                return true;
            })
        } catch (error : unknown) {
            if (error instanceof VerificationError) {
                switch (error.message) {
                    case "Invalid email address":
                        setError("유효하지 않은 이메일 주소에요.");
                        break;
                    case "Email address is too long":
                    setError("이메일 주소가 너무 길어요.");
                    break;
                    case "Invalid verification code":
                        setError("유효하지 않은 인증 코드에요.");
                        break;
                    case "Wrong verification code":
                        setError(`인증 코드가 틀렸어요. ${EMAIL_AUTH_POLICY.maxVerificationAttempts - (error.attempts ?? 0)}번 남았어요.`);
                        break;
                    case "No challenge found for this email":
                    case "Challenge has expired":
                        setError("인증 코드가 만료되었어요. 인증 코드를 다시 받아주세요.");
                        break;
                    case "Too many failed attempts.":
                        setError("인증 코드를 너무 많이 틀렸어요. 인증 코드를 다시 받아주세요.");
                        break;
                    default:
                        setError("알 수 없는 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
                        break;
                }
                console.error("Error submitting code:", error);
            } else {
                console.error("Unexpected error:", error);
            }
            return false;
        } finally {
            setLoading(false);
        }
    }

    const JSX = (
        <div className="relative w-full h-full flex flex-row items-center justify-center">
            <div className="flex flex-1 flex-col items-end justify-center p-8">
                <img src="/symbol.svg" className="w-auto h-[250px]"/>
            </div>
            {content === "main" && <Main enterEmail={changeToAuthorization} error={error} activateButton={!loading} />}
            {content === "authorization" && <Authorization email={email} enterCode={submitCode} resendCode={sendEmail} error={error} retryAt={retryAt} now={now} activateButton={!loading} />}
            {/*
            <div className="absolute pointer-events-none inset-0 flex flex-col items-start justify-end p-8 gap-1">
                <h3 className="text-2xl font-semibold text-text">솟대</h3>
                <p className="text-lg text-text">성역이나 경계의 상징 또는 마을의 수호신으로 세우는 신목</p>
                <p className="text-sm text-text">-「한국민족문화대박과사전」</p>
            </div>
            */}
        </div>
    )

    if (content === "main" || content === "authorization") {
        return JSX
    } else if (content === "success") {
        navigate("/");
        return <Success />
    } else if (content === "sessionChecking") {
        return <div></div>
    } else {
        return <div>Invalid content</div>
    }
}

export default AuthPage