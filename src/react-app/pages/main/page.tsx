import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

function MainPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

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
                        if (response.status === 401) {
                            navigate("/login");
                        } else {
                            throw data.error || "Unknown error occurred";
                        }
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
        checkSession();
    }, []);

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            }).then(async (response) => {
                const data = await response.json() as {
                    message?: string;
                    error?: string;
                };
                if (!response.ok) {
                    throw data.error || "Unknown error occurred";
                }
                navigate("/login");
            });
        } catch (error) {
            console.error("Error occurred while logging out:", error);
            navigate("/error");
        }
    }

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-12">
        {!loading && (
            <div>
                <div className="flex items-center justify-center w-full">
                    <img src="/symbol.svg" className="w-auto h-[100px]"/> 
                </div>
                <div className="flex flex-col items-center justify-center gap-2 w-full">
                    <h2 className="text-2xl font-bold text-text">솟대</h2>
                    <p className="text-md font-regular text-text">메인 페이지</p>
                    <button className="text-sm text-text underline hover:text-text/80 active:text-text/60 transition-colors duration-200" 
                            onClick={(e) => {
                                e.preventDefault();
                                logout();
                            }}>로그아웃
                    </button>
                </div>
            </div>
        )}
        </div>
    )
}

export default MainPage;