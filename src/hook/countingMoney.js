export const CountingMoney = (date, price) => {
  if (!date) {
    return "Xatolik: Sana mavjud emas";
  }

  const parts = date.split(".");
  if (parts.length !== 3) {
    return "Xatolik: Sana noto'g'ri formatda";
  }

  const [day, month, year] = parts.map(Number); // Convert parts to numbers
  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return "Xatolik: Sana noto'g'ri formatda";
  }

  const sana = `${year}.${month}.${day}`; // Reformat date string

  const date1 = new Date(sana);
  const date2 = new Date();
  if (isNaN(date1.getTime()) || isNaN(date2.getTime())) {
    return "Xatolik: Sana noto'g'ri formatda";
  }

  const timeDifference = date2.getTime() - date1.getTime();
  const dayCountingMoney = Math.floor(Math.abs(timeDifference / (1000 * 3600 * 24)));

  return dayCountingMoney * price;
};






// export const CountingMoney = (date, price) => {
//   let parts = date?.split(".");
//   let sana = parts[2] + "." + parts[1] + "." + parts[0];

//   let date1 = new Date(sana);
//   let date2 = new Date();
//   if (date1.getTime() && date2.getTime()) {
//     let timeDifference = date2.getTime() - date1.getTime();
//     let dayCountingMoney = Math.floor(
//       Math.abs(timeDifference / (1000 * 3600 * 24))
//     );
//     // return dayCountingMoney * room.pricePerDay; // Narxni o'zgartiring kerak bo'lsa
//     return dayCountingMoney * price; // Narxni o'zgartiring kerak bo'lsa
//   } else {
//     return "Xatolik: Sana noto'g'ri formatda";
//   }
// };
