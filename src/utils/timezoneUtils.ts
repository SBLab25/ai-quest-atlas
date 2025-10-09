import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export const getISTDate = (date?: Date): Date => {
  const currentDate = date || new Date();
  return toZonedTime(currentDate, IST_TIMEZONE);
};

export const getISTDateString = (date?: Date): string => {
  const currentDate = date || new Date();
  const istDate = toZonedTime(currentDate, IST_TIMEZONE);
  // Get just the date part in IST timezone
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isNewDayInIST = (lastVisitDate: string | null): boolean => {
  if (!lastVisitDate) return true;
  
  const today = getISTDateString();
  return lastVisitDate !== today;
};