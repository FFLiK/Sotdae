import {useNavigate} from "react-router";
import logout from "./logout";

async function checkSession(navigate : ReturnType<typeof useNavigate>) {
    try {
        await fetch("/api/auth/session", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(async (response) => {
            const data = await response.json() as {
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

export default checkSession;