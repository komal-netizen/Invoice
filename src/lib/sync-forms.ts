import type { OnboardingForm } from "./types";

export async function syncFormsToServer(forms: OnboardingForm[]) {
  try {
    const response = await fetch("/api/onboarding-form/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ forms }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to sync forms");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error syncing forms:", error);
    throw error;
  }
}

export async function syncSubmissionsFromServer() {
  try {
    const response = await fetch("/api/onboarding-form/submit", {
      method: "GET",
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch submissions");
    }
    
    const data = await response.json();
    return data.submissions;
  } catch (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }
}
