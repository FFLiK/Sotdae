import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import sessionCheck from "../../methods/checkSession";
import { ArrowRightIcon, KeyIcon, PlusIcon, UserIcon } from "@heroicons/react/16/solid";
import { XMarkIcon, QrCodeIcon } from "@heroicons/react/24/solid";
import { EyeSlashIcon, EyeIcon } from "@heroicons/react/20/solid";

function CreatePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<"enterName" | "enterUsers" | "enterCode">("enterName");
    const [title, setTitle] = useState<string>("");
    const [serviceName, setServiceName] = useState<string>("");
    const [currentEmail, setCurrentEmail] = useState<string>("");
    const [emails, setEmails] = useState<string[]>([]);
    const [otpKey, setOtpKey] = useState<string>("");
    const [showKey, setShowKey] = useState(false);

    const emailListRef = useRef<HTMLDivElement>(null);
    const shouldScrollToEnd = useRef(false);

    useEffect(() => {
        sessionCheck(navigate).then(() => {
            setLoading(false);
        });
    }, [])

    let description = "";
    switch(step) {
        case "enterName":
            description = "새로운 공용 OTP의 이름과 계정 종류를 입력해주세요";
            break;
        case "enterUsers":
            description = "OTP를 함께 이용할 사람들을 초대해주세요";
            break;
        case "enterCode":
            description = "OTP 키를 입력해주세요";
            break;
    }
    let buttonType: "next" | "submit" = "next";
    if (step === "enterCode") {
        buttonType = "submit";
    }

    const isEmailValid = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const addEmail = () => {
        const email = currentEmail.trim();
        if (!email) return;
        if (!isEmailValid(email)) return;
        if (emails.includes(email)) return;
        setEmails([...emails, email]);
        setCurrentEmail("");
        shouldScrollToEnd.current = true;
    };

    const isKeyValid = (key: string) => {
        const keyRegex = /^[A-Z2-7]{32}$/;
        return keyRegex.test(key);
    }

    const createOtp = async () => {
        if (title.trim() === "" || serviceName.trim() === "" || otpKey.trim() === "" || !isKeyValid(otpKey.trim())) {
            return;
        }
        for (const email of emails) {
            if (!isEmailValid(email)) {
                return;
            }
        }
        try {
            await fetch("/api/otp/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    serviceName: serviceName.trim(),
                    otpKey: otpKey.trim(),
                    emails: emails,
                }),
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string,
                    otpId?: string,
                    error?: string
                };
                if (data.otpId) {
                    //navigate(`/otp/${data.otpId}`);
                    navigate('/');
                } else {
                    throw new Error(data.error || "Failed to create OTP");
                }
            });
        } catch (error) {
            console.error("Failed to create OTP:", error);
            navigate("/error");
        }
    }

    useEffect(() => {
        if (!shouldScrollToEnd.current) return;
        const element = emailListRef.current;
        if (!element) return;
        shouldScrollToEnd.current = false;
        
        element.scrollTo({
            left: element.scrollWidth,
            behavior: "smooth",
        });
    }, [emails]);

    const nameInput = (
        <div className="flex w-full flex-col items-start justify-center gap-1 border-border-strong border-x-2">
            <div className="flex w-full h-9 flex-row items-center justify-center border-border-strong border-b-2">
                <div className="flex w-20 h-full shrink-0 flex-col items-center justify-center pl-4">
                    <p className="text-md font-regular">이름</p>
                </div>
                <div className="flex h-full flex-1 flex-col items-center justify-center">
                    <input type="text" 
                        className="flex w-full h-full bg-transparent px-4 text-md text-text 
                        placeholder:text-placeholder placeholder:text-sm focus:outline-hidden focus:border-foreground" 
                        placeholder="새 OTP의 이름을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        />
                </div>
            </div>
            <div className="flex w-full h-9 flex-row items-center justify-center border-border-strong border-t-2">
                <div className="flex w-20 h-full shrink-0 flex-col items-center justify-center pl-4">
                    <p className="text-md font-regular">계정 종류</p>
                </div>
                <div className="flex h-full flex-1 flex-col items-center justify-center">
                    <input type="text" 
                        className="flex w-full h-full bg-transparent px-4 text-md text-text 
                        placeholder:text-placeholder placeholder:text-sm focus:outline-hidden focus:border-foreground" 
                        placeholder="새 OTP의 계정 종류를 입력하세요"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        />
                </div>
            </div>
        </div>
    )

    const userInput = (
        <div className="flex w-full flex-col items-start justify-center gap-1 border-border-strong border-x-2">
            <div className="flex w-full h-9 flex-row items-center justify-center border-border-strong border-b-2">
                <div className="flex h-full flex-1 flex-col items-center justify-center">
                    <input type="email" 
                        className="flex w-full h-full bg-transparent px-4 text-md text-text 
                        placeholder:text-placeholder placeholder:text-sm focus:outline-hidden focus:border-foreground" 
                        placeholder="이메일 주소를 입력하세요"
                        value={currentEmail}
                        onChange={(e) => setCurrentEmail(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "NumpadEnter" || e.key === "Tab") {
                                if (e.nativeEvent.isComposing || e.repeat) return;
                                e.preventDefault();
                                if (isEmailValid(currentEmail.trim()) && currentEmail.trim() !== "") {
                                    addEmail();
                                }
                            }
                        }}
                        />
                </div>
                <button type="button" 
                    className="flex h-full aspect-square flex-row items-center justify-center bg-foreground border-border-strong border-l-2
                    hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                    disabled:cursor-not-allowed disabled:bg-foreground/70"
                    onClick={() => {
                        addEmail();
                    }}
                    disabled={(isEmailValid(currentEmail.trim()) === false || currentEmail.trim() === "")}
                >
                    <PlusIcon aria-hidden="true" className="size-5 text-text-inverse"/>
                </button>
            </div>
            <div className="flex w-full min-h-9 flex-row items-center justify-center border-border-strong border-t-2 px-3 py-1">
                {emails.length === 0 && <button type="button" className="text-xs font-regular text-text underline hover:text-text/90 active:text-text/70">시트 파일로 불러오기</button>}
                {emails.length !== 0 && 
                <div className="flex h-full w-full flex-row items-center justify-center gap-3">
                    <div className="flex h-full w-full gap-1 overflow-x-auto overflow-y-hidden email-scrollbar" ref={emailListRef}>
                        {(
                            emails.map((email, index) => (
                                <div key={index} className="flex h-6.5 jusify-center items-center pl-3 pr-0.5 border-border-strong border-2 shrink-0 whitespace-nowrap">
                                    <p className="text-sm font-regular text-text">{email}</p>
                                    <button type="button"
                                        className="flex h-full aspect-square flex-row items-center justify-center text-text
                                        hover:text-text/50 active:text-text/30 transition-colors duration-200"
                                        onClick={() => {
                                            setEmails(emails.filter((_, i) => i !== index));
                                        }}
                                    >
                                        <XMarkIcon aria-hidden="true" className="size-3.5"/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex flex-row items-center justify-center gap-0.25">
                        <UserIcon className="size-4 text-text"/>
                        <p className="text-sm font-medium text-text">{emails.length}</p>
                    </div>
                </div>
                }        
            </div>
        </div>
    )

    const codeInput = (
        <div className="flex w-full flex-col items-start justify-center gap-1 border-border-strong border-x-2">
            <div className="flex w-full h-9 flex-row items-center justify-center">
                <div className="flex h-full flex-1 flex-row items-center justify-center px-1 gap-1">
                    <input type={showKey ? "text" : "password"}
                        className="flex w-full h-full bg-transparent text-md text-text pl-3
                        placeholder:text-placeholder placeholder:text-sm focus:outline-hidden focus:border-foreground" 
                        placeholder="키를 입력하세요"
                        value={otpKey}
                        onChange={(e) => setOtpKey(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === "NumpadEnter") {
                                if (e.nativeEvent.isComposing || e.repeat) return;
                                e.preventDefault();
                                if (isKeyValid(otpKey.trim()) && otpKey.trim() !== "") {
                                    createOtp();
                                }
                            }
                        }}
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(value => !value)}
                            aria-controls="otp-key"
                            className="flex min-h-3/4 aspect-square flex-row items-center justify-center text-text hover:text-text/90 active:text-text/70 transition-colors duration-200"
                        >
                            {showKey ? <EyeIcon className="size-3.5" /> : <EyeSlashIcon className="size-3.5" />}
                        </button>
                </div>
                <button type="button" 
                    className="flex h-full flex-row items-center justify-center bg-foreground border-border-strong border-l-2
                    hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                    disabled:cursor-not-allowed disabled:bg-foreground/70 gap-1 px-2.5"
                    onClick={() => {
                        // Open QR code scanner
                    }}
                >
                    <span className="text-sm font-medium text-text-inverse">QR 스캔하기</span>
                    <QrCodeIcon aria-hidden="true" className="size-4.5 text-text-inverse"/>
                </button>
            </div>
        </div>
    )

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
        {!loading && (
            <div className="flex h-full flex-row items-center justify-center border-border-strong border-x-1 px-4">
                <div className="flex h-full flex-col items-center justify-center border-border-strong border-x-2 gap-2">
                    <form className="flex w-100 flex-col items-center justify-center gap-1 border-border-strong border-y-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (step === "enterName") {
                            setStep("enterUsers");
                        } else if (step === "enterUsers") {
                            setStep("enterCode");
                        } else {
                            createOtp();
                        }
                    }}
                    >
                        <div className="flex w-full flex-col items-center justify-center p-8 border-border-strong border-b-2 gap-2">
                            <h1 className="text-2xl font-bold">새 공용 OTP 만들기</h1>
                            <p className="text-md font-regular">{description}</p>
                        </div>
                        <div className="flex w-full flex-col items-center justify-center px-3 border-border-strong border-y-2">
                            {step === "enterName" && nameInput}
                            {step === "enterUsers" && userInput}
                            {step === "enterCode" && codeInput}
                        </div>
                        <button type="submit" 
                            className="flex flex-row w-full items-center justify-center bg-foreground border-border-strong border-t-2 p-2 gap-2
                            hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                            disabled:cursor-not-allowed disabled:bg-foreground/70"
                            disabled={(step === "enterName" && (title.trim() === "" || serviceName.trim() === "")) || (step === "enterCode" && (otpKey.trim() === "" || isKeyValid(otpKey.trim()) === false))}
                        >
                            <span className="text-md font-medium text-text-inverse">{buttonType === "next" ? "다음으로" : "OTP 만들기"}</span>
                            {buttonType === "next" && <ArrowRightIcon aria-hidden="true" className="size-4 text-text-inverse"/>}
                            {buttonType === "submit" && <KeyIcon aria-hidden="true" className="size-4 text-text-inverse"/>}
                        </button>
                    </form>
                    <button type="button" 
                    className="text-xs font-regular text-text underline hover:text-text/90 active:text-text/70 absolute bottom-4"
                    onClick={() => {
                        if (step === "enterUsers") {
                            setStep("enterName");
                        } else if (step === "enterCode") {
                            setStep("enterUsers");
                        } else {
                            navigate("/");
                        }
                    }}>
                        이전으로
                    </button>
                </div>
            </div>
        )}
        </div>
    )
}

export default CreatePage;