// すぐ・あそび アクセス受信。サイトから来た1件をログと日別に書く。
var SHEET_ID = "1iN0_C6ymMto0oZgBjefIQjm0sj29eeOMMNYshB3PIbk";

function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents || "{}");
  } catch (err) {
    data = {};
  }
  var page = String(data.page || "").slice(0, 200);
  var screen = String(data.screen || "").slice(0, 20);
  if (!page) page = "/";

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    ss.getSheetByName("ログ").appendRow([new Date(), page, screen]);
    bumpDay(ss.getSheetByName("日別"));
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput("ok");
}

// 今日の回数を1つ足す
function bumpDay(sheet) {
  var today = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
  var last = sheet.getLastRow();
  if (last >= 2) {
    var dates = sheet.getRange(2, 1, last - 1, 2).getValues();
    for (var i = 0; i < dates.length; i++) {
      var cell = dates[i][0];
      var key = cell instanceof Date
        ? Utilities.formatDate(cell, "Asia/Tokyo", "yyyy-MM-dd")
        : String(cell);
      if (key === today) {
        sheet.getRange(i + 2, 2).setValue(Number(dates[i][1] || 0) + 1);
        return;
      }
    }
  }
  sheet.appendRow([today, 1]);
}
