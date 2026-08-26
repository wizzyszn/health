import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RebookModalProps {
  onClose: () => void;
}

export function RebookModal({ onClose }: RebookModalProps) {
  const [formData, setFormData] = useState({
    specialistName: "Dr. Sarah Johnson (Auto-populated)",
    hospitalName: "",
    hospitalAddress: "",
    rebookDetails: "",
  });

  const handleHospitalChange = (hospital: string) => {
    let address = "";
    if (hospital === "Springfield General Hospital") {
      address = "123 Main Street, Springfield, IL 62701";
    } else if (hospital === "City Medical Center") {
      address = "456 Oak Avenue, Springfield, IL 62702";
    } else if (hospital === "University Hospital") {
      address = "789 College Road, Springfield, IL 62703";
    }
    setFormData({
      ...formData,
      hospitalName: hospital,
      hospitalAddress: address,
    });
  };

  const handleSave = () => {
    alert("Rebook appointment saved successfully");
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] md:max-w-[700px] p-0 gap-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 py-4 flex flex-row items-center justify-between border-b border-gray-200 space-y-0 shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Rebook Appointment
          </DialogTitle>
        </DialogHeader>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm sm:text-base text-gray-700 mb-1.5 sm:mb-2 font-medium">
              Specialist Name
            </label>
            <input
              type="text"
              value={formData.specialistName}
              readOnly
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm sm:text-base text-gray-700 mb-1.5 sm:mb-2 font-medium">
              Hospital Name
            </label>
            <select
              value={formData.hospitalName}
              onChange={(e) => handleHospitalChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:border-[#5164E8]"
            >
              <option value="">Select Hospital</option>
              <option value="Springfield General Hospital">
                Springfield General Hospital
              </option>
              <option value="City Medical Center">City Medical Center</option>
              <option value="University Hospital">University Hospital</option>
            </select>
          </div>

          {formData.hospitalAddress && (
            <div>
              <label className="block text-sm sm:text-base text-gray-700 mb-1.5 sm:mb-2 font-medium">
                Hospital Address
              </label>
              <input
                type="text"
                value={formData.hospitalAddress}
                readOnly
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-sm sm:text-base"
              />
            </div>
          )}

          <div>
            <label className="block text-sm sm:text-base text-gray-700 mb-1.5 sm:mb-2 font-medium">
              Appointment Details
            </label>
            <textarea
              value={formData.rebookDetails}
              onChange={(e) =>
                setFormData({ ...formData, rebookDetails: e.target.value })
              }
              placeholder="Enter appointment notes and requirements"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-sm sm:text-base focus:outline-none focus:border-[#5164E8] min-h-[120px] sm:min-h-[150px] resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-[#5164E8] text-white rounded-lg hover:bg-[#4153D7] transition-colors text-sm font-medium"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
