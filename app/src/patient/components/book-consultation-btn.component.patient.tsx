import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import Booking from "./modals/booking.modal.component.patient";
import useUrlSearchParams from "@/shared/hooks/use-url-search-params";

function BookConsultationBtn() {
  const { getParam, deleteParams } = useUrlSearchParams();
  const stepParam = getParam("step");

  const [open, setOpen] = useState(stepParam !== null && stepParam !== "");

  useEffect(() => {
    setOpen(stepParam !== null && stepParam !== "");
  }, [stepParam]);

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      deleteParams(["step", "appointmentId", "mode"], { replace: true });
    }
    setOpen(isOpen);
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => handleOpen(true)}
        className="h-9 px-3.5 text-sm"
      >
        Book a consultation
      </Button>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="w-[95vw] max-w-[1080px] lg:min-w-[1080px] h-[95vh] md:h-[85vh] flex flex-col overflow-hidden p-3 md:p-6">
          <BookConsultationForm />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default BookConsultationBtn;

const BookConsultationForm = () => {
  return <Booking />;
};
