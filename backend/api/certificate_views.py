from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Count
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date
from django.utils import timezone
import json
from datetime import date, timedelta

from .certificate_models import Certificate, CertificateTemplate
from .certificate_serializers import CertificateSerializer, CertificateTemplateSerializer
from .models import Course, Batch, Enrollment, Notification


# ── helpers ───────────────────────────────────────────────
def _get_user(request):
    email = request.GET.get('email')
    if not email and request.body:
        try:
            email = json.loads(request.body).get('email')
        except Exception:
            pass
    if not email:
        return None, JsonResponse({'error': 'email required'}, status=400)
    try:
        return User.objects.get(email=email), None
    except User.DoesNotExist:
        return None, JsonResponse({'error': 'user not found'}, status=404)


def _get_admin(request):
    user, err = _get_user(request)
    if err:
        return None, err
    if not hasattr(user, 'profile') or user.profile.role not in ('admin',):
        return None, JsonResponse({'error': 'admin only'}, status=403)
    return user, None


# ── 1. List / Student Certificates ──────────────────────
@csrf_exempt
def certificates_view(request):
    """
    GET  /api/certificates/?email=...          (student sees own, admin sees all)
    POST /api/certificates/                    (admin: manual generate)
    """
    if request.method == 'GET':
        user, err = _get_user(request)
        if err:
            return err

        if user.profile.role == 'admin':
            certs = Certificate.objects.select_related('student', 'course', 'batch', 'template').all()
            # filters
            status_f = request.GET.get('status')
            course_f = request.GET.get('course_id')
            search   = request.GET.get('search', '').strip()
            if status_f:
                certs = certs.filter(status=status_f)
            if course_f:
                certs = certs.filter(course_id=course_f)
            if search:
                certs = certs.filter(
                    Q(student__first_name__icontains=search) |
                    Q(student__last_name__icontains=search)  |
                    Q(student__email__icontains=search)      |
                    Q(certificate_id__icontains=search)      |
                    Q(course__title__icontains=search)
                )
        else:
            certs = Certificate.objects.filter(student=user).select_related('course', 'batch', 'template')

        data = CertificateSerializer(certs, many=True).data
        return JsonResponse(data, safe=False)

    elif request.method == 'POST':
        admin, err = _get_admin(request)
        if err:
            return err
        body = json.loads(request.body)
        try:
            student = User.objects.get(id=body['student_id'])
            course  = Course.objects.get(id=body['course_id'])
            batch   = Batch.objects.get(id=body['batch_id']) if body.get('batch_id') else None

            cert, created = Certificate.objects.get_or_create(
                student=student, course=course,
                defaults={
                    'batch': batch,
                    'completion_date': parse_date(body.get('completion_date', str(date.today()))),
                    'issued_by': admin,
                    'status': 'active',
                    'template': CertificateTemplate.objects.filter(is_active=True).first(),
                }
            )
            if not created:
                return JsonResponse({'error': 'Certificate already exists for this student/course'}, status=400)

            # Notification
            Notification.objects.create(
                user=student,
                title='🎓 Certificate Issued!',
                message=f'Your certificate for "{course.title}" has been issued. Certificate ID: {cert.certificate_id}',
                notification_type='success'
            )
            return JsonResponse(CertificateSerializer(cert).data, status=201)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Student not found'}, status=404)
        except Course.DoesNotExist:
            return JsonResponse({'error': 'Course not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ── 2. Certificate Detail ────────────────────────────────
@csrf_exempt
def certificate_detail(request, cert_id):
    """GET/PUT/DELETE  /api/certificates/<cert_id>/"""
    try:
        cert = Certificate.objects.select_related(
            'student', 'course', 'batch', 'template', 'issued_by'
        ).get(id=cert_id)
    except Certificate.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(CertificateSerializer(cert).data)

    elif request.method == 'PUT':
        admin, err = _get_admin(request)
        if err:
            return err
        body = json.loads(request.body)
        cert.status        = body.get('status', cert.status)
        cert.revoke_reason = body.get('revoke_reason', cert.revoke_reason)
        if body.get('completion_date'):
            cert.completion_date = parse_date(body['completion_date'])
        cert.save()
        return JsonResponse(CertificateSerializer(cert).data)

    elif request.method == 'DELETE':
        admin, err = _get_admin(request)
        if err:
            return err
        cert.delete()
        return JsonResponse({'message': 'Deleted'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ── 3. Public Verification  ──────────────────────────────
@csrf_exempt
def verify_certificate(request, certificate_id):
    """GET  /api/certificates/verify/<certificate_id>/   — public, no auth needed"""
    try:
        cert = Certificate.objects.select_related('student', 'course', 'batch').get(
            certificate_id=certificate_id
        )
    except Certificate.DoesNotExist:
        return JsonResponse({'valid': False, 'error': 'Certificate not found'}, status=404)

    return JsonResponse({
        'valid': cert.status == 'active',
        'status': cert.status,
        'certificate_id': cert.certificate_id,
        'student_name': cert.student.get_full_name() or cert.student.username,
        'course_title': cert.course.title,
        'batch_name': cert.batch.name if cert.batch else '',
        'issue_date': str(cert.issue_date),
        'completion_date': str(cert.completion_date),
        'expiry_date': str(cert.expiry_date) if cert.expiry_date else None,
        'institute_name': cert.template.institute_name if cert.template else 'Kravia Institute',
    })


# ── 4. Download Counter  ─────────────────────────────────
@csrf_exempt
def increment_download(request, cert_id):
    """POST  /api/certificates/<cert_id>/download/"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        cert = Certificate.objects.get(id=cert_id)
        cert.download_count += 1
        cert.save(update_fields=['download_count'])
        return JsonResponse({'download_count': cert.download_count})
    except Certificate.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)


# ── 5. Admin Analytics  ──────────────────────────────────
@csrf_exempt
def certificate_analytics(request):
    """GET  /api/certificates/analytics/"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    admin, err = _get_admin(request)
    if err:
        return err

    total        = Certificate.objects.count()
    active       = Certificate.objects.filter(status='active').count()
    revoked      = Certificate.objects.filter(status='revoked').count()
    pending      = Certificate.objects.filter(status='pending').count()
    this_month   = Certificate.objects.filter(
        issue_date__gte=date.today().replace(day=1)
    ).count()
    total_dl     = sum(Certificate.objects.values_list('download_count', flat=True))

    # per-course
    course_data = []
    for course in Course.objects.all():
        cnt = Certificate.objects.filter(course=course, status='active').count()
        if cnt:
            course_data.append({'course': course.title, 'count': cnt})
    course_data.sort(key=lambda x: x['count'], reverse=True)

    # monthly trend (last 6)
    monthly = []
    for i in range(5, -1, -1):
        d = date.today().replace(day=1) - timedelta(days=i * 30)
        m_start = d.replace(day=1)
        m_end   = (m_start.replace(month=m_start.month % 12 + 1, day=1)
                   if m_start.month < 12
                   else m_start.replace(year=m_start.year + 1, month=1, day=1))
        cnt = Certificate.objects.filter(issue_date__gte=m_start, issue_date__lt=m_end).count()
        monthly.append({'month': m_start.strftime('%b %Y'), 'count': cnt})

    return JsonResponse({
        'stats': {
            'total': total, 'active': active, 'revoked': revoked,
            'pending': pending, 'this_month': this_month, 'total_downloads': total_dl,
        },
        'course_data': course_data,
        'monthly': monthly,
    })


# ── 6. Bulk Auto-Generate  ───────────────────────────────
@csrf_exempt
def auto_generate_certificates(request):
    """POST /api/certificates/auto-generate/ — for all completed enrollments."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    admin, err = _get_admin(request)
    if err:
        return err

    body = json.loads(request.body or '{}')
    course_id = body.get('course_id')

    enrollments = Enrollment.objects.filter(status='completed').select_related('student', 'batch__course')
    if course_id:
        enrollments = enrollments.filter(batch__course_id=course_id)

    template = CertificateTemplate.objects.filter(is_active=True).first()
    created_count = 0

    for e in enrollments:
        _, created = Certificate.objects.get_or_create(
            student=e.student,
            course=e.batch.course,
            defaults={
                'batch': e.batch,
                'completion_date': date.today(),
                'issued_by': admin,
                'status': 'active',
                'template': template,
                'auto_generated': True,
            }
        )
        if created:
            created_count += 1
            Notification.objects.create(
                user=e.student,
                title='🎓 Certificate Issued!',
                message=f'Your certificate for "{e.batch.course.title}" is ready. '
                        f'Download it from your Certificate Center.',
                notification_type='success'
            )

    return JsonResponse({'message': f'{created_count} certificates generated'})


# ── 7. Template CRUD  ────────────────────────────────────
@csrf_exempt
def certificate_templates(request):
    """GET / POST  /api/certificates/templates/"""
    if request.method == 'GET':
        templates = CertificateTemplate.objects.all()
        return JsonResponse(CertificateTemplateSerializer(templates, many=True).data, safe=False)

    elif request.method == 'POST':
        admin, err = _get_admin(request)
        if err:
            return err
        body = json.loads(request.body)
        t = CertificateTemplate.objects.create(**{
            k: v for k, v in body.items()
            if k in ['title', 'subtitle', 'institute_name', 'signatory_name',
                     'signatory_title', 'background_color', 'accent_color']
        })
        return JsonResponse(CertificateTemplateSerializer(t).data, status=201)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
