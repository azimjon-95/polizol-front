export const CountingDay = (value) => {

    if (!value) {
        return "Invalid date";
    }

    let dateParts = value?.split(".");
    if (dateParts.length !== 3) {
        return "Invalid date format";
    }

    let day = parseInt(dateParts[0], 10);
    let month = parseInt(dateParts[1], 10) - 1;
    let year = parseInt(dateParts[2], 10);
    let inputDate = new Date(year, month, day);
    let today = new Date();
    let differenceInTime = today.getTime() - inputDate.getTime();
    let differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    return differenceInDays
};




