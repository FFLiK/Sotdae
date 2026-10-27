function SuccessPage() {
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-12">
            <div className="flex items-center justify-center w-full">
                <img src="/symbol.svg" className="w-auto h-[100px]"/> 
            </div>
            <div className="flex flex-col items-center justify-center gap-2 w-full">
                <h2 className="text-2xl font-bold text-text">인증을 성공했어요</h2>
                <p className="text-md font-regular text-text">공유 계정의 인증 코드를 불러올게요</p>
            </div>
        </div>
    )
}

export default SuccessPage;