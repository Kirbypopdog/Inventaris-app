import { redirect } from "next/navigation";

/** Jobs are listed per customer on the projects page. */
export default function JobsPage() {
  redirect("/klanten");
}
