import ImageHero from "@/components/home/ImageHero";
import DoubleSideToSide from "@/components/home/DoubleSideToSide";
import HeroSlider from "@/components/home/HeroSlider";
import ContactInner from "@/components/home/ContactInner";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      <ImageHero />
      <DoubleSideToSide />
      <HeroSlider />
      <ContactInner />
      {/* <Link
        className="text-xs tracking-wider text-white uppercase bg-accent hover:bg-slate-900 px-6 py-2 rounded-md mt-10"
        href="/sistema/home"
      >
        Iniciar
      </Link> */}
    </div>
  );
}
