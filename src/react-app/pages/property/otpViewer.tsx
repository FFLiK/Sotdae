import { useEffect, useRef, useState } from "react";
import { TrashIcon } from "@heroicons/react/16/solid";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/20/solid";

type OtpViewerProps = {
    otpId: string;
    navigate: any;
    otpTitle: string;
    otpServiceName: string;
    firstOtpCode: string | null;
    firstTimeInterval: number;
    otpVisibilityParent: boolean;
}

function OtpViewer({otpId, navigate, otpTitle, otpServiceName, firstOtpCode, firstTimeInterval, otpVisibilityParent}: OtpViewerProps) {
    const otpLength = 6;
    const secreteLength = 2;
    const [now, setNow] = useState(Date.now());
    const [progress, setProgress] = useState(otpLength + secreteLength);
    const [otpVisibility, setOtpVisibility] = useState<boolean>(otpVisibilityParent);
    const [currentOtpCode, setCurrentOtpCode] = useState<string | null>(firstOtpCode);
    const nextOtpCode = useRef<string | null>(null);
    const timeInterval = useRef(firstTimeInterval);
    const nextTimeInterval = useRef(0);

    useEffect(() => {
        setProgress(otpLength + secreteLength);
        setCurrentOtpCode(firstOtpCode);
        setNow(Date.now());
        timeInterval.current = firstTimeInterval;
        nextOtpCode.current = null;
        nextTimeInterval.current = 0;
        setOtpVisibility(otpVisibilityParent);
        getNextOtpCode();
    },[otpId, navigate, firstOtpCode]);
    
    // Update the current time every 100 milliseconds
    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 100);
        return () => window.clearInterval(intervalId);
    }, []);

    // Update the progress and OTP code based on the current time and the time interval
    const leftTime = 30 - Math.floor((now % 30_000) / 1000);
    const currentProgress = Math.max(0, Math.abs(progress - otpLength - secreteLength / 2) - secreteLength / 2);
    useEffect(() => {
        const currentTimeInterval = Math.floor(now / 30_000);
        if (currentTimeInterval !== timeInterval.current) {
            timeInterval.current = currentTimeInterval;
            setProgress(0);
        } else {    
            let newProgress = progress + 1;
            if (progress > otpLength * 2 + secreteLength) {
                newProgress = otpLength * 2 + secreteLength;
            } else if (progress === otpLength && nextTimeInterval.current !== timeInterval.current) {
                let requestedTimeInterval = timeInterval.current;
                const getCurrentOtp = async () => {
                    try {
                        await fetch("/api/otp/code/" + otpId, {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }).then(async (response) => {
                            const data = await response.json() as {
                                message?: string;
                                error?: string;
                                otpCode?: string;
                                timeInterval?: number;
                            };
                            if (!response.ok) {
                                if (response.status === 401) {
                                    navigate("/login");
                                } else {
                                    throw data.error || "Unknown error occurred";
                                }
                            }
                            if (data.otpCode && data.timeInterval === requestedTimeInterval && requestedTimeInterval === timeInterval.current) {
                                nextOtpCode.current = data.otpCode;
                                nextTimeInterval.current = data.timeInterval || 0;
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
                getCurrentOtp();
            } else if (progress === otpLength + secreteLength / 2) {
                if (nextTimeInterval.current !== timeInterval.current) {
                    newProgress = progress;
                } else {
                    setCurrentOtpCode(nextOtpCode.current);
                    getNextOtpCode();
                }
            }
            setProgress(newProgress);
        }
    }, [now]);

    const getNextOtpCode = async () => {
        try {
            let requestedTimeInterval = timeInterval.current + 1;
            await fetch("/api/otp/code/" + otpId + "/next", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string;
                    error?: string;
                    otpCode?: string;
                    timeInterval?: number;
                };
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate("/login");
                    } else {
                        throw data.error || "Unknown error occurred";
                    }
                }
                if (data.otpCode && data.timeInterval === requestedTimeInterval && requestedTimeInterval === timeInterval.current + 1) {
                    nextOtpCode.current = data.otpCode;
                    nextTimeInterval.current = data.timeInterval || 0;
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

    const changeVisiblity = async () => {
        setOtpVisibility(!otpVisibility);
        fetch(`/api/otp/update/${otpId}/visibility`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                visibility: !otpVisibility,
                timestamp: Date.now()
            }),
        }).then(async (response) => {
            const data = await response.json() as {
                message?: string;
                error?: string;
            };
            if (!response.ok) {
                throw data.error || "Unknown error occurred";
            }
        }).catch((error) => {
            console.error("Error occurred while updating visibility:", error);
        });
    }

    const otpCode = currentOtpCode || "      ";
    const position = [1, 2, 3, 4, 5, 6];

    return (
        <div className="flex flex-1 w-full h-full flex-col items-start justify-between border-border-strong border-1 p-10">
            <div className="flex flex-col w-full items-start justify-start gap-8">
                <div className="flex flex-col items-start justify-center gap-0">
                    <p className="text-lg text-text font-medium">{otpServiceName}</p>
                    <h1 className="text-3xl text-text font-bold">{otpTitle}</h1>
                </div>
                <div className="flex flex-col items-start justify-center w-full gap-2">
                    <div className="flex w-full flex-col items-start justify-center gap-0.5">
                        <div className="flex w-full flex-row items-center justify-between">
                            <p className="text-xs text-text font-medium">공용 계정 OTP</p>
                            <button type="button" onClick={changeVisiblity} className="flex flex-row items-center justify-center">
                                {otpVisibility ? (
                                    <EyeIcon aria-hidden="true" className="size-4 text-text hover:text-text/90 active:text-text/70 transition-colors duration-200"/>
                                ) : (
                                    <EyeSlashIcon aria-hidden="true" className="size-4 text-text hover:text-text/90 active:text-text/70 transition-colors duration-200"/>
                                )}
                            </button>
                        </div>
                        <div className="flex w-full flex-col items-center justify-center gap-2 border-border-strong border-2 px-2">
                            <div className="flex w-full flex-row items-center justify-center gap-3 border-border-weak border-x-2 py-1">
                                <div className="flex flex-row items-center justify-center gap-1">
                                    <p className="text-3xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: currentProgress >= position[0] ? 1 : 0 }}>
                                        {otpVisibility || !currentOtpCode ? otpCode[0] : '*'}
                                    </p>
                                    <p className="text-3xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: currentProgress >= position[1] ? 1 : 0 }}>
                                        {otpVisibility || !currentOtpCode ? otpCode[1] : '*'}
                                    </p>
                                    <p className="text-3xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: currentProgress >= position[2] ? 1 : 0 }}>
                                        {otpVisibility || !currentOtpCode ? otpCode[2] : '*'}
                                    </p>
                                </div>
                                <div className="flex flex-row items-center justify-center gap-1">
                                    <p className="text-3xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: currentProgress >= position[3] ? 1 : 0 }}>
                                        {otpVisibility || !currentOtpCode ? otpCode[3] : '*'}
                                    </p>
                                    <p className="text-3xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: currentProgress >= position[4] ? 1 : 0 }}>
                                        {otpVisibility || !currentOtpCode ? otpCode[4] : '*'}
                                    </p>
                                    <p className="text-3xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: currentProgress >= position[5] ? 1 : 0 }}>
                                        {otpVisibility || !currentOtpCode ? otpCode[5] : '*'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full flex-col items-start justify-between gap-0">
                        <div className="flex w-full h-[12px] flex-row items-center justify-start border-border-strong border-2">
                            <div className={"h-full bg-foreground transition-[width] duration-500 ease-out"} style={{ width: `${((leftTime - 1) / 29) * 100}%` }}></div>
                        </div>
                        <p className="text-lg text-text font-bold">{leftTime}</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col w-full items-start justify-center gap-1.5">
                <button type="submit" 
                    className="flex flex-row w-full items-center justify-center bg-foreground border-border-strong border-2 p-2 gap-2
                    hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                    disabled:cursor-not-allowed disabled:bg-foreground/70"
                    onClick={() => {
                        // Handle delete OTP logic here
                    }}
                >
                    <span className="text-md font-medium text-text-inverse">공용 OTP 지우기</span>
                    <TrashIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                </button>
                <button type="submit" 
                    className="flex flex-row w-full items-center justify-center bg-background border-border-strong border-2 p-2 gap-2
                    hover:bg-foreground/10 active:bg-foreground/20 transition-colors duration-200
                    disabled:cursor-not-allowed disabled:bg-foreground/70"
                    onClick={() => {
                        navigate("/");
                    }}
                >
                    <span className="text-md font-medium text-text">돌아가기</span>
                </button>
            </div>
        </div>
    )
}

export default OtpViewer;