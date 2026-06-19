from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Sum, Count, Q
from django.contrib.auth.models import User
from django.utils.dateparse import parse_date
import json
from datetime import date, timedelta
from decimal import Decimal

from .fee_models import StudentFee, Payment, Installment, Receipt, generate_receipt_number
from .fee_serializers import StudentFeeSerializer, PaymentSerializer, ReceiptSerializer
from .models import Course, Batch, Enrollment, Notification


def _get_admin(request):
    """Validate admin from email param/body."""
    email = request.GET.get('email') or (json.loads(request.body or '{}').get('email') if request.body else None)
    if not email:
        return None, JsonResponse({'error': 'Email required'}, status=400)
    try:
        user = User.objects.get(email=email)
        if not hasattr(user, 'profile') or user.profile.role not in ('admin',):
            return None, JsonResponse({'error': 'Not authorized'}, status=403)
        return user, None
    except User.DoesNotExist:
        return None, JsonResponse({'error': 'User not found'}, status=404)


def _get_user(request):
    email = request.GET.get('email') or (json.loads(request.body or '{}').get('email') if request.body else None)
    if not email:
        return None, JsonResponse({'error': 'Email required'}, status=400)
    try:
        return User.objects.get(email=email), None
    except User.DoesNotExist:
        return None, JsonResponse({'error': 'User not found'}, status=404)


