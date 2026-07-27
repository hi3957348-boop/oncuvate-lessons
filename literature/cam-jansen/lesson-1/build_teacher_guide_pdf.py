from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output" / "pdf" / "cam-jansen-lesson-1-teacher-guide.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("Oncu", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("OncuBold", r"C:\Windows\Fonts\malgunbd.ttf"))

V950 = colors.HexColor("#24144F")
V900 = colors.HexColor("#35206F")
V800 = colors.HexColor("#4B24A5")
V700 = colors.HexColor("#5932B6")
V500 = colors.HexColor("#8D70D7")
V200 = colors.HexColor("#D9CFF5")
V100 = colors.HexColor("#EEE9FB")
V050 = colors.HexColor("#F8F6FD")
CYAN = colors.HexColor("#4BC9DC")
INK = colors.HexColor("#29243A")
MUTED = colors.HexColor("#6F697E")
LINE = colors.HexColor("#E8E3F3")
PAPER = colors.HexColor("#FFFEFB")
WARN_BG = colors.HexColor("#FFF9ED")
WARN = colors.HexColor("#8A6518")

PAGE_W, PAGE_H = A4
MARGIN = 14 * mm
CONTENT_W = PAGE_W - 2 * MARGIN


class EnsureTopHeader(Flowable):
    """Reserve top space and redraw the standard header for a forced section page."""

    def __init__(self):
        super().__init__()
        self.width = CONTENT_W
        self.height = 8 * mm

    def draw(self):
        band_y = self.height + 6 * mm
        self.canv.setFillColor(V950)
        self.canv.rect(-MARGIN - 5 * mm, band_y + 2 * mm, PAGE_W + 10 * mm, 8 * mm, fill=1, stroke=0)
        self.canv.setFont("OncuBold", 7)
        self.canv.setFillColor(colors.white)
        self.canv.drawString(0, band_y + 3.6 * mm, "ONCUVATE LITERATURE - CAM JANSEN LESSON 1 - INSTRUCTOR GUIDE")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverEyebrow", fontName="OncuBold", fontSize=8.5, leading=12, textColor=CYAN, spaceAfter=8, letterSpacing=1.1))
styles.add(ParagraphStyle(name="CoverTitle", fontName="OncuBold", fontSize=27, leading=34, textColor=colors.white, spaceAfter=10))
styles.add(ParagraphStyle(name="CoverBody", fontName="Oncu", fontSize=10, leading=17, textColor=colors.HexColor("#E7E2F2"), spaceAfter=10))
styles.add(ParagraphStyle(name="CoverNote", fontName="Oncu", fontSize=8, leading=13, textColor=colors.HexColor("#C6BDE1")))
styles.add(ParagraphStyle(name="PageTitle", fontName="OncuBold", fontSize=20, leading=26, textColor=INK, spaceAfter=3))
styles.add(ParagraphStyle(name="Tag", fontName="OncuBold", fontSize=7.5, leading=10, textColor=V700, spaceAfter=2, letterSpacing=0.8))
styles.add(ParagraphStyle(name="H2", fontName="OncuBold", fontSize=13, leading=18, textColor=V800, spaceBefore=5, spaceAfter=6))
styles.add(ParagraphStyle(name="H3", fontName="OncuBold", fontSize=10, leading=14, textColor=V800, spaceAfter=3))
styles.add(ParagraphStyle(name="Body", fontName="Oncu", fontSize=8.2, leading=13.2, textColor=INK, spaceAfter=4))
styles.add(ParagraphStyle(name="Small", fontName="Oncu", fontSize=7.2, leading=11.2, textColor=MUTED))
styles.add(ParagraphStyle(name="SmallBold", fontName="OncuBold", fontSize=7.4, leading=11.2, textColor=INK))
styles.add(ParagraphStyle(name="WhiteSmall", fontName="Oncu", fontSize=7.2, leading=11, textColor=colors.white))
styles.add(ParagraphStyle(name="WhiteBold", fontName="OncuBold", fontSize=8.2, leading=12, textColor=colors.white))
styles.add(ParagraphStyle(name="CenterSmall", fontName="Oncu", fontSize=7.2, leading=10, alignment=TA_CENTER, textColor=MUTED))
styles.add(ParagraphStyle(name="TableHead", fontName="OncuBold", fontSize=7.2, leading=10.5, textColor=V800))
styles.add(ParagraphStyle(name="TableCell", fontName="Oncu", fontSize=7, leading=10.5, textColor=INK))
styles.add(ParagraphStyle(name="TableCellMuted", fontName="Oncu", fontSize=7, leading=10.5, textColor=MUTED))


