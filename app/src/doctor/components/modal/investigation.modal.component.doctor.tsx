import { useState, useRef, useMemo, type ReactNode, Fragment } from "react";
import {
  Plus,
  Minus,
  Loader2,
  Send,
  Trash2,
  Beaker,
  Droplet,
  Microscope,
  Heart,
  Scan,
  FlaskConical,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createInvestigationListForConsultationReq,
  deleteInvestigationListForConsultationReq,
  getInvestigationListForConsultationReq,
  updateInvestigationListForConsultationReq,
} from "@/config/service/doctor.service";
import { getInvestigationDisplayFields } from "@/shared/utils/investigation-display.util";
import { queryKeys } from "@/config/query-keys";

interface InvestigationRowData {
  category: string;
  test: string;
  specimen: string;
  priority: string;
}

interface ExistingInvestigation extends InvestigationRowData {
  _id: string;
}

interface NewInvestigationRow extends InvestigationRowData {
  id: number;
}

interface InvestigationModalProps {
  onClose: () => void;
  consultationId: string;
}

const CATEGORY_OPTIONS = [
  "Hematological",
  "Microbiological",
  "Cardiological",
  "Radiological",
  "Biochemistry",
  "Other",
] as const;

const TEST_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  Hematological: [
    "CBC (Complete Blood Count)",
    "ESR (Erythrocyte Sedimentation Rate)",
    "Peripheral Smear",
    "Hemoglobin (Hb)",
    "Platelet Count",
    "PT / INR",
    "APTT",
    "Blood Group & Rh Typing",
  ],
  Microbiological: [
    "Urine Routine & Microscopy",
    "Urine Culture & Sensitivity",
    "Stool Routine Examination",
    "Sputum for AFB",
    "Blood Culture",
    "Widal Test",
    "Dengue NS1 / IgM",
    "Malaria Parasite (MP)",
  ],
  Cardiological: [
    "ECG (12 Lead)",
    "2D Echocardiography",
    "TMT (Treadmill Test)",
    "Troponin I / T",
    "CK-MB",
    "BNP / NT-proBNP",
    "Holter Monitoring (24hr)",
  ],
  Radiological: [
    "Chest X-ray (PA View)",
    "USG Abdomen (Whole)",
    "CT Scan Brain / Chest / Abdomen",
    "MRI Brain / Spine / Joint",
    "Mammography",
    "X-ray Lumbo-Sacral Spine",
    "DEXA Scan (Bone Density)",
  ],
  Biochemistry: [
    "Fasting Blood Sugar (FBS)",
    "Post Prandial Blood Sugar (PPBS)",
    "HbA1c",
    "Lipid Profile",
    "Liver Function Test (LFT)",
    "Kidney Function Test (KFT)",
    "Serum Electrolytes (Na+/K+/Cl-)",
    "Serum Calcium & Phosphorus",
    "Serum Vitamin D (25-OH)",
    "Vitamin B12 & Folate",
    "Thyroid Profile (T3, T4, TSH)",
    "CRP (Quantitative)",
    "PSA (Prostate Specific Antigen)",
  ],
  Other: [
    "Iron Studies (Serum Iron / TIBC / Ferritin)",
    "Vitamin B12 & Folate",
    "ANA (Antinuclear Antibody)",
    "HBsAg / Anti-HCV / HIV",
    "Allergy Panel (Total IgE)",
    "Semen Analysis",
    "Urine Pregnancy Test (UPT)",
  ],
};

const PRIORITY_OPTIONS = ["Routine", "Urgent", "STAT"];

const CATEGORY_ICONS: Record<string, ReactNode> = {
  Hematological: <Droplet className="w-3.5 h-3.5" />,
  Microbiological: <Microscope className="w-3.5 h-3.5" />,
  Cardiological: <Heart className="w-3.5 h-3.5" />,
  Radiological: <Scan className="w-3.5 h-3.5" />,
  Biochemistry: <FlaskConical className="w-3.5 h-3.5" />,
  Other: <MoreHorizontal className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Hematological: "text-red-600 bg-red-50 border-red-100",
  Microbiological: "text-emerald-600 bg-emerald-50 border-emerald-100",
  Cardiological: "text-rose-600 bg-rose-50 border-rose-100",
  Radiological: "text-indigo-600 bg-indigo-50 border-indigo-100",
  Biochemistry: "text-amber-600 bg-amber-50 border-amber-100",
  Other: "text-slate-600 bg-slate-50 border-slate-100",
};

