from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, Course, Batch, Enrollment, Lesson, ChatMessage, AIChatHistory,
    Exam, Question, ExamResult, Assignment, AssignmentSubmission,
    StudentGoal, StudyPlan, StudyTask, ProgressTracker
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'raw_password', 'is_approved']

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class BatchSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source='course.title')
    trainer_name = serializers.SerializerMethodField()
    class Meta:
        model = Batch
        fields = ['id', 'course', 'course_title', 'trainer', 'trainer_name', 'name', 'start_date', 'end_date', 'schedule_time']

    def get_trainer_name(self, obj):
        if obj.trainer:
            return obj.trainer.first_name or obj.trainer.username
        return None

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.first_name')
    batch_name = serializers.ReadOnlyField(source='batch.name')
    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'student_name', 'batch', 'batch_name', 'joined_date', 'status']

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.ReadOnlyField(source='sender.email')
    receiver_email = serializers.ReadOnlyField(source='receiver.email')
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_email', 'receiver', 'receiver_email', 'message', 'timestamp', 'is_read', 'status', 'delivered_at', 'read_at']

class AIChatHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatHistory
        fields = ['id', 'user', 'message', 'ai_response', 'created_at']
        read_only_fields = ['user', 'created_at']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'marks']

class ExamSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    class Meta:
        model = Exam
        fields = ['id', 'title', 'domain', 'difficulty', 'timer', 'total_marks', 'questions']

class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.username')
    exam_title = serializers.ReadOnlyField(source='exam.title')
    class Meta:
        model = ExamResult
        fields = ['id', 'student', 'student_name', 'exam', 'exam_title', 'score', 'total_marks', 'passed', 'timestamp']

# ─────────────────────────────────────────────────────────
# ENHANCED ASSIGNMENT SERIALIZERS
# ─────────────────────────────────────────────────────────

class AssignmentSerializer(serializers.ModelSerializer):
    batch_name = serializers.ReadOnlyField(source='batch.name')
    course_name = serializers.ReadOnlyField(source='batch.course.title')
    trainer_name = serializers.SerializerMethodField()
    submission_count = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    reference_url = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'instructions', 'batch', 'batch_name',
            'course_name', 'trainer_name', 'due_date', 'max_score', 'status',
            'attachment', 'attachment_url', 'reference_material', 'reference_url',
            'submission_count', 'created_at', 'updated_at'
        ]

    def get_trainer_name(self, obj):
        if obj.batch.trainer:
            return obj.batch.trainer.first_name or obj.batch.trainer.username
        return 'N/A'

    def get_submission_count(self, obj):
        return obj.submissions.count()

    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None

    def get_reference_url(self, obj):
        if obj.reference_material:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.reference_material.url)
            return obj.reference_material.url
        return None


class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.ReadOnlyField(source='student.email')
    assignment_title = serializers.ReadOnlyField(source='assignment.title')
    assignment_max_score = serializers.ReadOnlyField(source='assignment.max_score')
    uploaded_file_url = serializers.SerializerMethodField()

    class Meta:
        model = AssignmentSubmission
        fields = [
            'id', 'assignment', 'assignment_title', 'assignment_max_score',
            'student', 'student_name', 'student_email',
            'submission_text', 'uploaded_file', 'uploaded_file_url',
            'file_url', 'github_link', 'project_url',
            'submitted_at', 'updated_at', 'status',
            'score', 'feedback', 'suggestions', 'improvement_notes', 'evaluated_at',
            'ai_feedback', 'ai_plagiarism_score', 'ai_summary', 'ai_suggestions'
        ]

    def get_student_name(self, obj):
        return obj.student.first_name or obj.student.username

    def get_uploaded_file_url(self, obj):
        if obj.uploaded_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.uploaded_file.url)
            return obj.uploaded_file.url
        return None


# ─────────────────────────────────────────────────────────
# STUDY PLANNER SERIALIZERS
# ─────────────────────────────────────────────────────────

class StudentGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGoal
        fields = '__all__'

class StudyTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyTask
        fields = '__all__'

class StudyPlanSerializer(serializers.ModelSerializer):
    tasks = StudyTaskSerializer(many=True, read_only=True)
    class Meta:
        model = StudyPlan
        fields = '__all__'

class ProgressTrackerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgressTracker
        fields = '__all__'

from .models import Placement
class PlacementSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.first_name')
    student_email = serializers.ReadOnlyField(source='student.email')
    
    class Meta:
        model = Placement
        fields = ['id', 'student', 'student_name', 'student_email', 'company_name', 'job_role', 'package', 'placement_date', 'status', 'created_at']

from .resume_models import Resume, Education, Skill, Project, Experience, Certification, Achievement, Language, Interest, Reference, ResumeVersion, ATSAnalysis, CareerReadiness

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'

class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = '__all__'

class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = '__all__'

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'

class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'

class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = '__all__'

class ReferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reference
        fields = '__all__'

class ResumeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeVersion
        fields = '__all__'

class ATSAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ATSAnalysis
        fields = '__all__'

class CareerReadinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerReadiness
        fields = '__all__'

class ResumeSerializer(serializers.ModelSerializer):
    education_details = EducationSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    achievements = AchievementSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)
    interests = InterestSerializer(many=True, read_only=True)
    references = ReferenceSerializer(many=True, read_only=True)
    versions = ResumeVersionSerializer(many=True, read_only=True)
    ats_analyses = ATSAnalysisSerializer(many=True, read_only=True)
    
    student_name = serializers.ReadOnlyField(source='student.first_name')
    student_email = serializers.ReadOnlyField(source='student.email')
    
    class Meta:
        model = Resume
        fields = [
            'id', 'student', 'student_name', 'student_email', 
            'phone', 'address', 'linkedin', 'github', 'portfolio',
            'summary', 'template', 'ats_score', 
            'education_details', 'skills', 'projects', 'experiences',
            'certifications', 'achievements', 'languages', 'interests', 'references',
            'versions', 'ats_analyses',
            'created_at', 'updated_at'
        ]


