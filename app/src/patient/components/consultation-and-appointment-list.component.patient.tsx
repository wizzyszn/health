import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConsultationList } from "./consultation-list.component.patient";
import { AppointmentList } from "./appointment-list.component.patient";

export function ConsultationAndAppointmentList() {
  return (
    <div className="w-full rounded-xl bg-white shadow-sm border border-border">
      <Tabs defaultValue="consultations">
        <div className="flex items-center justify-between px-4">
          <TabsList className="h-auto gap-0 rounded-none bg-transparent p-0">
            <TabsTrigger
              value="consultations"
              className="rounded-none border-b-[3px] border-transparent px-4 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Consultations
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="rounded-none border-b-[3px] border-transparent px-4 py-3 text-sm font-medium shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Appointments
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="py-[12px] px-[16px]">
          <TabsContent value="consultations" className="mt-0">
            <ConsultationList inTabs={true} />
          </TabsContent>
          <TabsContent value="appointments" className="mt-0">
            <AppointmentList inTabs={true} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
