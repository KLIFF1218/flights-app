export const getDuration = (duration: string): number => {
  let totalMinutes = 0;

  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);

  if (hoursMatch) {
    totalMinutes += Number(hoursMatch[1]) * 60;
  }

  if (minutesMatch) {
    totalMinutes += Number(minutesMatch[1]);
  }

  return totalMinutes;
};
