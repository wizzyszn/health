// import { Consultation, GeneralReturnInt, RejectedPayload } from "@/lib/types";

// import { useQuery } from "@tanstack/react-query";
// import { Link, useParams } from "react-router-dom";
// import {
//   CalendarDays,
//   Clock,
//   User,
//   MapPin,
//   Briefcase,
//   ClipboardList,
//   X,
//   MessageSquare,
//   Video,
//   Phone,
//   Home,
//   Eye,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { getAConsultation } from "@/config/service/patient.service";
// import MainPageHeader from "@/shared/components/main-page-header.component.shared";
// import QuillViewer from "@/shared/components/quill-viewer.component";

// function ViewAppointment() {
//   const { consultationId } = useParams();
//   const { data, isLoading, isError } = useQuery<
//     GeneralReturnInt<Consultation>,
//     RejectedPayload
//   >({
//     queryKey: ["consultationId", consultationId],
//     queryFn: async () => await getAConsultation(consultationId as string),
//     enabled: !!consultationId,
//   });

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//       </div>
//     );
//   }

//   if (isError || !data || !data.data) {
//     return (
//       <>
//         <MainPageHeader backBtn />
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6 mx-auto my-8 max-w-3xl text-center">
//           <X className="mx-auto text-red-500 mb-2" size={32} />
//           <h2 className="text-xl font-bold text-red-700">
//             Error Loading Consultation
//           </h2>
//           <p className="text-red-600">
//             Unable to load appointment details. Please try again later.
//           </p>
//         </div>
//       </>
//     );
//   }

//   const consultation = data.data;
//   const patientFullName = `${consultation.patient_first_name} ${consultation.patient_middle_name ? consultation.patient_middle_name + " " : ""}${consultation.patient_last_name}`;

//   // Helper function to format dates
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("en-US", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   };

//   // Helper function to get consultation type icon
//   const getConsultationTypeIcon = (
//     type: "CHAT" | "AUDIO" | "VIDEO" | "MEETADOCTOR" | "HOMESERVICE",
//   ) => {
//     switch (type) {
//       case "CHAT":
//         return <MessageSquare className="text-blue-500" />;
//       case "VIDEO":
//         return <Video className="text-purple-500" />;
//       case "AUDIO":
//         return <Phone className="text-green-500" />;
//       case "MEETADOCTOR":
//         return <User className="text-orange-500" />;
//       case "HOMESERVICE":
//         return <Home className="text-teal-500" />;
//       default:
//         return <MessageSquare className="text-blue-500" />;
//     }
//   };

//   // Helper function to get status badge
//   const getStatusBadge = (
//     status: "PENDING" | "COMPLETED" | "CANCELED" | "ACTIVE",
//   ) => {
//     switch (status) {
//       case "PENDING":
//         return (
//           <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
//             Pending
//           </span>
//         );
//       case "COMPLETED":
//         return (
//           <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
//             Completed
//           </span>
//         );
//       case "CANCELED":
//         return (
//           <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
//             Canceled
//           </span>
//         );
//       default:
//         return (
//           <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
//             {status}
//           </span>
//         );
//     }
//   };

//   return (
//     <div className="bg-transparent">
//       <div className="w-full h-full">
//         {/* Header */}
//         <div className="bg-white w-full">
//           <div className=" px-6 py-4 border-b">
//             <div className="flex items-center justify-between">
//               <h1 className="text-2xl font-semibold  text-black">
//                 {consultation.title}
//               </h1>
//               {getStatusBadge(consultation.status)}
//             </div>
//             <p className="text-blue-100 mt-1 text-muted-foreground">
//               {consultation.consultation_id || consultationId}
//             </p>
//           </div>

//           {/* Consultation Info */}
//           <div className="p-6">
//             <div className="flex items-start mb-6">
//               <div className="bg-blue-100 p-3 rounded-full mr-4">
//                 {getConsultationTypeIcon(consultation.type)}
//               </div>
//               <div>
//                 <h2 className="text-lg font-semibold text-gray-800">
//                   {consultation.type} Consultation (
//                   {consultation.consoltation_for === "SELF" ? "Self" : "Others"}
//                   )
//                 </h2>
//                 <p className="text-gray-600 mt-1">{consultation.details}</p>
//               </div>
//             </div>

//             {/* Scheduling Information */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//               <div className="flex items-center">
//                 <CalendarDays className="text-blue-500 mr-3" />
//                 <div>
//                   <p className="text-sm text-gray-500">Start Time</p>
//                   <p className="font-medium">
//                     {formatDate(consultation.session_start_date)}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-center">
//                 <Clock className="text-blue-500 mr-3" />
//                 <div>
//                   <p className="text-sm text-gray-500">End Time</p>
//                   <p className="font-medium">
//                     {formatDate(consultation.session_end_date)}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Divider */}
//             <div className="border-t border-gray-200 my-6"></div>

//             {/* Patient Information */}
//             <h3 className="text-lg font-semibold text-gray-800 mb-4">
//               Patient Information
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="flex items-start">
//                 <User className="text-blue-500 mr-3 mt-1" />
//                 <div>
//                   <p className="text-sm text-gray-500">Patient Name</p>
//                   <p className="font-medium">{patientFullName}</p>
//                   <div className="flex mt-2 space-x-4">
//                     <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
//                       {consultation.patient_gender}
//                     </span>
//                     <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
//                       {consultation.patient_age} years
//                     </span>
//                     <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
//                       {consultation.patient_marital_status}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//               <div className="flex items-start">
//                 <CalendarDays className="text-blue-500 mr-3 mt-1" />
//                 <div>
//                   <p className="text-sm text-gray-500">Date of Birth</p>
//                   <p className="font-medium">
//                     {new Date(consultation.patient_dob).toLocaleDateString()}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex items-start">
//                 <MapPin className="text-blue-500 mr-3 mt-1" />
//                 <div>
//                   <p className="text-sm text-gray-500">Address</p>
//                   <p className="font-medium">{consultation.patient_address}</p>
//                 </div>
//               </div>
//               <div className="flex items-start">
//                 <Briefcase className="text-blue-500 mr-3 mt-1" />
//                 <div>
//                   <p className="text-sm text-gray-500">Occupation</p>
//                   <p className="font-medium">
//                     {consultation.patient_occupation}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Treatment Plan (if available) */}
//             {consultation.treatment_plan && (
//               <>
//                 <div className="border-t border-gray-200 my-6"></div>
//                 <div className="flex items-start">
//                   <ClipboardList className="text-blue-500 mr-3 mt-1" />
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800 mb-2">
//                       Treatment Plan
//                     </h3>
//                     <QuillViewer content={consultation.treatment_plan} />
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//           <div className=" flex justify-end pb-4">
//             <Button>
//               <Link
//                 to={`/patient/dashboard/consultations/medication/${consultationId}`}
//                 className=" flex items-center gap-2 p-3"
//               >
//                 <Eye />
//                 <span>View Medications</span>
//               </Link>
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ViewAppointment;
