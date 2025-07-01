import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price: number) => {
  if (!price) return "0.00";
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

export const formatDateTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // convert 0 to 12
  const formattedHours = String(hours).padStart(2, "0");

  return `${month}/${day}/${year}, ${formattedHours}:${minutes} ${ampm}`;
};

// export const formatDateTime = (date: Date | string) => {
//   const d = typeof date === "string" ? new Date(date) : date;

//   const formattedDate = d.toLocaleDateString("en-US"); // MM/DD/YYYY format

//   const formattedTime = d.toLocaleTimeString("en-US", {
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });

//   return `${formattedDate}, ${formattedTime}`;
// };

export const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}/${year}`;
};


export const formatTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};