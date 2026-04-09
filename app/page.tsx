import Hero from "./components/Hero";
import StatsStrip from "./components/StatsStrip";
import Grid from "./components/ui/grid";
import ImageCarousel from "./components/ui/infiniteCarousal";
import CuetCoverage from "./components/CuetCoverage";
import Reviews from "./components/Review";
import Faq from "./components/faq";
import Pricing from "./components/pricing";
import Coupon from "./components/ui/coupons";

export default function Home() {
  const logos = ["/logos/du.png", "/logos/srcc.png", "/logos/jnu.png", "/logos/st.png"];
  return (
    <main className="bg-white">
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

      <CuetCoverage />

      <div className="z-50 w-full bg-black shadow-xl">
        <Coupon />
      </div>

      <Pricing />

      <Reviews />

      <Faq />
    </main>
  );
}
