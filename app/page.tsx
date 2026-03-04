import Navbar from "./components/ui/Navbar";
import Hero from "./components/Hero";
import StatsStrip from "./components/StatsStrip";
import Grid from "./components/ui/grid";
import ImageCarousel from "./components/ui/infiniteCarousal";
import HowItWorks from "./components/HowItWorks";
import CuetCoverage from "./components/CuetCoverage";
import Courses from "./components/Courses";
import Usp from "./components/Usp";
import Reviews from "./components/Review";
import Faq from "./components/faq";
import Footer from "./components/Footer";

export default function Home() {
  const logos = ["/logos/du.png", "/logos/srcc.png", "/logos/jnu.png", "/logos/st.png"];
  return (
    <main className="bg-white">
      <Navbar />
      <Hero />
      <StatsStrip />

      <div className="py-12 max-w-6xl mx-auto flex items-center justify-center">
        <Grid />
      </div>

      <div className="max-w-6xl mx-auto pb-12">
        <div className="flex flex-col items-center justify-center">
          <h2 className="py-8 text-xl text-black">Colleges to Crack</h2>
          <ImageCarousel images={logos} speed={120} />
        </div>
      </div>

      <div className="rounded-t-4xl border-t border-t-neutral-50">
        <HowItWorks />
      </div>

      <CuetCoverage />

      <Courses />

      <Usp />

      <Reviews />

      <Faq />

      <Footer />
    </main>
  );
}
