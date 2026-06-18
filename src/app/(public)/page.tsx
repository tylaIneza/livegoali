import { redirect } from "next/navigation";

// Homepage is served by app/page.tsx. This file is never reached.
export default function Fallback() {
  redirect("/");
}
