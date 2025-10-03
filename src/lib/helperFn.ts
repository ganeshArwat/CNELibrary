export const formatIndianAmount = (amount: number | string): string => {
  if (!amount || isNaN(Number(amount))) return "0";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" | "DD Month YYYY";

export function formatDate(
  dateInput: string | Date,
  format: DateFormat = "DD/MM/YYYY"
): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    return ""; // invalid date
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  switch (format) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD Month YYYY":
      return `${day} ${monthNames[date.getMonth()]} ${year}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

export function formatTimeToAMPM(time: string): string {
  if (!time) return "";

  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr.padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 → 12

  return `${hours}:${minutes} ${ampm}`;
}

export const formatDateArray = (dateArr?: number[]): string => {
  if (!dateArr || dateArr.length < 3) return "";
  // Ensure format YYYY-MM-DD
  const [year, month, day] = dateArr;
  return [
    String(year),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
};
