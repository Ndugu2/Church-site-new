from django.contrib import admin
from .models import (
    Sermon, Event, PrayerRequest, BibleStudy, Donation, Project, LessonVideo,
    MemberProfile, BlogPost, Testimony, ForumCategory, ForumThread, ForumPost,
    StaffMember, PageView, EngagementMetric, Payment, Notification,
    EventAttendance, PrayerSupport, HymnBook, Hymn, SabbathProgramme, CommunityOutreachPage, GalleryImage, GoBackToSchoolPage, ProjectUpdateLog,
    AdminAuditLog
)


@admin.register(Sermon)
class SermonAdmin(admin.ModelAdmin):
    list_display = ('title', 'speaker', 'date', 'category', 'is_published')
    list_filter = ('category', 'is_published', 'date')
    search_fields = ('title', 'speaker', 'passage')
    ordering = ('-date',)
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Basic Info', {'fields': ('title', 'speaker', 'date', 'passage', 'category')}),
        ('Content', {'fields': ('description', 'youtube_id')}),
        ('Publishing', {'fields': ('is_published', 'scheduled_publish', 'created_at')}),
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'location', 'category', 'capacity', 'waitlist_enabled', 'is_published')
    list_filter = ('category', 'waitlist_enabled', 'is_published', 'date')
    search_fields = ('title', 'location')
    ordering = ('date',)
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Basic Info', {'fields': ('title', 'date', 'location', 'category')}),
        ('Registration', {'fields': ('capacity', 'waitlist_enabled')}),
        ('Details', {'fields': ('desc',)}),
        ('Publishing', {'fields': ('is_published', 'scheduled_publish', 'created_at')}),
    )


@admin.register(PrayerRequest)
class PrayerRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'confidential', 'created_at', 'supporter_count')
    list_filter = ('confidential', 'created_at')
    search_fields = ('name', 'content')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)
    
    def supporter_count(self, obj):
        return obj.supporters.count()
    supporter_count.short_description = 'Supporters'


@admin.register(BibleStudy)
class BibleStudyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'country', 'course', 'group_name', 'status', 'created_at')
    list_filter = ('status', 'course', 'group_name', 'created_at')
    search_fields = ('name', 'email', 'country', 'group_name')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('amount', 'fund', 'method', 'status', 'created_at')
    list_filter = ('fund', 'method', 'status', 'created_at')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'goal_amount', 'raised_amount', 'status', 'is_published', 'created_at')
    list_filter = ('category', 'status', 'is_published', 'created_at')
    search_fields = ('title', 'desc')
    readonly_fields = ('created_at',)


@admin.register(ProjectUpdateLog)
class ProjectUpdateLogAdmin(admin.ModelAdmin):
    list_display = ('project_title', 'action', 'updated_by', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('project_title', 'updated_by__username')
    readonly_fields = ('project', 'project_title', 'action', 'changed_fields', 'updated_by', 'created_at')


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'resource_type', 'resource_label', 'actor', 'created_at')
    list_filter = ('action', 'resource_type', 'created_at')
    search_fields = ('resource_type', 'resource_label', 'actor__username', 'resource_id')
    readonly_fields = ('actor', 'action', 'resource_type', 'resource_id', 'resource_label', 'details', 'created_at')


@admin.register(LessonVideo)
class LessonVideoAdmin(admin.ModelAdmin):
    list_display = ('week', 'title', 'date', 'youtube_id')
    ordering = ('week',)


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'ministry', 'total_tithe', 'attendance_count', 'joined_date')
    list_filter = ('role', 'joined_date')
    search_fields = ('user__username', 'user__email', 'ministry')
    readonly_fields = ('joined_date', 'total_tithe', 'attendance_count')


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'views', 'is_published', 'created_at')
    list_filter = ('category', 'is_published', 'created_at')
    search_fields = ('title', 'content', 'author__username')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at', 'views')
    fieldsets = (
        ('Basic Info', {'fields': ('title', 'slug', 'author', 'category')}),
        ('Content', {'fields': ('content', 'featured_image')}),
        ('Publishing', {'fields': ('is_published', 'scheduled_publish', 'views')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Testimony)
class TestimonyAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'is_featured', 'is_approved', 'created_at')
    list_filter = ('is_featured', 'is_approved', 'created_at')
    search_fields = ('title', 'content', 'author__user__username')
    readonly_fields = ('created_at',)


@admin.register(ForumCategory)
class ForumCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'thread_count', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at',)
    
    def thread_count(self, obj):
        return obj.threads.count()
    thread_count.short_description = 'Threads'


@admin.register(ForumThread)
class ForumThreadAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'pinned', 'closed', 'updated_at')
    list_filter = ('pinned', 'closed', 'category', 'created_at')
    search_fields = ('title', 'author__user__username')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ForumPost)
