"""
Trainer Analytics Dashboard Views
Uses existing models: Batch, Enrollment, Attendance, ExamResult, Assignment, AssignmentSubmission
No model changes required.
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Q
from django.views.decorators.cache import cache_page
from .models import Batch, Enrollment, ExamResult, Assignment, AssignmentSubmission


def get_trainer_user(request):
    """Helper: get trainer User from email query param (matches your existing pattern)."""
    email = request.query_params.get('email')
    if not email:
        return None, Response({'error': 'Email required'}, status=400)
    try:
        user = User.objects.get(email=email)
        return user, None
    except User.DoesNotExist:
        return None, Response({'error': 'Trainer not found'}, status=404)


@cache_page(60 * 5)  # Cache for 5 minutes
@api_view(['GET'])
def trainer_analytics_summary(request):
    """
    GET /api/trainer/analytics/summary/?email=trainer@email.com
    Returns: total students, completion rate, avg exam score, total courses, total assignments
    """
    user, err = get_trainer_user(request)
    if err:
        return err

    batches = Batch.objects.filter(trainer=user)

    # Total unique students across all batches
    total_students = Enrollment.objects.filter(
        batch__in=batches
    ).values('student').distinct().count()

    # Completion rate
    total_enrolled = Enrollment.objects.filter(batch__in=batches).count()
    completed = Enrollment.objects.filter(batch__in=batches, status='completed').count()
    completion_rate = round((completed / total_enrolled * 100), 1) if total_enrolled else 0

    # Average exam score across trainer's students
    student_ids = Enrollment.objects.filter(
        batch__in=batches
    ).values_list('student_id', flat=True).distinct()

    avg_score = ExamResult.objects.filter(
        student_id__in=student_ids
    ).aggregate(avg=Avg('score'))['avg']
    avg_score = round(avg_score, 1) if avg_score else 0

    # Assignment stats
    total_assignments = Assignment.objects.filter(batch__in=batches).count()
    total_submissions = AssignmentSubmission.objects.filter(
        assignment__batch__in=batches
    ).count()
    graded_submissions = AssignmentSubmission.objects.filter(
        assignment__batch__in=batches, status='evaluated'
    ).count()

    return Response({
        'total_students': total_students,
        'total_courses': batches.values('course').distinct().count(),
        'total_batches': batches.count(),
        'completion_rate': completion_rate,
        'avg_exam_score': avg_score,
        'total_assignments': total_assignments,
        'total_submissions': total_submissions,
        'graded_submissions': graded_submissions,
    })


@cache_page(60 * 5)
@api_view(['GET'])
def trainer_student_progress(request):
    """
    GET /api/trainer/analytics/student-progress/?email=trainer@email.com
    Returns per-student progress: status, exam scores, submissions count
    """
    user, err = get_trainer_user(request)
    if err:
        return err

    batches = Batch.objects.filter(trainer=user)
    enrollments = Enrollment.objects.filter(
        batch__in=batches
    ).select_related('student', 'batch__course').order_by('student__first_name')

    data = []
    seen = set()
    for e in enrollments:
        sid = e.student.id
        if sid in seen:
            continue
        seen.add(sid)

        # Exam scores for this student
        scores = ExamResult.objects.filter(student=e.student)
        avg = scores.aggregate(avg=Avg('score'))['avg']

        # Submissions
        subs = AssignmentSubmission.objects.filter(
            student=e.student, assignment__batch__in=batches
        )

        data.append({
            'student_id': sid,
            'student_name': e.student.get_full_name() or e.student.username,
            'student_email': e.student.email,
            'batch': e.batch.name,
            'course': e.batch.course.title,
            'status': e.status,
            'avg_exam_score': round(avg, 1) if avg else 0,
            'exams_taken': scores.count(),
            'assignments_submitted': subs.count(),
            'assignments_graded': subs.filter(status='evaluated').count(),
        })

    return Response(data)


@cache_page(60 * 5)
@api_view(['GET'])
def trainer_batch_enrollment_chart(request):
    """
    GET /api/trainer/analytics/batch-chart/?email=trainer@email.com
    Returns enrollment count per batch (for bar chart)
    """
    user, err = get_trainer_user(request)
    if err:
        return err

    batches = Batch.objects.filter(trainer=user).annotate(
        student_count=Count('enrolled_students')
    ).select_related('course')

    data = [
        {
            'batch': b.name,
            'course': b.course.title,
            'students': b.student_count,
        }
        for b in batches
    ]
    return Response(data)


@cache_page(60 * 5)
@api_view(['GET'])
def trainer_assignment_stats(request):
    """
    GET /api/trainer/analytics/assignments/?email=trainer@email.com
    Returns assignment submission stats per assignment
    """
    user, err = get_trainer_user(request)
    if err:
        return err

    batches = Batch.objects.filter(trainer=user)
    assignments = Assignment.objects.filter(batch__in=batches).select_related('batch__course')

    data = []
    for a in assignments:
        total_students = Enrollment.objects.filter(batch=a.batch).count()
        submitted = AssignmentSubmission.objects.filter(assignment=a).count()
        graded = AssignmentSubmission.objects.filter(assignment=a, status='evaluated').count()
        avg_score = AssignmentSubmission.objects.filter(
            assignment=a, score__isnull=False
        ).aggregate(avg=Avg('score'))['avg']

        data.append({
            'assignment_id': a.id,
            'title': a.title,
            'course': a.batch.course.title,
            'batch': a.batch.name,
            'status': a.status,
            'due_date': a.due_date,
            'total_students': total_students,
            'submitted': submitted,
            'graded': graded,
            'submission_rate': round(submitted / total_students * 100, 1) if total_students else 0,
            'avg_score': round(avg_score, 1) if avg_score else 0,
        })

    return Response(data)
