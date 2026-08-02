import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
    queryKey: ["patient-profile"],
    queryFn: () => getPatientProfileReq(),
  });
  const profile = profileData?.data;

  const medication = data?.data;

  const handleDownloadPDF = () => {
    if (!medication) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 20;
    const marginRight = 20;

    // ── Helper: draw MEDIAPP cross icon ──
    const drawCrossIcon = (cx: number, cy: number, size: number) => {
      const half = size / 2;
      const thickness = size / 3.5;
      doc.setFillColor(0, 153, 204);
      doc.rect(cx - thickness / 2, cy - half, thickness, size, "F");
      doc.rect(cx - half, cy - thickness / 2, size, thickness, "F");
      doc.setFillColor(30, 120, 180);
      doc.rect(cx - half, cy - half, half, thickness / 2, "F");
    };

    // ── 1. HEADER: Centered MEDIAPP branding ──
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

    // ── 2. TITLE ──
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

    // ── 3. PATIENT INFO ──
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
      docName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
    }

    const leftX = marginLeft + 6;
    const rightX = pageWidth / 2 + 10;
    const lineHeight = 7;
    const infoTextY = infoBoxY + 10;

    doc.setFontSize(10);
    doc.setTextColor(20, 40, 60);

    // Left column
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

    // Right column
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

    // ── 4. MEDICATION TABLE ──
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
      [medication],
    );
    const sigY = drawGeneralMedicationInstructionsSection(
      doc,
      marginLeft,
      contentWidth,
      afterOrderInstructionsY,
    );

    // ── 6. PRESCRIBER BLOCK ──
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
    doc.text(`Ref: ${consRefDisplay}`, pageWidth - marginRight - 6, sigY + 29, {
      align: "right",
    });

    // ── 7. FOOTER ──
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
                    Requesting Physician • MEDIAPP
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
