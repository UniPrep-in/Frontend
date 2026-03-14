import Navbar from "../components/ui/Navbar";
import Footer from "../components/Footer";

export default function Notice(){
    return(
        <main className="bg-neutral-100">
            <Navbar />

            <div className="mx-auto max-w-6xl bg-transparent py-12">
                <div className="flex items-center justify-center">
                    <div className="w-fit bg-white flex gap-2 px-2 py-2 rounded-full">
                        <button className="px-6 py-2 bg-emerald-300 border text-black rounded-full">Syllabus</button>
                        <button className="px-6 py-2 bg-white text-black rounded-full">Blogs</button>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}