class ForumPostAdmin(admin.ModelAdmin):
    list_display = ('thread', 'author', 'likes', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('content', 'author__user__username')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StaffMember)
class StaffMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'position', 'department', 'email', 'order')
    list_filter = ('department',)
    search_fields = ('user__username', 'position', 'department')
    readonly_fields = ('created_at',)
    ordering = ('order', 'department')


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ('page', 'user', 'ip_address', 'timestamp')
    list_filter = ('page', 'timestamp')
    search_fields = ('page', 'user__username')
    readonly_fields = ('timestamp',)


@admin.register(EngagementMetric)
class EngagementMetricAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'value', 'timestamp')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'action')
    readonly_fields = ('timestamp',)


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'currency', 'payment_type', 'status', 'created_at')
    list_filter = ('status', 'payment_type', 'created_at')
    search_fields = ('user__username', 'transaction_id')
    readonly_fields = ('created_at', 'completed_at', 'transaction_id')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    readonly_fields = ('created_at',)


@admin.register(EventAttendance)
class EventAttendanceAdmin(admin.ModelAdmin):
    list_display = ('event', 'member', 'is_waitlisted', 'attended', 'registered_at')
    list_filter = ('is_waitlisted', 'attended', 'registered_at')
    search_fields = ('event__title', 'member__user__username')
    readonly_fields = ('registered_at',)


@admin.register(PrayerSupport)
class PrayerSupportAdmin(admin.ModelAdmin):
    list_display = ('prayer_request', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('prayer_request__content', 'user__username')
    readonly_fields = ('created_at',)


class HymnInline(admin.TabularInline):
    model = Hymn
    extra = 1
    fields = ('number', 'title', 'author', 'composer', 'theme')


@admin.register(HymnBook)
class HymnBookAdmin(admin.ModelAdmin):
    list_display = ('title', 'abbreviation', 'publisher', 'hymn_count', 'is_featured', 'created_at')
    list_filter = ('is_featured', 'created_at', 'publisher')
    search_fields = ('title', 'abbreviation', 'description')
    readonly_fields = ('created_at',)
    inlines = [HymnInline]
    fieldsets = (
        ('Basic Info', {'fields': ('title', 'abbreviation', 'publisher', 'year')}),
        ('Details', {'fields': ('description', 'hymn_count')}),
        ('Settings', {'fields': ('is_featured', 'created_at')}),
    )


@admin.register(Hymn)
class HymnAdmin(admin.ModelAdmin):
    list_display = ('number', 'title', 'hymn_book', 'author', 'theme')
    list_filter = ('hymn_book', 'theme', 'created_at')
    search_fields = ('title', 'author', 'composer', 'number', 'lyrics')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Hymn Info', {'fields': ('hymn_book', 'number', 'title')}),
        ('Credits', {'fields': ('author', 'composer', 'tune_name')}),
        ('Content', {'fields': ('lyrics', 'theme')}),
        ('Media', {'fields': ('audio_url',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(SabbathProgramme)
class SabbathProgrammeAdmin(admin.ModelAdmin):
    list_display = ('service_date', 'theme', 'is_published', 'updated_at')
    list_filter = ('is_published', 'service_date', 'updated_at')
    search_fields = ('theme',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Programme Info', {'fields': ('service_date', 'theme', 'is_published')}),
        ('Content', {'fields': ('content',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(CommunityOutreachPage)
class CommunityOutreachPageAdmin(admin.ModelAdmin):
    list_display = ('page_key', 'hero_title', 'is_published', 'updated_at')
    list_filter = ('is_published', 'updated_at')
    search_fields = ('page_key', 'hero_title', 'hero_subtitle')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Page Info', {'fields': ('page_key', 'hero_title', 'hero_subtitle', 'is_published')}),
        ('Content', {'fields': ('stats', 'programs', 'upcoming_visits', 'testimonials', 'contact_points')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'album', 'is_published', 'created_at')
    list_filter = ('album', 'is_published', 'created_at')
    search_fields = ('title', 'album', 'img_url')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Image Info', {'fields': ('album', 'title', 'img_url', 'is_published')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(GoBackToSchoolPage)
class GoBackToSchoolPageAdmin(admin.ModelAdmin):
    list_display = ('page_key', 'hero_title', 'is_published', 'updated_at')
    list_filter = ('is_published', 'updated_at')
    search_fields = ('page_key', 'hero_title', 'hero_subtitle', 'overall_fundraising_title')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Page Info', {'fields': ('page_key', 'hero_title', 'hero_subtitle', 'is_published')}),
        ('Fundraising', {'fields': ('overall_fundraising_title', 'overall_fundraising_copy', 'overall_stats')}),
        ('Content', {'fields': ('student_cases', 'ways_to_give', 'impact_levels', 'contact_points')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

