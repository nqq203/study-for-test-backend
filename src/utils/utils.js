function getStartAndEndOfWeek(date) {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Chỉnh về thứ Hai
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6); // Chỉnh về Chủ Nhật

  // Format ngày tháng năm để sử dụng trong SQL
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  return { start, end };
}

module.exports = {
  getStartAndEndOfWeek,
}