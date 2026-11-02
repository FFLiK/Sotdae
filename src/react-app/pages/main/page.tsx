import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { KeyIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/16/solid";
import OtpBox from "../../components/otp-box";
import logout from "../../methods/logout";

type Otp = {
    id: string;
    title: string;
    serviceName: string;
    otpCode: string;
    visibility: boolean;
    isManager: boolean;
}

function MainPage() {
    const otpLength = 6;
    const secreteLength = 2;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(Date.now());
    const [progress, setProgress] = useState(otpLength + secreteLength);
    const [otpList, setOtpList] = useState<Otp[]>([]);
    const nextOtpList = useRef<Otp[]>([]);
    const timeInterval = useRef(Math.floor(now / 30_000));
    const nextTimeInterval = useRef(0);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 100);
        return () => window.clearInterval(intervalId);
    }, []);

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
                        await fetch("/api/otp", {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        }).then(async (response) => {
                            const data = await response.json() as {
                                message?: string;
                                error?: string;
                                otpList?: Otp[];
                                timeInterval?: number;
                            };
                            if (!response.ok) {
                                if (response.status === 401) {
                                    navigate("/login");
                                } else {
                                    throw data.error || "Unknown error occurred";
                                }
                            }
                            if (data.otpList && data.timeInterval === requestedTimeInterval && requestedTimeInterval === timeInterval.current) {
                                nextOtpList.current = data.otpList;
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
                    setOtpList(nextOtpList.current);
                    getNextOtpList();
                }
            }
            setProgress(newProgress);
        }
    }, [now]);

    useEffect(() => {
        const getOtp = async () => {
            try {
                await fetch("/api/otp", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(async (response) => {
                    const data = await response.json() as {
                        message?: string;
                        error?: string;
                        otpList?: Otp[];
                        timeInterval?: number;
                    };
                    if (!response.ok) {
                        if (response.status === 401) {
                            navigate("/login");
                        } else {
                            throw data.error || "Unknown error occurred";
                        }
                    }
                    if (data.otpList) {
                        setOtpList(data.otpList);
                        timeInterval.current = data.timeInterval || 0;
                        getNextOtpList();
                    }
                })
            } catch (error) {
                switch (error) {
                    default:
                        console.error("Error occurred while fetching OTP:", error);
                        navigate("/error");
                }
            } finally {
                setLoading(false);
            }
        }
        const getUserEmail = async () => {
            try {
                await fetch("/api/user/email", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(async (response) => {
                    const data = await response.json() as {
                        email?: string;
                        message?: string;
                        error?: string;
                    };
                    if (!response.ok) {
                        if (response.status === 401) {
                            navigate("/login");
                        } else {
                            throw data.error || "Unknown error occurred";
                        }
                    }
                    if (data.email) {
                        setUserEmail(data.email);
                    }
                })
            } catch (error) {
                switch (error) {
                    case "User not found":
                        logout(navigate);
                        break;
                    default:
                        console.error("Error occurred while fetching user email:", error);
                        navigate("/error");
                }
            }
        }
        getOtp();
        getUserEmail();
    }, []);

    const getNextOtpList = async () => {
        try {
            let requestedTimeInterval = timeInterval.current + 1;
            await fetch("/api/otp/next", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string;
                    error?: string;
                    otpList?: Otp[];
                    timeInterval?: number;
                };
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate("/login");
                    } else {
                        throw data.error || "Unknown error occurred";
                    }
                }
                if (data.otpList && data.timeInterval === requestedTimeInterval && requestedTimeInterval === timeInterval.current + 1) {
                    nextOtpList.current = data.otpList;
                    for (let i = 0; i < nextOtpList.current.length; i++) {
                        for (let j = 0; j < otpList.length; j++) {
                            if (nextOtpList.current[i].id === otpList[j].id) {
                                nextOtpList.current[i].visibility = otpList[j].visibility;
                                break;
                            }
                        }
                    }
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

    const OtpBoxContent = (otp : Otp, i : number) => (
        <OtpBox key={otp.id} title={otp.title} serviceName={otp.serviceName} otpCode={otp.otpCode} visibility={otp.visibility} progress={currentProgress} isSettingEnabled={otp.isManager} onEyeButtonClicked={() => {
            const newOtpList = [...otpList];
            newOtpList[i].visibility = !newOtpList[i].visibility;
            for (let j = 0; j < nextOtpList.current.length; j++) {
                if (nextOtpList.current[j].id === newOtpList[i].id) {
                    nextOtpList.current[j].visibility = newOtpList[i].visibility;
                    break;
                }
            }
            fetch(`/api/otp/update/${otp.id}/visibility`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    visibility: newOtpList[i].visibility,
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
            setOtpList(newOtpList);
        }} onSettingButtonClicked={() => {
            navigate("/property/" + otp.id);
        }} />
    )

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
        {!loading && (
            <div className="flex max-w-screen-lg w-full h-full flex-row items-center justify-center gap-16">
                <div className="flex flex-1 w-full h-full flex-col items-start justify-between border-border-strong border-1 p-10">
                    <div className="flex flex-col w-full items-start justify-start gap-8">
                        <div className="flex flex-col items-start justify-center gap-0.5">
                            <p className="text-lg text-text font-medium">{userEmail}</p>
                            <h1 className="text-2xl text-text font-bold">공유 계정 인증 코드 목록</h1>
                        </div>
                        <div className="flex flex-col items-start justify-center w-full gap-0.5">
                            <p className="text-xs text-text font-regular">새로고침까지 남은 시간</p>
                            <p className="text-4xl text-text font-extrabold">{leftTime}</p>
                            <div className="flex w-full h-[12px] flex-row items-center justify-start border-border-strong border-2">
                                <div className={"h-full bg-foreground transition-[width] duration-500 ease-out"} style={{ width: `${((leftTime - 1) / 29) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col w-full items-start justify-center gap-1.5">
                        <button type="submit" 
                            className="flex flex-row w-full items-center justify-center bg-foreground border-border-strong border-2 p-2 gap-2
                            hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                            disabled:cursor-not-allowed disabled:bg-foreground/70"
                            onClick={() => {
                                navigate("/create");
                            }}
                        >
                            <span className="text-md font-medium text-text-inverse">공용 OTP 만들기</span>
                            <KeyIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                        </button>
                        <button type="submit" 
                            className="flex flex-row w-full items-center justify-center bg-background border-border-strong border-2 p-2 gap-2
                            hover:bg-foreground/10 active:bg-foreground/20 transition-colors duration-200
                            disabled:cursor-not-allowed disabled:bg-foreground/70"
                            onClick={() => {
                                logout(navigate);
                            }}
                        >
                            <span className="text-md font-medium text-text">로그아웃</span>
                            <ArrowRightStartOnRectangleIcon aria-hidden="true" className="size-4 text-text"/>
                        </button>
                    </div>
                </div>
                {otpList.length > 0 &&                 
                <div className="flex flex-2 w-full h-full flex-row border-border-strong border-1 px-4 gap-4">
                    <div className="flex flex-1 w-full h-full flex-col items-start justify-start gap-8 border-border-strong border-x-2 py-10">
                    {otpList.map((otp, i) => (i % 2 === 0 && OtpBoxContent(otp, i)))}
                    </div>
                    <div className="flex flex-1 w-full h-full flex-col items-start justify-start gap-8 border-border-strong border-x-2 py-10">
                        {otpList.map((otp, i) => (i % 2 === 1 && OtpBoxContent(otp, i)))}
                    </div>
                </div>}
                {otpList.length === 0 && 
                <div className="flex flex-2 w-full h-full flex-row border-border-strong border-1 px-4 gap-4">
                    <div className="flex flex-1 w-full h-full flex-col items-center justify-center gap-1">                 
                        <p className="text-xl text-text font-bold">공유된 계정이 없어요</p>
                        <p className="text-sm text-text font-regular">공유 계정을 만들고 다른 사람과 인증 코드를 공유해보세요</p>
                    </div>
                </div>}
            </div>
        )}
        </div>
    )
}

export default MainPage;