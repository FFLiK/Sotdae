import { EyeIcon, EyeSlashIcon, Cog6ToothIcon } from "@heroicons/react/20/solid";

type OtpBoxProps = {
    title: string;
    serviceName: string;
    otpCode: string;
    visibility: boolean;
    isSettingEnabled: boolean;
    onEyeButtonClicked: () => void;
    onSettingButtonClicked: () => void;
    progress: number;
}

function OtpBox({ title, serviceName, otpCode, visibility, isSettingEnabled, progress, onEyeButtonClicked, onSettingButtonClicked }: OtpBoxProps) {
    if (progress < 0) {
        progress = 0;
    } else if (progress > 6) {
        progress = 6;
    }
    let position = [1, 2, 3, 4, 5, 6];
    /*
    // Randomize the position array to create a random order for the OTP digits
    for (let i = 0; i < position.length; i++) {
        let j = Math.floor(Math.random() * (position.length - i)) + i;
        [position[i], position[j]] = [position[j], position[i]];
    }
    */
    return (
        <div className="flex w-full border-border-strong border-y-2 px-4">
            <div className="flex w-full flex-col border-border-weak border-x-2 py-4 gap-4">
                <div className="flex w-full flex-row justify-between items-start px-4 gap-3">
                    <div className="flex flex-col items-start justify-start">
                        <h2 className="text-lg font-bold">{title}</h2>
                        <p className="text-xs font-regular text-text">{serviceName}</p>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-2 py-1">
                        <button type="button" onClick={onEyeButtonClicked} className="flex flex-row items-center justify-center">
                            {visibility ? (
                                <EyeIcon aria-hidden="true" className="size-4.5 text-text hover:text-text/90 active:text-text/70 transition-colors duration-200"/>
                            ) : (
                                <EyeSlashIcon aria-hidden="true" className="size-4.5 text-text hover:text-text/90 active:text-text/70 transition-colors duration-200"/>
                            )}
                        </button>
                        {isSettingEnabled && (
                            <button type="button" onClick={onSettingButtonClicked} className="flex flex-row items-center justify-center">
                                <Cog6ToothIcon aria-hidden="true" className="size-4.5 text-text hover:text-text/90 active:text-text/70 transition-colors duration-200"/>
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-center gap-2 border-border-weak border-y-2 py-1">
                    <div className="flex flex-row items-center justify-center gap-1">
                        <p className="text-2xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: progress >= position[0] ? 1 : 0 }}>
                            {visibility ? otpCode[0] : '*'}
                        </p>
                        <p className="text-2xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: progress >= position[1] ? 1 : 0 }}>
                            {visibility ? otpCode[1] : '*'}
                        </p>
                        <p className="text-2xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: progress >= position[2] ? 1 : 0 }}>
                            {visibility ? otpCode[2] : '*'}
                        </p>
                    </div>
                    <div className="flex flex-row items-center justify-center gap-1">
                        <p className="text-2xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: progress >= position[3] ? 1 : 0 }}>
                            {visibility ? otpCode[3] : '*'}
                        </p>
                        <p className="text-2xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: progress >= position[4] ? 1 : 0 }}>
                            {visibility ? otpCode[4] : '*'}
                        </p>
                        <p className="text-2xl font-extrabold text-text transition-opacity duration-200" style={{ opacity: progress >= position[5] ? 1 : 0 }}>
                            {visibility ? otpCode[5] : '*'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OtpBox;