function getDefaultSpecimen(category: string, test: string): string {
  const t = test.toLowerCase();
  if (t.includes("urine")) return "Midstream Urine";
  if (t.includes("stool")) return "Stool sample";
  if (t.includes("sputum")) return "Sputum sample";
  if (t.includes("semen")) return "Semen sample";
  if (
    t.includes("smear") ||
    t.includes("esr") ||
    t.includes("cbc") ||
    t.includes("hemoglobin") ||
    t.includes("platelet") ||
    t.includes("pt /") ||
    t.includes("aptt") ||
    t.includes("blood group")
  ) {
    return "Whole Blood (EDTA)";
  }
  if (t.includes("culture")) return "Blood / Fluid in culture media";
  if (
    t.includes("ecg") ||
    t.includes("x-ray") ||
    t.includes("usg") ||
    t.includes("echo") ||
    t.includes("tmt") ||
    t.includes("ct") ||
    t.includes("mri") ||
    t.includes("mammography") ||
    t.includes("dexa")
  ) {
    return "-";
  }
  if (t.includes("troponin") || t.includes("ck-mb") || t.includes("bnp")) {
    return "Whole Blood (EDTA) or Serum";
  }
  if (
    t.includes("lipid") ||
    t.includes("fasting") ||
    t.includes("ppbs") ||
    t.includes("hba1c") ||
    t.includes("lft") ||
    t.includes("kft") ||
    t.includes("electrolyte") ||
    t.includes("calcium") ||
    t.includes("vitamin") ||
    t.includes("thyroid") ||
    t.includes("crp") ||
    t.includes("psa") ||
    t.includes("iron") ||
    t.includes("ana") ||
    t.includes("hbsag") ||
    t.includes("hiv")
  ) {
    return "Whole Blood (SST)";
  }
  if (category === "Hematological") return "Whole Blood (EDTA)";
  if (category === "Biochemistry") return "Whole Blood (SST)";
  if (category === "Radiological") return "-";
  return "Whole Blood (SST)";
}

function applyRowPatch(
  row: InvestigationRowData,
  patch: Partial<InvestigationRowData>,
): InvestigationRowData {
  const next = { ...row, ...patch };

  if (patch.category && patch.category !== row.category) {
    const tests = TEST_OPTIONS_BY_CATEGORY[patch.category] || [];
    const newTest = tests[0] || "";
    next.test = newTest;
    next.specimen = getDefaultSpecimen(patch.category, newTest);
    next.priority = "Routine";
  }

  if (patch.test !== undefined && patch.test !== row.test) {
    next.specimen = getDefaultSpecimen(next.category, patch.test);
    next.priority = "Routine";
  }

  return next;
}

function groupRowsByCategory<T extends { category: string }>(rows: T[]) {
  const byCat = new Map<string, T[]>();
  CATEGORY_OPTIONS.forEach((c) => byCat.set(c, []));

  rows.forEach((item) => {
    const arr = byCat.get(item.category) || [];
    if (!byCat.has(item.category)) byCat.set(item.category, arr);
    arr.push(item);
  });

  return CATEGORY_OPTIONS.map((cat) => [cat, byCat.get(cat)!] as const).filter(
    ([, groupRows]) => groupRows.length > 0,
  );
}

