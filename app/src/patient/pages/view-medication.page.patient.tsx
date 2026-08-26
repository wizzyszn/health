import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/config/query-keys";
import {
  getSingleMedicationReq,
  getPatientProfileReq,
} from "@/config/service/patient.service";
import Spinner from "@/shared/components/spinner.component";
import MedicineBottleIcon from "@/shared/components/svgs/icons/medicine-bottle.icon";
import {
  ChevronLeft,
  MoveRight,
  MoveLeft,
  CloudDownload,
  Info,
  Pill,
  Clock,
  Calendar,
  User,
  FileText,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { formatUtcDate } from "@/lib/utils";
import {
  drawGeneralMedicationInstructionsSection,
  drawMedicationOrderInstructionsSection,
  formatMedicationStartDate,
} from "@/patient/components/medication/medication-pdf-instructions.util.patient";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export default function ViewMedicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-medication", id],
    queryFn: () => (id ? getSingleMedicationReq(id) : Promise.reject()),
    enabled: Boolean(id),
    retry: false,
  });

  const { data: profileData } = useQuery({
    queryKey: queryKeys.patientProfile,
    queryFn: () => getPatientProfileReq(),
  });
  const profile = profileData?.data;

  const medication = data?.data;

  const handleDownloadPDF = async () => {
    if (!medication) return;
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

    const consId = medication.consultation_id?._id || "N/A";
    const consRefDisplay =
      consId !== "N/A" ? `C-${consId.slice(-6).toUpperCase()}` : "N/A";

    const date = formatUtcDate(
      medication.createdAt || new Date().toISOString(),
      { day: "numeric", month: "long", year: "numeric" },
    );
    const time = formatUtcDate(
      medication.createdAt || new Date().toISOString(),
      { hour: "2-digit", minute: "2-digit" },
    );

    let docName = "N/A";
    if (medication.doctor_id) {
      const rawName =
        medication.doctor_id.full_name ||
        `${medication.doctor_id.first_name} ${medication.doctor_id.last_name}`;
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

    autoTable(doc, {
      startY: tableHeaderY + 8,
      head: [["Drug", "Dosage", "Frequency", "Duration", "Start Date"]],
      body: [
        [
          medication.medication || "N/A",
          `${medication.dose} ${medication.unit}`,
          medication.interval || "N/A",
          `${medication.duration} ${medication.duration_unit}`,
          formatMedicationStartDate(medication.start_date),
        ],
      ],
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
      [medication],
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
    doc.text(`Ref: ${consRefDisplay}`, pageWidth - marginRight - 6, sigY + 29, {
      align: "right",
    });

    drawFooterWave(doc);
    doc.save(`${medication.medication}_prescription.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  if (isError || !medication) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full h-full bg-card rounded-[20px] border border-border p-8 md:p-10 text-center shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm mb-6">
            <MedicineBottleIcon size={28} color="currentColor" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
            Record Not Found
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            We couldn't retrieve the details for this prescription. It might
            have been removed or the link is invalid.
          </p>
          <Link
            to="/patient/dashboard/medications"
            className="group inline-flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-primary text-white font-semibold text-[11px] uppercase tracking-wider hover:opacity-90 transition-all active:scale-[0.98] shadow-sm shadow-primary/20"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Medications
          </Link>
        </div>
      </div>
    );
  }

  const doctorDisplayName = medication.doctor_id
    ? (() => {
        const raw =
          medication.doctor_id.full_name ||
          `${medication.doctor_id.first_name} ${medication.doctor_id.last_name}`;
        return raw.startsWith("Dr.") ? raw : `Dr. ${raw}`;
      })()
    : "N/A";

  const consultationRef = medication.consultation_id?._id
    ? `C-${medication.consultation_id._id.slice(-6).toUpperCase()}`
    : "N/A";

  return (
    <>
      <div className="mb-4 md:mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 md:mb-5 group"
        >
          <MoveLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          Prescription Details
        </h1>
        <p className="text-xs md:text-sm text-[#6C6C6C] mt-1">
          View your medication prescription details
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content: Document-style prescription view */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-[20px] border border-[#F0F0F0] shadow-sm overflow-hidden">
            {/* Document Header */}
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-[#F0F0F0]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-[10px] bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm sm:text-base font-semibold text-[#2B2B2B] tracking-tight truncate">
                      Prescription Sheet
                    </h2>
                    <p className="text-[10px] sm:text-[11px] text-[#8B8B8B] mt-0.5 truncate">
                      {formatUtcDate(medication.createdAt, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <span className="self-start sm:self-auto text-[10px] sm:text-xs font-semibold text-primary bg-primary/8 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-primary/20 shrink-0">
                  Ref: {consultationRef}
                </span>
              </div>
            </div>

            {/* Patient & Prescriber Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#F0F0F0] border-b border-[#F0F0F0]">
              <div className="grid grid-cols-2 divide-x divide-[#F0F0F0]">
                <div className="px-4 md:px-6 py-4 md:py-5 min-w-0">
                  <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] block mb-1 truncate">
                    Patient
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] truncate">
                    {profile?.first_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : "N/A"}
                  </p>
                </div>
                <div className="px-4 md:px-6 py-4 md:py-5 min-w-0">
                  <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] block mb-1 truncate">
                    Date of Birth
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] truncate">
                    {profile?.date_of_birth
                      ? formatUtcDate(profile.date_of_birth, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-[#F0F0F0]">
                <div className="px-4 md:px-6 py-4 md:py-5 min-w-0">
                  <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] block mb-1 truncate">
                    Prescriber
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-primary truncate">
                    {doctorDisplayName}
                  </p>
                </div>
                <div className="px-4 md:px-6 py-4 md:py-5 min-w-0">
                  <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] block mb-1 truncate">
                    Date Prescribed
                  </span>
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] truncate">
                    {formatUtcDate(medication.createdAt, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Medication Details Grid */}
            <div className="px-4 md:px-8 py-4 md:py-6 border-b border-[#F0F0F0]">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] mb-3 md:mb-4">
                Medication Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-[#F0F0F0] p-3 md:p-4 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                    <Pill className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] truncate">
                      Drug
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] break-words">
                    {medication.medication}
                  </p>
                  <span className="text-[10px] md:text-[11px] text-[#A0A0A0] mt-1 block capitalize truncate">
                    {medication.formulary?.toLowerCase()}
                  </span>
                </div>

                <div className="rounded-xl border border-[#F0F0F0] p-3 md:p-4 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] truncate">
                      Dosage
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] truncate">
                    {medication.dose} {medication.unit}
                  </p>
                </div>

                <div className="rounded-xl border border-[#F0F0F0] p-3 md:p-4 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] truncate">
                      Frequency
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] capitalize truncate">
                    {medication.interval?.toLowerCase()}
                  </p>
                </div>

                <div className="rounded-xl border border-[#F0F0F0] p-3 md:p-4 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2 md:mb-3">
                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#A0A0A0] truncate">
                      Duration
                    </span>
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] capitalize truncate">
                    {medication.duration}{" "}
                    {medication.duration_unit?.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Prescriber Footer */}
            <div className="px-4 md:px-8 py-4 md:py-5 bg-[#FAFBFC] border-t border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full shrink-0 bg-primary/10 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-[#2B2B2B] truncate">
                    {doctorDisplayName}
                  </p>
                  <p className="text-[10px] md:text-[11px] text-[#8B8B8B] truncate">
                    Requesting Physician • Carelexa
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto text-[10px] md:text-xs font-medium text-[#8B8B8B] bg-white px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg border border-[#F0F0F0] shrink-0">
                Ref: {consultationRef}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-[320px] flex flex-col gap-6">
          <div className="bg-card rounded-xl border border-border p-5 sticky top-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#727171]">Actions</h3>
            </div>
            <div className="space-y-3 flex flex-col">
              <Button
                size="default"
                className="gap-2 rounded-[12px] h-12 w-full"
                onClick={handleDownloadPDF}
              >
                <CloudDownload />
                Download Prescription
              </Button>
              <Button
                variant="outline"
                size="default"
                className="gap-2 rounded-[12px] h-12 w-full font-semibold"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(
                    `/patient/dashboard/consultations/${medication.consultation_id?._id}`,
                  );
                }}
              >
                View Consultation
                <MoveRight />
              </Button>
            </div>
          </div>
          <section className="flex items-start gap-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50">
            <Info className="w-5 h-5 text-[#5164E8] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-950/80 leading-relaxed">
              Take your medication exactly as scheduled. Consistency is key to
              the effectiveness of your treatment. If you experience any
              unexpected side effects, please contact your healthcare provider
              immediately.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
