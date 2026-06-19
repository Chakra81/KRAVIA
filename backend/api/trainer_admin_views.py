from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Course, Batch, Enrollment, Profile

@api_view(['GET', 'POST'])
def manage_course_assignment(request):
    """
    Admin: Assign trainers to courses (via Batch)
    """
    if request.method == 'GET':
        batches = Batch.objects.select_related('course', 'trainer').all()
        data = []
        for b in batches:
            data.append({
                'id': b.id,
                'course_id': b.course.id,
                'course_title': b.course.title,
                'trainer_id': b.trainer.id if b.trainer else None,
                'trainer_name': b.trainer.first_name if b.trainer else 'Unassigned',
                'batch_name': b.name,
                'start_date': b.start_date,
                'end_date': b.end_date,
                'schedule_time': b.schedule_time
            })
        return Response(data)
    elif request.method == 'POST':
        # Create a new assignment/batch
        course_id = request.data.get('course_id')
        trainer_id = request.data.get('trainer_id')
        name = request.data.get('batch_name')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        schedule_time = request.data.get('schedule_time')

        try:
            course = Course.objects.get(id=course_id)
            trainer = User.objects.get(id=trainer_id) if trainer_id else None
            batch = Batch.objects.create(
                course=course, trainer=trainer, name=name,
                start_date=start_date, end_date=end_date,
                schedule_time=schedule_time
            )
            return Response({'message': 'Batch/Assignment created successfully', 'id': batch.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
def manage_course_assignment_detail(request, pk):
    try:
        batch = Batch.objects.get(pk=pk)
        if request.method == 'PUT':
            trainer_id = request.data.get('trainer_id')
            if trainer_id:
                try:
                    trainer = User.objects.get(id=trainer_id)
                    batch.trainer = trainer
                except User.DoesNotExist:
                    pass
            batch.save()
            return Response({'message': 'Assignment updated'})
        elif request.method == 'DELETE':
            batch.delete()
            return Response({'message': 'Assignment deleted'})
    except Batch.DoesNotExist:
        return Response({'error': 'Batch not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def trainer_my_courses(request):
    """
    Trainer: Get assigned courses
    """
    email = request.query_params.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=400)
    try:
        user = User.objects.get(email=email)
        batches = Batch.objects.filter(trainer=user)
        data = []
        for b in batches:
            data.append({
                'batch_id': b.id,
                'batch_name': b.name,
                'course_id': b.course.id,
                'course_title': b.course.title,
                'schedule_time': b.schedule_time,
                'students_count': b.enrolled_students.count()
            })
        return Response(data)
    except User.DoesNotExist:
        return Response({'error': 'Trainer not found'}, status=404)

@api_view(['GET'])
def trainer_my_students(request):
    """
    Trainer: Get students for their assigned courses
    """
    email = request.query_params.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=400)
    try:
        user = User.objects.get(email=email)
        batches = Batch.objects.filter(trainer=user)
        enrollments = Enrollment.objects.filter(batch__in=batches).select_related('student', 'batch')
        data = []
        for e in enrollments:
            data.append({
                'student_id': e.student.id,
                'student_name': e.student.first_name or e.student.username,
                'student_email': e.student.email,
                'batch_name': e.batch.name,
                'course_title': e.batch.course.title,
                'joined_date': e.joined_date,
                'status': e.status
            })
        return Response(data)
    except User.DoesNotExist:
        return Response({'error': 'Trainer not found'}, status=404)
