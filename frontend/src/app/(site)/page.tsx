import Home from "@/components/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imouto Store",
  description: "Imouto Store",
  // other metadata
};

export default function HomePage() {
  return (
    <>
      <Home />
    </>
  );
}
