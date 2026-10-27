import { useRef, useEffect, useState, FormEvent  } from "react";
import { ArrowRightIcon } from "@heroicons/react/20/solid";

type AuthMainProps = {
  enterEmail: (email: string) => Promise<boolean>;
  error: string | null;
};

function AuthMain({ enterEmail, error }: AuthMainProps) {
    const emailInputElement = useRef<HTMLInputElement>(null);
    const [email, setEmail] = useState("");
    useEffect(() => {
        emailInputElement.current?.focus();
    }, [])

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) return;
        const succeeded = await enterEmail(normalizedEmail);
        if (succeeded) {
            setEmail("");
        }
        emailInputElement.current?.focus();
    }

    return (
        <div className="flex flex-1 h-full flex-col items-start justify-center gap-8 border-border-strong p-8">
            <div className="flex flex-col items-start justify-center gap-2">
                <h1 className="text-6xl font-bold">솟대</h1>
                <p className="text-2xl">우리 계정의 수호신</p>
            </div>
            <div className="flex flex-col items-start justify-center gap-1">
                <form className="flex flex-row justify-start gap-0 items-stretch"
                    onSubmit={handleSubmit}
                >
                    <input
                        className="w-[200px] border-border-strong border-2 border-r-0 bg-transparent px-2 text-lg text-text placeholder:text-placeholder focus:outline-hidden focus:border-foreground" 
                        placeholder="이메일을 입력하세요"
                        ref={emailInputElement}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button type="submit"
                        className="flex flex-row items-center justify-center bg-foreground border-border-strong border-2 p-2 
                        hover:bg-foreground/90 active:bg-foreground/70 transition-colors duration-200"
                    >
                        <ArrowRightIcon aria-hidden="true" className="size-5 text-text-inverse"/>
                    </button>
                </form>  
                {error && <p className="text-sm text-error">{error}</p>}
            </div>
        </div>
    )
}

export default AuthMain;