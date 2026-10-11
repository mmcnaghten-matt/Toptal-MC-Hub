/**
 * Toptal MC Hub mailer (Google Apps Script web app).
 *
 * Sends the "your Client Insights report is ready" emails for the client-insights-job edge function.
 * Deploy it from the shared Toptal MC Hub mailbox account so the mail comes From: Toptal MC Hub.
 *
 * Script properties (Project Settings > Script properties):
 *   MAIL_SECRET   a long random string; the same value is stored as the APPS_SCRIPT_SECRET secret in Supabase
 *   FROM_ALIAS    optional: a send-as alias of this account to use as the From address
 *
 * The script only ever sends to @toptal.com addresses, whatever it is asked to do.
 */
var ALLOWED_DOMAIN = "toptal.com";
var SENDER_NAME = "Toptal MC Hub";

function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty("MAIL_SECRET");
    var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (!expected || !body.secret || !sameSecret_(String(body.secret), expected)) return reply_({ ok: false, error: "not authorised" });

    var to = String(body.to || "").trim().toLowerCase();
    if (!/^[^@\s,;<>]+@toptal\.com$/.test(to)) return reply_({ ok: false, error: "recipient must be a @" + ALLOWED_DOMAIN + " address" });

    var subject = String(body.subject || "").replace(/[\r\n]+/g, " ").slice(0, 200);
    var html = String(body.html || "");
    if (!subject || !html) return reply_({ ok: false, error: "subject and html are required" });
    var text = html.replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/g, "$2 ($1)").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    var options = { name: SENDER_NAME, htmlBody: html };
    var alias = props.getProperty("FROM_ALIAS");
    if (alias) options.from = alias;
    GmailApp.sendEmail(to, subject, text, options);
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: String(err && err.message ? err.message : err).slice(0, 200) });
  }
}

function sameSecret_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
