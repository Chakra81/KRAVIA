from django.db import models
from django.contrib.auth.models import User

class Resume(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='resume')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    linkedin = models.URLField(blank=True, null=True)
    github = models.URLField(blank=True, null=True)
    portfolio = models.URLField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    template = models.CharField(max_length=50, default='modern')
    ats_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.username}'s Resume"

class Education(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='education_details')
    degree = models.CharField(max_length=150)
    college = models.CharField(max_length=200)
    percentage = models.CharField(max_length=20, blank=True, null=True)
    year = models.CharField(max_length=20)
    
    def __str__(self):
        return f"{self.degree} at {self.college}"

class Skill(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='skills')
    skill_name = models.CharField(max_length=100)
    skill_type = models.CharField(max_length=50, choices=(('Technical', 'Technical'), ('Soft', 'Soft')), default='Technical')
    
    def __str__(self):
        return self.skill_name

class Project(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=200)
    description = models.TextField()
    technologies = models.CharField(max_length=300, blank=True, null=True)
    github_link = models.URLField(blank=True, null=True)
    live_link = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.title

class Experience(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='experiences')
    company = models.CharField(max_length=200)
    role = models.CharField(max_length=150)
    duration = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.role} at {self.company}"

class Certification(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200)
    date = models.CharField(max_length=100, blank=True, null=True)
    link = models.URLField(blank=True, null=True)

class Achievement(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

class Language(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='languages')
    language = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=100)

class Interest(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='interests')
    interest = models.CharField(max_length=100)

class Reference(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='references')
    name = models.CharField(max_length=200)
    position = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    contact_info = models.CharField(max_length=200)

class ResumeVersion(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='versions')
    version_name = models.CharField(max_length=100)
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

class ATSAnalysis(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='ats_analyses')
    target_role = models.CharField(max_length=200, blank=True, null=True)
    ats_score = models.IntegerField(default=0)
    skills_score = models.IntegerField(default=0)
    keywords_score = models.IntegerField(default=0)
    experience_score = models.IntegerField(default=0)
    projects_score = models.IntegerField(default=0)
    education_score = models.IntegerField(default=0)
    formatting_score = models.IntegerField(default=0)
    missing_keywords = models.JSONField(default=list)
    suggestions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

class CareerReadiness(models.Model):
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='career_readiness')
    score = models.IntegerField(default=0)
    tier = models.CharField(max_length=50, default='Beginner') # Beginner, Intermediate, Advanced, Placement Ready
    breakdown = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)
