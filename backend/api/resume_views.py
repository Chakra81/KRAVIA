from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from .resume_models import Resume, Education, Skill, Project, Experience, Certification, Achievement, Language, Interest, Reference, ResumeVersion, ATSAnalysis
from .serializers import ResumeSerializer
from django.db import transaction
from django.utils import timezone
import json
import logging

try:
    from .ai_utils import get_gemini_response as generate_text
except ImportError:
    generate_text = None

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_resume(request):
    email = request.query_params.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        resume, created = Resume.objects.get_or_create(student=user)
        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST', 'PUT'])
def update_resume(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        resume, created = Resume.objects.get_or_create(student=user)
        
        # Update basic info
        if 'phone' in request.data: resume.phone = request.data['phone']
        if 'address' in request.data: resume.address = request.data['address']
        if 'linkedin' in request.data: resume.linkedin = request.data['linkedin']
        if 'github' in request.data: resume.github = request.data['github']
        if 'portfolio' in request.data: resume.portfolio = request.data['portfolio']
        if 'summary' in request.data: resume.summary = request.data['summary']
        if 'template' in request.data: resume.template = request.data['template']
        if 'ats_score' in request.data: resume.ats_score = request.data['ats_score']
        
        resume.save()

        with transaction.atomic():
            # Update Education
            if 'education_details' in request.data:
                Education.objects.filter(resume=resume).delete()
                for edu in request.data['education_details']:
                    edu.pop('id', None)
                    edu.pop('resume', None)
                    Education.objects.create(resume=resume, **edu)

            # Update Skills
            if 'skills' in request.data:
                Skill.objects.filter(resume=resume).delete()
                for skill in request.data['skills']:
                    skill.pop('id', None)
                    skill.pop('resume', None)
                    Skill.objects.create(resume=resume, **skill)

            # Update Projects
            if 'projects' in request.data:
                Project.objects.filter(resume=resume).delete()
                for proj in request.data['projects']:
                    proj.pop('id', None)
                    proj.pop('resume', None)
                    Project.objects.create(resume=resume, **proj)

            # Update Experiences
            if 'experiences' in request.data:
                Experience.objects.filter(resume=resume).delete()
                for exp in request.data['experiences']:
                    exp.pop('id', None)
                    exp.pop('resume', None)
                    Experience.objects.create(resume=resume, **exp)

            # Update Certifications
            if 'certifications' in request.data:
                Certification.objects.filter(resume=resume).delete()
                for cert in request.data['certifications']:
                    cert.pop('id', None)
                    cert.pop('resume', None)
                    Certification.objects.create(resume=resume, **cert)
                    
            # Update Achievements
            if 'achievements' in request.data:
                Achievement.objects.filter(resume=resume).delete()
                for ach in request.data['achievements']:
                    ach.pop('id', None)
                    ach.pop('resume', None)
                    Achievement.objects.create(resume=resume, **ach)
                    
            # Update Languages
            if 'languages' in request.data:
                Language.objects.filter(resume=resume).delete()
                for lang in request.data['languages']:
                    lang.pop('id', None)
                    lang.pop('resume', None)
                    Language.objects.create(resume=resume, **lang)

            # Update Interests
            if 'interests' in request.data:
                Interest.objects.filter(resume=resume).delete()
                for intst in request.data['interests']:
                    intst.pop('id', None)
                    intst.pop('resume', None)
                    Interest.objects.create(resume=resume, **intst)
                    
            # Update References
            if 'references' in request.data:
                Reference.objects.filter(resume=resume).delete()
                for ref in request.data['references']:
                    ref.pop('id', None)
                    ref.pop('resume', None)
                    Reference.objects.create(resume=resume, **ref)

            # Save version if requested
            if request.data.get('save_version'):
                version_name = request.data.get('version_name', f"Version {ResumeVersion.objects.filter(resume=resume).count() + 1}")
                # Serialize the current state to JSON
                current_data = ResumeSerializer(resume).data
                ResumeVersion.objects.create(
                    resume=resume,
                    version_name=version_name,
                    data=current_data
                )

        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating resume: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def get_ats_score(request):
    email = request.data.get('email')
    job_description = request.data.get('job_description', '')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        resume = Resume.objects.get(student=user)
        
        if not generate_text:
            return Response({'error': 'AI services not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
        serializer = ResumeSerializer(resume)
        resume_data = json.dumps(serializer.data, indent=2)
        
        prompt = f"""
        Act as an expert ATS (Applicant Tracking System) software and Technical Recruiter.
        I will provide a JSON representation of a student's resume.
        Analyze this resume for placement readiness and ATS compatibility.
        
        Resume Data:
        {resume_data}
        
        Target Job Description (Optional, if empty assume general software engineer):
        {job_description}
        
        Provide your analysis in the exact JSON format below. Do not include markdown formatting or backticks, just the raw JSON object.
        {{
            "ats_score": 85,
            "keyword_match_score": 80,
            "skills_score": 90,
            "formatting_score": 85,
            "project_quality_score": 88,
            "education_score": 90,
            "experience_score": 85,
            "missing_keywords": ["REST API", "Docker", "CI/CD"],
            "suggestions": [
                "Add more quantifiable results in project descriptions",
                "Include a link to your live portfolio"
            ]
        }}
        """
        
        ai_response = generate_text(prompt)
        
        if not ai_response:
            return Response({'error': 'Failed to get AI response'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Clean up any potential markdown formatting from the AI response
        if ai_response.startswith('```json'):
            ai_response = ai_response[7:-3]
        elif ai_response.startswith('```'):
            ai_response = ai_response[3:-3]
            
        try:
            analysis_data = json.loads(ai_response.strip())
            
            # Update resume ATS score
            resume.ats_score = analysis_data.get('ats_score', resume.ats_score)
            resume.save()
            
            # Save detailed analysis
            ATSAnalysis.objects.create(
                resume=resume,
                target_role=job_description,
                ats_score=analysis_data.get('ats_score', 0),
                skills_score=analysis_data.get('skills_score', 0),
                keywords_score=analysis_data.get('keyword_match_score', 0),
                experience_score=analysis_data.get('experience_score', 0),
                projects_score=analysis_data.get('project_quality_score', 0),
                education_score=analysis_data.get('education_score', 0),
                formatting_score=analysis_data.get('formatting_score', 0),
                missing_keywords=analysis_data.get('missing_keywords', []),
                suggestions=analysis_data.get('suggestions', [])
            )
            
            return Response(analysis_data, status=status.HTTP_200_OK)
        except json.JSONDecodeError:
            return Response({'error': 'Failed to parse AI response', 'raw': ai_response}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Resume.DoesNotExist:
        return Response({'error': 'Resume not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def generate_summary(request):
    """Generate a professional summary based on current skills and projects"""
    skills = request.data.get('skills', [])
    projects = request.data.get('projects', [])
    
    if not generate_text:
        return Response({'error': 'AI services not configured'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
    prompt = f"""
    Write a short, professional, 2-sentence resume summary for a candidate with the following background.
    Make it ATS-friendly and impactful. Do not use words like "I am".
    
    Skills: {', '.join(skills) if skills else 'Software Development, Web Technologies, Problem Solving'}
    Projects: {', '.join([p.get('title', '') for p in projects]) if projects else 'Academic and personal software projects'}
    
    CRITICAL INSTRUCTION: You MUST generate a READY-TO-USE summary. 
    NEVER output templates with placeholders like [Job Title], [Number], or [Skill]. 
    If specific details are missing, write a complete, generalized summary for an entry-level Software Developer or IT Professional. Do NOT provide instructions or meta-text. Only return the 2-sentence summary.
    """
    
    try:
        summary = generate_text(prompt)
        if not summary:
            return Response({'error': 'Failed to generate summary'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({'summary': summary.strip()}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def download_resume(request):
    """
    For a fully customizable and dynamic PDF generation matching Glassmorphism/Tailwind UI, 
    we recommend generating the PDF on the frontend using react-to-print or jspdf/html2canvas.
    This endpoint serves as an acknowledgment/logging point that a download occurred.
    """
    email = request.data.get('email')
    if email:
        try:
            user = User.objects.get(email=email)
            resume = Resume.objects.get(student=user)
            # Serialize the current state to JSON
            current_data = ResumeSerializer(resume).data
            # Create a version on download
            version_name = f"Downloaded on {timezone.now().strftime('%b %d, %Y %H:%M')}"
            ResumeVersion.objects.create(
                resume=resume,
                version_name=version_name,
                data=current_data
            )
        except Exception as e:
            print(f"Error creating version on download: {e}")
            pass

    return Response({'message': 'PDF generated successfully on frontend', 'status': 'success'}, status=status.HTTP_200_OK)

@api_view(['POST'])
def restore_version(request):
    """Restore a specific resume version"""
    email = request.data.get('email')
    version_id = request.data.get('version_id')
    
    if not email or not version_id:
        return Response({'error': 'Email and version_id are required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        resume = Resume.objects.get(student=user)
        version = ResumeVersion.objects.get(id=version_id, resume=resume)
        
        # We need to recreate the sections from version.data
        data = version.data
        
        with transaction.atomic():
            # Update basic info
            resume.phone = data.get('phone', '')
            resume.address = data.get('address', '')
            resume.linkedin = data.get('linkedin', '')
            resume.github = data.get('github', '')
            resume.portfolio = data.get('portfolio', '')
            resume.summary = data.get('summary', '')
            resume.template = data.get('template', 'modern')
            resume.save()
            
            # Helper to restore sections
            def restore_section(Model, key):
                Model.objects.filter(resume=resume).delete()
                for item in data.get(key, []):
                    item.pop('id', None)
                    item.pop('resume', None)
                    Model.objects.create(resume=resume, **item)
                    
            restore_section(Education, 'education_details')
            restore_section(Skill, 'skills')
            restore_section(Project, 'projects')
            restore_section(Experience, 'experiences')
            restore_section(Certification, 'certifications')
            restore_section(Achievement, 'achievements')
            restore_section(Language, 'languages')
            restore_section(Interest, 'interests')
            restore_section(Reference, 'references')
            
        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except (User.DoesNotExist, Resume.DoesNotExist, ResumeVersion.DoesNotExist):
        return Response({'error': 'User, Resume or Version not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error restoring version: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_version(request, version_id):
    """Delete a specific resume version"""
    try:
        version = ResumeVersion.objects.get(id=version_id)
        version.delete()
        return Response({'message': 'Version deleted'}, status=status.HTTP_200_OK)
    except ResumeVersion.DoesNotExist:
        return Response({'error': 'Version not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def import_platform_data(request):
    """Import data from platform (certificates, courses, exam results) to resume"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(email=email)
        resume = Resume.objects.get(student=user)
        
        # Import Certificates
        try:
            from .certificate_models import Certificate
            certs = Certificate.objects.filter(student=user)
            for cert in certs:
                # Add if not exists
                if not Certification.objects.filter(resume=resume, name=cert.course.title).exists():
                    Certification.objects.create(
                        resume=resume,
                        name=cert.course.title,
                        issuer="Training Institute",
                        date=cert.issue_date.strftime("%Y-%m-%d") if cert.issue_date else "",
                        link=getattr(cert, 'certificate_url', "")
                    )
        except ImportError:
            pass
            
        # Import Courses as achievements or skills
        try:
            from .models import Enrollment
            enrollments = Enrollment.objects.filter(student=user, status='completed')
            for en in enrollments:
                if not Achievement.objects.filter(resume=resume, title=f"Completed {en.batch.course.title}").exists():
                    Achievement.objects.create(
                        resume=resume,
                        title=f"Completed {en.batch.course.title}",
                        description=f"Successfully completed the course and passed required assignments."
                    )
        except ImportError:
            pass

        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except (User.DoesNotExist, Resume.DoesNotExist):
        return Response({'error': 'User or Resume not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error importing data: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
def delete_resume(request):
    """Delete the student's entire resume and all related sections."""
    email = request.query_params.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = User.objects.get(email=email)
        resume = Resume.objects.get(student=user)
        resume.delete()  # cascades to all related sections via on_delete=CASCADE
        return Response({'message': 'Resume deleted successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Resume.DoesNotExist:
        return Response({'message': 'No resume to delete'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error deleting resume: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
