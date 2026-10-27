import { useNavigate } from "react-router";

function NotFoundPage() {
    const navigate = useNavigate();
    return (
        <div className="relative w-full h-full flex flex-row items-center justify-center gap-12">
            <div className="flex items-center justify-end w-full">
                <img src="/symbol.svg" className="w-auto h-[150px]"/> 
            </div>
            <div className="flex flex-col items-start justify-center gap-3 w-full">
                <h2 className="text-5xl font-extrabold text-text">404</h2>
                <div className="flex flex-col items-start justify-center gap-1">
                    <p className="text-xl font-bold text-text">존재하지 않는 페이지에요</p>
                    <p className="text-sm font-regular text-text">다시 시도해주세요</p>
                </div>
                <button className="text-sm text-text underline hover:text-text/80 active:text-text/60 transition-colors duration-200" 
                onClick={(e) => {
                    navigate("/");
                }}>돌아가기</button>
            </div>
        </div>
    )
}

export default NotFoundPage;