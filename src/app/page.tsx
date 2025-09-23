import RPDYonlendirme from "@/components/RPDYonlendirme";
import ConfigurationStatus from "@/components/ConfigurationStatus";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <>
      <div className="container mx-auto px-4 pt-6">
        <ConfigurationStatus />
      </div>
      <RPDYonlendirme />
      <Toaster />
    </>
  );
}

