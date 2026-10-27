import { EMAIL_AUTH_POLICY } from "../../shared/config/email-auth-policy";

type AuthEmailProps = {
    code: string;
    logoUrl: string;
};

export default function AuthEmailTemplate({ code, logoUrl }: AuthEmailProps) {
    return (
        <html lang="ko">
            <body
                style={{
                    margin: 0,
                    padding: "32px 16px",
                    backgroundColor: "#f4f4f5",
                    fontFamily: '"SUITE Variable", Arial, "Malgun Gothic", sans-serif',
                    color: "#18181b",
                }}
            >
                <div
                    style={{
                        display: "none",
                        maxHeight: 0,
                        overflow: "hidden",
                        opacity: 0,
                    }}
                >
                    솟대 로그인 인증 코드입니다.
                </div>

                <table
                    role="presentation"
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={{ borderCollapse: "collapse" }}
                >
                    <tbody>
                        <tr>
                            <td align="center">
                                <table
                                    role="presentation"
                                    width="100%"
                                    cellPadding="0"
                                    cellSpacing="0"
                                    style={{
                                        maxWidth: "480px",
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e4e4e7",
                                        borderRadius: "12px",
                                    }}
                                >
                                    <tbody>
                                        <tr>
                                            <td
                                                align="center"
                                                style={{ padding: "36px 28px 12px" }}
                                            >
                                                <img
                                                    src={logoUrl}
                                                    width="54"
                                                    height="50"
                                                    alt="솟대"
                                                    style={{ display: "block" }}
                                                />
                                                <p
                                                    style={{
                                                        margin: "12px 0 0",
                                                        fontSize: "20px",
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    솟대
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                align="center"
                                                style={{ padding: "16px 28px 36px" }}
                                            >
                                                <h1
                                                    style={{
                                                        margin: "0 0 12px",
                                                        fontSize: "22px",
                                                    }}
                                                >
                                                    이메일 인증
                                                </h1>
                                                <p
                                                    style={{
                                                        margin: "0 0 24px",
                                                        color: "#52525b",
                                                        fontSize: "15px",
                                                        lineHeight: 1.6,
                                                    }}
                                                >
                                                    아래 인증 코드를 입력해 로그인을 완료해 주세요.
                                                </p>
                                                <div
                                                    dir="ltr"
                                                    style={{
                                                        padding: "18px 12px",
                                                        borderRadius: "8px",
                                                        backgroundColor: "#f4f4f5",
                                                        fontSize: "32px",
                                                        fontWeight: 700,
                                                        letterSpacing: "0.3em",
                                                    }}
                                                >
                                                    {code}
                                                </div>
                                                <p
                                                    style={{
                                                        margin: "20px 0 0",
                                                        color: "#71717a",
                                                        fontSize: "13px",
                                                        lineHeight: 1.6,
                                                    }}
                                                >
                                                    이 코드는 {EMAIL_AUTH_POLICY.challengeTtlMs / 60000}분 동안 유효합니다.
                                                    <br />
                                                    요청하지 않았다면 이 메일을 무시해 주세요.
                                                </p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>
    );
}