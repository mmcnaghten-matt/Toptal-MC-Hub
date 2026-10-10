// Fixed clock so the tests do not drift: "today" is 2026-10-10 in every pipeline test (recent-year windows, expired
// forecasts and similar rules depend on it). Import this file first.
const RealDate = Date;
const FIXED = RealDate.parse("2026-10-10T12:00:00Z");
class FakeDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) super(FIXED);
    else super(...args);
  }
  static now() {
    return FIXED;
  }
}
globalThis.Date = FakeDate;
