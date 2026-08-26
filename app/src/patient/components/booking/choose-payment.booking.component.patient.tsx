// import { motion } from "framer-motion";
// import { Smartphone, Landmark } from "lucide-react";
// import { useFormContext } from "react-hook-form";
// import { Button } from "@/components/ui/button";
// import MasterCardIcon from "@/shared/components/svgs/icons/master-card.icon";
// import type { BookingFormData } from "@/patient/lib/schemas";

// interface ChoosePaymentProps {
//   onNext: () => void;
//   onBack: () => void;
// }

// const PAYMENT_METHODS = [
//   {
//     id: "card",
//     label: "Card Payment",
//     icon: MasterCardIcon,
//     iconColor: "text-orange-500",
//   },
//   {
//     id: "apple",
//     label: "Apple Pay",
//     icon: Smartphone,
//     iconColor: "text-foreground",
//   },
//   {
//     id: "bank",
//     label: "Bank Transfer",
//     icon: Landmark,
//     iconColor: "text-muted-foreground",
//   },
// ];

// const MotionButton = motion.create(Button);

// const ChoosePayment = ({ onNext, onBack }: ChoosePaymentProps) => {
//   const { watch, setValue } = useFormContext<BookingFormData>();
//   const selected = watch("paymentMethod");

//   const handleSelect = (id: string) => {
//     setValue("paymentMethod", id, { shouldValidate: true });
//   };

//   return (
//     <>
//       <div className="space-y-3">
//         {PAYMENT_METHODS.map((method) => (
//           <motion.button
//             key={method.id}
//             onClick={() => handleSelect(method.id)}
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//             className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors relative ${
//               selected === method.id
//                 ? "border-primary bg-card/60"
//                 : "border-border bg-[#F7F7F7] hover:border-primary/30"
//             }`}
//           >
//             {selected === method.id && (
//               <motion.div
//                 layoutId="active-payment-bg"
//                 className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
//                 initial={false}
//                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
//               />
//             )}
//             <method.icon size={22} className={method.iconColor} />
//             <span className="text-sm font-medium text-foreground flex-1 text-left">
//               {method.label}
//             </span>
//             <div
//               className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
//                 selected === method.id ? "border-primary" : "border-border"
//               }`}
//             >
//               {selected === method.id && (
//                 <motion.div
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   transition={{ type: "spring", stiffness: 400, damping: 25 }}
//                   className="w-2.5 h-2.5 rounded-full bg-primary"
//                 />
//               )}
//             </div>
//           </motion.button>
//         ))}
//       </div>

//       <div className=" mt-60">
//         <p className="text-sm text-muted-foreground mb-4">
//           By clicking confirm booking, you've agreed to{" "}
//           <span className="text-foreground font-medium">
//             MediApp's Consultant's terms
//           </span>
//         </p>
//         <div className="flex gap-3">
//           <MotionButton
//             variant="ghost"
//             className="flex-1 h-12 bg-[#F7F7F7] hover:border-2"
//             onClick={onBack}
//             type="button"
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//           >
//             Go Back
//           </MotionButton>
//           <MotionButton
//             className="flex-1 h-12"
//             onClick={onNext}
//             type="button"
//             whileHover={{ scale: 1.02 }}
//             whileTap={{ scale: 0.98 }}
//           >
//             Book appointments
//           </MotionButton>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ChoosePayment;
