import CollectionSection from "@/components/CollectionSection";
import DestinationsSection from "@/components/DestinationsSection";
import HeroSection from "@/components/HeroSection";
import StorySection from "@/components/StorySection";

export default function Home() {
  return (
    <div className="home" id="inicio">
      <HeroSection />
      <DestinationsSection />
      <CollectionSection />
      <StorySection />
    </div>
  );
}
