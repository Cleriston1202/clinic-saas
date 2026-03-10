import { redirect } from "next/navigation";

export default function DoctorsRedirectPage() {
  redirect("/dentists");
}
