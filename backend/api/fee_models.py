from django.db import models
from django.contrib.auth.models import User
from .models import Course, Batch, Enrollment
import uuid


def generate_transaction_id():
    return f"TXN{uuid.uuid4().hex[:10].upper()}"

def generate_receipt_number():
    return f"RCP{uuid.uuid4().hex[:8].upper()}"


class StudentFee(models.Model):
    STATUS_CHOICES = (
        ('paid', 'Paid'),
        ('partially_paid', 'Partially Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
    )
    PAYMENT_TYPE_CHOICES = (
        ('one_time', 'One Time'),
        ('installment', 'Installment'),
    )

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fees')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='student_fees')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='fees')
    total_fee = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='one_time')
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def pending_amount(self):
        return max(self.total_fee - self.discount - self.paid_amount, 0)

    def update_status(self):
        from decimal import Decimal
        from django.utils import timezone
        effective_total = self.total_fee - self.discount
        if self.paid_amount >= effective_total:
            self.status = 'paid'
        elif self.paid_amount > 0:
            self.status = 'partially_paid'
        elif self.due_date and self.due_date < timezone.now().date():
            self.status = 'overdue'
        else:
            self.status = 'pending'
        self.save()

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.course.title} - {self.status}"

    class Meta:
        ordering = ['-created_at']
        unique_together = ('student', 'course', 'batch')


class Payment(models.Model):
    METHOD_CHOICES = (
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
        ('card', 'Card'),
        ('cheque', 'Cheque'),
        ('online', 'Online'),
    )
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )

    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='cash')
    transaction_id = models.CharField(max_length=50, unique=True, default=generate_transaction_id)
    payment_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    remarks = models.TextField(blank=True, null=True)
    collected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='collected_payments')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_id} - {self.student.get_full_name()} - ₹{self.amount}"

    class Meta:
        ordering = ['-payment_date', '-created_at']


class Installment(models.Model):
    STATUS_CHOICES = (
        ('upcoming', 'Upcoming'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('missed', 'Missed'),
    )

    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='installments')
    installment_number = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='installment')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')

    def __str__(self):
        return f"Installment {self.installment_number} - {self.student_fee.student.get_full_name()}"

    class Meta:
        ordering = ['installment_number']


class Receipt(models.Model):
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.CharField(max_length=30, unique=True, default=generate_receipt_number)
    generated_at = models.DateTimeField(auto_now_add=True)
    institute_name = models.CharField(max_length=200, default='Kravia Institute')

    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.payment.student.get_full_name()}"

    class Meta:
        ordering = ['-generated_at']
