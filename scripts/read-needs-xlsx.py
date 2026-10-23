# Reads the first sheet of an .xlsx (as saved by Excel or written by make-needs-xlsx.py) and prints it as JSON: a list of rows keyed by the header names.
# usage: read-needs-xlsx.py file.xlsx
import json, re, sys, zipfile
import xml.etree.ElementTree as ET

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{%s}t" % NS["m"]
z = zipfile.ZipFile(sys.argv[1])
shared = []
if "xl/sharedStrings.xml" in z.namelist():
    for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", NS):
        shared.append("".join(t.text or "" for t in si.iter(T)))
sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
rows = []
for r in sheet.find("m:sheetData", NS).findall("m:row", NS):
    row = {}
    for c in r.findall("m:c", NS):
        col = re.match(r"[A-Z]+", c.get("r")).group(0)
        t = c.get("t")
        v = c.find("m:v", NS)
        if t == "s" and v is not None:
            val = shared[int(v.text)]
        elif t == "inlineStr":
            val = "".join(x.text or "" for x in c.iter(T))
        elif v is not None:
            val = v.text or ""
        else:
            val = ""
        row[col] = val
    rows.append(row)
header = rows[0]
out = [{header[col]: val for col, val in row.items() if col in header} for row in rows[1:]]
print(json.dumps(out))
