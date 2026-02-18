import { notFound } from "next/navigation";
import { OnboardingFormPublic } from "./OnboardingFormPublic";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

async function getFormData(token: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/onboarding-form/${token}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Error fetching form:", error);
    return null;
  }
}

export default async function OnboardingFormPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getFormData(token);

  if (!data) {
    notFound();
  }

  return <OnboardingFormPublic data={data} token={token} />;
}
