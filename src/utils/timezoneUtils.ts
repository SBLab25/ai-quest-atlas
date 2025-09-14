import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const IST_TIMEZONE = 'Asia/Kolkata';

export const getISTDate = (date?: Date): Date => {
  const currentDate = date || new Date();
  return toZonedTime(currentDate, IST_TIMEZONE);
};

export const getISTDateString = (date?: Date): string => {
  const istDate = getISTDate(date);
  return istDate.toISOString().split('T')[0];
};

export const isNewDayInIST = (lastVisitDate: string | null): boolean => {
  if (!lastVisitDate) return true;
  
  const today = getISTDateString();
  return lastVisitDate !== today;
};