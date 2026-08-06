from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Sermon(models.Model):
    title = models.CharField(max_length=255)
    speaker = models.CharField(max_length=255)
    date = models.DateField()
    passage = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    youtube_id = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    scheduled_publish = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Event(models.Model):
    title = models.CharField(max_length=255)
    date = models.DateField()
    location = models.CharField(max_length=255)
    category = models.CharField(max_length=100, default='General')
    capacity = models.PositiveIntegerField(null=True, blank=True)
    waitlist_enabled = models.BooleanField(default=True)
    desc = models.TextField()
    scheduled_publish = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class PrayerRequest(models.Model):
    name = models.CharField(max_length=255, blank=True, default="Anonymous")
    content = models.TextField()
    confidential = models.BooleanField(default=False)
    follow_up_status = models.CharField(max_length=30, choices=[
        ('received', 'Received'),
        ('assigned', 'Assigned to Prayer Team'),
        ('contacted', 'Contacted'),
        ('ongoing', 'Ongoing Prayer Support'),
        ('completed', 'Follow-up Completed'),
    ], default='received')
    care_request_type = models.CharField(max_length=50, choices=[
        ('none', 'No Additional Care Needed'),
        ('pastoral_call', 'Pastoral Call'),
        ('elder_visit', 'Elder Visit'),
        ('counseling', 'Counseling Support'),
        ('prayer_partner', 'Prayer Partner'),
    ], default='none')
    follow_up_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Prayer from {self.name}"


class BibleStudyGroup(models.Model):
    FORMAT_CHOICES = [
        ('in_person', 'In Person'),
        ('online', 'Online'),
        ('hybrid', 'Hybrid'),
    ]
    name = models.CharField(max_length=120, unique=True)
    topic = models.CharField(max_length=255, blank=True, default='')
    meeting_day = models.CharField(max_length=40, blank=True, default='')
    meeting_time = models.CharField(max_length=40, blank=True, default='')
    format = models.CharField(max_length=30, choices=FORMAT_CHOICES, blank=True, default='')
    leader_name = models.CharField(max_length=150, blank=True, default='')
    description = models.TextField(blank=True, default='')
    max_members = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        return BibleStudy.objects.filter(group_name=self.name).count()

class BibleStudy(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    course = models.CharField(max_length=255)
    group_name = models.CharField(max_length=120, blank=True, default='')
    registration_type = models.CharField(max_length=30, default='individual')
    preferred_meeting_day = models.CharField(max_length=40, blank=True, default='')
    preferred_meeting_time = models.CharField(max_length=40, blank=True, default='')
    preferred_group_format = models.CharField(max_length=30, blank=True, default='')
    small_group_notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=100, default="Pending Guide Assignment")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.course}"

class Donation(models.Model):
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    fund = models.CharField(max_length=100)
    method = models.CharField(max_length=100)
    status = models.CharField(max_length=100, default="Completed Stewardship")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount} UGX for {self.fund}"

class Project(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    desc = models.TextField()
    goal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    raised_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    image_url = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=100, default="Active")
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ProjectUpdateLog(models.Model):
    """Audit log for project create/update/delete actions."""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='update_logs')
    project_title = models.CharField(max_length=255)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    changed_fields = models.JSONField(default=dict, blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project_title} - {self.action}"

class LessonVideo(models.Model):
    week = models.IntegerField(unique=True)
    title = models.CharField(max_length=255)
    date = models.DateField()
    youtube_id = models.CharField(max_length=100)
    desc = models.TextField()

    def __str__(self):
        return f"Week {self.week}: {self.title}"


# ============== NEW FEATURES ==============

