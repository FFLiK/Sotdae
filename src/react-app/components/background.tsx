function Background() {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-background">
            <div className="absolute top-[64px] bottom-[64px] left-0 right-0 bg-transparent border-y border-border-strong"/>
            <div className="absolute left-[64px] right-[64px] top-0 bottom-0 bg-transparent border-x border-border-strong"/>
        </div>
    )
}

export default Background