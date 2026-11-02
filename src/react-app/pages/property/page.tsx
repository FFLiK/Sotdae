import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CheckIcon, XMarkIcon, UserIcon, ArrowLeftIcon, ArrowRightIcon, PlusIcon } from "@heroicons/react/16/solid";
import { Cog8ToothIcon } from "@heroicons/react/20/solid";
import OtpViewer from "./otpViewer";
import checkManagerSession from "../../methods/checkManager";

type Otp = {
    id: string;
    title: string;
    serviceName: string;
    otpCode: string;
    visibility: boolean;
    isManager: boolean;
}

function PropertyPage() {
    const { id : otpId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [otpTitle, setOtpTitle] = useState<string>("");
    const [otpServiceName, setOtpServiceName] = useState<string>("");
    const [changingTitle, setChangingTitle] = useState<boolean>(false);
    const [changingServiceName, setChangingServiceName] = useState<boolean>(false);
    const [newTitle, setNewTitle] = useState<string>("");
    const [newServiceName, setNewServiceName] = useState<string>("");
    const [members, setMembers] = useState<{ userId: string; userEmail: string; isManager: boolean; isSelected: boolean }[]>([]);
    const [firstOtp, setFirstOtp] = useState<{code: string, timeInterval: number, visibility: boolean} | null>(null);
    const isMultipleChoiceActivated = useRef(false);

    const [currentEmail, setCurrentEmail] = useState<string>("");
    const [emails, setEmails] = useState<string[]>([]);
    const emailListRef = useRef<HTMLDivElement>(null);
    const shouldScrollToEnd = useRef(false);

    // Fetch the OTP details when the component mounts
    useEffect(() => {
        setLoading(true);
        let cancelled = false;
        checkManagerSession(navigate, otpId || "").then(() => {
            setLoading(false);
        });
        const getOtp = async () => {
            try {
                await fetch("/api/otp/" + otpId, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(async (response) => {
                    const data = await response.json() as {
                        message?: string;
                        error?: string;
                        otp?: Otp;
                        timeInterval?: number;
                    };
                    if (!response.ok) {
                        if (response.status === 401) {
                            navigate("/login");
                        } else {
                            throw data.error || "Unknown error occurred";
                        }
                    }
                    if (data.otp) {
                        if (cancelled) return;
                        setOtpTitle(data.otp.title);
                        setNewTitle(data.otp.title);
                        setOtpServiceName(data.otp.serviceName);
                        setNewServiceName(data.otp.serviceName);
                        setFirstOtp({
                            code: data.otp.otpCode,
                            timeInterval: data.timeInterval || 0,
                            visibility: data.otp.visibility,
                        })
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
        const getMembers = async () => {
            try {
                await fetch("/api/otp/" + otpId + "/members", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }).then(async (response) => {
                    const data = await response.json() as {
                        message?: string;
                        error?: string;
                        members?: { userId: string; userEmail: string; isManager: boolean }[];
                    };
                    if (!response.ok) {
                        if (response.status === 401) {
                            navigate("/login");
                        } else if (response.status === 403) {
                            navigate("/");
                        } else {
                            throw data.error || "Unknown error occurred";
                        }
                    }
                    if (data.members) {
                        if (cancelled) return;
                        setMembers(data.members.map(user => ({ ...user, isSelected: false })));
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
        getOtp();
        getMembers();
        return () => {
            cancelled = true;
        };
    }, [otpId, navigate]);

    const setTitle = async (newTitle: string) => {
        fetch(`/api/otp/update/${otpId}/title`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: newTitle,
            }),
        }).then(async (response) => {
            const data = await response.json() as {
                message?: string;
                value?: string;
                error?: string;
            };
            if (!response.ok) {
                throw data.error || "Unknown error occurred";
            }
            if (data.value) {
                setOtpTitle(data.value);
            } else {
                throw "No value returned from server";
            }
        }).catch((error) => {
            console.error("Error occurred while updating title:", error);
        });
    };

    const setServiceName = async (newServiceName: string) => {
        fetch(`/api/otp/update/${otpId}/service-name`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                serviceName: newServiceName,
            }),
        }).then(async (response) => {
            const data = await response.json() as {
                message?: string;
                value?: string;
                error?: string;
            };
            if (!response.ok) {
                throw data.error || "Unknown error occurred";
            }
            if (data.value) {
                setOtpServiceName(data.value);
            } else {
                throw "No value returned from server";
            }
        }).catch((error) => {
            console.error("Error occurred while updating service name:", error);
        });
    };

    const parameterEditComponent = (paramType: "title" | "serviceName") => {
        return (
            <div className="flex w-full items-center justify-center border-border-strong border-y-2 px-4">
                <div className="flex w-full flex-col items-center justify-center border-border-strong border-x-2">
                    <div className="flex w-full flex-col items-start justify-center gap-0 p-3">
                        <h2 className="text-xs text-text font-medium">{paramType === "title" ? "OTP 이름" : "서비스 이름"}</h2>
                        <p className="text-lg text-text font-bold">{paramType === "title" ? otpTitle : otpServiceName}</p>
                    </div>
                    <div className="flex w-full flex-row items-center justify-center">
                        {(paramType === "title" ? !changingTitle : !changingServiceName) ? (
                            <button type="submit" 
                                className="flex flex-row w-full items-center justify-center bg-foreground border-border-strong border-t-2 p-1
                                hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                                disabled:cursor-not-allowed disabled:bg-foreground/70"
                                onClick={() => {
                                    if (paramType === "title") {
                                        setChangingTitle(true);
                                        setNewTitle(otpTitle);
                                    } else {
                                        setChangingServiceName(true);
                                        setNewServiceName(otpServiceName);
                                    }
                                }}
                            >
                                <span className="text-sm text-text-inverse font-medium">변경하기</span>
                            </button>)
                            : (
                                <form className="flex w-full flex-row items-stretch justify-center border-border-strong border-t-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (paramType === "title") {
                                            setChangingTitle(false);
                                            setTitle(newTitle);
                                        } else {
                                            setChangingServiceName(false);
                                            setServiceName(newServiceName);
                                        }
                                    }}
                                >
                                    <input type="text" 
                                        className="flex flex-1 bg-transparent px-3 text-sm text-text 
                                        placeholder:text-placeholder placeholder:text-sm focus:outline-hidden focus:border-foreground" 
                                        placeholder="변경할 OTP 이름을 입력하세요"
                                        value={paramType === "title" ? newTitle : newServiceName}
                                        onChange={(e) => {
                                            if (paramType === "title") {
                                                setNewTitle(e.target.value);
                                            } else {
                                                setNewServiceName(e.target.value);
                                            }
                                        }}
                                    />
                                    <button type="submit" 
                                        className="flex flex-row items-center justify-center bg-foreground p-1 px-2 border-border-strong border-x-2
                                        hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                                        disabled:cursor-not-allowed disabled:bg-foreground/70"
                                    >
                                        <span className="text-sm text-text-inverse font-medium">적용하기</span>
                                        <CheckIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                                    </button>
                                    <button type="button" 
                                        className="flex flex-row w-7 items-center justify-center bg-foreground p-1
                                        hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                                        disabled:cursor-not-allowed disabled:bg-foreground/70"
                                        onClick={() => {
                                            if (paramType === "title") {
                                                setChangingTitle(false);
                                                setNewTitle(otpTitle);
                                            } else {
                                                setChangingServiceName(false);
                                                setNewServiceName(otpServiceName);
                                            }
                                        }}
                                    >
                                        <XMarkIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                                    </button>
                                </form>
                            )
                        }
                    </div>
                </div>
            </div>
        )
    }


    const isManagerSelected = members?.filter((user) => user.isManager && user.isSelected).length > 0;
    const isNonManagerSelected = members?.filter((user) => !user.isManager && user.isSelected).length > 0;

    const isEmailValid = (email: string) => {
        const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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

    const addMembers = async (isManager: boolean) => {
        for (const email of emails) {
            if (!isEmailValid(email)) {
                console.error(`Invalid email address: ${email}`);
                return;
            }
        }
        if (emails.length === 0) return;
        try {
            fetch(`/api/otp/update/${otpId}/members/add`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    emails: emails,
                    role: isManager ? "manager" : "member",
                }),
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string;
                    failedEmails?: string[];
                    duplicateEmails?: string[];
                    members?: { userId: string; userEmail: string; isManager: boolean }[];
                    error?: string;
                };
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate("/login");
                    } else if (response.status === 403) {
                        navigate("/");
                    } else {
                        throw data.error || "Unknown error occurred";
                    }
                }
                if (data.members) {
                    setMembers(prev => data.members!.map(user => ({ ...user, isSelected: !prev.some(member => member.userId === user.userId) })));
                    setEmails([]);
                }
            })
        } catch (error) {
            console.error("Error occurred while adding members:", error);
            navigate("/error");
        }
    }

    const deleteMembers = async () => {
        const selectedMemberIds = members.filter((user) => user.isSelected).map((user) => user.userId);
        if (selectedMemberIds.length === 0) return;
        try {
            await fetch(`/api/otp/update/${otpId}/members/remove`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    memberIds: selectedMemberIds,
                })
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string;
                    members?: { userId: string; userEmail: string; isManager: boolean }[];
                    error?: string;
                };
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate("/login");
                    } else if (response.status === 403) {
                        navigate("/");
                    } else {
                        throw data.error || "Unknown error occurred";
                    }
                }
                if (data.members) {
                    setMembers(data.members.map(user => ({ ...user, isSelected: false })));
                }
            })
        } catch (error) {
            console.error("Error occurred while deleting members:", error);
            navigate("/error");
        }
    };

    const updateMemberRole = async (isElevation: boolean) => {
        const selectedMemberIds = members.filter((user) => user.isSelected).map((user) => user.userId);
        if (selectedMemberIds.length === 0) return;
        try {
            fetch(`/api/otp/update/${otpId}/members/role`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    memberIds: selectedMemberIds,
                    role: isElevation ? "manager" : "member",
                }),
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string;
                    members?: { userId: string; userEmail: string; isManager: boolean }[];
                    error?: string;
                };
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate("/login");
                    } else if (response.status === 403) {
                        navigate("/");
                    }
                    else {
                        throw data.error || "Unknown error occurred";
                    }
                }
                if (data.members) {
                    setMembers(prev => data.members!.map(user => ({ ...user, isSelected: prev.find(member => member.userId === user.userId)?.isSelected || false })));
                }
            })
        } catch (error) {
            console.error("Error occurred while updating member role:", error);
            navigate("/error");
        }
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
        {!loading && (
            <div className="flex max-w-screen-lg w-full h-full flex-row items-center justify-center gap-16">
                <OtpViewer otpId={otpId || ""} navigate={navigate} otpTitle={otpTitle} otpServiceName={otpServiceName} firstOtpCode={firstOtp?.code || null} firstTimeInterval={firstOtp?.timeInterval || 0} otpVisibilityParent={firstOtp?.visibility || false}/>
                <div className="flex flex-2 min-w-0 w-full h-full flex-row border-border-strong border-1 px-4 gap-4">
                    <div className="flex flex-1 max-h-full min-w-0 w-full h-full flex-col items-center justify-start gap-4 border-border-strong border-x-2 py-6">                 
                        <div className="flex w-full flex-col items-start justify-center gap-2 px-4">
                            <Cog8ToothIcon aria-hidden="true" className="size-8 text-text"/>
                            <h1 className="text-2xl text-text font-bold">OTP 관리하기</h1>
                        </div>
                        {parameterEditComponent("title")}
                        {parameterEditComponent("serviceName")}
                        <div className="flex w-full min-h-0 flex-1 items-center justify-center border-border-strong border-y-2 px-4">
                            <div className="flex w-full min-h-0 h-full flex-col items-center justify-center border-border-strong border-x-2 py-2 gap-0">
                                <div className="flex w-full flex-col items-center justify-center gap-1 pb-1">
                                    <div className="flex flex-row items-center justify-between w-full px-4">
                                        <h1 className="text-sm font-semibold text-text">사용자 관리</h1>
                                        <div className="flex flex-row items-center justify-center gap-0.25">
                                            <UserIcon className="size-3.5 text-text"/>
                                            <p className="text-xs font-medium text-text">{members?.length || 0}</p>
                                        </div>
                                    </div>
                                    <div className='flex w-full flex-row items-center justify-between px-4'>
                                        <div className="flex flex-row items-center justify-center">
                                            <p className="text-xs text-text font-medium">관리자 ({members?.filter((user) => user.isManager).length || 0})</p>
                                        </div>
                                        <div className="flex flex-row items-center justify-center">
                                            <p className="text-xs text-text font-medium">일반 사용자 ({members?.filter((user) => !user.isManager).length || 0})</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex w-full flex-1 min-h-0 flex-row items-stretch justify-between border-border-weak border-y-2"
                                onBlur={(e) => {
                                    const next = e.relatedTarget;
                                    const staysInside = e.currentTarget.contains(next);
                                    const movesToAction = next instanceof HTMLElement && next.matches("button[data-member-action]");
                                    if (!staysInside || (!isMultipleChoiceActivated.current && !movesToAction)) {
                                        setMembers(prev =>
                                            prev.map(user => ({ ...user, isSelected: false }))
                                        );
                                    }
                                }}
                                onPointerDown={(e) => {
                                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                                        isMultipleChoiceActivated.current = true;
                                    } else {
                                        isMultipleChoiceActivated.current = false;
                                    }
                                }}>
                                    <div className="flex flex-1 min-h-0 flex-col items-center justify-start">
                                        <select multiple className="flex flex-col w-full max-h-full items-center justify-start vertical-scrollbar user-select overflow-y-auto focus:outline-none"
                                        value={members?.filter((user) => user.isManager && user.isSelected).map((user) => user.userId)}
                                        size={Math.max(2, members.filter(user => user.isManager).length)}
                                        onChange={(e) => {
                                            const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
                                            setMembers((prevMembers) => prevMembers.map((user) => {
                                                if (user.isManager) {
                                                    return { ...user, isSelected: selectedOptions.includes(user.userId) };
                                                }
                                                return user;
                                            }));
                                        }}>
                                            {members?.filter((user) => user.isManager).map((user) => (
                                                <option key={user.userId} value={user.userId} className="flex flex-row items-center justify-center gap-1 py-1 text-xs font-medium">
                                                    {user.userEmail}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid w-7 h-full grid-cols-1 border-border-weak border-x-2 transition-[grid-template-rows, backgroundColor] duration-200"
                                    style={{
                                        gridTemplateRows: `${(isManagerSelected && ! isNonManagerSelected) ? 1 : 0}fr ${(isNonManagerSelected && ! isManagerSelected) ? 1 : 0}fr 1fr`,
                                        backgroundColor: isManagerSelected || isNonManagerSelected ? "var(--color-foreground)" : "var(--color-background)",
                                    }}>
                                        <div className="min-h-0 overflow-hidden w-full">
                                            <button type="button" data-member-action
                                                className="flex flex-row w-full h-full min-h-0 items-center justify-center bg-foreground p-1
                                                hover:bg-[color-mix(in_srgb,var(--foreground)_90%,var(--background))] active:bg-[color-mix(in_srgb,var(--foreground)_70%,var(--background))] transition-[colors, opacity] duration-200
                                                disabled:cursor-not-allowed disabled:bg-foreground/70
                                                border-b-2 border-border-weak"
                                                style={{opacity: (isManagerSelected && ! isNonManagerSelected) ? 1 : 0}}
                                                onClick={() => { 
                                                    updateMemberRole(false);
                                                }}
                                                disabled={!isManagerSelected || isNonManagerSelected}
                                            >
                                                <ArrowRightIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                                            </button>
                                        </div>
                                        <div className="min-h-0 overflow-hidden w-full">
                                            <button type="button" data-member-action
                                                className="flex flex-row w-full h-full min-h-0 items-center justify-center bg-foreground p-1
                                                hover:bg-[color-mix(in_srgb,var(--foreground)_90%,var(--background))] active:bg-[color-mix(in_srgb,var(--foreground)_70%,var(--background))] transition-[colors, opacity] duration-200
                                                disabled:cursor-not-allowed disabled:bg-foreground/70
                                                border-b-2 border-border-weak"
                                                style={{opacity: (isNonManagerSelected && ! isManagerSelected) ? 1 : 0}}
                                                onClick={() => {
                                                    updateMemberRole(true);
                                                }}
                                                disabled={!isNonManagerSelected || isManagerSelected}
                                            >
                                                <ArrowLeftIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                                            </button>
                                        </div>
                                        <div className="min-h-0 overflow-hidden w-full">
                                            <button type="button" data-member-action
                                                className="flex flex-row w-full h-full items-center justify-center bg-foreground p-1
                                                hover:bg-[color-mix(in_srgb,var(--foreground)_90%,var(--background))] active:bg-[color-mix(in_srgb,var(--foreground)_70%,var(--background))] transition-[colors, opacity] duration-200
                                                disabled:cursor-not-allowed disabled:bg-foreground/70"
                                                style={{opacity: (!isManagerSelected && ! isNonManagerSelected) ? 0 : 1}}
                                                onClick={() => {
                                                    deleteMembers();
                                                }}
                                                disabled={!isManagerSelected && !isNonManagerSelected}
                                            >
                                                <XMarkIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 min-h-0 flex-col items-center justify-start">
                                        <select multiple className="flex flex-col w-full max-h-full items-center justify-start vertical-scrollbar user-select overflow-y-auto focus:outline-none"
                                        value={members?.filter((user) => !user.isManager && user.isSelected).map((user) => user.userId)}
                                        size={Math.max(2, members.filter(user => !user.isManager).length)}
                                        onChange={(e) => {
                                            const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
                                            setMembers((prevMembers) => prevMembers.map((user) => {
                                                if (!user.isManager) {
                                                    return { ...user, isSelected: selectedOptions.includes(user.userId) };
                                                }
                                                return user;
                                            }));
                                        }}>
                                            {members?.filter((user) => !user.isManager).map((user) => (
                                                <option key={user.userId} value={user.userId} className="flex flex-row items-center justify-center gap-1 py-1 text-xs font-medium">
                                                    {user.userEmail}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex w-full flex-col items-start justify-center">
                                    <div className="flex w-full h-8 flex-row items-center justify-center">
                                        <div className="flex h-full flex-1 flex-col items-center justify-center">
                                            <input type="email" 
                                                className="flex w-full h-full bg-transparent px-4 text-sm text-text 
                                                placeholder:text-placeholder placeholder:text-xs focus:outline-hidden focus:border-foreground" 
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
                                            <PlusIcon aria-hidden="true" className="size-4 text-text-inverse"/>
                                        </button>
                                    </div>
                                    <div className="flex w-full min-h-8 flex-row items-center justify-center border-border-strong border-y-2 px-3 py-0.5">
                                        {emails.length === 0 && <button type="button" className="text-xs font-regular text-text underline hover:text-text/90 active:text-text/70">시트 파일로 불러오기</button>}
                                        {emails.length !== 0 && 
                                        <div className="flex h-full min-w-0 w-full flex-row items-center justify-center gap-3">
                                            <div className="flex h-full min-w-0 w-full gap-1 overflow-x-auto overflow-y-hidden email-scrollbar justify-start items-center" ref={emailListRef}>
                                                {(
                                                    emails.map((email, index) => (
                                                        <div key={index} className="flex h-5.5 jusify-center items-center pl-3 pr-0.5 border-border-strong border-2 shrink-0 whitespace-nowrap">
                                                            <p className="text-xs font-regular text-text">{email}</p>
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
                                <div className="flex w-full flex-row items-center justify-center border-border-strong border-b-2">
                                    <button type="button" 
                                        className="flex flex-row w-full items-center justify-center bg-foreground p-1
                                        hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                                        disabled:cursor-not-allowed disabled:bg-foreground/70
                                        border-r-2 border-border-strong"
                                        onClick={() => {
                                            addMembers(true);
                                        }}
                                        disabled={emails.length === 0}
                                    >
                                        <span className="text-sm text-text-inverse font-medium">관리자로 추가하기</span>
                                    </button>
                                    <button type="button" 
                                        className="flex flex-row w-full items-center justify-center bg-foreground p-1
                                        hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200
                                        disabled:cursor-not-allowed disabled:bg-foreground/70"
                                        onClick={() => {
                                            addMembers(false);
                                        }}
                                        disabled={emails.length === 0}
                                    >
                                        <span className="text-sm text-text-inverse font-medium">사용자로 추가하기</span>
                                    </button>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    )
}

export default PropertyPage;