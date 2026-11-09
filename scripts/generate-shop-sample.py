"""Regenerate the free sample; requires ReportLab. Preview with pdftoppm."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4

out = Path(__file__).resolve().parents[1] / 'public' / 'shop-assets'
out.mkdir(parents=True, exist_ok=True)
pdf = canvas.Canvas(str(out / 'problem-to-product-planner.pdf'), pagesize=A4)
pdf.setTitle('Problem-to-Product Planner | Obsidian International')
pdf.setAuthor('Agrim Sigdel / Obsidian International')
W, H = A4
ink, muted, accent, line = [HexColor(c) for c in ['#24362d', '#59665d', '#b9553b', '#cfd4c8']]
def text(x, y, value, size=10, color=ink, font='Helvetica'):
    pdf.setFillColor(color); pdf.setFont(font, size); pdf.drawString(x,y,value)
def lines(y, count=3):
    pdf.setStrokeColor(line); pdf.setLineWidth(.5)
    for i in range(count): pdf.line(48,y-i*24,W-48,y-i*24)
def question(y, title, hint, count=3):
    text(48,y,title,12,font='Helvetica-Bold'); text(48,y-20,hint,9,muted); lines(y-49,count)
def start(num, title, subtitle):
    pdf.setFillColor(HexColor('#f7f5ef')); pdf.rect(0,0,W,H,fill=1,stroke=0)
    text(48,H-48,'OBSIDIAN INTERNATIONAL',9,accent,'Helvetica-Bold')
    text(48,H-94,title,30,font='Times-Roman')
    text(48,H-122,subtitle,10,muted)
    pdf.setStrokeColor(line); pdf.line(48,56,W-48,56)
    text(48,39,'Problem-to-Product Planner | Personal and own-business use. Not for resale.',7,muted)
    text(W-67,39,f'0{num}',9,accent)
start(1,'Find a problem worth solving.','Capture evidence before you choose what to build.')
question(669,'01 / Who are you helping?','Name a specific group, situation and task. Avoid "everyone".')
question(528,'02 / What keeps getting in their way?','Describe the obstacle in their words. When and how often does it happen?')
question(387,'03 / What evidence do you have?','Record sources, dates, examples and current workarounds. Separate facts from guesses.')
question(246,'04 / What will you check next?','Choose one conversation or observation that could challenge your idea.',3)
text(48,108,'A useful signal: people already spend time, effort or money trying to solve it.',9,accent)
pdf.showPage()
start(2,'Shape one small offer.','Choose a useful outcome that you can deliver honestly.')
question(669,'01 / The before and after','I help [person] go from [problem] to [specific outcome] with [resource].')
question(528,'02 / What is the smallest useful version?','Choose a guide, checklist, template or spreadsheet. List exactly what is inside.')
question(387,'03 / What makes it usable?','Note the format, software, instructions, examples and limits. What is not included?')
question(246,'04 / How will someone judge it before buying?','Plan a preview and a clear description. Write a test price and why it is reasonable.',3)
text(48,108,'Make the promise smaller if you cannot show how the resource delivers it.',9,accent)
pdf.showPage()
start(3,'Run a seven-day experiment.','Test the problem and offer. Keep the workload small enough to finish.')
text(48,678,'My hypothesis:',12,font='Helvetica-Bold'); lines(650,2)
text(48,593,'My success signal and decision date:',12,font='Helvetica-Bold'); lines(566,2)
text(48,508,'DAY',8,accent,'Helvetica-Bold'); text(94,508,'ACTION / WHAT I LEARNED',8,accent,'Helvetica-Bold')
for i in range(7):
    y=480-i*36
    text(48,y,f'0{i+1}',11,font='Times-Roman'); pdf.setStrokeColor(line); pdf.line(94,y-3,W-48,y-3)
text(48,205,'Review the evidence, not just the views.',15,font='Times-Roman')
text(48,184,'What happened? What remains uncertain? Continue, change the offer, or stop?',9,muted)
lines(158,2)
text(48,88,'This planner supports thinking and testing. It does not guarantee sales or income.',8,accent)
pdf.save()
print('Created three-page shop sample.')