class MemberProfile(models.Model):
    """Extended user profile for members"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='member_profile')
    phone = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    ministry = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=50, choices=[
        ('member', 'Member'),
        ('leader', 'Leader'),
        ('pastor', 'Pastor'),
        ('admin', 'Admin')
    ], default='member')
    profile_picture = models.URLField(blank=True)
    joined_date = models.DateTimeField(auto_now_add=True)
    total_tithe = models.DecimalField(max_digits=12, decimal_places=2, default=0.0)
    attendance_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class BlogPost(models.Model):
    """Blog/News posts"""
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('normal', 'Normal'),
        ('low', 'Low'),
    ]
    AUDIENCE_CHOICES = [
        ('all_church', 'All Church'),
        ('youth', 'Youth'),
        ('leaders', 'Leaders'),
        ('new_members', 'New Members'),
        ('ministry_team', 'Ministry Team'),
    ]
    MISSION_TAG_CHOICES = [
        ('prayer', 'Prayer'),
        ('strengthening', 'Strengthening'),
        ('growth', 'Growth'),
        ('service', 'Service'),
        ('worship', 'Worship'),
        ('administration', 'Administration'),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    featured_image = models.URLField(blank=True)
    category = models.CharField(max_length=100, choices=[
        ('news', 'News'),
        ('biblical', 'Biblical Insight'),
        ('announcement', 'Announcement'),
        ('testimonial', 'Testimonial'),
        ('other', 'Other')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    scheduled_publish = models.DateTimeField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal')
    audience = models.CharField(max_length=30, choices=AUDIENCE_CHOICES, default='all_church')
    action_required = models.BooleanField(default=False)
    cta_text = models.CharField(max_length=120, blank=True)
    cta_link = models.URLField(blank=True)
    mission_tag = models.CharField(max_length=30, choices=MISSION_TAG_CHOICES, default='administration')
    views = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Testimony(models.Model):
    """Member testimonies/faith stories"""
    author = models.ForeignKey(MemberProfile, on_delete=models.CASCADE, related_name='testimonies')
    title = models.CharField(max_length=255)
    testimony_type = models.CharField(max_length=50, choices=[
        ('prayer_answered', 'Prayer Answered'),
        ('spiritual_growth', 'Spiritual Growth'),
        ('community_support', 'Community Support'),
        ('healing_restoration', 'Healing and Restoration'),
        ('outreach_impact', 'Outreach Impact'),
    ], default='spiritual_growth')
    content = models.TextField()
    image = models.URLField(blank=True)
    next_step = models.CharField(max_length=50, choices=[
        ('none', 'No Follow-up Needed'),
        ('mentor', 'Connect to Mentor'),
        ('growth_class', 'Invite to Growth Class'),
        ('prayer_team', 'Connect to Prayer Team'),
        ('service_team', 'Connect to Service Team'),
    ], default='none')
    created_at = models.DateTimeField(auto_now_add=True)
    is_featured = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.user.username}: {self.title}"


class ForumCategory(models.Model):
    """Discussion forum categories"""
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Forum Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class ForumThread(models.Model):
    """Forum discussion threads"""
    category = models.ForeignKey(ForumCategory, on_delete=models.CASCADE, related_name='threads')
    title = models.CharField(max_length=255)
    author = models.ForeignKey(MemberProfile, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    pinned = models.BooleanField(default=False)
    closed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-pinned', '-updated_at']

    def __str__(self):
        return self.title


class ForumPost(models.Model):
    """Replies to forum threads"""
    thread = models.ForeignKey(ForumThread, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(MemberProfile, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.IntegerField(default=0)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Post by {self.author.user.username}"


class StaffMember(models.Model):
    """Staff/Leadership directory"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    position = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    bio = models.TextField()
    photo = models.URLField()
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'department']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.position}"


class PageView(models.Model):
    """Analytics - page views and engagement"""
    page = models.CharField(max_length=255)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    timestamp = models.DateTimeField(auto_now_add=True)
    session_id = models.CharField(max_length=255, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['page', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.page} - {self.timestamp}"


class EngagementMetric(models.Model):
    """Track user engagement"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='engagement_metrics')
    action = models.CharField(max_length=100)  # 'viewed_sermon', 'donated', 'attended_event', etc.
    value = models.IntegerField(default=1)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username}: {self.action}"


class Payment(models.Model):
    """Payment transactions"""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='UGX')
    payment_type = models.CharField(max_length=100, choices=[
        ('tithe', 'Tithe'),
        ('offering', 'Offering'),
        ('project', 'Project Donation'),
        ('event', 'Event Registration'),
    ])
    status = models.CharField(max_length=50, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ], default='pending')
    transaction_id = models.CharField(max_length=255, unique=True)
    payment_method = models.CharField(max_length=100)  # 'stripe', 'paypal', 'mobile_money'
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.amount} {self.currency} - {self.payment_type}"


class Notification(models.Model):
    """User notifications"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=[
        ('event_reminder', 'Event Reminder'),
        ('prayer_answered', 'Prayer Answered'),
        ('forum_reply', 'Forum Reply'),
        ('system', 'System'),
        ('announcement', 'Announcement'),
    ])
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_url = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.title}"


