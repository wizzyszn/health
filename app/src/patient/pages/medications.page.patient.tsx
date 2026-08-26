import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  COMPANY,
  REFERRAL_PALETTE,
} from "@/shared/constants/company.constants";
import {
  loadLogoDataUrl,
  drawFooterWave,
  drawHeader,
  setText,
  setFill,
  MARGIN,
  PAGE_W,
} from "@/shared/utils/pdf-branding.util";

import {
  getGroupMedicationsByConsultation,
  getPatientProfileReq,
} from "@/config/service/patient.service";
import { formatUtcDate } from "@/lib/utils";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import { Pagination } from "@/shared/components/pagination.component.shared";
import { toast } from "sonner";
import { MedicationPageHeader } from "@/patient/components/medication/medication-page-header.component.patient";
import { MedicationSearchBar } from "@/patient/components/medication/medication-search-bar.component.patient";
import { MedicationGroupCard } from "@/patient/components/medication/medication-group-card.component.patient";
import { MedicationEmptyState } from "@/patient/components/medication/medication-empty-state.component.patient";
import {
  MedicationGroup,
  MedicationPatientProfile,
  MedicationItem,
} from "@/patient/components/medication/medication.types.patient";
import {
  drawGeneralMedicationInstructionsSection,
  drawMedicationOrderInstructionsSection,
  formatMedicationStartDate,
} from "@/patient/components/medication/medication-pdf-instructions.util.patient";
import { PatientRecordGroupSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";
import { useQuery } from "@tanstack/react-query";
import SEO from "@/shared/components/seo.component";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export default function MedicationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { updateParam, getParam } = useUrlSearchParams();
  const pageParam = getParam("page") || "1";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-medications-grouped", pageParam],
    queryFn: () =>
      getGroupMedicationsByConsultation({ page: pageParam, perPage: "10" }),
  });

  const { data: profileData } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: () => getPatientProfileReq(),
  });
  const profile = profileData?.data as MedicationPatientProfile | undefined;

  const paginationData = data?.data?.pagination;
  const totalPages = paginationData?.total_pages ?? 1;

  const groups = useMemo(
    () => (data?.data?.groups || []) as MedicationGroup[],
    [data],
  );

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return groups;

    return groups.filter((group) => {
      const consultationTitle = (
        group.consultation?.appointment_id?.reason_for_visit ||
        group.consultation?.title ||
        "Consultation"
      ).toLowerCase();
      const reference = (group.consultation?._id || "").toLowerCase();

      // Also search within individual medications
      const medMatch = group.medications?.some((med) => {
        const medName = (med.medication || "").toLowerCase();
        const formulary = (med.formulary || "").toLowerCase();
        return (
          medName.includes(normalizedSearch) ||
          formulary.includes(normalizedSearch)
        );
      });

      return (
        consultationTitle.includes(normalizedSearch) ||
        reference.includes(normalizedSearch) ||
        medMatch
      );
    });
  }, [groups, searchTerm]);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  /* ─── PDF Generation (per group — all medications in the consultation) ─── */

  const handleDownloadPDF = async (group: MedicationGroup) => {
    try {
      const logoDataUrl = await loadLogoDataUrl();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginRight = 20;

      const headerEnd = drawHeader(doc, logoDataUrl);

      // Title
      let cursorY = headerEnd + 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      setText(doc, REFERRAL_PALETTE.primary);
      doc.text("PRESCRIPTION SHEET", PAGE_W / 2, cursorY, { align: "center" });
      cursorY += 10;

      // Patient Info Box
      const infoBoxY = cursorY;
      const infoBoxHeight = 45;
      setFill(doc, REFERRAL_PALETTE.gridFill);
      doc.setDrawColor(210, 215, 225);
      doc.rect(
        MARGIN,
        infoBoxY,
        pageWidth - MARGIN - marginRight,
        infoBoxHeight,
        "FD",
      );

      const name = profile?.first_name
        ? `${profile.first_name} ${profile.last_name}`
        : "N/A";

      let dob = "N/A";
      if (profile?.date_of_birth) {
        dob = formatUtcDate(profile.date_of_birth, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }

      const consId = group.consultation?._id || "N/A";
      const consRefDisplay =
        consId !== "N/A" ? `C-${consId.slice(-6).toUpperCase()}` : "N/A";

      const firstMed = group.medications?.[0];
      const date = formatUtcDate(
        firstMed?.createdAt || new Date().toISOString(),
        { day: "numeric", month: "long", year: "numeric" },
      );
      const time = formatUtcDate(
        firstMed?.createdAt || new Date().toISOString(),
        { hour: "2-digit", minute: "2-digit" },
      );

      let docName = "N/A";
      if (firstMed?.doctor_id) {
        const rawName =
          firstMed.doctor_id.full_name ||
          `${firstMed.doctor_id.first_name} ${firstMed.doctor_id.last_name}`;
        docName =
          rawName.startsWith("Dr.") || rawName.startsWith("Dr ")
            ? rawName.replace(/^Dr\.?\s*/, "Dr ")
            : `Dr ${rawName}`;
      }

      const leftX = MARGIN + 6;
      const rightX = pageWidth / 2 + 10;
      const lineHeight = 7;
      const infoTextY = infoBoxY + 10;

      doc.setFontSize(10);
      setText(doc, REFERRAL_PALETTE.ink);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name: ", leftX, infoTextY);
      doc.setFont("helvetica", "normal");
      doc.text(name, leftX + doc.getTextWidth("Patient Name: "), infoTextY);

      doc.setFont("helvetica", "bold");
      doc.text("DOB: ", leftX, infoTextY + lineHeight);
      doc.setFont("helvetica", "normal");
      doc.text(dob, leftX + doc.getTextWidth("DOB: "), infoTextY + lineHeight);

      doc.setFont("helvetica", "bold");
      doc.text("Consultation Ref: ", leftX, infoTextY + lineHeight * 2);
      doc.setFont("helvetica", "normal");
      doc.text(
        consRefDisplay,
        leftX + doc.getTextWidth("Consultation Ref: "),
        infoTextY + lineHeight * 2,
      );

      doc.setFont("helvetica", "bold");
      doc.text("Date:  ", rightX, infoTextY);
      doc.setFont("helvetica", "normal");
      doc.text(date, rightX + doc.getTextWidth("Date:  "), infoTextY);

      doc.setFont("helvetica", "bold");
      doc.text("Time:  ", rightX, infoTextY + lineHeight);
      doc.setFont("helvetica", "normal");
      doc.text(
        time,
        rightX + doc.getTextWidth("Time:  "),
        infoTextY + lineHeight,
      );

      doc.setFont("helvetica", "bold");
      doc.text("Prescriber:", rightX, infoTextY + lineHeight * 2);
      doc.setFont("helvetica", "normal");
      doc.text(docName, rightX, infoTextY + lineHeight * 3);

      // Medication Table
      const tableHeaderY = infoBoxY + infoBoxHeight + 10;
      doc.setFillColor(30, 58, 138);
      doc.rect(MARGIN, tableHeaderY, pageWidth - MARGIN - marginRight, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("MEDICATION TABLE", PAGE_W / 2, tableHeaderY + 5.5, {
        align: "center",
      });

      const tableBody = (group.medications || []).map((med: MedicationItem) => [
        med.medication || "N/A",
        `${med.dose} ${med.unit}`,
        med.interval || "N/A",
        `${med.duration} ${med.duration_unit}`,
        formatMedicationStartDate(med.start_date),
      ]);

      autoTable(doc, {
        startY: tableHeaderY + 8,
        head: [["Drug", "Dosage", "Frequency", "Duration", "Start Date"]],
        body: tableBody,
        theme: "grid",
        margin: { left: MARGIN, right: marginRight },
        tableWidth: pageWidth - MARGIN - marginRight,
        headStyles: {
          fillColor: REFERRAL_PALETTE.gridFill,
          textColor: REFERRAL_PALETTE.primary,
          fontStyle: "bold",
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: REFERRAL_PALETTE.ink,
        },
      });

      const tableEndY =
        (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 12;
      const contentWidth = pageWidth - MARGIN - marginRight;

      const afterOrderInstructionsY = drawMedicationOrderInstructionsSection(
        doc,
        MARGIN,
        contentWidth,
        tableEndY,
        group.medications || [],
      );
      const sigY = drawGeneralMedicationInstructionsSection(
        doc,
        MARGIN,
        contentWidth,
        afterOrderInstructionsY,
      );

      // Prescriber block
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(210, 215, 225);
      doc.rect(MARGIN, sigY, contentWidth, 34, "FD");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      setText(doc, REFERRAL_PALETTE.primary);
      doc.text("PRESCRIBED BY:", MARGIN + 6, sigY + 10);

      doc.setFontSize(13);
      setText(doc, REFERRAL_PALETTE.ink);
      doc.text(docName, MARGIN + 6, sigY + 17);

      setText(doc, REFERRAL_PALETTE.muted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Responsible Prescriber", MARGIN + 6, sigY + 23);

      setText(doc, REFERRAL_PALETTE.primary);
      doc.setFont("helvetica", "bold");
      doc.text(COMPANY.name, MARGIN + 6, sigY + 29);

      setText(doc, REFERRAL_PALETTE.ink);
      doc.setFontSize(10);
      doc.text(
        `Ref: ${consRefDisplay}`,
        pageWidth - marginRight - 6,
        sigY + 29,
        { align: "right" },
      );

      drawFooterWave(doc);

      const title =
        group.consultation?.appointment_id?.reason_for_visit ||
        group.consultation?.title ||
        "prescription";
      doc.save(`${title}_prescription.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <>
      <SEO
        title="Medications"
        description="View your prescriptions and medication history on Carelexa."
        canonicalPath="/patient/dashboard/medications"
      />
      <div className="flex w-full flex-col gap-6">
        <MedicationPageHeader />

        <section className="overflow-hidden rounded-[20px] border border-[#F0F0F0] bg-white shadow-sm">
          <div className="border-b border-[#F0F0F0] px-4 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-[#6C6C6C]">History</h2>
          </div>

          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <MedicationSearchBar value={searchTerm} onChange={setSearchTerm} />

            <div className="flex flex-col gap-2">
              {isLoading ? (
                <PatientRecordGroupSkeleton count={4} />
              ) : isError ? (
                <div className="text-center py-12 text-red-500">
                  Failed to load medication history. Please try again later.
                </div>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group, index) => {
                  const consultationId =
                    group.consultation?._id || `unknown-${index}`;
                  const isExpanded = expandedGroupId === consultationId;

                  return (
                    <MedicationGroupCard
                      key={consultationId}
                      group={group}
                      index={index}
                      isExpanded={isExpanded}
                      onToggle={toggleGroup}
                      onDownload={handleDownloadPDF}
                    />
                  );
                })
              ) : (
                <MedicationEmptyState
                  onBookConsultant={() => updateParam("step", "0")}
                />
              )}

              {filteredGroups.length > 0 && totalPages > 1 && (
                <Pagination totalPages={totalPages} />
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
