import type { Metadata } from "next";
import InteractiveMap from "@/components/InteractiveMap";

export const metadata: Metadata = {
  title: "Interactive Map",
  description: "Explore holiday decoration displays on an interactive map of Texas. Plan your driving tour of the best Christmas lights and Halloween decorations near you.",
};

export default function MapPage() {
  return <InteractiveMap />;
}
