export function computeHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  try {
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);

    if (
      isNaN(inHour) || isNaN(inMin) ||
      isNaN(outHour) || isNaN(outMin)
    ) {
      return 0;
    }

    let totalMins = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    
    // Shift crossed midnight boundary helper
    if (totalMins < 0) {
      totalMins += 24 * 60;
    }

    return parseFloat((totalMins / 60).toFixed(2));
  } catch (error) {
    return 0;
  }
}
