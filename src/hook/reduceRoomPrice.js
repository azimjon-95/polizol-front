import moment from "moment";

export function calculateRoomPayment(entry) {
  // Sana va vaqtni parse qilamiz
  const startDate = moment(entry.startDay, "DD.MM.YYYY HH:mm");
  let time = new Date();
  let today =
    time.getDate() +
    "." +
    (time.getMonth() + 1) +
    "." +
    time.getFullYear() +
    " " +
    time.getHours() +
    ":" +
    time.getMinutes();
  const endDate = moment(today, "DD.MM.YYYY HH:mm");

  // Abet soati - 12:00
  const NOON_HOUR = 12;

  // Kunlar orasidagi farqni hisoblash
  const dayDiff = endDate.diff(startDate, "days");

  let totalPay = 0;

  // Kirish kunidagi to'lov
  if (startDate.hours() < NOON_HOUR) {
    // Abetdan oldin kirgan bo'lsa, 100% to'lov
    totalPay += entry.payForRoom;
  } else {
    // Abetdan keyin kirgan bo'lsa, 50% to'lov
    totalPay += entry.payForRoom * 0.5;
  }

  // O'rtadagi kunlar uchun 100% to'lov
  if (dayDiff > 1) {
    totalPay += entry.payForRoom * (dayDiff - 1); // Oradagi kunlar uchun to'liq 100% to'lov
  }

  if (!dayDiff < 1) {
    // Chiqish kunidagi to'lov
    if (endDate.hours() < NOON_HOUR || !dayDiff) {
      // Abetdan oldin chiqqan bo'lsa, 50% to'lov
      totalPay += entry.payForRoom * 0.5;
    } else {
      // Abetdan keyin chiqqan bo'lsa, 100% to'lov
      totalPay += entry.payForRoom;
    }
  }

  //   // Natija
  //   entry.dayOfTreatment = dayDiff;
  //   entry.clientPayForRoomPrice = totalPay;

  return totalPay;
}
