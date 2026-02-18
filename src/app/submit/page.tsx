import type { Metadata } from "next";
import SubmitForm from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit Your Display",
  description: "Submit your holiday decoration display to BestTexasDisplay.com. Share your Christmas lights, Halloween decorations, and more with all of Texas.",
};

export default function SubmitPage() {
  return <SubmitForm />;
}
