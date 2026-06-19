from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
        ('trainer', 'Trainer'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    raw_password = models.CharField(max_length=100, blank=True, null=True) # For admin viewing
    phone_number = models.CharField(max_length=20, blank=True, null=True, help_text="WhatsApp number with country code (e.g., +919876543210)")
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Course(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)
    video_url = models.TextField(blank=True, null=True)
    duration_weeks = models.IntegerField(default=4)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Batch(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='batches')
    trainer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='training_batches')
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    schedule_time = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.name} ({self.course.title})"

class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='enrolled_students')
    joined_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=(('active', 'Active'), ('completed', 'Completed'), ('dropped', 'Dropped')), default='active')

    class Meta:
        unique_together = ('student', 'batch')

    def __str__(self):
        return f"{self.student.first_name} -> {self.batch.name}"

class Lesson(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    video_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class ChatMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=(('sent', 'Sent'), ('delivered', 'Delivered'), ('read', 'Read')), default='sent')
    is_read = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username}: {self.message[:20]}"

class AIChatHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_chats')
    message = models.TextField()
    ai_response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Chat: {self.user.username} - {self.created_at}"

class Exam(models.Model):
    title = models.CharField(max_length=200)
    domain = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20, choices=(('Beginner', 'Beginner'), ('Intermediate', 'Intermediate'), ('Expert', 'Expert')), default='Beginner')
    timer = models.IntegerField(help_text="Duration in seconds")
    total_marks = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.domain})"

class Question(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)
    correct_option = models.CharField(max_length=1, choices=(('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')))
    marks = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.exam.title} - {self.text[:30]}"

class ExamResult(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_results')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    score = models.FloatField()
    total_marks = models.IntegerField()
    passed = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.exam.title}: {self.score}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('assignment', 'Assignment'),
        ('exam', 'Exam'),
        ('attendance', 'Attendance'),
        ('course', 'Course'),
        ('placement', 'Placement'),
        ('fees', 'Fees'),
        ('certificate', 'Certificate'),
        ('message', 'Message'),
        ('system', 'System Alert'),
        ('study_planner', 'Study Planner'),
    )
    
    PRIORITY_CHOICES = (
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Information'),
        ('success', 'Success'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='info')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username if self.user else 'All'}"

class NotificationSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)

    def __str__(self):
        return f"Notification Settings for {self.user.username}"

# ─────────────────────────────────────────────────────────
# ENHANCED ASSIGNMENT MODELS
# ─────────────────────────────────────────────────────────

class Assignment(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('closed', 'Closed'),
        ('draft', 'Draft'),
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    instructions = models.TextField(blank=True, null=True)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='assignments')
    due_date = models.DateTimeField()
    max_score = models.IntegerField(default=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    # File attachments (stored as file path after upload)
    attachment = models.FileField(upload_to='assignments/attachments/', blank=True, null=True)
    reference_material = models.FileField(upload_to='assignments/references/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.batch.name}"

    class Meta:
        ordering = ['-created_at']


class AssignmentSubmission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('evaluated', 'Evaluated'),
        ('rework', 'Needs Rework'),
        ('resubmitted', 'Resubmitted'),
    )
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignment_submissions')
    submission_text = models.TextField(blank=True, null=True)
    uploaded_file = models.FileField(upload_to='assignments/submissions/', blank=True, null=True)
    file_url = models.TextField(blank=True, null=True)   # For external links
    github_link = models.TextField(blank=True, null=True)
    project_url = models.TextField(blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    score = models.FloatField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    suggestions = models.TextField(blank=True, null=True)
    improvement_notes = models.TextField(blank=True, null=True)
    evaluated_at = models.DateTimeField(blank=True, null=True)
    # AI-generated fields
    ai_feedback = models.TextField(blank=True, null=True)
    ai_plagiarism_score = models.FloatField(blank=True, null=True)
    ai_summary = models.TextField(blank=True, null=True)
    ai_suggestions = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title}"


# ─────────────────────────────────────────────────────────
# STUDY PLANNER MODELS (unchanged)
# ─────────────────────────────────────────────────────────

class StudentGoal(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    target_date = models.DateField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.student.username}"

class StudyPlan(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='study_plans')
    goal = models.ForeignKey(StudentGoal, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=200)
    generated_content = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.student.username}"

class StudyTask(models.Model):
    plan = models.ForeignKey(StudyPlan, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    task_type = models.CharField(max_length=50, choices=(('daily', 'Daily'), ('weekly', 'Weekly'), ('revision', 'Revision'), ('quiz', 'Quiz')), default='daily')
    date = models.DateField()
    is_completed = models.BooleanField(default=False)
    is_skipped = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} - {self.plan.title}"

class ProgressTracker(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='progress_tracker')
    xp_points = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_study_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"Progress: {self.student.username}"

class DailyActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_activities')
    date = models.DateField()
    activity_count = models.IntegerField(default=1)

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['date']

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.activity_count}"

# ─────────────────────────────────────────────────────────
# FEE MANAGEMENT MODELS (imported from fee_models.py)
# ─────────────────────────────────────────────────────────
from .fee_models import StudentFee, Payment, Installment, Receipt

# ─────────────────────────────────────────────────────────
# CERTIFICATE MODELS (imported from certificate_models.py)
# ─────────────────────────────────────────────────────────
from .certificate_models import Certificate, CertificateTemplate

# ─────────────────────────────────────────────────────────
# PLACEMENT MODELS
# ─────────────────────────────────────────────────────────
class Placement(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='placement')
    company_name = models.CharField(max_length=200)
    job_role = models.CharField(max_length=150)
    package = models.CharField(max_length=100, blank=True, null=True)
    placement_date = models.DateField()
    status = models.CharField(max_length=20, choices=(('placed', 'Placed'), ('pending', 'Pending'), ('in_progress', 'In Progress')), default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.company_name} ({self.status})"

# ─────────────────────────────────────────────────────────
# RESUME MODELS (imported from resume_models.py)
# ─────────────────────────────────────────────────────────
from .resume_models import Resume, Education, Skill, Project, Experience