def P(text, style="Body"):
    return Paragraph(text, styles[style])


def section_header(tag, title, badge=None):
    left = [P(tag, "Tag"), P(title, "PageTitle")]
    cells = [left]
    widths = [CONTENT_W]
    if badge:
        cells.append(P(badge, "WhiteBold"))
        widths = [CONTENT_W - 32 * mm, 32 * mm]
    table = Table([cells], colWidths=widths, hAlign="LEFT")
    commands = [("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]
    if badge:
        commands += [("BACKGROUND", (1, 0), (1, 0), V800), ("ALIGN", (1, 0), (1, 0), "CENTER"), ("VALIGN", (1, 0), (1, 0), "MIDDLE"), ("BOX", (1, 0), (1, 0), 0.5, V800), ("LEFTPADDING", (1, 0), (1, 0), 5), ("RIGHTPADDING", (1, 0), (1, 0), 5), ("TOPPADDING", (1, 0), (1, 0), 5), ("BOTTOMPADDING", (1, 0), (1, 0), 5)]
    table.setStyle(TableStyle(commands))
    return [table, Spacer(1, 3 * mm)]


def card(title, body, accent=V500):
    table = Table([[P(title, "H3")], [P(body, "Small")]], colWidths=[CONTENT_W])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("LINEABOVE", (0, 0), (-1, 0), 3, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def callout(text, warning=False):
    bg = WARN_BG if warning else colors.HexColor("#EEFAFA")
    fg = WARN if warning else colors.HexColor("#35606A")
    edge = colors.HexColor("#D4A84D") if warning else CYAN
    para = Paragraph(text, ParagraphStyle("callout-temp", parent=styles["Small"], textColor=fg, leading=11.5))
    table = Table([[para]], colWidths=[CONTENT_W])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LINEBEFORE", (0, 0), (0, -1), 3, edge),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def grid_cards(items, cols=3):
    width = (CONTENT_W - (cols - 1) * 3 * mm) / cols
    rows = []
    for start in range(0, len(items), cols):
        row = []
        for title, body in items[start:start + cols]:
            inner = Table([[P(title, "H3")], [P(body, "Small")]], colWidths=[width - 8 * mm])
            inner.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
            row.append(inner)
        while len(row) < cols:
            row.append("")
        rows.append(row)
    table = Table(rows, colWidths=[width] * cols, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), V050),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def data_table(headers, rows, widths):
    data = [[P(h, "TableHead") for h in headers]]
    for row in rows:
        data.append([P(str(value), "TableCell" if i == 0 else "TableCellMuted") for i, value in enumerate(row)])
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), V050),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def checklist(items):
    data = []
    for text in items:
        data.append([P("□", "SmallBold"), P(text, "Small")])
    table = Table(data, colWidths=[7 * mm, CONTENT_W - 7 * mm])
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def step_box(number, title, body, time):
    left = Table([[P(number, "WhiteBold")]], colWidths=[10 * mm], rowHeights=[10 * mm])
    left.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), CYAN), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    text = [P(title, "H3"), P(body, "Small")]
    badge = Table([[P(time, "WhiteBold")]], colWidths=[18 * mm])
    badge.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), V800), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    table = Table([[left, text, badge]], colWidths=[13 * mm, CONTENT_W - 34 * mm, 21 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def first_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(V950)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(V900)
    canvas.circle(PAGE_W - 10 * mm, PAGE_H - 10 * mm, 58 * mm, fill=1, stroke=0)
    canvas.setStrokeColor(CYAN)
    canvas.setLineWidth(1.2)
    canvas.circle(PAGE_W - 8 * mm, 22 * mm, 43 * mm, fill=0, stroke=1)
    canvas.restoreState()


def later_pages(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(V950)
    canvas.rect(0, PAGE_H - 10 * mm, PAGE_W, 10 * mm, fill=1, stroke=0)
    canvas.setFont("OncuBold", 7)
    canvas.setFillColor(colors.white)
    canvas.drawString(MARGIN, PAGE_H - 6.4 * mm, "ONCUVATE LITERATURE - CAM JANSEN LESSON 1 - INSTRUCTOR GUIDE")
    canvas.setFillColor(MUTED)
    canvas.setFont("Oncu", 7)
    canvas.drawRightString(PAGE_W - MARGIN, 7 * mm, f"{doc.page - 1}")
    canvas.setStrokeColor(LINE)
    canvas.line(MARGIN, 10 * mm, PAGE_W - MARGIN, 10 * mm)
    canvas.restoreState()


story = []

logo = Image(str(ROOT / "assets" / "oncuvate-brand-logo.png"), width=52 * mm, height=14 * mm, kind="proportional")
story += [Spacer(1, 14 * mm), logo, Spacer(1, 15 * mm), P("ONCUVATE LITERATURE - INSTRUCTOR-ONLY", "CoverEyebrow"), P("The Wrong-Way Runner<br/>1회차 교수용 진행안", "CoverTitle"), P("<i>Cam Jansen and the Mystery of the Stolen Diamonds</i>의 Chapters 1-3을 실제 원서로 읽으며, 관찰한 사실과 처음의 추측을 분리하는 수업입니다. 원문, 원작 삽화, 대사 대본은 포함하지 않습니다.", "CoverBody")]
meta = Table([[P("표준 70분", "WhiteBold"), P("예습 없음", "WhiteBold"), P("숙제 없음", "WhiteBold"), P("1:1 또는 소그룹", "WhiteBold")]], colWidths=[37 * mm] * 4)
meta.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#412E78")), ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#7664A6")), ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#7664A6")), ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
story += [meta, Spacer(1, 13 * mm), P("수업 안에서 완결", "CoverEyebrow"), P("Chapters 1-3 전체 읽기부터 기록과 역할극까지 수업 안에서 마칩니다.", "CoverBody"), Spacer(1, 8 * mm), P("오늘의 성공 문장", "CoverEyebrow"), P("I first thought ..., but now I think ... because the witnesses ....", "CoverBody"), Spacer(1, 10 * mm), P("교수자 수업 진행용 - 학생 배포 및 공개 게시용이 아닙니다.", "CoverNote"), PageBreak()]

story += section_header("LESSON OVERVIEW", "수업 한눈에 보기", "Chapters 1-3")
story += [grid_cards([
    ("핵심 독해", "보이는 행동과 범인이라는 판단을 구분하고, 쪽수 근거로 설명합니다."),
    ("읽기 방식", "혼자 의미 읽기 -> 문단 교대 읽기 -> 담당 단서 추적 순으로 바꿉니다."),
    ("회차 절단점", "달린 사람과 범인이 같지 않을 수 있다는 충돌에서 멈추고 다음 질문을 남깁니다."),
]), Spacer(1, 4 * mm), P("수업 전 준비", "H2"), checklist([
    "학생마다 합법적으로 구입하거나 대여한 원서를 준비합니다.",
    "학생 화면과 이 교수안을 서로 다른 탭에 엽니다.",
    "학생 화면에서 강사 모드를 켜고 교수용 진행안 링크가 보이는지 확인합니다.",
    "학생에게 이름 대신 수업용 학생 코드를 배정합니다.",
    "Listen은 선택형이며 자동 재생하지 않습니다. 영어 초점 문장을 줄별로 번역해 주지 않습니다.",
    "판본마다 쪽수가 다를 수 있으므로 정답 쪽수를 미리 고정하지 않습니다.",
    "1:1은 문단 단위 교대 읽기, 소그룹은 인물별 담당 단서 추적으로 운영합니다.",
    "미완성 읽기나 답을 가정 과제로 보내지 않고 수업 안에서 함께 마칩니다.",
]), Spacer(1, 4 * mm), callout("<b>자동 활동 기록</b> - 모든 입력은 먼저 브라우저에 저장됩니다. Web3Forms가 설정되면 핵심 활동 종료, 화면 이탈, 쓰기 도움 사용, 수업 완료 시 최신 기록을 자동 전송하며 별도 제출 버튼은 없습니다."), Spacer(1, 2 * mm), callout("<b>개인정보와 AI</b> - 이름과 이메일 대신 수업용 코드만 사용합니다. Web3Forms는 기록 전송만 담당하며 AI Tutor는 보호된 별도 엔드포인트가 필요합니다. 연결 전에는 로컬 문장 코치로 표시됩니다."), Spacer(1, 5 * mm), P("70분 표준 진행표", "H2")]
timeline_rows = [
    ("0-5분", "화면 1", "수업 안에서 세 Chapter를 모두 읽고 근거로 생각을 고치는 시간이라고 안내합니다."),
    ("5-10분", "화면 2", "Word Lab에서 각 Chapter의 핵심 단어 두 개씩을 골라 확인합니다."),
    ("10-16분", "화면 3-4", "관찰과 Fact/Guess 연습을 각 3분으로 압축해 읽기 전략을 준비합니다."),
    ("16-29분", "화면 5-6", "Chapter 1 전체를 문단 교대로 읽고 경보 전 행동과 단서를 기록합니다."),
    ("29-45분", "화면 7-8", "Chapter 2 전체를 읽으며 담당 인물의 방향과 물건을 추적하고 공유합니다."),
    ("45-61분", "화면 9-10", "Chapter 3 전체 읽기 후 핵심 장면을 다시 읽고 인터뷰로 추측을 수정합니다."),
    ("61-66분", "화면 11", "rang / ran / said를 확인하고 생각이 바뀐 이유를 과거형으로 말합니다."),
    ("66-70분", "화면 12", "Fact, Changed Guess, Next Question을 완성하고 수업 안에서 사건 파일을 마칩니다."),
]
story += [data_table(["시간", "화면", "진행"], timeline_rows, [22 * mm, 28 * mm, CONTENT_W - 50 * mm]), Spacer(1, 4 * mm), grid_cards([
    ("50분 빠른 복습안", "이미 Chapters 1-3을 읽은 학생에게만 사용합니다. 새 읽기를 숙제로 넘기는 압축안으로 사용하지 않습니다."),
    ("75-80분 지원안", "읽기가 느리면 교사 모델링과 한국어 요약 -> 영어 핵심어 -> 영어 문장 발판을 수업 안에서 추가합니다."),
], cols=2), PageBreak()]

story += section_header("CHECKPOINT A", "Chapters 1-2 지도안", "29분")
story += [step_box("01", "Chapter 1 위치 훑기", "전체 읽기가 아닙니다. 1분 동안 인물, 장소, 경보 위치만 찾고 다시 처음으로 돌아옵니다.", "1분"), Spacer(1, 3 * mm), step_box("02", "Chapter 1 전체 읽기와 기록", "9분 동안 처음부터 끝까지 문단 단위로 교대해 읽고, 3분 동안 경보 전 활동과 보이는 단서 두 개를 Q1-Q2에 기록합니다.", "12분"), Spacer(1, 3 * mm), step_box("03", "Chapter 2 전체 읽기와 단서 추적", "1분 동안 담당 인물을 정하고 11분 동안 Chapter 전체를 읽습니다. 4분 동안 Q3-Q4를 기록하고 서로의 단서를 공유합니다.", "16분"), Spacer(1, 4 * mm)]
answer_a = [
    ("Q1", "쇼핑몰 벤치에서 아기를 돌보며 기억력 활동을 하고 있었습니다.", "Which activity shows Cam's special skill?"),
    ("Q2", "달린 사람의 체격, 수염, 어두운 옷, 급히 달린 행동, 쇼핑몰 중앙 쪽 이동 등에서 두 가지.", "Did Cam see it, or did she infer it?"),
    ("Q3", "처음 달린 사람, 아기를 동반한 젊은 두 사람, 나이 든 두 사람을 구분합니다.", "Did everyone leave in the same direction?"),
    ("Q4", "예: 젊은 두 사람은 가까운 출구 쪽으로 이동했고 각자 아기처럼 보이는 것과 큰 아기용 물건을 들었습니다. 다른 인물을 골라도 됩니다.", "Which detail is strongest?"),
]
story += [data_table(["문항", "예상 답의 핵심 의미", "추가 질문"], answer_a, [15 * mm, 98 * mm, CONTENT_W - 113 * mm]), Spacer(1, 4 * mm), callout("<b>오개념 대응</b> - 학생이 달린 사람을 바로 강도라고 쓰면 지우게 하지 말고 옆에 G를 붙입니다. 이어서 책에서 직접 본 행동을 Fact 문장으로 하나 더 쓰게 합니다.", warning=True), PageBreak()]

story += [EnsureTopHeader(), P("CHECKPOINT B", "Tag"), P("Chapter 3 지도안", "PageTitle"), P("Chapter 전체 읽기와 5분 즉흥 역할극 - 16분", "H2"), Spacer(1, 2 * mm), step_box("01", "Chapter 3 전체 의미 읽기", "7분 동안 처음부터 끝까지 읽으며 누가 직접 보았는지, 누가 다른 사람에게 들었는지 표시합니다. Q1-Q2는 핵심어로 메모합니다.", "7분"), Spacer(1, 3 * mm), step_box("02", "핵심 부분 다시 읽기", "체포된 사람이 달려 나온 사람이라는 관찰과 실제 강도라는 판단을 두 칸으로 나눕니다. Q3에 바뀐 생각과 쪽수를 적습니다.", "4분"), Spacer(1, 3 * mm), step_box("03", "Witness Interview", "원작 대사를 외우지 않습니다. 역할의 목표만 보고 자기 말로 질문하고 답하며 최소 한 번 쪽수 근거를 가리킵니다.", "5분"), Spacer(1, 4 * mm), grid_cards([
    ("Detective", "보거나 들은 사실과 쪽수 근거를 묻습니다."),
    ("Witness A", "직접 경험한 범위만 자기 말로 답합니다."),
    ("Witness B", "동의하거나 다른 점을 한 가지 보탭니다."),
    ("Evidence Keeper", "Fact / Guess / Question으로 정리합니다."),
], cols=4), Spacer(1, 3 * mm), callout("<b>질문 카드</b> - What did you actually see? / What did you hear? / What did you not see? / Which idea changed?"), Spacer(1, 4 * mm)]
answer_b = [
    ("Q1", "가게 안에 있었던 나이 든 두 여성.", "이름 대신 특징으로 식별해도 인정."),
    ("Q2", "무장한 사람이 점주를 위협해 작은 보석들을 가져가고, 안에 있던 사람들에게 시선을 돌리게 했다는 사건 흐름.", "표현보다 사건 순서와 자기 말 사용을 봅니다."),
    ("Q3", "붙잡힌 사람은 가게에서 달려 나온 사람은 맞지만 목격자들이 본 강도와는 다른 사람일 수 있다는 충돌.", "Fact와 Guess가 분리되고 쪽수 근거가 있으면 인정."),
]
story += [data_table(["문항", "예상 답의 핵심 의미", "인정 기준"], answer_b, [15 * mm, 100 * mm, CONTENT_W - 115 * mm]), Spacer(1, 4 * mm), P("1:1 운영", "H2"), P("교사가 먼저 Detective, 학생이 Witness를 맡아 90초 진행합니다. 역할을 바꾸어 학생이 질문하도록 한 뒤, 마지막 2분에는 함께 Fact / Changed Guess / Next Question을 말합니다.", "Body"), PageBreak()]

story += section_header("SCREEN-BY-SCREEN KEY", "나머지 화면별 지도안", "빠른 참고")
screen_rows = [
    ("1 브리핑", "진범이나 Chapter 3의 충돌을 미리 말하지 않습니다.", "근거로 생각을 고치는 수업임을 이해."),
    ("2 Word Lab", "16개를 시험하지 않고 필요한 카드만 엽니다. Listen은 선택형입니다.", "각 Chapter에서 두 단어씩, 총 여섯 카드 이상."),
    ("3-4 공통 활동", "직접 확인한 것과 해석을 나누고 Fact/Guess 규칙을 연습합니다.", "Fact와 Guess 각 1문장, 분류 네 문항."),
    ("5-6 Chapter 1", "안내 렌즈 뒤 바로 읽고 경보 전 행동과 보이는 단서를 찾습니다.", "활동, 단서 두 개, 쪽수."),
    ("7-8 Chapter 2", "Person, Direction, Object를 정한 뒤 담당 인물을 추적합니다.", "나온 사람, 방향, 물건, 쪽수."),
    ("9-10 Chapter 3", "Witness, Limit, Revision 렌즈 뒤 목격자 근거를 읽습니다.", "목격자, 사건 요약, 바뀐 근거."),
    ("11 언어", "문법 설명을 길게 하지 않고 사건 말하기에 바로 사용합니다.", "rang / ran / said와 사건, 생각 변화 문장."),
    ("12 사건 파일", "People과 Place보다 Fact, Changed Guess, Next Question을 우선합니다.", "최소 다섯 칸, 진범 확정 없이 질문 남기기."),
]
story += [data_table(["화면", "지도 포인트", "정답 또는 완료 기준"], screen_rows, [24 * mm, 86 * mm, CONTENT_W - 110 * mm]), Spacer(1, 5 * mm), P("수준별 읽기 지원", "H2"), grid_cards([
    ("읽기가 느린 학생", "교사가 먼저 한 문단을 읽고 학생은 의미가 중요한 한 문장만 다시 읽습니다. 한국어 + 영어 핵심어 두 개도 허용합니다."),
    ("평균 독자", "혼자 읽은 뒤 문단을 교대하고, 네 기록 카드 중 세 개는 영어 문장으로 완성합니다."),
    ("도전이 필요한 학생", "목격자의 정보가 직접 관찰인지 전언인지 구분하고 두 가능성을 because 문장으로 비교합니다."),
]), Spacer(1, 4 * mm), callout("<b>낭독 원칙</b> - 발음 오류를 읽는 도중 모두 고치지 않습니다. 의미 전달을 막는 단어만 짧게 모델링하고 문단 뒤 한 번 다시 읽게 합니다.", warning=True), Spacer(1, 5 * mm), P("교사 관찰 기록", "H2"), grid_cards([
    ("Fact / Guess", "보인 행동과 범인이라는 판단을 분리했는가?"),
    ("Page Evidence", "답의 근거가 있는 쪽을 찾고 가리켰는가?"),
    ("Own Words", "원문 복사 없이 사건을 자기 말로 요약했는가?"),
    ("Revision", "새 근거에 따라 처음 생각을 수정했는가?"),
], cols=4), PageBreak()]

story += section_header("COPYRIGHT-SAFE OPERATION", "저작권 운영선", "교수자 확인")
story += [checklist([
    "학생은 각자 합법적으로 구입하거나 대여한 원서를 사용합니다.",
    "교수안과 학생 화면에는 원작 문장, 삽화, 표지를 넣지 않습니다.",
    "답은 사건의 핵심 의미를 학생 자신의 말로 요약합니다.",
    "역할 카드는 행동 목표와 질문 기능만 제공합니다.",
    "원작 대사를 복사하거나 번역한 역할극 대본을 만들지 않습니다.",
    "원서 전체 화면공유, 스캔, 캡처 배포를 하지 않습니다.",
    "역할극을 녹화해 공개하거나 수업 상품으로 재사용하지 않습니다.",
    "본 교수안은 수업 진행용으로만 보관합니다.",
]), Spacer(1, 5 * mm), callout("이 자료의 줄거리 단서는 수업 진행에 필요한 최소한의 요약이며 원문을 대체하지 않습니다. 학생이 반드시 실제 도서를 열고 쪽수 근거를 찾게 하세요.", warning=True), Spacer(1, 8 * mm), P("수업 종료 체크", "H2"), checklist([
    "학생이 달린 사람이라는 Fact와 강도라는 Guess를 구분했다.",
    "최소 세 문항에 판본별 쪽수 근거가 기록되었다.",
    "역할극에서 원문 대사 대신 자기 말을 사용했다.",
    "다음 회차 질문을 남기고 진범은 확정하지 않았다.",
]), Spacer(1, 10 * mm), P("종료 멘트", "H2"), callout("A good detective does not protect the first guess. A good detective changes it when the evidence changes."), Spacer(1, 10 * mm), P("ONCUVATE LITERATURE - Cam Jansen Lesson 1 - Instructor Guide - Chapters 1-3", "CenterSmall")]

doc = SimpleDocTemplate(
    str(OUT),
    pagesize=A4,
    rightMargin=MARGIN,
    leftMargin=MARGIN,
    topMargin=16 * mm,
    bottomMargin=14 * mm,
    title="Cam Jansen Lesson 1 Instructor Guide",
    author="Oncuvate",
    subject="Chapters 1-3 teacher guide",
)
doc.build(story, onFirstPage=first_page, onLaterPages=later_pages)
print(OUT)