class EventAttendance(models.Model):
    """Track event attendance"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendees')
    member = models.ForeignKey(MemberProfile, on_delete=models.CASCADE)
    contact_name = models.CharField(max_length=255, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    contact_phone = models.CharField(max_length=50, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    is_waitlisted = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False)

    class Meta:
        unique_together = ('event', 'member')

    def __str__(self):
        return f"{self.member.user.username} - {self.event.title}"


class PrayerSupport(models.Model):
    """Track prayer request supporters"""
    prayer_request = models.ForeignKey(PrayerRequest, on_delete=models.CASCADE, related_name='supporters')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('prayer_request', 'user')

    def __str__(self):
        return f"{self.user.username} supports prayer"


class HymnBook(models.Model):
    """Hymn book collections like Bridge Hymnal, Spirit of Prophecy, etc."""
    title = models.CharField(max_length=255, unique=True)
    abbreviation = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    publisher = models.CharField(max_length=255, blank=True)
    year = models.IntegerField(blank=True, null=True)
    hymn_count = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class Hymn(models.Model):
    """Individual hymns with lyrics, number, and metadata"""
    hymn_book = models.ForeignKey(HymnBook, on_delete=models.CASCADE, related_name='hymns')
    number = models.IntegerField()  # Hymn number in the book
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255, blank=True)
    composer = models.CharField(max_length=255, blank=True)
    lyrics = models.TextField()  # Full lyrics with verse/chorus formatting
    theme = models.CharField(max_length=100, blank=True)  # e.g., "Praise", "Thanksgiving", "Trust"
    tune_name = models.CharField(max_length=255, blank=True)  # Name of the tune/melody
    audio_url = models.URLField(blank=True, null=True)  # URL to audio file
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['hymn_book', 'number']
        unique_together = ('hymn_book', 'number')

    def __str__(self):
        return f"{self.hymn_book.abbreviation} #{self.number}: {self.title}"


class SabbathProgramme(models.Model):
    """Backend source of truth for each Sabbath programme entry."""
    service_date = models.DateField(unique=True)
    theme = models.CharField(max_length=255)
    content = models.JSONField(default=dict)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['service_date']

    def __str__(self):
        return f"{self.service_date}: {self.theme}"


class CommunityOutreachPage(models.Model):
    """Managed content for the Community Outreach page."""
    page_key = models.CharField(max_length=80, unique=True, default='community-outreach')
    hero_title = models.CharField(max_length=255, default='Community Outreach')
    hero_subtitle = models.TextField(default='We visit the sick, comfort the grieving, and stand beside those in crisis — because love is not just a feeling, it is an action.')
    stats = models.JSONField(default=list)
    programs = models.JSONField(default=list)
    upcoming_visits = models.JSONField(default=list)
    testimonials = models.JSONField(default=list)
    contact_points = models.JSONField(default=list)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page_key']

    def __str__(self):
        return self.hero_title


class GalleryImage(models.Model):
    """Managed gallery image metadata."""
    album = models.CharField(max_length=120)
    title = models.CharField(max_length=255)
    img_url = models.URLField(max_length=500)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.album}: {self.title}"


class GoBackToSchoolPage(models.Model):
    """Managed content for the Go Back To School project page."""
    page_key = models.CharField(max_length=80, unique=True, default='go-back-to-school')
    hero_title = models.CharField(max_length=255, default='Go Back to School Project')
    hero_subtitle = models.TextField(default='Volunteers like you are the reason children go back to class')
    overall_fundraising_title = models.CharField(max_length=255, default='Current Fundraising Campaign')
    overall_fundraising_copy = models.TextField(default='We are raising funds for students this term. Every contribution goes 100% directly to a student\'s education.')
    overall_stats = models.JSONField(default=list)
    student_cases = models.JSONField(default=list)
    ways_to_give = models.JSONField(default=list)
    impact_levels = models.JSONField(default=list)
    contact_points = models.JSONField(default=list)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['page_key']

    def __str__(self):
        return self.hero_title


class AdminAuditLog(models.Model):
    """Generic audit trail for admin/staff write actions across resources."""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    ]

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='admin_audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    resource_type = models.CharField(max_length=120)
    resource_id = models.CharField(max_length=50, blank=True)
    resource_label = models.CharField(max_length=255, blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} {self.resource_type} by {self.actor_id or 'system'}"
