import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Color from 'color'
import { parse, format, isValid } from 'date-fns';



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



export const formatDate = (date: Date | string | null | undefined): string => {

  if (!date) {
    console.warn(`Invalid date input: ${date}`);
    return "Invalid Date";
  }

  let d: Date;

  if (typeof date === "string") {
    const normalizedDate = date.replace(/(am|pm)/i, (match) => match.toUpperCase());

    const formats = [
      "M/d/yyyy, h:mm:ss a", // 7/17/2025, 11:01:03 PM
      "dd/MM/yyyy, h:mm:ss a", // 17/07/2025, 10:58:02 PM
      "yyyy-MM-dd'T'HH:mm:ss.SSSX", // 2025-07-17T18:01:03.000Z
      "yyyy-MM-dd'T'HH:mm:ss.SSS", // 2025-07-17T18:01:03.000
      "yyyy-MM-dd'T'HH:mm:ss", // 2025-07-17T18:01:03
      "yyyy-MM-dd", // 2025-07-17
      "MM/dd/yyyy", // 07/17/2025
      "dd/MM/yyyy", // 17/07/2025
    ];

    for (const formatStr of formats) {
      const parsed = parse(normalizedDate, formatStr, new Date());
      if (isValid(parsed)) {
        d = parsed;
        return format(d, "MM/dd/yyyy");
      }
    }

    d = new Date(date);
    if (isValid(d)) {
      return format(d, "MM/dd/yyyy");
    }

    console.warn(`Invalid date input: ${date}`);
    return "Invalid Date";
  } else if (date instanceof Date) {
    d = date;
  } else {
    console.warn(`Invalid date input type: ${typeof date}`);
    return "Invalid Date";
  }

  if (!isValid(d)) {
    console.warn(`Invalid date input: ${date}`);
    return "Invalid Date";
  }

  return format(d, "MM/dd/yyyy");
};


export const formatTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;

  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const fetchColors = async () => {
  try {
    const response = await fetch('/api/colors')
    if (response.ok) {
      const data = await response.json()

      const primary = Color(data.primaryColor)
      const secondary = Color(data.secondaryColor)

      const generateShades = (color: typeof Color.prototype) => ({
        50: color.mix(Color('white'), 0.9).hex(),
        100: color.mix(Color('white'), 0.8).hex(),
        200: color.mix(Color('white'), 0.6).hex(),
        300: color.mix(Color('white'), 0.4).hex(),
        400: color.mix(Color('white'), 0.2).hex(),
        500: color.hex(),
        600: color.mix(Color('black'), 0.1).hex(),
        700: color.mix(Color('black'), 0.2).hex(),
        800: color.mix(Color('black'), 0.3).hex(),
        900: color.mix(Color('black'), 0.4).hex(),
      })

      const primaryShades = generateShades(primary)

      Object.entries(primaryShades).forEach(([shade, color]) => {
        document.documentElement.style.setProperty(`--primary-${shade}`, color)
      })

      document.documentElement.style.setProperty(`--barColor`, secondary.hex())

    } else {
      console.error('Failed to fetch colors')
    }
  } catch (error) {
    console.error('Error fetching colors:', error)
  }
}