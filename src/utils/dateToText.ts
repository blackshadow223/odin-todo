function dateToText(date: Date) {
    let text = "";

    text += date.getFullYear() + "-";
    text += (date.getMonth() < 10) ? `0${date.getMonth() + 1}-` : date.getMonth() + 1 + "-";
    text += date.getDate();

    return text;
}

export default dateToText;
