// let myBirthday = "1995-06-26"; => result 29
export const ColculateBorthday = (value) => {
    const userYear = parseInt(value?.substring(0, 4));
    const currentYear = new Date().getFullYear();
    const userAge = currentYear - userYear;
    return userAge;
}
