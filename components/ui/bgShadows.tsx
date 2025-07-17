export default function BgShadows() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
            <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-gradient-radial from-primary-50 to-transparent blur-[100px] z-0 pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[-100px] w-[400px] h-[400px] bg-gradient-radial from-primary-50 to-transparent blur-[100px] z-0 pointer-events-none"></div>
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-gradient-radial from-primary-50 to-transparent blur-[100px] z-0 pointer-events-none"></div>
            <div className="absolute top-[-100px] right-[25%] w-[400px] h-[400px] bg-gradient-radial from-primary-50 to-transparent blur-[200px] z-0 pointer-events-none"></div>
            <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-gradient-radial from-primary-50 to-transparent blur-[100px] z-0 pointer-events-none"></div>
            <div className="absolute bottom-[-100px] right-[20%] w-[500px] h-[400px] bg-gradient-radial from-primary-50 to-transparent blur-[100px] z-0 pointer-events-none"></div>
            <div className="absolute bottom-[-100px] right-[50%] w-[500px] h-[400px] bg-gradient-radial from-primary-50 to-transparent blur-[100px] z-0 pointer-events-none"></div>
        </div>
    )
}