export type InvestigationDisplayFields = {
  category: string;
  test_requested: string;
  priority: string;
  specimen: string;
};

type InvestigationLike = {
  name?: string;
  category?: string | null;
  test_requested?: string | null;
  priority?: string | null;
  specimen?: string | null;
};

function parseLegacyInvestigationName(rawName: string) {
  const parts = (rawName || "").split(" | ").map((p) => p.trim());
  const test_requested = parts[0] || "";
  let specimen = "-";
  let priority = "Routine";

  for (const part of parts.slice(1)) {
    const low = part.toLowerCase();
    if (low.startsWith("specimen:")) {
      specimen = part.replace(/specimen:\s*/i, "");
    } else if (low.startsWith("priority:")) {
      priority = part.replace(/priority:\s*/i, "");
    }
  }

  const categoryMatch = test_requested.match(/\(([^)]+)\)\s*$/);
  const category = categoryMatch?.[1] || "Other";

  return {
    category,
    test_requested: categoryMatch
      ? test_requested.replace(/\s*\([^)]+\)\s*$/, "").trim()
      : test_requested,
    priority,
    specimen,
  };
}

export function getInvestigationDisplayFields(
  investigation: InvestigationLike,
): InvestigationDisplayFields {
  if (investigation.test_requested) {
    return {
      category: investigation.category || "Other",
      test_requested: investigation.test_requested,
      priority: investigation.priority || "Routine",
      specimen: investigation.specimen || "-",
    };
  }

  if (investigation.name) {
    return parseLegacyInvestigationName(investigation.name);
  }

  return {
    category: investigation.category || "Other",
    test_requested: "",
    priority: investigation.priority || "Routine",
    specimen: investigation.specimen || "-",
  };
}

export function formatInvestigationLabel(
  investigation: InvestigationLike,
): string {
  const { test_requested, category } =
    getInvestigationDisplayFields(investigation);
  if (!test_requested) return "";

  if (category && category !== "Other") {
    return `${test_requested} (${category})`;
  }

  return test_requested;
}
