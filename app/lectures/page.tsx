import Navbar from "../components/ui/Navbar";
import ComingSoon from "../components/ui/comingSoon";
import Footer from "../components/Footer";

export default function Lecture(){
    return(
        <main>
            <div>
                <Navbar />
            </div>

            <div className="h-screen flex items-center justify-center">
                <ComingSoon />
            </div>

            <div>
                <Footer />
            </div>
        </main>
    );
}