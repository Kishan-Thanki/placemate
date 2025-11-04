from datetime import datetime
from django.db.models import Q
from django.conf import settings
from apps.core.models import Program
from apps.students.models import StudentProfile
from apps.core.tasks import send_email_in_background

def send_drive_notification(company_name, application_deadline, program_ids, job_title_list):
    current_calendar_year = datetime.now().year
    programs_with_duration = Program.objects.filter(id__in=program_ids).values('id', 'duration_years') 
    target_joining_years = {}
    for p in programs_with_duration:
        # Target Joining Year = Current Year - (Duration - 1)
        target_year = current_calendar_year - (p['duration_years'] - 1)
        target_joining_years[p['id']] = target_year
    
    q_objects = Q()
    for program_id, target_year in target_joining_years.items():
        q_objects |= Q(program_id=program_id, joining_year=target_year)

    final_year_students_to_notify = StudentProfile.objects.filter(
            q_objects,
            is_placed=False, 
            user__is_active=True 
        ).select_related('user').distinct()
            
    deadline_datetime = application_deadline
    
    base_email_context = {
        'company_name': company_name,
        'job_roles': job_title_list,
        'deadline': deadline_datetime.strftime('%B %#d, %Y, %I:%M %p'),
        'drive_url': settings.FRONTEND_URL
    }

    for profile in final_year_students_to_notify:
        print(f"Sending email to: {profile.user.email}")
        send_email_in_background(
            subject=f"New Campus Job From {company_name}", 
            template_name="emails/drive_notification.html", 
            context=base_email_context, 
            recipient_list=[profile.user.email]
        )