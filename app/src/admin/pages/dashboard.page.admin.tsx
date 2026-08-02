import { Link } from "react-router-dom";
import MainPageHeader from "@/shared/components/main-page-header.component.shared";
import { Button } from "@/components/ui/button";

const DASH_CARDS = [
  {
    title: "All patients",
    description: "Search and inspect patient records.",
    href: "/admin/dashboard/patients",
    button: "View patients",
  },
  {
    title: "Add doctor",
    description: "Invite a new doctor with email verification.",
    href: "/admin/dashboard/doctors/add",
    button: "Add doctor",
  },
  {
    title: "Admin tools",
    description: "Monitor doctor onboarding and patient access.",
    href: "/admin/dashboard/patients",
    button: "Manage now",
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <MainPageHeader
        heading="Admin console"
        subHeading="Manage all patients and onboard new doctors without login requirements."
      />
      <section className="grid gap-6 lg:grid-cols-3">
        {DASH_CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-border bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {card.description}
            </p>
            <div className="mt-6">
              <Link to={card.href}>
                <Button className="w-full">{card.button}</Button>
              </Link>
            </div>
          </div>
        ))}
      </section>
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Admin workflow</h3>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>1. Search patients by email or registration number.</li>
          <li>2. Open a patient profile to review their contact details.</li>
          <li>
            3. Add doctors by verifying their email before finalizing the
            profile.
          </li>
        </ul>
      </section>
    </div>
  );
}
