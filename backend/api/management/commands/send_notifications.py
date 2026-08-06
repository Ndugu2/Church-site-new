from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from api.models import Event, Notification, EventAttendance, MemberProfile

class Command(BaseCommand):
    help = 'Send event reminders and notifications to members'

    def handle(self, *args, **options):
        # Send event reminders 24 hours before event
        tomorrow = timezone.now() + timedelta(days=1)
        events_tomorrow = Event.objects.filter(
            date=tomorrow.date(),
            is_published=True
        )
        
        for event in events_tomorrow:
            # Get registered attendees
            attendees = EventAttendance.objects.filter(event=event, is_waitlisted=False).select_related('member')
            
            for attendance in attendees:
                member = attendance.member
                if member.user.email:
                    # Create notification
                    Notification.objects.create(
                        user=member.user,
                        title=f"Reminder: {event.title}",
                        message=f"Upcoming event '{event.title}' at {event.location}",
                        notification_type='event_reminder',
                        related_url=f'/events/{event.id}'
                    )
                    
                    # Send email
                    send_mail(
                        subject=f"Reminder: {event.title}",
                        message=f"This is a reminder that {event.title} is happening tomorrow at {event.location}.\n\nDetails:\n{event.desc}",
                        from_email='noreply@seattleinternationalchurch.org',
                        recipient_list=[member.user.email],
                        fail_silently=True,
                    )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully sent reminders for {len(list(events_tomorrow))} events'))
