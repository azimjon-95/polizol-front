// Berilgan so'zni birinchi harfini katta qilib qaytaruvchi funksiya
export function capitalizeFirstLetter(string) {
  return string?.charAt(0).toUpperCase() + string?.slice(1);
}
