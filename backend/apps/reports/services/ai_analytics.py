from decimal import Decimal, ROUND_HALF_UP
from apps.academics.models import StudentProfile, Subject
from apps.examinations.models import Exam, ExamSubject
from apps.results.services import ResultCalculator


class AIAnalyticsService:
    """
    Deterministic AI Analytics Engine (Phase 26).
    Analyzes student academic performance data from ResultCalculator and MarkEntry database records.
    Generates weak/strong subject detection, historical trend, academic risk level, recommendations, and AI summary.
    Does NOT use external LLMs or store fake/temporary data in separate models.
    """

    @classmethod
    def _quantize(cls, val):
        if val is None:
            return Decimal('0.00')
        return Decimal(str(val)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    @classmethod
    def detect_weak_subjects(cls, subjects_data):
        """
        Identifies subjects where performance is comparatively low (< 50%, grade F/D, or FAIL status).
        """
        weak = []
        for sub in subjects_data:
            perc = float(sub.get("percentage", 0))
            st = sub.get("status", "")
            gr = sub.get("grade", "")

            if st == "FAIL" or perc < 50.0 or gr in ["F", "D"]:
                weak.append(sub.get("subject", "Unknown Subject"))
        return weak

    @classmethod
    def detect_strong_subjects(cls, subjects_data):
        """
        Identifies high-performing subjects (percentage >= 75% or top grades A+/A/B+ with PASS status).
        """
        strong = []
        for sub in subjects_data:
            perc = float(sub.get("percentage", 0))
            st = sub.get("status", "")
            gr = sub.get("grade", "")

            if st == "PASS" and (perc >= 75.0 or gr in ["A+", "A"]):
                strong.append(sub.get("subject", "Unknown Subject"))
        return strong

    @classmethod
    def calculate_performance_trend(cls, student, current_exam):
        """
        Compares current exam percentage against student's historical exams.
        Returns trend status: IMPROVING, DECLINING, STABLE, or INSUFFICIENT_DATA.
        """
        semester = current_exam.semester
        if not semester:
            return {"status": "INSUFFICIENT_DATA", "change": "0.00"}

        exams_qs = Exam.objects.filter(
            semester__program=semester.program,
            is_active=True
        ).exclude(id=current_exam.id).order_by('academic_year__start_date', 'id')

        historical_results = []
        for past_exam in exams_qs:
            res = ResultCalculator.calculate_exam_result(student, past_exam)
            if res["status"] != "INCOMPLETE":
                historical_results.append(Decimal(res["percentage"]))

        if not historical_results:
            return {
                "status": "INSUFFICIENT_DATA",
                "change": "0.00"
            }

        prev_percentage = historical_results[-1]
        curr_res = ResultCalculator.calculate_exam_result(student, current_exam)

        if curr_res["status"] == "INCOMPLETE":
            return {
                "status": "INSUFFICIENT_DATA",
                "change": "0.00"
            }

        curr_percentage = Decimal(curr_res["percentage"])
        diff = cls._quantize(curr_percentage - prev_percentage)

        if diff > Decimal('2.00'):
            status_str = "IMPROVING"
        elif diff < Decimal('-2.00'):
            status_str = "DECLINING"
        else:
            status_str = "STABLE"

        return {
            "status": status_str,
            "previous_percentage": str(cls._quantize(prev_percentage)),
            "current_percentage": str(cls._quantize(curr_percentage)),
            "change": str(diff)
        }

    @classmethod
    def calculate_risk_level(cls, result_data, weak_subjects, trend_data):
        """
        Calculates academic risk level (LOW, MEDIUM, HIGH) with explanatory reasons.
        """
        reasons = []
        failed_count = 0
        incomplete_count = 0

        for sub in result_data.get("subjects", []):
            if sub.get("status") == "FAIL":
                failed_count += 1
            elif sub.get("status") == "INCOMPLETE":
                incomplete_count += 1

        overall_status = result_data.get("status")
        perc = float(result_data.get("percentage", 0))

        if failed_count > 0:
            reasons.append(f"Failed in {failed_count} subject(s).")
        if perc < 50.0 and overall_status != "INCOMPLETE":
            reasons.append(f"Overall percentage ({perc}%) is below 50%.")
        if trend_data.get("status") == "DECLINING":
            reasons.append(f"Performance is declining (change: {trend_data.get('change')}%).")
        if incomplete_count > 0:
            reasons.append(f"{incomplete_count} subject component(s) are incomplete.")

        if failed_count >= 2 or (perc < 45.0 and overall_status == "FAIL"):
            risk_level = "HIGH"
        elif failed_count == 1 or perc < 60.0 or trend_data.get("status") == "DECLINING":
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            if not reasons:
                reasons.append("Consistently strong academic standing.")

        return {
            "level": risk_level,
            "reasons": reasons
        }

    @classmethod
    def generate_recommendations(cls, result_data, weak_subjects, strong_subjects, trend_data, risk_data):
        """
        Generates 2 to 5 actionable, condition-based academic recommendations.
        """
        recs = []

        if weak_subjects:
            weak_str = ", ".join(weak_subjects[:2])
            recs.append(f"Focus revision on weak subjects: {weak_str}.")

        failed_subs = [s["subject"] for s in result_data.get("subjects", []) if s.get("status") == "FAIL"]
        if failed_subs:
            recs.append(f"Review core concepts for failed subject(s): {', '.join(failed_subs)} before upcoming re-examinations.")

        if trend_data.get("status") == "DECLINING":
            recs.append("Your recent performance is declining. Consider increasing daily study and practice hours.")
        elif trend_data.get("status") == "IMPROVING":
            recs.append("Your performance is improving. Maintain your current study routine and revision schedule.")

        if risk_data.get("level") == "HIGH":
            recs.append("Seek academic counseling or peer tutoring to improve overall understanding.")
        elif strong_subjects:
            recs.append(f"Leverage your strengths in {strong_subjects[0]} to support your overall academic performance.")

        if len(recs) < 2:
            recs.append("Maintain consistent problem-solving practice and review lecture material regularly.")

        return recs[:5]

    @classmethod
    def generate_summary(cls, student_name, result_data, weak_subjects, strong_subjects, trend_data, risk_data):
        """
        Generates a concise, natural-language academic summary.
        """
        perc = result_data.get("percentage", "0.00")
        gr = result_data.get("grade", "N/A")
        st = result_data.get("status", "N/A")
        risk = risk_data.get("level", "LOW")

        parts = [f"{student_name} holds an overall percentage of {perc}% (Grade: {gr}, Status: {st})."]

        if strong_subjects:
            parts.append(f"Demonstrates strong capability in {', '.join(strong_subjects[:2])}.")
        if weak_subjects:
            parts.append(f"Requires improvement in {', '.join(weak_subjects[:2])}.")
        else:
            parts.append("No major weak subjects detected.")

        if trend_data.get("status") != "INSUFFICIENT_DATA":
            parts.append(f"Performance trend is {trend_data.get('status').lower()} ({trend_data.get('change')}% change).")

        parts.append(f"Current academic risk level is {risk}.")

        return " ".join(parts)

    @classmethod
    def analyze_student(cls, student, exam):
        """
        Full AI performance analysis payload for a specific student and examination.
        """
        student_name = student.user.get_full_name() if student.user else f"Student #{student.id}"

        # 1. Fetch backend calculated results
        res_data = ResultCalculator.calculate_exam_result(student, exam)
        subjects_data = res_data.get("subjects", [])

        # 2. Detect weak & strong subjects
        weak_subs = cls.detect_weak_subjects(subjects_data)
        strong_subs = cls.detect_strong_subjects(subjects_data)

        # 3. Calculate trend across historical exams
        trend_data = cls.calculate_performance_trend(student, exam)

        # 4. Calculate risk level & reasons
        risk_data = cls.calculate_risk_level(res_data, weak_subs, trend_data)

        # 5. Generate recommendations & summary
        recs = cls.generate_recommendations(res_data, weak_subs, strong_subs, trend_data, risk_data)
        summary = cls.generate_summary(student_name, res_data, weak_subs, strong_subs, trend_data, risk_data)

        return {
            "student": {
                "id": student.id,
                "name": student_name,
                "roll_number": student.roll_number,
            },
            "exam": {
                "id": exam.id,
                "name": exam.name,
            },
            "overall": {
                "percentage": res_data.get("percentage"),
                "grade": res_data.get("grade"),
                "status": res_data.get("status"),
                "sgpa": res_data.get("sgpa"),
                "total_marks": res_data.get("total_marks"),
                "maximum_marks": res_data.get("maximum_marks"),
            },
            "trend": trend_data,
            "strong_subjects": strong_subs,
            "weak_subjects": weak_subs,
            "risk": risk_data,
            "summary": summary,
            "recommendations": recs,
            "subject_breakdown": subjects_data
        }

    @classmethod
    def analyze_exam(cls, exam, section_ids=None):
        """
        Exam-wide AI performance analysis and common weak area summary.
        """
        from apps.reports.services import AnalyticsService

        base_analytics = AnalyticsService.get_exam_analytics(exam, section_ids=section_ids)

        students_qs = StudentProfile.objects.select_related('user', 'section').filter(
            section__classroom__semester=exam.semester,
            is_active=True,
            user__is_active=True
        )

        if section_ids:
            students_qs = students_qs.filter(section_id__in=section_ids)

        weak_subject_counts = {}
        strong_subject_counts = {}
        high_risk_count = 0
        medium_risk_count = 0
        low_risk_count = 0

        for student in students_qs:
            analysis = cls.analyze_student(student, exam)
            for w in analysis["weak_subjects"]:
                weak_subject_counts[w] = weak_subject_counts.get(w, 0) + 1
            for s in analysis["strong_subjects"]:
                strong_subject_counts[s] = strong_subject_counts.get(s, 0) + 1

            r_lvl = analysis["risk"]["level"]
            if r_lvl == "HIGH":
                high_risk_count += 1
            elif r_lvl == "MEDIUM":
                medium_risk_count += 1
            else:
                low_risk_count += 1

        common_weak = sorted(weak_subject_counts.items(), key=lambda x: x[1], reverse=True)
        common_strong = sorted(strong_subject_counts.items(), key=lambda x: x[1], reverse=True)

        summary_text = (
            f"Examination '{exam.name}' has a pass rate of {base_analytics['pass_percentage']}% "
            f"with an average percentage of {base_analytics['average_percentage']}%. "
            f"{high_risk_count} student(s) identified at HIGH academic risk."
        )

        return {
            "exam": exam.name,
            "analytics_summary": base_analytics,
            "common_weak_subjects": [item[0] for item in common_weak[:3]],
            "common_strong_subjects": [item[0] for item in common_strong[:3]],
            "risk_distribution": {
                "high": high_risk_count,
                "medium": medium_risk_count,
                "low": low_risk_count
            },
            "ai_summary": summary_text
        }
