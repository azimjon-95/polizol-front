export function numberFormat(number) {
  const cleanNumber = String(number).replace(/\D/g, "");
  const num = 3;
  const filter = [];
  let startIndex = cleanNumber.length;
  while (startIndex > 0) {
    const endIndex = startIndex;
    startIndex = Math.max(0, startIndex - num);
    filter.unshift(cleanNumber.slice(startIndex, endIndex));
  }
  return filter.join(".");
}
