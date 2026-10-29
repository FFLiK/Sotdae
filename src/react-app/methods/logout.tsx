import { useNavigate } from "react-router";

async function logout(navigate : ReturnType<typeof useNavigate>) {
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

export default logout;