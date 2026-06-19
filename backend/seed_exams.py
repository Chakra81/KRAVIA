import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Exam, Question

def seed_exams():
    # 1. Python Full Stack Exam
    python_exam, _ = Exam.objects.get_or_create(
        title="Python Basics Certification",
        domain="Python Full Stack",
        difficulty="Beginner",
        defaults={
            'timer': 300, # 5 mins
            'total_marks': 50
        }
    )
    
    if not python_exam.questions.exists():
        questions_py = [
            ("What is the output of print(2 ** 3)?", "6", "8", "9", "Error", "B", 10),
            ("Which keyword is used to define a function in Python?", "func", "def", "function", "lambda", "B", 10),
            ("What data type is the object [1, 2, 3]?", "Tuple", "Dictionary", "List", "Set", "C", 10),
            ("Which of the following is mutable?", "Tuple", "String", "List", "Integer", "C", 10),
            ("How do you insert comments in Python code?", "// comment", "/* comment */", "# comment", "<!-- comment -->", "C", 10)
        ]
        
        for text, a, b, c, d, correct, marks in questions_py:
            Question.objects.create(
                exam=python_exam,
                text=text,
                option_a=a,
                option_b=b,
                option_c=c,
                option_d=d,
                correct_option=correct,
                marks=marks
            )
        print("Python Full Stack exam created.")
        
    # 2. ReactJS Exam
    react_exam, _ = Exam.objects.get_or_create(
        title="ReactJS Fundamentals",
        domain="ReactJS",
        difficulty="Intermediate",
        defaults={
            'timer': 300,
            'total_marks': 50
        }
    )
    
    if not react_exam.questions.exists():
        questions_react = [
            ("What is the virtual DOM?", "A direct copy of the real DOM", "A lightweight Javascript representation of the DOM", "A browser extension", "A backend database", "B", 10),
            ("Which hook is used to manage state in a functional component?", "useEffect", "useContext", "useState", "useReducer", "C", 10),
            ("What are props in React?", "Internal state", "External libraries", "Arguments passed into React components", "DOM elements", "C", 10),
            ("Which lifecycle method is replaced by useEffect?", "componentDidMount", "componentDidUpdate", "componentWillUnmount", "All of the above", "D", 10),
            ("How do you pass data to child components?", "Using state", "Using context", "Using props", "Using refs", "C", 10)
        ]
        
        for text, a, b, c, d, correct, marks in questions_react:
            Question.objects.create(
                exam=react_exam,
                text=text,
                option_a=a,
                option_b=b,
                option_c=c,
                option_d=d,
                correct_option=correct,
                marks=marks
            )
        print("ReactJS exam created.")

if __name__ == '__main__':
    seed_exams()
