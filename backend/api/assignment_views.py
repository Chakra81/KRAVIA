from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import Assignment, AssignmentSubmission, Batch, Enrollment
from .serializers import AssignmentSerializer, AssignmentSubmissionSerializer
from django.contrib.auth.models import User
import os

# ──────────────────────────────────────────────────────────────
#  HELPER: Get Gemini AI client
# ──────────────────────────────────────────────────────────────
def get_gemini_response(prompt):
    """Call Gemini API and return text response."""
    try:
        import google.generativeai as genai
        api_key = os.environ.get('GEMINI_API_KEY', '')
        if not api_key:
            from django.conf import settings
            api_key = getattr(settings, 'GEMINI_API_KEY', '')
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini error: {e}")
        return None


# ──────────────────────────────────────────────────────────────
#  ASSIGNMENTS LIST / CREATE
# ──────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def assignments_view(request):
    if request.method == 'GET':
        email = request.query_params.get('email')
        try:
            user = User.objects.get(email=email)
            role = getattr(getattr(user, 'profile', None), 'role', 'student')
            if role == 'trainer':
                batches = Batch.objects.filter(trainer=user)
                assignments = Assignment.objects.filter(batch__in=batches).order_by('-created_at')
            elif role == 'admin':
                assignments = Assignment.objects.all().order_by('-created_at')
            else:
                # Student sees assignments for their enrolled batches, excluding drafts
                enrollments = Enrollment.objects.filter(student=user)
                batches = [e.batch for e in enrollments]
                assignments = Assignment.objects.filter(batch__in=batches).exclude(status='draft').order_by('-created_at')

            serializer = AssignmentSerializer(assignments, many=True, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

    elif request.method == 'POST':
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            role = getattr(getattr(user, 'profile', None), 'role', 'student')
            if role not in ('trainer', 'admin'):
                return Response({'error': 'Unauthorized'}, status=403)

            batch_id = request.data.get('batch_id')
            title = request.data.get('title', '').strip()
            description = request.data.get('description', '').strip()
            instructions = request.data.get('instructions', '').strip()
            due_date = request.data.get('due_date')
            max_score = request.data.get('max_score', 100)
            attachment = request.FILES.get('attachment')
            reference_material = request.FILES.get('reference_material')

            if not all([batch_id, title, description, due_date]):
                return Response({'error': 'batch_id, title, description, due_date are required'}, status=400)

            assignment_status = request.data.get('status', 'draft')

            batch = Batch.objects.get(id=batch_id)
            assignment = Assignment.objects.create(
                title=title,
                description=description,
                instructions=instructions,
                batch=batch,
                due_date=due_date,
                max_score=int(max_score),
                attachment=attachment,
                reference_material=reference_material,
                status=assignment_status,
            )
            # Notify enrolled students
            try:
                from .models import Notification
                students = Enrollment.objects.filter(batch=batch).select_related('student')
                for enrollment in students:
                    Notification.objects.create(
                        user=enrollment.student,
                        title=f"New Assignment: {title} 📝",
                        message=f"A new assignment has been posted for {batch.course.title}. Due: {due_date[:10] if due_date else 'TBD'}",
                        notification_type="assignment"
                    )
            except Exception as e:
                print(f"Notification error: {e}")

            return Response(AssignmentSerializer(assignment, context={'request': request}).data, status=201)
        except Batch.DoesNotExist:
            return Response({'error': 'Batch not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


# ──────────────────────────────────────────────────────────────
#  ASSIGNMENT DETAIL: GET / PUT / DELETE
# ──────────────────────────────────────────────────────────────
@api_view(['GET', 'PUT', 'DELETE'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def assignment_detail_view(request, assignment_id):
    try:
        assignment = Assignment.objects.get(id=assignment_id)
    except Assignment.DoesNotExist:
        return Response({'error': 'Assignment not found'}, status=404)

    if request.method == 'GET':
        return Response(AssignmentSerializer(assignment, context={'request': request}).data)

    elif request.method == 'PUT':
        try:
            if 'title' in request.data:
                assignment.title = request.data['title']
            if 'description' in request.data:
                assignment.description = request.data['description']
            if 'instructions' in request.data:
                assignment.instructions = request.data['instructions']
            if 'due_date' in request.data:
                assignment.due_date = request.data['due_date']
            if 'max_score' in request.data:
                assignment.max_score = int(request.data['max_score'])
            if 'status' in request.data:
                assignment.status = request.data['status']
            if 'attachment' in request.FILES:
                assignment.attachment = request.FILES['attachment']
            if 'reference_material' in request.FILES:
                assignment.reference_material = request.FILES['reference_material']
            assignment.save()
            return Response(AssignmentSerializer(assignment, context={'request': request}).data)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    elif request.method == 'DELETE':
        assignment.delete()
        return Response({'message': 'Assignment deleted successfully'})


# ──────────────────────────────────────────────────────────────
#  SUBMISSIONS: LIST / CREATE
# ──────────────────────────────────────────────────────────────
@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def submissions_view(request, assignment_id):
    if request.method == 'GET':
        email = request.query_params.get('email')
        try:
            user = User.objects.get(email=email)
            role = getattr(getattr(user, 'profile', None), 'role', 'student')
            if role == 'student':
                submissions = AssignmentSubmission.objects.filter(
                    assignment_id=assignment_id, student=user
                )
            else:
                # Trainer/Admin sees all
                submissions = AssignmentSubmission.objects.filter(assignment_id=assignment_id)
            serializer = AssignmentSubmissionSerializer(submissions, many=True, context={'request': request})
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    elif request.method == 'POST':
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            assignment = Assignment.objects.get(id=assignment_id)

            # Check deadline
            if timezone.now() > assignment.due_date:
                return Response({'error': 'Deadline has passed. Submission not allowed.'}, status=400)

            uploaded_file = request.FILES.get('uploaded_file')
            submission_text = request.data.get('submission_text', '')
            file_url = request.data.get('file_url', '')
            github_link = request.data.get('github_link', '')
            project_url = request.data.get('project_url', '')

            submission, created = AssignmentSubmission.objects.update_or_create(
                assignment=assignment,
                student=user,
                defaults={
                    'submission_text': submission_text,
                    'file_url': file_url,
                    'github_link': github_link,
                    'project_url': project_url,
                    'status': 'resubmitted' if not created else 'submitted',
                }
            )
            # Handle file upload separately (don't overwrite with None)
            if uploaded_file:
                submission.uploaded_file = uploaded_file
                submission.save()
            if created:
                submission.status = 'submitted'
                submission.save()

            # Notify trainer
            try:
                from .models import Notification
                if assignment.batch.trainer:
                    Notification.objects.create(
                        user=assignment.batch.trainer,
                        title=f"New Submission: {assignment.title} 📬",
                        message=f"{user.first_name or user.username} submitted assignment '{assignment.title}'.",
                        notification_type="assignment"
                    )
            except Exception as e:
                print(f"Submission notification error: {e}")

            return Response(
                AssignmentSubmissionSerializer(submission, context={'request': request}).data,
                status=201
            )
        except Assignment.DoesNotExist:
            return Response({'error': 'Assignment not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)


# ──────────────────────────────────────────────────────────────
#  EVALUATE / GRADE SUBMISSION
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
def grade_submission(request, submission_id):
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        role = getattr(getattr(user, 'profile', None), 'role', 'student')
        if role not in ('trainer', 'admin'):
            return Response({'error': 'Unauthorized'}, status=403)

        submission = AssignmentSubmission.objects.get(id=submission_id)
        submission.score = request.data.get('score')
        submission.feedback = request.data.get('feedback', '')
        submission.suggestions = request.data.get('suggestions', '')
        submission.improvement_notes = request.data.get('improvement_notes', '')
        submission.status = request.data.get('status', 'evaluated')  # 'evaluated' or 'rework'
        submission.evaluated_at = timezone.now()
        submission.save()

        # Notify student
        try:
            from .models import Notification
            Notification.objects.create(
                user=submission.student,
                title=f"Assignment Evaluated: {submission.assignment.title} ✅",
                message=f"Your assignment has been graded. Score: {submission.score}/{submission.assignment.max_score}",
                notification_type="assignment"
            )
        except Exception as e:
            print(f"Grade notification error: {e}")

        return Response(
            AssignmentSubmissionSerializer(submission, context={'request': request}).data,
            status=200
        )
    except AssignmentSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


# ──────────────────────────────────────────────────────────────
#  AI: GENERATE FEEDBACK FOR SUBMISSION
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
def ai_assignment_feedback(request, submission_id):
    """Generate AI feedback for a student submission."""
    email = request.data.get('email')
    try:
        user = User.objects.get(email=email)
        role = getattr(getattr(user, 'profile', None), 'role', 'student')
        submission = AssignmentSubmission.objects.get(id=submission_id)

        # Build context for AI
        context_text = f"""
Assignment: {submission.assignment.title}
Description: {submission.assignment.description}
Instructions: {submission.assignment.instructions or 'N/A'}
Student Submission: {submission.submission_text or '(No text - file submission)'}
GitHub: {submission.github_link or 'N/A'}
Project URL: {submission.project_url or 'N/A'}
"""
        # AI Feedback
        feedback_prompt = f"""
You are an expert educational evaluator. Analyze this student assignment submission and provide detailed, constructive feedback.

{context_text}

Provide:
1. Overall quality assessment (2-3 sentences)
2. Strengths (bullet points)
3. Areas for improvement (bullet points)
4. Specific suggestions for better code/documentation quality
5. A score estimate out of 10

Keep it professional, encouraging, and actionable.
"""
        ai_feedback = get_gemini_response(feedback_prompt)

        # AI Summary
        summary_prompt = f"""
Summarize this assignment submission in 3-4 sentences for a trainer's quick review:

{context_text}

Be concise and highlight the key points of what the student did.
"""
        ai_summary = get_gemini_response(summary_prompt)

        # AI Plagiarism check (basic text similarity heuristic via AI)
        plagiarism_prompt = f"""
Analyze this student submission for potential plagiarism or copied content. 
Check if the text seems original vs. copied from documentation or other sources.

Submission text: {submission.submission_text or 'File submission - cannot analyze text'}

Return ONLY a JSON object like: {{"score": 15, "verdict": "Likely Original", "reason": "brief reason"}}
Score 0-100 where 0=completely original, 100=completely plagiarized.
"""
        ai_plagiarism_raw = get_gemini_response(plagiarism_prompt)
        plagiarism_score = 0
        try:
            import json, re
            match = re.search(r'\{.*?\}', ai_plagiarism_raw, re.DOTALL)
            if match:
                plag_data = json.loads(match.group())
                plagiarism_score = plag_data.get('score', 0)
        except Exception:
            plagiarism_score = 0

        # AI Improvement suggestions
        suggestions_prompt = f"""
For this assignment submission, provide 3-5 specific improvement suggestions:

Assignment: {submission.assignment.title}
Student work: {submission.submission_text or 'File submission'}

Focus on:
- Better coding practices (if applicable)
- Documentation improvements
- Missing sections or requirements
- Professional quality improvements

Format as numbered list.
"""
        ai_suggestions = get_gemini_response(suggestions_prompt)

        # Save AI data to submission
        submission.ai_feedback = ai_feedback
        submission.ai_summary = ai_summary
        submission.ai_plagiarism_score = plagiarism_score
        submission.ai_suggestions = ai_suggestions
        submission.save()

        return Response({
            'ai_feedback': ai_feedback,
            'ai_summary': ai_summary,
            'ai_plagiarism_score': plagiarism_score,
            'ai_suggestions': ai_suggestions,
        }, status=200)

    except AssignmentSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


# ──────────────────────────────────────────────────────────────
#  STUDENT: ASSIGNMENT HISTORY
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
def student_assignment_history(request):
    """Returns all submissions by a student with grades and feedback."""
    email = request.query_params.get('email')
    try:
        user = User.objects.get(email=email)
        submissions = AssignmentSubmission.objects.filter(student=user).select_related('assignment')
        serializer = AssignmentSubmissionSerializer(submissions, many=True, context={'request': request})
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


# ──────────────────────────────────────────────────────────────
#  ADMIN: ASSIGNMENT ANALYTICS
# ──────────────────────────────────────────────────────────────
@api_view(['GET'])
def admin_assignment_analytics(request):
    """Admin dashboard assignment statistics."""
    email = request.query_params.get('email')
    try:
        user = User.objects.get(email=email)
        role = getattr(getattr(user, 'profile', None), 'role', 'student')
        if role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)

        total_assignments = Assignment.objects.count()
        total_submissions = AssignmentSubmission.objects.count()
        pending_submissions = AssignmentSubmission.objects.filter(status='submitted').count()
        under_review = AssignmentSubmission.objects.filter(status='under_review').count()
        evaluated = AssignmentSubmission.objects.filter(status='evaluated').count()
        needs_rework = AssignmentSubmission.objects.filter(status='rework').count()

        # Completion rate
        completion_rate = round((evaluated / total_submissions * 100), 1) if total_submissions > 0 else 0

        # Course-wise stats
        from .models import Course
        course_stats = []
        for course in Course.objects.all():
            batches = course.batches.all()
            course_assignments = Assignment.objects.filter(batch__in=batches)
            course_submissions = AssignmentSubmission.objects.filter(assignment__in=course_assignments)
            course_evaluated = course_submissions.filter(status='evaluated').count()
            total = course_submissions.count()
            course_stats.append({
                'course': course.title,
                'total_assignments': course_assignments.count(),
                'total_submissions': total,
                'evaluated': course_evaluated,
                'completion_rate': round((course_evaluated / total * 100), 1) if total > 0 else 0,
            })

        # Trainer evaluation stats
        trainer_stats = []
        from .models import Profile
        for trainer_profile in Profile.objects.filter(role='trainer'):
            trainer = trainer_profile.user
            trainer_batches = Batch.objects.filter(trainer=trainer)
            trainer_assignments = Assignment.objects.filter(batch__in=trainer_batches)
            trainer_submissions = AssignmentSubmission.objects.filter(assignment__in=trainer_assignments)
            trainer_evaluated = trainer_submissions.filter(status='evaluated').count()
            trainer_stats.append({
                'trainer': trainer.first_name or trainer.username,
                'total_assignments': trainer_assignments.count(),
                'total_submissions': trainer_submissions.count(),
                'evaluated': trainer_evaluated,
            })

        return Response({
            'total_assignments': total_assignments,
            'total_submissions': total_submissions,
            'pending': pending_submissions,
            'under_review': under_review,
            'evaluated': evaluated,
            'needs_rework': needs_rework,
            'completion_rate': completion_rate,
            'course_stats': course_stats,
            'trainer_stats': trainer_stats,
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


# ──────────────────────────────────────────────────────────────
#  TRAINER: MARK SUBMISSION STATUS (under_review / rework)
# ──────────────────────────────────────────────────────────────
@api_view(['POST'])
def update_submission_status(request, submission_id):
    email = request.data.get('email')
    new_status = request.data.get('status')
    try:
        user = User.objects.get(email=email)
        role = getattr(getattr(user, 'profile', None), 'role', 'student')
        if role not in ('trainer', 'admin'):
            return Response({'error': 'Unauthorized'}, status=403)

        submission = AssignmentSubmission.objects.get(id=submission_id)
        valid_statuses = ['under_review', 'rework', 'evaluated', 'submitted']
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Use: {valid_statuses}'}, status=400)

        submission.status = new_status
        submission.save()

        # Notify student on rework
        if new_status == 'rework':
            try:
                from .models import Notification
                Notification.objects.create(
                    user=submission.student,
                    title=f"Assignment Needs Rework: {submission.assignment.title} 🔄",
                    message=f"Your trainer has requested rework on '{submission.assignment.title}'. Please review and resubmit.",
                    notification_type="assignment"
                )
            except Exception:
                pass

        return Response(AssignmentSubmissionSerializer(submission, context={'request': request}).data)
    except AssignmentSubmission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)
