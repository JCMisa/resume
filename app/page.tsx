import SamplePage from "@/components/custom/SamplePage";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <UserButton />
      <SamplePage />
    </div>
  );
}
