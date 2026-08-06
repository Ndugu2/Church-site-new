from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Sermon, Event, PrayerRequest, BibleStudy, BibleStudyGroup, Donation, Project, LessonVideo,
    MemberProfile, BlogPost, Testimony, ForumCategory, ForumThread, ForumPost,
    StaffMember, PageView, EngagementMetric, Payment, Notification, 
    EventAttendance, PrayerSupport, HymnBook, Hymn, SabbathProgramme, CommunityOutreachPage, GalleryImage, GoBackToSchoolPage, ProjectUpdateLog,
    AdminAuditLog
)

class SermonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sermon
        fields = '__all__'

class BibleStudyGroupSerializer(serializers.ModelSerializer):
    member_count = serializers.ReadOnlyField()

    class Meta:
        model = BibleStudyGroup
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    attendee_count = serializers.SerializerMethodField()
    waitlist_count = serializers.SerializerMethodField()
    seats_remaining = serializers.SerializerMethodField()

    def get_attendee_count(self, obj):
        return obj.attendees.filter(is_waitlisted=False).count()

    def get_waitlist_count(self, obj):
        return obj.attendees.filter(is_waitlisted=True).count()

    def get_seats_remaining(self, obj):
        if obj.capacity is None:
            return None
        confirmed = obj.attendees.filter(is_waitlisted=False).count()
        return max(obj.capacity - confirmed, 0)

    class Meta:
        model = Event
        fields = '__all__'

class PrayerRequestSerializer(serializers.ModelSerializer):
    support_count = serializers.SerializerMethodField()
    
    class Meta:
        model = PrayerRequest
        fields = '__all__'
    
    def get_support_count(self, obj):
        return obj.supporters.count()

class BibleStudySerializer(serializers.ModelSerializer):
    class Meta:
        model = BibleStudy
        fields = '__all__'

class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = '__all__'
    
    def get_progress(self, obj):
        if obj.goal_amount == 0:
            return 0
        return min(100, int((obj.raised_amount / obj.goal_amount) * 100))


class ProjectUpdateLogSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = ProjectUpdateLog
        fields = '__all__'


class AdminAuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True)

    class Meta:
        model = AdminAuditLog
        fields = '__all__'

class LessonVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonVideo
        fields = '__all__'


# ============== NEW SERIALIZERS ==============

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class MemberProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = MemberProfile
        fields = '__all__'

class BlogPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    def validate(self, attrs):
        category = attrs.get('category', getattr(self.instance, 'category', None))
        cta_text = attrs.get('cta_text', getattr(self.instance, 'cta_text', ''))
        cta_link = attrs.get('cta_link', getattr(self.instance, 'cta_link', ''))
        expires_at = attrs.get('expires_at', getattr(self.instance, 'expires_at', None))
        scheduled_publish = attrs.get('scheduled_publish', getattr(self.instance, 'scheduled_publish', None))

        if category == 'announcement':
            # Keep legacy frontend behavior: if one CTA field is present, require the other.
            if bool(cta_text) != bool(cta_link):
                raise serializers.ValidationError('Both cta_text and cta_link are required when either is provided.')

            if expires_at and scheduled_publish and expires_at <= scheduled_publish:
                raise serializers.ValidationError('expires_at must be later than scheduled_publish.')

        return attrs
    
    class Meta:
        model = BlogPost
        fields = '__all__'

class TestimonySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.user.get_full_name', read_only=True)
    author_id = serializers.IntegerField(source='author.id', read_only=True)
    
    class Meta:
        model = Testimony
        fields = '__all__'

class ForumCategorySerializer(serializers.ModelSerializer):
    thread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumCategory
        fields = '__all__'
    
    def get_thread_count(self, obj):
        return obj.threads.count()

class ForumPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.user.get_full_name', read_only=True)
    
    class Meta:
        model = ForumPost
        fields = '__all__'
        read_only_fields = ['author', 'author_name', 'created_at', 'updated_at', 'likes']

class ForumThreadSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.user.get_full_name', read_only=True)
    posts = ForumPostSerializer(many=True, read_only=True)
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumThread
        fields = '__all__'
        read_only_fields = ['author', 'author_name', 'created_at', 'updated_at', 'posts', 'post_count']
    
    def get_post_count(self, obj):
        return obj.posts.count()

class StaffMemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = StaffMember
        fields = '__all__'

class PageViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PageView
        fields = '__all__'

class EngagementMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngagementMetric
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class EventAttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.user.get_full_name', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    event_date = serializers.DateField(source='event.date', read_only=True)
    rsvp_status = serializers.SerializerMethodField()

    def get_rsvp_status(self, obj):
        if obj.attended:
            return 'attended'
        if obj.is_waitlisted:
            return 'waitlisted'
        return 'registered'
    
    class Meta:
        model = EventAttendance
        fields = '__all__'

class PrayerSupportSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = PrayerSupport
        fields = '__all__'


class HymnSerializer(serializers.ModelSerializer):
    hymn_book_title = serializers.CharField(source='hymn_book.title', read_only=True)
    hymn_book_abbr = serializers.CharField(source='hymn_book.abbreviation', read_only=True)
    
    class Meta:
        model = Hymn
        fields = '__all__'


class HymnBookSerializer(serializers.ModelSerializer):
    hymns = HymnSerializer(many=True, read_only=True)
    
    class Meta:
        model = HymnBook
        fields = '__all__'


class SabbathProgrammeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SabbathProgramme
        fields = '__all__'


class CommunityOutreachPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunityOutreachPage
        fields = '__all__'


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'


class GoBackToSchoolPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoBackToSchoolPage
        fields = '__all__'