# ─────────────────────────────────────────────────────────
# 1. FEE DASHBOARD ANALYTICS
# ─────────────────────────────────────────────────────────
@csrf_exempt
def fee_analytics(request):
    """GET /api/fees/analytics/ — Admin dashboard stats & charts."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    admin, err = _get_admin(request)
    if err:
        return err

    today = date.today()
    this_month_start = today.replace(day=1)

    # Card stats
    total_revenue = Payment.objects.filter(status='success').aggregate(total=Sum('amount'))['total'] or 0
    pending_fees = StudentFee.objects.filter(status__in=['pending', 'partially_paid']).aggregate(
        total=Sum('total_fee'))['total'] or 0
    paid_count = StudentFee.objects.filter(status='paid').count()
    overdue_count = StudentFee.objects.filter(status='overdue').count()

    today_collection = Payment.objects.filter(
        status='success', payment_date=today
    ).aggregate(total=Sum('amount'))['total'] or 0

    monthly_revenue = Payment.objects.filter(
        status='success', payment_date__gte=this_month_start
    ).aggregate(total=Sum('amount'))['total'] or 0

    total_transactions = Payment.objects.filter(status='success').count()

    # Monthly revenue for last 6 months chart
    monthly_data = []
    for i in range(5, -1, -1):
        month_date = today.replace(day=1) - timedelta(days=i * 30)
        month_start = month_date.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1, day=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1, day=1)

        rev = Payment.objects.filter(
            status='success',
            payment_date__gte=month_start,
            payment_date__lt=month_end
        ).aggregate(total=Sum('amount'))['total'] or 0

        monthly_data.append({
            'month': month_start.strftime('%b %Y'),
            'revenue': float(rev)
        })

    # Course-wise revenue
    course_revenue = []
    for course in Course.objects.all():
        rev = Payment.objects.filter(
            status='success', student_fee__course=course
        ).aggregate(total=Sum('amount'))['total'] or 0
        if rev > 0:
            course_revenue.append({'course': course.title, 'revenue': float(rev)})

    # Payment method breakdown
    method_breakdown = []
    for method, label in Payment.METHOD_CHOICES:
        total = Payment.objects.filter(status='success', payment_method=method).aggregate(
            total=Sum('amount'))['total'] or 0
        if total > 0:
            method_breakdown.append({'method': label, 'total': float(total)})

    # Pending per course
    pending_amount_total = StudentFee.objects.aggregate(
        total=Sum('total_fee'))['total'] or 0
    overdue_amount = StudentFee.objects.filter(status='overdue').aggregate(
        total=Sum('total_fee'))['total'] or 0

    return JsonResponse({
        'stats': {
            'total_revenue': float(total_revenue),
            'pending_fees': float(pending_fees),
            'paid_students': paid_count,
            'overdue_count': overdue_count,
            'today_collection': float(today_collection),
            'monthly_revenue': float(monthly_revenue),
            'total_transactions': total_transactions,
            'overdue_amount': float(overdue_amount),
        },
        'monthly_chart': monthly_data,
        'course_revenue': course_revenue,
        'method_breakdown': method_breakdown,
    })


# ─────────────────────────────────────────────────────────
# 2. STUDENT FEE LIST & CREATE
# ─────────────────────────────────────────────────────────
@csrf_exempt
def student_fees_view(request):
    """GET /api/fees/ — List all student fees (admin)
       POST /api/fees/ — Create a student fee record."""

    if request.method == 'GET':
        admin, err = _get_admin(request)
        if err:
            return err

        fees = StudentFee.objects.select_related('student', 'course', 'batch').all()

        # Filters
        status_filter = request.GET.get('status')
        search = request.GET.get('search', '').strip()
        if status_filter:
            fees = fees.filter(status=status_filter)
        if search:
            fees = fees.filter(
                Q(student__first_name__icontains=search) |
                Q(student__last_name__icontains=search) |
                Q(student__email__icontains=search) |
                Q(course__title__icontains=search)
            )

        data = StudentFeeSerializer(fees, many=True).data
        return JsonResponse(data, safe=False)

    elif request.method == 'POST':
        admin, err = _get_admin(request)
        if err:
            return err

        body = json.loads(request.body)
        try:
            student = User.objects.get(id=body['student_id'])
            course = Course.objects.get(id=body['course_id'])
            batch = Batch.objects.get(id=body['batch_id']) if body.get('batch_id') else None

            # Auto-detect enrollment
            if not batch:
                enrollment = Enrollment.objects.filter(student=student, batch__course=course, status='active').first()
                if enrollment:
                    batch = enrollment.batch

            fee, created = StudentFee.objects.get_or_create(
                student=student,
                course=course,
                batch=batch,
                defaults={
                    'total_fee': Decimal(str(body.get('total_fee', 0) or 0)),
                    'discount': Decimal(str(body.get('discount', 0) or 0)),
                    'payment_type': body.get('payment_type', 'one_time'),
                    'due_date': parse_date(body.get('due_date')) if body.get('due_date') else None,
                    'notes': body.get('notes', ''),
                }
            )
            
            # If the record exists, update it with the new values (upsert)
            if not created:
                if 'total_fee' in body and body['total_fee'] != '':
                    fee.total_fee = Decimal(str(body['total_fee']))
                if 'discount' in body and body['discount'] != '':
                    fee.discount = Decimal(str(body['discount']))
                if 'payment_type' in body:
                    fee.payment_type = body['payment_type']
                if 'due_date' in body:
                    fee.due_date = parse_date(body['due_date']) if body['due_date'] else None
                if 'notes' in body:
                    fee.notes = body['notes']
                fee.save()

            fee.update_status()

            # Create installments if installment type
            if fee.payment_type == 'installment' and body.get('installments'):
                for i, inst in enumerate(body['installments'], 1):
                    Installment.objects.create(
                        student_fee=fee,
                        installment_number=i,
                        amount=inst['amount'],
                        due_date=parse_date(inst['due_date']),
                    )

            return JsonResponse(StudentFeeSerializer(fee).data, status=201)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Student not found'}, status=404)
        except Course.DoesNotExist:
            return JsonResponse({'error': 'Course not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def student_fee_detail(request, fee_id):
    """GET/PUT /api/fees/<fee_id>/"""
    try:
        fee = StudentFee.objects.get(id=fee_id)
    except StudentFee.DoesNotExist:
        return JsonResponse({'error': 'Fee not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(StudentFeeSerializer(fee).data)

    elif request.method == 'PUT':
        admin, err = _get_admin(request)
        if err:
            return err
        body = json.loads(request.body)
        fee.total_fee = body.get('total_fee', fee.total_fee)
        fee.discount = body.get('discount', fee.discount)
        fee.payment_type = body.get('payment_type', fee.payment_type)
        fee.notes = body.get('notes', fee.notes)
        if body.get('due_date'):
            fee.due_date = parse_date(body['due_date'])
        fee.update_status()
        return JsonResponse(StudentFeeSerializer(fee).data)

    elif request.method == 'DELETE':
        admin, err = _get_admin(request)
        if err:
            return err
        fee.delete()
        return JsonResponse({'message': 'Fee record deleted successfully'})

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ─────────────────────────────────────────────────────────
# 3. COLLECT FEE / PAYMENT
# ─────────────────────────────────────────────────────────
@csrf_exempt
def collect_fee(request):
    """POST /api/fees/collect/ — Record a payment."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    admin, err = _get_admin(request)
    if err:
        return err

    body = json.loads(request.body)
    try:
        fee = StudentFee.objects.get(id=body['fee_id'])
        amount = Decimal(str(body['amount']))

        payment = Payment.objects.create(
            student_fee=fee,
            student=fee.student,
            amount=amount,
            payment_method=body.get('payment_method', 'cash'),
            payment_date=parse_date(body.get('payment_date', str(date.today()))),
            status='success',
            remarks=body.get('remarks', ''),
            collected_by=admin,
        )

        # Generate Receipt
        receipt = Receipt.objects.create(payment=payment)

        # Update paid amount & status
        fee.paid_amount = (fee.paid_amount or Decimal('0')) + amount
        fee.update_status()

        # Update installment if provided
        if body.get('installment_id'):
            try:
                inst = Installment.objects.get(id=body['installment_id'])
                inst.status = 'paid'
                inst.paid_date = payment.payment_date
                inst.payment = payment
                inst.save()
            except Installment.DoesNotExist:
                pass

        # Send notification to student
        Notification.objects.create(
            user=fee.student,
            title='Payment Received',
            message=f'Your payment of ₹{amount} for {fee.course.title} has been received. Receipt: {receipt.receipt_number}',
            notification_type='success'
        )

        return JsonResponse({
            'payment': PaymentSerializer(payment).data,
            'receipt_number': receipt.receipt_number,
            'fee': StudentFeeSerializer(fee).data,
        }, status=201)

    except StudentFee.DoesNotExist:
        return JsonResponse({'error': 'Fee record not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ─────────────────────────────────────────────────────────
# 4. PAYMENT HISTORY
# ─────────────────────────────────────────────────────────
@csrf_exempt
def payment_history(request):
    """GET /api/fees/history/ — All payments (admin) or student's own."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user, err = _get_user(request)
    if err:
        return err

    if user.profile.role == 'admin':
        payments = Payment.objects.select_related('student', 'student_fee__course').all()
        search = request.GET.get('search', '').strip()
        method_filter = request.GET.get('method')
        status_filter = request.GET.get('status')
        if search:
            payments = payments.filter(
                Q(student__first_name__icontains=search) |
                Q(student__last_name__icontains=search) |
                Q(transaction_id__icontains=search)
            )
        if method_filter:
            payments = payments.filter(payment_method=method_filter)
        if status_filter:
            payments = payments.filter(status=status_filter)
    else:
        payments = Payment.objects.filter(student=user).select_related('student_fee__course')

    data = PaymentSerializer(payments[:100], many=True).data
    return JsonResponse(data, safe=False)


# ─────────────────────────────────────────────────────────
# 5. RECEIPT
# ─────────────────────────────────────────────────────────
@csrf_exempt
def get_receipt(request, payment_id):
    """GET /api/fees/receipt/<payment_id>/ — Receipt data for a payment."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        payment = Payment.objects.select_related('student', 'student_fee__course', 'receipt').get(id=payment_id)
        receipt = payment.receipt
    except Payment.DoesNotExist:
        return JsonResponse({'error': 'Payment not found'}, status=404)
    except Receipt.DoesNotExist:
        # Auto-generate if missing
        receipt = Receipt.objects.create(payment=payment)

    return JsonResponse({
        'receipt_number': receipt.receipt_number,
        'generated_at': receipt.generated_at.isoformat(),
        'institute_name': receipt.institute_name,
        'student_name': payment.student.get_full_name() or payment.student.username,
        'student_email': payment.student.email,
        'course': payment.student_fee.course.title,
        'batch': payment.student_fee.batch.name if payment.student_fee.batch else '',
        'amount': float(payment.amount),
        'payment_method': payment.get_payment_method_display(),
        'transaction_id': payment.transaction_id,
        'payment_date': str(payment.payment_date),
        'status': payment.status,
        'total_fee': float(payment.student_fee.total_fee),
        'paid_amount': float(payment.student_fee.paid_amount),
        'pending_amount': float(payment.student_fee.pending_amount),
        'fee_status': payment.student_fee.status,
    })


# ─────────────────────────────────────────────────────────
# 6. STUDENT'S OWN FEE SUMMARY
# ─────────────────────────────────────────────────────────
@csrf_exempt
def student_fee_summary(request):
    """GET /api/fees/my/ — Student's own fee summary."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    user, err = _get_user(request)
    if err:
        return err

    fees = StudentFee.objects.filter(student=user).select_related('course', 'batch')
    data = StudentFeeSerializer(fees, many=True).data
    return JsonResponse(data, safe=False)


# ─────────────────────────────────────────────────────────
# 7. INSTALLMENT MANAGEMENT
# ─────────────────────────────────────────────────────────
@csrf_exempt
def manage_installments(request, fee_id):
    """GET /api/fees/<fee_id>/installments/"""
    try:
        fee = StudentFee.objects.get(id=fee_id)
    except StudentFee.DoesNotExist:
        return JsonResponse({'error': 'Fee not found'}, status=404)

    if request.method == 'GET':
        from .fee_serializers import InstallmentSerializer
        inst = Installment.objects.filter(student_fee=fee)
        # Auto-mark overdue
        today = date.today()
        for i in inst:
            if i.status == 'upcoming' and i.due_date < today:
                i.status = 'overdue'
                i.save()
        return JsonResponse(InstallmentSerializer(inst, many=True).data, safe=False)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


# ─────────────────────────────────────────────────────────
# 8. AUTO-DETECT & ASSIGN FEES FROM ENROLLMENTS
# ─────────────────────────────────────────────────────────
@csrf_exempt
def auto_assign_fees(request):
    """POST /api/fees/auto-assign/ — Bulk assign fee records to all enrolled students."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    admin, err = _get_admin(request)
    if err:
        return err
    body = json.loads(request.body)
    total_fee = Decimal(str(body.get('total_fee', 15000)))
    due_date = parse_date(body.get('due_date', str(date.today() + timedelta(days=30))))
    course_id = body.get('course_id')

    enrollments = Enrollment.objects.select_related('student', 'batch__course').all()
    if course_id:
        enrollments = enrollments.filter(batch__course_id=course_id)

    created_count = 0
    for enrollment in enrollments:
        _, created = StudentFee.objects.get_or_create(
            student=enrollment.student,
            course=enrollment.batch.course,
            batch=enrollment.batch,
            defaults={
                'total_fee': total_fee,
                'due_date': due_date,
            }
        )
        if created:
            created_count += 1

    return JsonResponse({'message': f'{created_count} fee records created'})
