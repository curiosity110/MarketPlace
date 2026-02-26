import { redirect } from "next/navigation";

export default function FinishAuth() {
  redirect("/register");
}
