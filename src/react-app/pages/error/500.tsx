import { useNavigate } from "react-router";

function ErrorPage() {
    const navigate = useNavigate();
    return (
        <div className="relative w-full h-full flex flex-row items-center justify-center gap-12">
            <div className="flex items-center justify-end w-full">
                <img src="/symbol.svg" className="w-auto h-[150px]"/> 
            </div>
            <div className="flex flex-col items-start justify-center gap-3 w-full">
                <h2 className="text-5xl font-extrabold text-text">500</h2>
                <div className="flex flex-col items-start justify-center gap-1">
                    <p className="text-xl font-bold text-text">알 수 없는 오류가 발생했어요</p>
                    <p className="text-sm font-regular text-text">나중에 다시 시도해주세요</p>
                </div>
                <button className="text-sm text-text underline hover:text-text/80 active:text-text/60 transition-colors duration-200" 
                onClick={(e) => {
                    navigate("/");
                }}>돌아가기</button>
            </div>
        </div>
    )
}

export default ErrorPage;