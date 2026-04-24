import type { Metadata } from "next";
import SuggestPage from "@/components/site/SuggestPage";

export const metadata: Metadata = {
  title: "Suggest a Clue · OriginGuessr",
  description:
    "Know something with a fascinating country of origin? Suggest it as a new clue for OriginGuessr.",
};

export default function SuggestRoute() {
  return <SuggestPage />;
}
