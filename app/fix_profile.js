const fs = require("fs");
const path =
  "/home/ubuntu/Desktop/health-app-frontend/app/src/patient/pages/profile.page.patient.tsx";
let code = fs.readFileSync(path, "utf-8");

// Container overrides
code = code.replace(
  '<div className="flex items-center justify-between border-b p-[18px]">',
  '<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b p-4 sm:p-6 gap-4">',
);
code = code.replace(
  '<div className="px-6 py-4 space-y-8">',
  '<div className="px-4 sm:px-6 py-4 space-y-8">',
);
code = code.replace(
  '<div className="flex gap-[24px] items-center">',
  '<div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">',
);
code = code.replace(
  '<div className="flex flex-col sm:flex-row gap-4">',
  '<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">',
);
code = code.replace(
  /className="w-full sm:w-\[292\.5px\] min-w-\[250px\]/g,
  'className="w-full sm:w-auto sm:min-w-[250px]',
);

// Headers
code = code.replace(
  /<div className="px-6 py-5 border-b text-\[16px\] font-semibold">/g,
  '<div className="px-4 sm:px-6 py-5 border-b text-[16px] font-semibold">',
);
code = code.replace(
  '<div className="p-[18px] border-b text-[16px] font-semibold">',
  '<div className="p-4 sm:p-6 border-b text-[16px] font-semibold">',
);

// Biodata Grid
code = code.replace(
  '<div className="px-6 py-4 flex flex-wrap justify-between gap-[16px]">',
  '<div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">',
);

// Personal Info Grid
code = code.replace(
  '<div className="px-6 flex flex-wrap justify-between gap-[16px]">',
  '<div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">',
);

// Medical Info Grid
code = code.replace(
  '<div className="px-6 py-4 flex flex-wrap justify-between gap-[16px]">',
  '<div className="px-4 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">',
);

// Change Password Grid
code = code.replace(
  '<div className="p-[18px] flex flex-wrap justify-between gap-[16px]">',
  '<div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">',
);

// Replace form items min items
code = code.replace(
  /className="flex-1 min-w-\[300px\]"/g,
  'className="w-full"',
);

// Action Buttons
code = code.replace(
  '<div className="w-full p-[18px] flex gap-4">',
  '<div className="w-full p-4 sm:p-6 flex flex-col-reverse sm:flex-row gap-4 sm:justify-end">',
);
code = code.replace(
  /className="min-w-\[140px\] w-\[48%\]"/g,
  'className="w-full sm:w-auto min-w-[140px]"',
);

// Change Password Actions
code = code.replace(
  '<div className="w-full px-[18px] flex">',
  '<div className="w-full px-4 sm:px-6 pb-6 flex">',
);
code = code.replace(
  'className="w-full sm:w-[200px]"',
  'className="w-full sm:w-auto sm:min-w-[200px]"',
);

fs.writeFileSync(path, code);
