import CinematicGrid from "@/components/ui-lora/CinematicGrid";
import LightPillar from "../LightPillar";

const Workflow = () => {
  return (
    /* 🚀 STEP 1: Removed overflow-hidden from the section wrapper so cards can stick */
    <section className="w-[calc(100vw-40px)] mx-[20px] relative border rounded-[30px] border-stone-200/40 dark:border-stone-800/40 shadow-2xl bg-black">
      {/* 🚀 STEP 2: Wrapped the LightPillar in an absolute, overflow-hidden container to protect the borders */}
      <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none z-0">
        <LightPillar
          topColor="#82B02C"
          bottomColor="#9ae600"
          intensity={0.5}
          rotationSpeed={0.15}
          glowAmount={0.002}
          pillarWidth={3.5}
          pillarHeight={0.4}
          noiseIntensity={0.5}
          pillarRotation={135}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />
      </div>

      {/* 🚀 STEP 3: CinematicGrid sits flat and free to track the window scroll */}
      <CinematicGrid />
    </section>
  );
};

export default Workflow;
