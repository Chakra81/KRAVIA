from rest_framework import serializers
from .fee_models import StudentFee, Payment, Installment, Receipt
from django.contrib.auth.models import User


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    receipt_number = serializers.SerializerMethodField()
    collected_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'student_fee', 'student', 'student_name', 'course_title',
            'amount', 'payment_method', 'transaction_id', 'payment_date',
            'status', 'remarks', 'collected_by', 'collected_by_name',
            'receipt_number', 'created_at'
        ]

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_course_title(self, obj):
        return obj.student_fee.course.title if obj.student_fee else ''

    def get_receipt_number(self, obj):
        if hasattr(obj, 'receipt'):
            return obj.receipt.receipt_number
        return None

    def get_collected_by_name(self, obj):
        if obj.collected_by:
            return obj.collected_by.get_full_name() or obj.collected_by.username
        return 'System'


class InstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Installment
        fields = ['id', 'installment_number', 'amount', 'due_date', 'paid_date', 'status', 'payment']


class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    course_title = serializers.SerializerMethodField()
    batch_name = serializers.SerializerMethodField()
    pending_amount = serializers.SerializerMethodField()
    payments = PaymentSerializer(many=True, read_only=True)
    installments = InstallmentSerializer(many=True, read_only=True)

    class Meta:
        model = StudentFee
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'course', 'course_title', 'batch', 'batch_name',
            'total_fee', 'paid_amount', 'pending_amount', 'discount',
            'status', 'payment_type', 'due_date', 'notes',
            'payments', 'installments', 'created_at', 'updated_at'
        ]

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_student_email(self, obj):
        return obj.student.email

    def get_course_title(self, obj):
        return obj.course.title

    def get_batch_name(self, obj):
        return obj.batch.name if obj.batch else ''

    def get_pending_amount(self, obj):
        return float(obj.pending_amount)


class ReceiptSerializer(serializers.ModelSerializer):
    payment_info = PaymentSerializer(source='payment', read_only=True)

    class Meta:
        model = Receipt
        fields = ['id', 'receipt_number', 'generated_at', 'institute_name', 'payment_info']
