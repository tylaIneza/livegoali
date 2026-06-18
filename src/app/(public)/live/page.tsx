import { redirect } from "next/navigation";

// The live matches page is now the homepage.
export default function LiveRedirect() {
  redirect("/");
}
