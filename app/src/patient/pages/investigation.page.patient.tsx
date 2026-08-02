import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import useUrlSearchParams from "@/shared/hooks/use-url-search-params";
import {
  getPatientInvestigationListReq,
  getPatientProfileReq,
} from "@/config/service/patient.service";
import { Pagination } from "@/shared/components/pagination.component.shared";
import { toast } from "sonner";
import { InvestigationEmptyState } from "@/patient/components/investigation/investigation-empty-state.component.patient";
import { InvestigationGroupCard } from "@/patient/components/investigation/investigation-group-card.component.patient";
import { InvestigationPageHeader } from "@/patient/components/investigation/investigation-page-header.component.patient";
import { InvestigationSearchBar } from "@/patient/components/investigation/investigation-search-bar.component.patient";
import { generateInvestigationRequestPdf } from "@/patient/components/investigation/generate-investigation-request-pdf.patient";
import {
  InvestigationGroup,
  InvestigationPatientProfile,
} from "@/patient/components/investigation/investigation.types.patient";
import { PatientRecordGroupSkeleton } from "@/shared/components/patient-record-skeletons.component.shared";

function Investigation() {
  const [searchTerm, setSearchTerm] = useState("");
  const { updateParam, getParam } = useUrlSearchParams();
  const pageParam = getParam("page") || "1";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patient-investigations", pageParam],
    queryFn: () =>
      getPatientInvestigationListReq({ page: pageParam, perPage: "10" }),
  });

  const { data: profileData } = useQuery({
    queryKey: ["patient-profile"],
    queryFn: () => getPatientProfileReq(),
  });
  const profile = profileData?.data as InvestigationPatientProfile | undefined;

  const downloadPdf = (group: InvestigationGroup) => {
    try {
      generateInvestigationRequestPdf(group, profile);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const paginationData = data?.data?.pagination;
  const totalPages = paginationData?.total_pages ?? 1;

  const groups = useMemo(
    () => (data?.data?.groups || []) as InvestigationGroup[],
    [data],
  );

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return groups;
    }

    return groups.filter((group) => {
      const consultationTitle = (
        group.consultation?.title ||
        group.consultation?.appointment_id?.reason_for_visit ||
        "Consultation"
      ).toLowerCase();
      const reference = (group.consultation?._id || "").toLowerCase();
      return (
        consultationTitle.includes(normalizedSearch) ||
        reference.includes(normalizedSearch)
      );
    });
  }, [groups, searchTerm]);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroupId((prev) => (prev === groupId ? null : groupId));
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <InvestigationPageHeader />

      <section className="overflow-hidden rounded-[20px] border border-[#F0F0F0] bg-white shadow-sm">
        <div className="border-b border-[#F0F0F0] px-4 py-4 sm:px-6">
          <h2 className="text-sm font-semibold text-[#6C6C6C]">History</h2>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:p-6">
          <InvestigationSearchBar value={searchTerm} onChange={setSearchTerm} />

          <div className="flex flex-col gap-2">
            {isLoading ? (
              <PatientRecordGroupSkeleton count={4} />
            ) : isError ? (
              <div className="text-center py-12 text-red-500">
                Failed to load investigation history. Please try again later.
              </div>
            ) : filteredGroups.length > 0 ? (
              filteredGroups.map((group, index) => {
                const consultationId =
                  group.consultation?._id ||
                  group.investigations?.[0]?.consultation_id ||
                  `unknown-${index}`;
                const isExpanded = expandedGroupId === consultationId;

                return (
                  <InvestigationGroupCard
                    key={consultationId}
                    group={group}
                    index={index}
                    isExpanded={isExpanded}
                    onToggle={toggleGroup}
                    onDownload={downloadPdf}
                  />
                );
              })
            ) : (
              <InvestigationEmptyState
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

export default Investigation;
