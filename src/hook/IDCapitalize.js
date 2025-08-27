export function IdCapitalize(son) {
    return String(son)
        .split('')
        .map(harf => harf.toUpperCase())
        .join('');
}

