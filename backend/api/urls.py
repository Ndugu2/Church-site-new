from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SermonViewSet,
    EventViewSet,
    PrayerRequestViewSet,
    BibleStudyViewSet,
    DonationViewSet,
    ProjectViewSet,
    LessonVideoViewSet,
    LoginView,
    RegisterView,
    AdminSessionView,
    MemberProfileViewSet,
    BlogPostViewSet,
    TestimonyViewSet,
    ForumCategoryViewSet,
    ForumThreadViewSet,
    ForumPostViewSet,
    StaffMemberViewSet,
    AdminAuditLogViewSet,
    NotificationViewSet,
    PaymentViewSet,
    AnalyticsViewSet,
    HymnBookViewSet,
    HymnViewSet,
    SabbathProgrammeViewSet
)

router = DefaultRouter()
router.register(r'sermons', SermonViewSet)
router.register(r'events', EventViewSet)
router.register(r'prayers', PrayerRequestViewSet)
router.register(r'bible-studies', BibleStudyViewSet)
router.register(r'donations', DonationViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'lessons', LessonVideoViewSet)
router.register(r'members', MemberProfileViewSet)
router.register(r'blog', BlogPostViewSet, basename='blog')
router.register(r'testimonies', TestimonyViewSet)
router.register(r'forum-categories', ForumCategoryViewSet)
router.register(r'forum-threads', ForumThreadViewSet)
router.register(r'forum-posts', ForumPostViewSet)
router.register(r'staff', StaffMemberViewSet)
router.register(r'admin-audit-logs', AdminAuditLogViewSet, basename='admin-audit-logs')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'hymn-books', HymnBookViewSet)
router.register(r'hymns', HymnViewSet)
router.register(r'sabbath-programmes', SabbathProgrammeViewSet, basename='sabbath-programmes')

urlpatterns = [
    path('login/', LoginView.as_view(), name='api-login'),
    path('register/', RegisterView.as_view(), name='api-register'),
    path('admin/session/', AdminSessionView.as_view(), name='api-admin-session'),
    path('', include(router.urls)),
]

