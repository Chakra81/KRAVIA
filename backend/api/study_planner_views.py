from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import StudentGoal, StudyPlan, StudyTask, ProgressTracker, Notification
from .serializers import StudentGoalSerializer, StudyPlanSerializer, StudyTaskSerializer, ProgressTrackerSerializer
from django.utils import timezone
import json
import re
from datetime import timedelta
from .ai_utils import get_gemini_response


def get_user_by_email(email):
    """Helper: look up a User by email, return None if not found."""
    if not email:
        return None
    return User.objects.filter(email=email).first()


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def student_goals(request):
    email = request.query_params.get('email') or request.data.get('email')
    user = get_user_by_email(email)
    if not user:
        return Response({'error': 'User not found. Please provide a valid email.'}, status=400)

    if request.method == 'GET':
        goals = StudentGoal.objects.filter(student=user).order_by('-created_at')
        serializer = StudentGoalSerializer(goals, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data
        goal = StudentGoal.objects.create(
            student=user,
            title=data.get('title'),
            description=data.get('description'),
            target_date=data.get('target_date')
        )
        ProgressTracker.objects.get_or_create(student=user)
        return Response(StudentGoalSerializer(goal).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_study_plan(request):
    email = request.data.get('email')
    user = get_user_by_email(email)
    if not user:
        return Response({'error': 'User not found. Please provide a valid email.'}, status=400)

    goal_id = request.data.get('goal_id')
    try:
        goal = StudentGoal.objects.get(id=goal_id, student=user)
    except StudentGoal.DoesNotExist:
        return Response({'error': 'Goal not found'}, status=404)

    prompt = f"""
    You are an expert AI Study Planner. Create a 7-day study plan for a student whose goal is to '{goal.title}'.
    Additional details: {goal.description or 'No additional details provided'}.
    Return ONLY a valid JSON array (no markdown, no code fences) where each element has:
    - day: integer 1-7
    - title: string (short task title)
    - description: string (what to study/do)
    - task_type: one of daily, weekly, revision, quiz
    """

    def make_fallback_tasks(goal_title):
        """Generate a default 7-day plan when AI is unavailable."""
        return [
            {"day": 1, "title": f"Introduction to {goal_title}", "description": f"Start with the basics of {goal_title}. Read introductory materials and set up your study environment.", "task_type": "daily"},
            {"day": 2, "title": f"Core Concepts – {goal_title}", "description": f"Study the fundamental concepts of {goal_title}. Take notes and highlight key points.", "task_type": "daily"},
            {"day": 3, "title": f"Deep Dive – {goal_title}", "description": f"Go deeper into {goal_title}. Focus on understanding rather than memorising.", "task_type": "daily"},
            {"day": 4, "title": f"Practice Exercises", "description": f"Solve practice problems related to {goal_title}. Apply what you have learned so far.", "task_type": "daily"},
            {"day": 5, "title": f"Review & Revision", "description": f"Revise all material covered so far in {goal_title}. Create summary notes.", "task_type": "revision"},
            {"day": 6, "title": f"Mock Quiz", "description": f"Take a self-quiz on {goal_title}. Identify weak areas and revisit them.", "task_type": "quiz"},
            {"day": 7, "title": f"Weekly Summary", "description": f"Consolidate your learning for the week. Plan next steps for {goal_title}.", "task_type": "weekly"},
        ]

    try:
        tasks_data = None
        ai_used = False

        # Try AI generation
        content = get_gemini_response(prompt)
        if content:
            try:
                # Strip markdown code fences if present
                json_match = re.search(r'```(?:json)?\n?(.*?)\n?```', content, re.DOTALL)
                clean = json_match.group(1) if json_match else content.strip()
                tasks_data = json.loads(clean)
                ai_used = True
            except (json.JSONDecodeError, Exception) as parse_err:
                print(f"JSON parse error: {parse_err}")

        # Fallback to template plan if AI failed
        if not tasks_data:
            tasks_data = make_fallback_tasks(goal.title)

        # Delete existing plan for this goal and create new one
        StudyPlan.objects.filter(student=user, goal=goal).delete()

        plan = StudyPlan.objects.create(
            student=user,
            goal=goal,
            title=f"Study Plan for {goal.title}",
            generated_content=json.dumps(tasks_data)
        )

        start_date = timezone.now().date()
        for t in tasks_data:
            StudyTask.objects.create(
                plan=plan,
                title=t.get('title', f"Day {t.get('day')} Task"),
                description=t.get('description', ''),
                task_type=t.get('task_type', 'daily'),
                date=start_date + timedelta(days=int(t.get('day', 1)) - 1)
            )

        label = "AI-Powered" if ai_used else "Template"
        Notification.objects.create(
            user=user,
            title=f"{label} Study Plan Generated!",
            message=f"Your 7-day study plan for '{goal.title}' is ready. Check your Daily Plan to get started!",
            notification_type='info'
        )

        return Response(StudyPlanSerializer(plan).data)

    except Exception as e:
        print("Plan generation Error:", e)
        return Response({'error': f'Failed to create plan: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_study_plans(request):
    email = request.query_params.get('email')
    user = get_user_by_email(email)
    if not user:
        return Response({'error': 'User not found. Please provide a valid email.'}, status=400)

    plans = StudyPlan.objects.filter(student=user).order_by('-created_at')
    return Response(StudyPlanSerializer(plans, many=True).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def update_task_status(request, task_id):
    email = request.data.get('email')
    user = get_user_by_email(email)
    if not user:
        return Response({'error': 'User not found. Please provide a valid email.'}, status=400)

    try:
        task = StudyTask.objects.get(id=task_id, plan__student=user)
    except StudyTask.DoesNotExist:
        return Response({'error': 'Task not found'}, status=404)

    action = request.data.get('action')

    tracker, _ = ProgressTracker.objects.get_or_create(student=user)
    today = timezone.now().date()

    if action == 'complete':
        task.is_completed = True
        task.is_skipped = False
        task.save()

        tracker.xp_points += 50

        if tracker.last_study_date == today - timedelta(days=1):
            tracker.current_streak += 1
        elif tracker.last_study_date != today:
            tracker.current_streak = 1

        if tracker.current_streak > tracker.longest_streak:
            tracker.longest_streak = tracker.current_streak

        tracker.last_study_date = today
        tracker.save()

    elif action == 'skip':
        task.is_skipped = True
        task.is_completed = False
        task.save()

    return Response(StudyTaskSerializer(task).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_progress(request):
    email = request.query_params.get('email')
    user = get_user_by_email(email)
    if not user:
        return Response({'error': 'User not found. Please provide a valid email.'}, status=400)

    tracker, _ = ProgressTracker.objects.get_or_create(student=user)
    return Response(ProgressTrackerSerializer(tracker).data)
