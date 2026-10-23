# Writes the needs-placement workbook (no third-party libraries) from needs-placement.json.
#   Sheet "Needs placement": one row per saved need.
#     Service area / Agenda: drop-downs (the agenda list follows the service area). Check column flags an agenda not in the area.
#     Primary offering: drop-down limited to the chosen service area's offerings. Secondary offering: any of the offerings, optional.
#     Placement confidence and Offering confidence: drop-downs coloured High green / Medium dark yellow / Low red.
#     Offering alignment: formula, MISMATCH when the primary offering is not in the service area.
#   Sheet "Lists": the lists behind the drop-downs.
# usage: make-needs-xlsx.py needs-placement.json out.xlsx lists.json   (lists.json: {areas:[{name,catalogL2,agendas:[..],offerings:[..]}]})
import json, sys, zipfile
from xml.sax.saxutils import escape

rows = json.load(open(sys.argv[1]))
out = sys.argv[2]
areas = json.load(open(sys.argv[3]))["areas"]
OTHER = "Other"
N = len(rows)
last = N + 1

cols = [("Industry", 10), ("Sub-sector", 22), ("Position", 9), ("Need", 52), ("Service area", 32), ("Agenda", 46),
        ("Placement confidence", 13), ("Your review", 11), ("Agenda check", 26),
        ("Primary offering", 52), ("Secondary offering (optional)", 52), ("Offering confidence", 13),
        ("Offering alignment", 36), ("Offering note", 60), ("Offerings as saved", 70), ("Saved first offering", 40)]
# column letters
C = {name: chr(65 + i) for i, (name, _) in enumerate(cols)}
AREA, AGENDA, PCONF, REVIEW, ACHECK = C["Service area"], C["Agenda"], C["Placement confidence"], C["Your review"], C["Agenda check"]
PRIMARY, SECOND, OCONF, ALIGN, SAVEDFLAG = C["Primary offering"], C["Secondary offering (optional)"], C["Offering confidence"], C["Offering alignment"], C["Saved first offering"]
CONF_STYLE = {"High": 5, "Medium": 6, "Low": 7}

styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="4">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFC00000"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/></font>
</fonts>
<fills count="6">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F3A8A"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF2E9E4F"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFC9A100"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD64545"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="3" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="5" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment horizontal="center" vertical="top"/></xf>
</cellXfs>
<dxfs count="5">
<dxf><font><b/><color rgb="FFFFFFFF"/></font><fill><patternFill patternType="solid"><fgColor rgb="FF2E9E4F"/><bgColor rgb="FF2E9E4F"/></patternFill></fill></dxf>
<dxf><font><b/><color rgb="FF000000"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFC9A100"/><bgColor rgb="FFC9A100"/></patternFill></fill></dxf>
<dxf><font><b/><color rgb="FFFFFFFF"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFD64545"/><bgColor rgb="FFD64545"/></patternFill></fill></dxf>
<dxf><font><b/><color rgb="FFFFFFFF"/></font><fill><patternFill patternType="solid"><fgColor rgb="FFD64545"/><bgColor rgb="FFD64545"/></patternFill></fill></dxf>
<dxf><font><color rgb="FF2E7D32"/></font></dxf>
</dxfs>
</styleSheet>"""


def cell(ref, v, s=0):
    return f'<c r="{ref}" s="{s}" t="inlineStr"><is><t xml:space="preserve">{escape(str(v))}</t></is></c>'


def fcell(ref, formula, s=0):
    return f'<c r="{ref}" s="{s}" t="str"><f>{escape(formula)}</f></c>'


# ---- sheet 1 ----
body = ['<row r="1" ht="32" customHeight="1">' + "".join(cell(f"{C[name]}1", name, 1) for name, _ in cols) + "</row>"]
for n, r in enumerate(rows, start=2):
    vals = {
        "Industry": (r["industry"], 0), "Sub-sector": (r["subSector"], 0), "Position": (r["position"], 2), "Need": (r["need"], 0),
        "Service area": (r["areaName"], 0), "Agenda": (r["agendaLabel"], 0),
        "Placement confidence": (r["placementConfidence"], CONF_STYLE[r["placementConfidence"]]), "Your review": (r["review"], 2),
        "Primary offering": (r["primary"], 0), "Secondary offering (optional)": (r["secondary"], 0),
        "Offering confidence": (r["offeringConfidence"], CONF_STYLE[r["offeringConfidence"]]),
        "Offering note": (r["offeringNote"], 0), "Offerings as saved": ("; ".join(r["savedOfferings"]), 0), "Saved first offering": (r["savedFlag"], 3),
    }
    cellmap = {C[name]: cell(f"{C[name]}{n}", v, s) for name, (v, s) in vals.items()}
    agenda_check = f'IF(COUNTIF(OFFSET(Lists!$A$2,0,MATCH(${AREA}{n},Lists!$A$1:$F$1,0)-1,4,1),${AGENDA}{n})=0,"Agenda is not in this service area","")'
    align = (f'IF(${PRIMARY}{n}="","Choose a primary offering",IF(IFERROR(SEARCH(INDEX(Lists!$I$2:$I$7,MATCH(${AREA}{n},Lists!$H$2:$H$7,0))&" > ",${PRIMARY}{n})=1,FALSE),'
             f'"OK","MISMATCH: primary offering is not in "&${AREA}{n}))')
    cellmap[ACHECK] = fcell(f"{ACHECK}{n}", agenda_check, 3)
    cellmap[ALIGN] = fcell(f"{ALIGN}{n}", align, 0)
    body.append(f'<row r="{n}">' + "".join(cellmap[c] for c in sorted(cellmap)) + "</row>")


cf_conf = lambda sqref, base: (
    f'<conditionalFormatting sqref="{sqref}">'
    + "".join(f'<cfRule type="cellIs" dxfId="{i}" priority="{base + i}" operator="equal"><formula>"{name}"</formula></cfRule>' for i, name in enumerate(["High", "Medium", "Low"]))
    + "</conditionalFormatting>")
cf_align = (f'<conditionalFormatting sqref="{ALIGN}2:{ALIGN}{last}">'
            f'<cfRule type="containsText" dxfId="3" priority="7" operator="containsText" text="MISMATCH"><formula>NOT(ISERROR(SEARCH("MISMATCH",{ALIGN}2)))</formula></cfRule>'
            f'<cfRule type="cellIs" dxfId="4" priority="8" operator="equal"><formula>"OK"</formula></cfRule></conditionalFormatting>')
dv = (
    '<dataValidations count="5">'
    f'<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Service area" error="Pick a service area from the list." sqref="{AREA}2:{AREA}{last}"><formula1>Lists!$H$2:$H$7</formula1></dataValidation>'
    f'<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Agenda" error="Pick an agenda from the list for the chosen service area." sqref="{AGENDA}2:{AGENDA}{last}"><formula1>OFFSET(Lists!$A$2,0,MATCH(${AREA}2,Lists!$A$1:$F$1,0)-1,4,1)</formula1></dataValidation>'
    f'<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Primary offering" error="Pick a primary offering from the list for the chosen service area." sqref="{PRIMARY}2:{PRIMARY}{last}"><formula1>OFFSET(Lists!$L$2,0,MATCH(${AREA}2,Lists!$L$1:$Q$1,0)-1,COUNTA(OFFSET(Lists!$L$2,0,MATCH(${AREA}2,Lists!$L$1:$Q$1,0)-1,10,1)),1)</formula1></dataValidation>'
    f'<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Secondary offering" error="Pick a secondary offering from the list, or leave it empty." sqref="{SECOND}2:{SECOND}{last}"><formula1>Lists!$S$2:$S$53</formula1></dataValidation>'
    f'<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="{PCONF}2:{PCONF}{last} {OCONF}2:{OCONF}{last}"><formula1>Lists!$J$2:$J$4</formula1></dataValidation>'
    '</dataValidations>')
sheet1 = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
          '<sheetViews><sheetView workbookViewId="0" tabSelected="1"><pane xSplit="4" ySplit="1" topLeftCell="E2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>'
          '<cols>' + "".join(f'<col min="{i + 1}" max="{i + 1}" width="{w}" customWidth="1"/>' for i, (_, w) in enumerate(cols)) + "</cols>"
          "<sheetData>" + "".join(body) + "</sheetData>"
          f'<autoFilter ref="A1:{chr(65 + len(cols) - 1)}{last}"/>'
          + cf_conf(f"{PCONF}2:{PCONF}{last}", 1) + cf_conf(f"{OCONF}2:{OCONF}{last}", 4) + cf_align + dv + "</worksheet>")
# priorities must be unique: placement 1-3, offering 4-6, align 7-8 (cf_conf adds base + i)

# ---- sheet 2: lists ----
lists = {}
for i, a in enumerate(areas):
    lists[(1, i)] = a["name"]
    for j, g in enumerate(a["agendas"] + [OTHER]):
        lists[(2 + j, i)] = g
lists[(1, 7)] = "Service areas"
lists[(1, 8)] = "Catalog name"
for j, a in enumerate(areas):
    lists[(2 + j, 7)] = a["name"]
    lists[(2 + j, 8)] = a["catalogL2"]
lists[(1, 9)] = "Confidence"
for j, c in enumerate(["High", "Medium", "Low"]):
    lists[(2 + j, 9)] = c
for i, a in enumerate(areas):  # L..Q (columns 11..16): offerings per area
    lists[(1, 11 + i)] = a["name"]
    for j, o in enumerate(a["offerings"]):
        lists[(2 + j, 11 + i)] = o
lists[(1, 18)] = "All offerings"
k = 0
for a in areas:
    for o in a["offerings"]:
        lists[(2 + k, 18)] = o
        k += 1
by_row = {}
for (r, c), v in lists.items():
    by_row.setdefault(r, []).append((c, v))
colL = lambda c: chr(65 + c)
list_rows = "".join(
    f'<row r="{r}">' + "".join(cell(f"{colL(c)}{r}", v, 4 if r == 1 else 0) for c, v in sorted(items)) + "</row>"
    for r, items in sorted(by_row.items()))
sheet2 = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
          '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
          '<cols><col min="1" max="9" width="40" customWidth="1"/><col min="10" max="10" width="14" customWidth="1"/><col min="11" max="19" width="46" customWidth="1"/></cols>'
          f"<sheetData>{list_rows}</sheetData></worksheet>")

files = {
    "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    "_rels/.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Needs placement" sheetId="1" r:id="rId1"/><sheet name="Lists" sheetId="2" r:id="rId2"/></sheets><calcPr fullCalcOnLoad="1"/></workbook>',
    "xl/_rels/workbook.xml.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "xl/styles.xml": styles,
    "xl/worksheets/sheet1.xml": sheet1,
    "xl/worksheets/sheet2.xml": sheet2,
}
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for name, data in files.items():
        z.writestr(name, data)
print("wrote", out, N, "rows")