function InvestigationGroupedTable({
  groupedRows,
  highlightedTestId,
  listBodyRef,
  onUpdateRow,
  onApplyQuickTest,
  onRemoveRow,
  onSendToPatient,
  canRemove,
  removeVariant,
  removingId,
  sendingId,
  disabled,
  showSavedBadge,
}: {
  groupedRows: ReadonlyArray<readonly [string, InvestigationRowData[]]>;
  highlightedTestId?: number | null;
  listBodyRef?: React.RefObject<HTMLTableSectionElement | null>;
  onUpdateRow: (
    rowKey: string | number,
    patch: Partial<InvestigationRowData>,
  ) => void;
  onApplyQuickTest: (
    rowKey: string | number,
    test: string,
    category: string,
  ) => void;
  onRemoveRow: (rowKey: string | number) => void;
  onSendToPatient?: (rowKey: string | number) => void;
  canRemove: (rowKey: string | number) => boolean;
  removeVariant: "minus" | "trash";
  removingId?: string | null;
  sendingId?: string | number | null;
  disabled?: boolean;
  showSavedBadge?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
      <table className="min-w-[960px] w-full text-sm">
        <thead className="bg-[#F9FAFB]">
          <tr className="text-left text-[#6B7280]">
            <th className="py-2.5 pl-4 pr-2 text-xs font-semibold w-[140px]">
              CATEGORY
            </th>
            <th className="py-2.5 px-2 text-xs font-semibold">
              TEST REQUESTED
            </th>
            <th className="py-2.5 px-2 text-xs font-semibold w-[200px]">
              SPECIMEN
            </th>
            <th className="py-2.5 px-2 text-xs font-semibold w-[120px]">
              PRIORITY
            </th>
            <th className="py-2.5 pr-4 text-xs font-semibold w-[130px] text-right">
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody ref={listBodyRef} className="divide-y divide-[#F3F4F6]">
          {groupedRows.map(([groupCategory, groupRows]) => (
            <Fragment key={groupCategory}>
              <tr className="bg-[#F1F5F9]">
                <td
                  colSpan={5}
                  className="px-3 py-1.5 text-xs font-semibold text-[#475569]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded border ${CATEGORY_COLORS[groupCategory] || CATEGORY_COLORS.Other}`}
                    >
                      {CATEGORY_ICONS[groupCategory] || CATEGORY_ICONS.Other}
                    </span>
                    {groupCategory}
                    <span className="ml-1 rounded bg-white/70 px-1.5 py-px text-[10px] font-normal text-[#64748B]">
                      {groupRows.length}{" "}
                      {groupRows.length === 1 ? "test" : "tests"}
                    </span>
                  </div>
                </td>
              </tr>

              {groupRows.map((row) => {
                const rowKey =
                  "id" in row
                    ? (row as NewInvestigationRow).id
                    : (row as ExistingInvestigation)._id;
                const catColor =
                  CATEGORY_COLORS[row.category] || CATEGORY_COLORS.Other;
                const catIcon =
                  CATEGORY_ICONS[row.category] || CATEGORY_ICONS.Other;
                const availableTests =
                  TEST_OPTIONS_BY_CATEGORY[row.category] || [];
                const isHighlighted =
                  typeof rowKey === "number" && rowKey === highlightedTestId;
                const isRemoving =
                  typeof rowKey === "string" && removingId === rowKey;
                const isSending = sendingId === rowKey;

                return (
                  <tr
                    key={rowKey}
                    className={`hover:bg-[#FAFBFC] group transition-colors duration-500 ${
                      isHighlighted
                        ? "bg-emerald-100 ring-1 ring-inset ring-emerald-300"
                        : ""
                    }`}
                  >
                    <td className="py-3 pl-4 pr-2 align-top">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${catColor}`}
                        >
                          {catIcon}
                        </span>
                        <select
                          value={row.category}
                          onChange={(e) =>
                            onUpdateRow(rowKey, { category: e.target.value })
                          }
                          disabled={disabled || isRemoving || isSending}
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:border-[#5164E8] focus:outline-none"
                        >
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    <td className="py-3 px-2 align-top">
                      <div className="flex items-start gap-2">
                        <input
                          type="text"
                          value={row.test}
                          placeholder="Enter test name"
                          onChange={(e) =>
                            onUpdateRow(rowKey, { test: e.target.value })
                          }
                          disabled={disabled || isRemoving || isSending}
                          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-[#5164E8] focus:outline-none"
                        />
                        {showSavedBadge && (
                          <span className="shrink-0 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-100">
                            Saved
                          </span>
                        )}
                      </div>
                      {availableTests.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {availableTests.map((t) => {
                            const active =
                              row.test.toLowerCase() === t.toLowerCase();
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() =>
                                  onApplyQuickTest(rowKey, t, row.category)
                                }
                                disabled={disabled || isRemoving || isSending}
                                className={`rounded px-2 py-0.5 text-[10px] leading-none transition ${
                                  active
                                    ? "bg-[#5164E8] text-white"
                                    : "bg-gray-100 text-[#4B5563] hover:bg-gray-200"
                                }`}
                              >
                                {t.length > 26 ? t.slice(0, 24) + "…" : t}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-2 align-top">
                      <input
                        type="text"
                        value={row.specimen}
                        placeholder="e.g. Whole Blood (EDTA)"
                        onChange={(e) =>
                          onUpdateRow(rowKey, { specimen: e.target.value })
                        }
                        disabled={disabled || isRemoving || isSending}
                        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-[#5164E8] focus:outline-none"
                      />
                    </td>

                    <td className="py-3 px-2 align-top">
                      <select
                        value={row.priority}
                        onChange={(e) =>
                          onUpdateRow(rowKey, { priority: e.target.value })
                        }
                        disabled={disabled || isRemoving || isSending}
                        className={`w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-[#5164E8] focus:outline-none ${
                          row.priority === "STAT"
                            ? "text-red-600 font-medium"
                            : row.priority === "Urgent"
                              ? "text-amber-600 font-medium"
                              : ""
                        }`}
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 pr-4 align-top">
                      <div className="flex flex-col items-end gap-1.5">
                        {onSendToPatient && (
                          <button
                            type="button"
                            onClick={() => onSendToPatient(rowKey)}
                            disabled={disabled || isRemoving || isSending}
                            className="inline-flex items-center gap-1 rounded-md border border-[#5164E8]/30 bg-[#EEF2FF] px-2 py-1 text-[10px] font-semibold text-[#5164E8] hover:bg-[#E0E7FF] transition-colors disabled:opacity-40 whitespace-nowrap"
                            title="Send this investigation to the patient"
                          >
                            {isSending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Send to Patient
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveRow(rowKey)}
                          disabled={
                            !canRemove(rowKey) ||
                            disabled ||
                            isRemoving ||
                            isSending
                          }
                          className={`rounded p-1.5 transition-colors disabled:opacity-30 ${
                            removeVariant === "trash"
                              ? "bg-[#FF6B6B] text-white hover:bg-[#FF5252]"
                              : "text-[#9CA3AF] opacity-70 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          }`}
                          title={
                            removeVariant === "trash"
                              ? "Delete investigation"
                              : "Remove test"
                          }
                        >
                          {isRemoving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : removeVariant === "trash" ? (
                            <Trash2 className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function InvestigationModal({
  onClose,
  consultationId,
}: InvestigationModalProps) {
  const [newInvestigations, setNewInvestigations] = useState<
    NewInvestigationRow[]
  >([]);
  const [existingEdits, setExistingEdits] = useState<
    Record<string, Partial<ExistingInvestigation>>
  >({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [quickCategory, setQuickCategory] = useState<string>("Hematological");
  const [highlightedTestId, setHighlightedTestId] = useState<number | null>(
    null,
  );
  const listBodyRef = useRef<HTMLTableSectionElement>(null);
  const queryClient = useQueryClient();

  const { data: existingInvestigationsRes, isLoading: isLoadingExisting } =
    useQuery({
      queryKey: queryKeys.consultationInvestigations(consultationId),
      queryFn: () => getInvestigationListForConsultationReq(consultationId),
      enabled: !!consultationId,
      retry: false,
    });

  const existingInvestigations: ExistingInvestigation[] = useMemo(() => {
    const items = existingInvestigationsRes?.data;
    if (!items || !Array.isArray(items)) return [];

    return items
      .filter((inv) => !inv.assign_to_patient)
      .map((inv) => {
        const fields = getInvestigationDisplayFields(inv);
        const edits = existingEdits[inv._id] ?? {};
        return {
          _id: inv._id,
          category: edits.category ?? fields.category,
          test: edits.test ?? fields.test_requested,
          specimen: edits.specimen ?? fields.specimen,
          priority: edits.priority ?? fields.priority,
        };
      });
  }, [existingInvestigationsRes, existingEdits]);

  const groupedExistingInvestigations = useMemo(
    () => groupRowsByCategory(existingInvestigations),
    [existingInvestigations],
  );

  const groupedNewInvestigations = useMemo(
    () => groupRowsByCategory(newInvestigations),
    [newInvestigations],
  );

  const invalidateInvestigationQueries = () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.consultationInvestigations(consultationId),
    });
    queryClient.invalidateQueries({ queryKey: ["investigation_doc"] });
  };

  const { mutate: deleteInvestigation } = useMutation({
    mutationFn: (id: string) => deleteInvestigationListForConsultationReq(id),
    onMutate: (id) => setDeletingId(id),
    onSuccess: () => {
      toast.success("Investigation deleted");
      invalidateInvestigationQueries();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete investigation");
    },
    onSettled: () => setDeletingId(null),
  });

  const isTestAlreadyAdded = (category: string, test: string) => {
    const normalized = test.toLowerCase();
    return (
      existingInvestigations.some(
        (row) =>
          row.category === category && row.test.toLowerCase() === normalized,
      ) ||
      newInvestigations.some(
        (row) =>
          row.category === category && row.test.toLowerCase() === normalized,
      )
    );
  };

  const updateExistingInvestigation = (
    _id: string,
    patch: Partial<InvestigationRowData>,
  ) => {
    setExistingEdits((prev) => {
      const current = existingInvestigations.find((row) => row._id === _id);
      if (!current) return prev;
      const merged = applyRowPatch(current, patch);
      return {
        ...prev,
        [_id]: {
          ...prev[_id],
          ...patch,
          ...(patch.category !== undefined
            ? {
                test: merged.test,
                specimen: merged.specimen,
                priority: merged.priority,
              }
            : {}),
          ...(patch.test !== undefined
            ? { specimen: merged.specimen, priority: merged.priority }
            : {}),
        },
      };
    });
  };

  const updateNewInvestigation = (
    id: number,
    patch: Partial<InvestigationRowData>,
  ) => {
    setNewInvestigations((prev) =>
      prev.map((row) =>
        row.id === id ? { ...applyRowPatch(row, patch), id: row.id } : row,
      ),
    );
  };

  const applyQuickTestToExisting = (
    _id: string,
    test: string,
    category: string,
  ) => {
    if (!test) return;
    setExistingEdits((prev) => ({
      ...prev,
      [_id]: {
        ...prev[_id],
        category,
        test,
        specimen: getDefaultSpecimen(category, test),
        priority: "Routine",
      },
    }));
  };

  const applyQuickTestToNew = (id: number, test: string, category: string) => {
    if (!test) return;
    setNewInvestigations((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              category,
              test,
              specimen: getDefaultSpecimen(category, test),
              priority: "Routine",
            }
          : row,
      ),
    );
  };

  const addTestFromCatalog = (category: string, test: string) => {
    if (isTestAlreadyAdded(category, test)) return;

    const newId = Date.now();
    const newRow: NewInvestigationRow = {
      id: newId,
      category,
      test,
      specimen: getDefaultSpecimen(category, test),
      priority: "Routine",
    };
    setNewInvestigations((prev) => [...prev, newRow]);
    setHighlightedTestId(newId);

    setTimeout(() => {
      listBodyRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }, 50);

    setTimeout(() => {
      setHighlightedTestId((current) => (current === newId ? null : current));
    }, 1600);
  };

  const addCustomRow = () => {
    const newId = Date.now();
    setNewInvestigations((prev) => [
      ...prev,
      {
        id: newId,
        category: "Other",
        test: "",
        specimen: "",
        priority: "Routine",
      },
    ]);
    setHighlightedTestId(newId);
    setTimeout(() => {
      listBodyRef.current?.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }, 50);
    setTimeout(() => {
      setHighlightedTestId((current) => (current === newId ? null : current));
    }, 1600);
  };

  const clearNewTests = () => {
    setNewInvestigations([]);
  };

  const validateRow = (row: InvestigationRowData, label: string): boolean => {
    if (!row.test.trim()) {
      toast.error(`Please enter a test name for ${label}`);
      return false;
    }
    if (!row.category) {
      toast.error(`Please select a category for ${label}`);
      return false;
    }
    return true;
  };

  const handleSendExistingInvestigation = async (_id: string) => {
    const row = existingInvestigations.find((inv) => inv._id === _id);
    if (!row || !validateRow(row, "this investigation")) return;

    setSendingId(_id);
    try {
      await updateInvestigationListForConsultationReq(_id, {
        category: row.category,
        test_requested: row.test.trim(),
        priority: row.priority || "Routine",
        specimen: row.specimen || "-",
        assign_to_patient: true,
      });
      toast.success(`"${row.test.trim()}" sent to patient`);
      setExistingEdits((prev) => {
        const next = { ...prev };
        delete next[_id];
        return next;
      });
      invalidateInvestigationQueries();
    } catch (error) {
      toast.error(
        (error as Error).message ||
          "Failed to send investigation to patient. Please try again.",
      );
    } finally {
      setSendingId(null);
    }
  };

  const handleSendNewInvestigation = async (id: number) => {
    const row = newInvestigations.find((inv) => inv.id === id);
    if (!row || !validateRow(row, "this investigation")) return;

    setSendingId(id);
    try {
      await createInvestigationListForConsultationReq(consultationId, {
        investigations: [
          {
            category: row.category,
            test_requested: row.test.trim(),
            priority: row.priority || "Routine",
            specimen: row.specimen || "-",
          },
        ],
        assign_to_patient: true,
      });
      toast.success(`"${row.test.trim()}" sent to patient`);
      setNewInvestigations((prev) => prev.filter((inv) => inv.id !== id));
      invalidateInvestigationQueries();
    } catch (error) {
      toast.error(
        (error as Error).message ||
          "Failed to send investigation to patient. Please try again.",
      );
    } finally {
      setSendingId(null);
    }
  };

  const handleSubmit = async (assignToPatient: boolean) => {
    if (!consultationId) {
      toast.error("Consultation ID is missing. Please try again.");
      return;
    }

    for (let i = 0; i < existingInvestigations.length; i++) {
      if (!validateRow(existingInvestigations[i], `saved test ${i + 1}`)) {
        return;
      }
    }

    const touchedNewInvestigations = newInvestigations.filter(
      (row) => row.test.trim() !== "",
    );

    for (let i = 0; i < touchedNewInvestigations.length; i++) {
      if (!validateRow(touchedNewInvestigations[i], `new test ${i + 1}`)) {
        return;
      }
    }

    if (
      existingInvestigations.length === 0 &&
      touchedNewInvestigations.length === 0
    ) {
      toast.error("Please add at least one investigation.");
      return;
    }

    if (assignToPatient) {
      setIsSendingAll(true);
    } else {
      setIsSaving(true);
    }

    try {
      const patchPromises = existingInvestigations.map((row) =>
        updateInvestigationListForConsultationReq(row._id, {
          category: row.category,
          test_requested: row.test.trim(),
          priority: row.priority || "Routine",
          specimen: row.specimen || "-",
          assign_to_patient: assignToPatient,
        }),
      );

      let createPromise: Promise<unknown> = Promise.resolve();
      if (touchedNewInvestigations.length > 0) {
        createPromise = createInvestigationListForConsultationReq(
          consultationId,
          {
            investigations: touchedNewInvestigations.map((row) => ({
              category: row.category,
              test_requested: row.test.trim(),
              priority: row.priority || "Routine",
              specimen: row.specimen || "-",
            })),
            assign_to_patient: assignToPatient,
          },
        );
      }

      await Promise.all([...patchPromises, createPromise]);

      toast.success(
        assignToPatient
          ? "All investigation requests sent to patient"
          : "Investigations saved successfully",
      );
      setNewInvestigations([]);
      setExistingEdits({});
      invalidateInvestigationQueries();
    } catch (error) {
      toast.error(
        (error as Error).message ||
          "Failed to save investigations. Please try again.",
      );
    } finally {
      if (assignToPatient) {
        setIsSendingAll(false);
      } else {
        setIsSaving(false);
      }
    }
  };

  const isBusy =
    isSaving || isSendingAll || deletingId !== null || sendingId !== null;
  const pendingSendCount =
    existingInvestigations.length +
    newInvestigations.filter((row) => row.test.trim() !== "").length;
  const totalCount = existingInvestigations.length + newInvestigations.length;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[720px] md:max-w-[920px] lg:max-w-[1100px] xl:max-w-[1200px] w-[98vw] p-0 gap-0 overflow-hidden bg-white rounded-lg max-h-[92vh] flex flex-col">
        <DialogHeader className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-200 space-y-0 shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Investigation Request
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {existingInvestigations.length > 0 && (
              <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700 border border-amber-100">
                {existingInvestigations.length} saved
              </div>
            )}
            {newInvestigations.length > 0 && (
              <div className="rounded-full bg-[#EEF2FF] px-3 py-1 text-sm font-semibold text-[#5164E8]">
                {newInvestigations.length} new
              </div>
            )}
            {totalCount > 0 && (
              <div className="text-xs text-[#6B7280]">
                {totalCount} total {totalCount === 1 ? "test" : "tests"} in this
                request
              </div>
            )}
          </div>

          {isLoadingExisting && (
            <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading saved investigations…</span>
            </div>
          )}

          {existingInvestigations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Beaker className="w-4 h-4 text-[#5164E8]" />
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                  Saved Investigations
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {existingInvestigations.length}
                </span>
              </div>
              <p className="mb-3 text-xs text-[#6B7280]">
                These tests are saved but not yet sent to the patient. Send one
                at a time, or use the footer action to send all pending requests
                together.
              </p>
              <InvestigationGroupedTable
                groupedRows={groupedExistingInvestigations}
                onUpdateRow={(rowKey, patch) =>
                  updateExistingInvestigation(String(rowKey), patch)
                }
                onApplyQuickTest={(rowKey, test, category) =>
                  applyQuickTestToExisting(String(rowKey), test, category)
                }
                onRemoveRow={(rowKey) => deleteInvestigation(String(rowKey))}
                onSendToPatient={(rowKey) =>
                  handleSendExistingInvestigation(String(rowKey))
                }
                canRemove={() => true}
                removeVariant="trash"
                removingId={deletingId}
                sendingId={sendingId}
                disabled={isBusy}
                showSavedBadge
              />
            </div>
          )}

          <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#374151]">
                  Browse &amp; add tests
                </div>
                <p className="mt-0.5 text-[11px] text-[#6B7280]">
                  Click a test to add it to your new request list.
                </p>
              </div>
              <button
                onClick={addCustomRow}
                disabled={isBusy}
                className="flex items-center gap-1 rounded-md border border-[#D1D5DB] px-2.5 py-1 text-xs font-medium text-[#374151] hover:bg-gray-50 active:bg-gray-100"
              >
                <Plus className="h-3.5 w-3.5" />
                Add custom test
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((cat) => {
                const isActive = quickCategory === cat;
                const count = (TEST_OPTIONS_BY_CATEGORY[cat] || []).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setQuickCategory(cat)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      isActive
                        ? "border-[#5164E8] bg-[#5164E8] text-white shadow-sm"
                        : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]"
                    }`}
                  >
                    <span className={isActive ? "text-white" : ""}>{cat}</span>
                    {count > 0 && (
                      <span
                        className={`rounded px-1 text-[10px] ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-gray-100 text-[#6B7280]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(TEST_OPTIONS_BY_CATEGORY[quickCategory] || []).length > 0 ? (
                (TEST_OPTIONS_BY_CATEGORY[quickCategory] || []).map((test) => {
                  const isAdded = isTestAlreadyAdded(quickCategory, test);
                  const defaultSpec = getDefaultSpecimen(quickCategory, test);

                  return (
                    <button
                      key={test}
                      type="button"
                      onClick={() => addTestFromCatalog(quickCategory, test)}
                      disabled={isAdded || isBusy}
                      className={`group flex flex-col rounded-lg border p-3 text-left transition-all ${
                        isAdded
                          ? "cursor-default border-emerald-200 bg-emerald-50 opacity-75"
                          : "border-[#E5E7EB] hover:border-[#5164E8] hover:bg-[#F8FAFF] active:bg-[#EEF2FF]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium leading-snug text-[#1F2937]">
                          {test}
                        </div>
                        {isAdded && (
                          <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-px text-[10px] font-medium text-emerald-700">
                            Added
                          </span>
                        )}
                      </div>
                      {defaultSpec && defaultSpec !== "-" && (
                        <div className="mt-1 text-[11px] text-[#6B7280]">
                          Specimen:{" "}
                          <span className="font-medium text-[#4B5563]">
                            {defaultSpec}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full rounded-lg border border-dashed p-4 text-center text-xs text-[#6B7280]">
                  No preset tests for this category. Use “Add custom test”
                  above.
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#374151]">
                New request list
                {newInvestigations.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-[#6B7280]">
                    ({newInvestigations.length})
                  </span>
                )}
              </div>
              {newInvestigations.length > 0 && (
                <button
                  onClick={clearNewTests}
                  disabled={isBusy}
                  className="text-xs text-[#BA1A1A] hover:underline"
                >
                  Clear new
                </button>
              )}
            </div>

            {newInvestigations.length === 0 ? (
              <div className="rounded-xl border border-dashed py-8 text-center text-sm text-[#6B7280]">
                No new tests added yet. Use the browser above to start building
                your request.
              </div>
            ) : (
              <InvestigationGroupedTable
                groupedRows={groupedNewInvestigations}
                highlightedTestId={highlightedTestId}
                listBodyRef={listBodyRef}
                onUpdateRow={(rowKey, patch) =>
                  updateNewInvestigation(Number(rowKey), patch)
                }
                onApplyQuickTest={(rowKey, test, category) =>
                  applyQuickTestToNew(Number(rowKey), test, category)
                }
                onRemoveRow={(rowKey) =>
                  setNewInvestigations((prev) =>
                    prev.filter((row) => row.id !== Number(rowKey)),
                  )
                }
                onSendToPatient={(rowKey) =>
                  handleSendNewInvestigation(Number(rowKey))
                }
                canRemove={() => true}
                removeVariant="minus"
                sendingId={sendingId}
                disabled={isBusy}
              />
            )}
          </div>

          <div className="text-[11px] text-[#6B7280]">
            Tip: Use Send to Patient on any row to release a single request, or
            Save to keep drafts without sending. The footer action sends every
            pending request at once.
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            disabled={isBusy}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isBusy}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isBusy || pendingSendCount === 0}
            className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-2 bg-[#5164E8] text-white rounded-lg hover:bg-[#3B4BCF] transition-all disabled:opacity-50 text-sm font-semibold shadow-sm"
            title={
              pendingSendCount === 0
                ? "No pending investigations to send"
                : undefined
            }
          >
            {isSendingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 shrink-0" />
            )}
            <span className="hidden lg:inline">
              Generate &amp; Send All Investigation Requests to Patient
              {pendingSendCount > 0 ? ` (${pendingSendCount})` : ""}
            </span>
            <span className="lg:hidden">
              Send All to Patient
              {pendingSendCount > 0 ? ` (${pendingSendCount})` : ""}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
