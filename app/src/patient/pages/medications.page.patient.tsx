import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useQuery } from "@tanstack/react-query";
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

  const handleDownloadPDF = (group: MedicationGroup) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 20;
      const marginRight = 20;

      // Helper: draw MEDIAPP cross icon
      const drawCrossIcon = (cx: number, cy: number, size: number) => {
        const half = size / 2;
        const thickness = size / 3.5;
        doc.setFillColor(0, 153, 204);
        doc.rect(cx - thickness / 2, cy - half, thickness, size, "F");
        doc.rect(cx - half, cy - thickness / 2, size, thickness, "F");
        doc.setFillColor(30, 120, 180);
        doc.rect(cx - half, cy - half, half, thickness / 2, "F");
      };

      // 1. HEADER
      const logoSize = 14;
      const logoX = pageWidth / 2 - 18;
      const logoY = 18;
      drawCrossIcon(logoX, logoY, logoSize);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(20, 60, 120);
      doc.text("MEDIAPP", logoX + logoSize / 2 + 5, logoY + 2);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 140, 160);
      doc.text(
        "Comprehensive Healthcare Solutions",
        logoX + logoSize / 2 + 5,
        logoY + 7,
      );

      // 2. TITLE
      const titleY = 38;
      doc.setDrawColor(180, 190, 200);
      doc.setLineWidth(0.4);
      doc.line(marginLeft, titleY, pageWidth - marginRight, titleY);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(20, 40, 60);
      doc.text("PRESCRIPTION SHEET", pageWidth / 2, titleY + 8, {
        align: "center",
      });

      doc.line(marginLeft, titleY + 12, pageWidth - marginRight, titleY + 12);

      // 3. PATIENT INFO
      const infoBoxY = titleY + 18;
      const infoBoxHeight = 45;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(210, 215, 225);
      doc.rect(
        marginLeft,
        infoBoxY,
        pageWidth - marginLeft - marginRight,
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
        docName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
      }

      const leftX = marginLeft + 6;
      const rightX = pageWidth / 2 + 10;
      const lineHeight = 7;
      const infoTextY = infoBoxY + 10;

      doc.setFontSize(10);
      doc.setTextColor(20, 40, 60);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name: ", leftX, infoTextY);
      const nameValX = leftX + doc.getTextWidth("Patient Name: ");
      doc.setFont("helvetica", "normal");
      doc.text(name, nameValX, infoTextY);

      doc.setFont("helvetica", "bold");
      doc.text("DOB: ", leftX, infoTextY + lineHeight);
      const dobValX = leftX + doc.getTextWidth("DOB: ");
      doc.setFont("helvetica", "normal");
      doc.text(dob, dobValX, infoTextY + lineHeight);

      doc.setFont("helvetica", "bold");
      doc.text("Consultation Ref: ", leftX, infoTextY + lineHeight * 2);
      const refValX = leftX + doc.getTextWidth("Consultation Ref: ");
      doc.setFont("helvetica", "normal");
      doc.text(consRefDisplay, refValX, infoTextY + lineHeight * 2);

      doc.setFont("helvetica", "bold");
      doc.text("Date:  ", rightX, infoTextY);
      const dateValX = rightX + doc.getTextWidth("Date:  ");
      doc.setFont("helvetica", "normal");
      doc.text(date, dateValX, infoTextY);

      doc.setFont("helvetica", "bold");
      doc.text("Time:  ", rightX, infoTextY + lineHeight);
      const timeValX = rightX + doc.getTextWidth("Time:  ");
      doc.setFont("helvetica", "normal");
      doc.text(time, timeValX, infoTextY + lineHeight);

      doc.setFont("helvetica", "bold");
      doc.text("Prescriber:", rightX, infoTextY + lineHeight * 2);
      doc.setFont("helvetica", "normal");
      doc.text(docName, rightX, infoTextY + lineHeight * 3);

      // 4. MEDICATION TABLE (all medications in the group)
      const tableHeaderY = infoBoxY + infoBoxHeight + 10;

      doc.setFillColor(30, 58, 138);
      doc.rect(
        marginLeft,
        tableHeaderY,
        pageWidth - marginLeft - marginRight,
        8,
        "F",
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("MEDICATION TABLE", pageWidth / 2, tableHeaderY + 5.5, {
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
        margin: { left: marginLeft, right: marginRight },
        tableWidth: pageWidth - marginLeft - marginRight,
        headStyles: {
          fillColor: [239, 246, 255],
          textColor: [30, 58, 138],
          fontStyle: "bold",
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: [40, 50, 60],
        },
      });

      const tableEndY =
        (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 12;
      const contentWidth = pageWidth - marginLeft - marginRight;

      const afterOrderInstructionsY = drawMedicationOrderInstructionsSection(
        doc,
        marginLeft,
        contentWidth,
        tableEndY,
        group.medications || [],
      );
      const sigY = drawGeneralMedicationInstructionsSection(
        doc,
        marginLeft,
        contentWidth,
        afterOrderInstructionsY,
      );

      // 6. PRESCRIBER BLOCK
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(210, 215, 225);
      doc.rect(marginLeft, sigY, contentWidth, 34, "FD");

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("PRESCRIBED BY:", marginLeft + 6, sigY + 10);

      doc.setFontSize(13);
      doc.setTextColor(20, 40, 60);
      doc.text(docName, marginLeft + 6, sigY + 17);

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Responsible Prescriber", marginLeft + 6, sigY + 23);

      doc.setTextColor(30, 58, 138);
      doc.setFont("helvetica", "bold");
      doc.text("MEDIAPP", marginLeft + 6, sigY + 29);

      doc.setTextColor(20, 40, 60);
      doc.setFontSize(10);
      doc.text(
        `Ref: ${consRefDisplay}`,
        pageWidth - marginRight - 6,
        sigY + 29,
        { align: "right" },
      );

      // 7. FOOTER
      doc.setDrawColor(210, 215, 225);
      doc.line(marginLeft, 282, pageWidth - marginRight, 282);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Official use only. For stock supplies and out-patient prescriptions in hospital. May also be used for primary care.",
        marginLeft,
        287,
      );

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
  );
}
