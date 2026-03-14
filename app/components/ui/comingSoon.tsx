import Link from "next/link";

export default function ComingSoon(){
    return(
        <main className="h-[50vh] flex flex-col items-center gap-4 justify-center">
            <span className="text-6xl animate-bounce">👍</span>
            <span className="uppercase text-lg font-light">We{"\'"}re Still</span>
            <h1 className="text-4xl">Preparing magic for your dreams</h1>
            <p className="text-lg text-neutral-500 w-xl text-center">We are going to publish this section soon. Meanwhile take a seat and relax.</p>
            <div className="inline-flex p-0.5 rounded-full bg-linear-to-br from-emerald-400 via-purple-600 to-emerald-400">
                <Link
                    href="https://chat.whatsapp.com/JHuRh0vIRx00WxkRw3Ds3Q"
                    className="block px-6 py-4 text-white rounded-full bg-linear-to-br from-black to-black via-neutral-700 hover:scale-110 duration-300"
                >
                    Get Notified
                </Link>
            </div>
        </main>
    );
}