import io
import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from apps.results.services import ResultCalculator
from apps.verification.services import get_or_create_verification, generate_qr_code_image


def generate_result_pdf(student, exam, base_url="http://127.0.0.1:8000"):
    """
    Generates a professional, publication-ready A4 examination result mark sheet PDF.
    Incorporates ResultCalculator data and embeds QR verification code.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    # 1. Fetch backend calculated result data
    result_data = ResultCalculator.calculate_exam_result(student, exam)

    # 2. Get QR verification token & image
    verification = get_or_create_verification(student, exam)
    qr_buffer, verification_url = generate_qr_code_image(verification.verification_token, base_url=base_url)

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1A365D'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#4A5568'),
        fontName='Helvetica-Bold'
    )
    header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        leading=15,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#2B6CB0'),
        fontName='Helvetica-Bold'
    )
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#2D3748')
    )
    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#1A202C')
    )

    story = []

    # Title & Subtitle Header
    story.append(Paragraph("PR-TERRA DIGITAL EXAMINATION SYSTEM", title_style))
    story.append(Paragraph("<b>OFFICIAL MARKSHEET / RESULT STATEMENT</b>", subtitle_style))
    story.append(Spacer(1, 10))

    # Student & Academic Info Box
    student_name = student.user.get_full_name() if student.user else ""
    roll_num = student.roll_number
    enrollment = getattr(student, 'enrollment_number', 'N/A') or 'N/A'
    dept_name = student.section.classroom.semester.program.department.name if student.section and student.section.classroom and student.section.classroom.semester and student.section.classroom.semester.program and student.section.classroom.semester.program.department else "N/A"
    program_name = student.section.classroom.semester.program.name if student.section and student.section.classroom and student.section.classroom.semester and student.section.classroom.semester.program else "N/A"
    sem_name = student.section.classroom.semester.name if student.section and student.section.classroom and student.section.classroom.semester else "N/A"
    sec_name = student.section.name if student.section else "N/A"

    info_data = [
        [
            Paragraph(f"<b>Student Name:</b> {student_name}", normal_style),
            Paragraph(f"<b>Examination:</b> {exam.name}", normal_style)
        ],
        [
            Paragraph(f"<b>Roll Number:</b> {roll_num}", normal_style),
            Paragraph(f"<b>Academic Year:</b> {exam.academic_year.name if exam.academic_year else ''}", normal_style)
        ],
        [
            Paragraph(f"<b>Enrollment No:</b> {enrollment}", normal_style),
            Paragraph(f"<b>Program / Class:</b> {program_name}", normal_style)
        ],
        [
            Paragraph(f"<b>Department:</b> {dept_name}", normal_style),
            Paragraph(f"<b>Semester & Section:</b> {sem_name} (Sec {sec_name})", normal_style)
        ]
    ]

    info_table = Table(info_data, colWidths=[260, 260])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F7FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # Component Marks Table
    story.append(Paragraph("Component-wise Evaluation Breakdown", header_style))
    story.append(Spacer(1, 4))

    comp_table_data = [
        [
            Paragraph("<b>Subject Code</b>", bold_style),
            Paragraph("<b>Subject Name</b>", bold_style),
            Paragraph("<b>Component</b>", bold_style),
            Paragraph("<b>Max Marks</b>", bold_style),
            Paragraph("<b>Obtained</b>", bold_style),
            Paragraph("<b>Status</b>", bold_style),
        ]
    ]

    for sub in result_data["subjects"]:
        for comp in sub.get("components", []):
            obtained_str = comp["obtained_marks"] if comp["obtained_marks"] is not None else "MISSING"
            comp_table_data.append([
                Paragraph(sub["subject_code"], normal_style),
                Paragraph(sub["subject"], normal_style),
                Paragraph(comp["name"], normal_style),
                Paragraph(comp["maximum_marks"], normal_style),
                Paragraph(obtained_str, normal_style),
                Paragraph(comp["status"], normal_style),
            ])

    comp_table = Table(comp_table_data, colWidths=[75, 175, 90, 60, 60, 60])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EBF8FF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2B6CB0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 12))

    # Subject Summary Table
    story.append(Paragraph("Subject Summary & Performance", header_style))
    story.append(Spacer(1, 4))

    sub_table_data = [
        [
            Paragraph("<b>Code</b>", bold_style),
            Paragraph("<b>Subject Title</b>", bold_style),
            Paragraph("<b>Max Marks</b>", bold_style),
            Paragraph("<b>Obtained</b>", bold_style),
            Paragraph("<b>Percentage</b>", bold_style),
            Paragraph("<b>Grade</b>", bold_style),
            Paragraph("<b>Status</b>", bold_style),
        ]
    ]

    for sub in result_data["subjects"]:
        sub_table_data.append([
            Paragraph(sub["subject_code"], normal_style),
            Paragraph(sub["subject"], normal_style),
            Paragraph(sub["maximum_marks"], normal_style),
            Paragraph(sub["total_marks"], normal_style),
            Paragraph(f"{sub['percentage']}%", normal_style),
            Paragraph(sub["grade"], normal_style),
            Paragraph(sub["status"], normal_style),
        ])

    sub_table = Table(sub_table_data, colWidths=[60, 190, 60, 60, 65, 45, 40])
    sub_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EDF2F7')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E0')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(sub_table)
    story.append(Spacer(1, 12))

    # Overall Summary & QR Code Section
    overall_bg = colors.HexColor('#C6F6D5') if result_data['status'] == 'PASS' else (
        colors.HexColor('#FED7D7') if result_data['status'] == 'FAIL' else colors.HexColor('#FEFCBF')
    )

    summary_text = [
        Paragraph(f"<b>Total Marks Obtained:</b> {result_data['total_marks']} / {result_data['maximum_marks']}", normal_style),
        Paragraph(f"<b>Overall Percentage:</b> {result_data['percentage']}%", normal_style),
        Paragraph(f"<b>Overall Grade:</b> {result_data['grade']}", normal_style),
        Paragraph(f"<b>RESULT STATUS:</b> <b><font color='{ 'green' if result_data['status']=='PASS' else 'red' }'>{result_data['status']}</font></b>", normal_style),
        Paragraph(f"<b>SGPA:</b> {result_data['sgpa']}", normal_style),
    ]

    qr_img = Image(qr_buffer, width=70, height=70)
    qr_caption = Paragraph("<b>Scan to Verify Result</b><br/><font size=7 color='#718096'>Token Verified</font>", ParagraphStyle('QRCap', parent=normal_style, alignment=TA_CENTER))

    summary_left_table = Table([[item] for item in summary_text], colWidths=[300])
    summary_left_table.setStyle(TableStyle([
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))

    qr_stack_table = Table([[qr_img], [qr_caption]], colWidths=[120])
    qr_stack_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 2),
    ]))

    footer_summary_table = Table([[summary_left_table, qr_stack_table]], colWidths=[360, 160])
    footer_summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), overall_bg),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))

    story.append(footer_summary_table)
    story.append(Spacer(1, 20))

    # Signatures
    today_str = datetime.date.today().strftime("%B %d, %Y")
    sig_data = [
        [
            Paragraph(f"<b>Generated Date:</b> {today_str}", normal_style),
            Paragraph("________________________<br/><b>Controller of Examinations</b>", ParagraphStyle('Sig1', parent=normal_style, alignment=TA_CENTER)),
            Paragraph("________________________<br/><b>Registrar</b>", ParagraphStyle('Sig2', parent=normal_style, alignment=TA_CENTER)),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[170, 175, 175])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
    ]))
    story.append(sig_table)

    doc.build(story)
    buffer.seek(0)
    return buffer
