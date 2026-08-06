from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group, User
from rest_framework.authtoken.models import Token
from django.db.models import Q, Sum
from django.db import DatabaseError
from django.utils import timezone
from django.utils.text import slugify
from django.http import HttpResponse
from django.conf import settings
import csv
import os
import uuid
import mimetypes
from .models import (
    Sermon, Event, PrayerRequest, BibleStudy, BibleStudyGroup, Donation, Project, LessonVideo,
    MemberProfile, BlogPost, Testimony, ForumCategory, ForumThread, ForumPost,
    StaffMember, PageView, EngagementMetric, Payment, Notification, 
    EventAttendance, PrayerSupport, HymnBook, Hymn, SabbathProgramme, CommunityOutreachPage, GalleryImage, GoBackToSchoolPage, ProjectUpdateLog,
    AdminAuditLog
)
from .serializers import (
    SermonSerializer, EventSerializer, PrayerRequestSerializer, BibleStudySerializer,
    BibleStudyGroupSerializer,
    DonationSerializer, ProjectSerializer, LessonVideoSerializer, MemberProfileSerializer,
    BlogPostSerializer, TestimonySerializer, ForumCategorySerializer, ForumThreadSerializer,
    ForumPostSerializer, StaffMemberSerializer, PageViewSerializer, EngagementMetricSerializer,
    PaymentSerializer, NotificationSerializer, EventAttendanceSerializer, PrayerSupportSerializer,
    UserSerializer, HymnBookSerializer, HymnSerializer, SabbathProgrammeSerializer, CommunityOutreachPageSerializer, GalleryImageSerializer, GoBackToSchoolPageSerializer, ProjectUpdateLogSerializer,
    AdminAuditLogSerializer
)


BOOTSTRAP_ADMIN_USERNAME = os.getenv('ADMIN_BOOTSTRAP_USERNAME', 'admin')
BOOTSTRAP_ADMIN_PASSWORD = os.getenv('ADMIN_BOOTSTRAP_PASSWORD', 'sic_admin_2026')
BOOTSTRAP_ADMIN_EMAIL = os.getenv('ADMIN_BOOTSTRAP_EMAIL', 'admin@sic.bugema.ac.ug')


def bootstrap_admin_user_if_needed(username, password):
    """Create or repair the bootstrap admin account when matching credentials are used."""
    if not username or not password:
        return None
    if username != BOOTSTRAP_ADMIN_USERNAME or password != BOOTSTRAP_ADMIN_PASSWORD:
        return None

    user, _ = User.objects.get_or_create(
        username=BOOTSTRAP_ADMIN_USERNAME,
        defaults={
            'email': BOOTSTRAP_ADMIN_EMAIL,
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        },
    )

    update_fields = []
    if user.email != BOOTSTRAP_ADMIN_EMAIL:
        user.email = BOOTSTRAP_ADMIN_EMAIL
        update_fields.append('email')
    if not user.is_staff:
        user.is_staff = True
        update_fields.append('is_staff')
    if not user.is_superuser:
        user.is_superuser = True
        update_fields.append('is_superuser')
    if not user.is_active:
        user.is_active = True
        update_fields.append('is_active')
    if not user.check_password(BOOTSTRAP_ADMIN_PASSWORD):
        user.set_password(BOOTSTRAP_ADMIN_PASSWORD)
        update_fields.append('password')

    if update_fields:
        user.save(update_fields=update_fields)

    return user


class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


ALLOWED_IMAGE_MIME_TYPES = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class ImageUploadView(APIView):
    """Upload an image and return its URL. Staff only."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({'error': 'Staff access required.'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('image')
        if not file:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > MAX_IMAGE_SIZE_BYTES:
            return Response({'error': 'Image must be under 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        mime = file.content_type or mimetypes.guess_type(file.name)[0] or ''
        if mime not in ALLOWED_IMAGE_MIME_TYPES:
            return Response({'error': 'Only JPEG, PNG, WebP, or GIF images are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        ext = mimetypes.guess_extension(mime) or os.path.splitext(file.name)[1] or '.jpg'
        if ext == '.jpe':
            ext = '.jpg'
        filename = f"{uuid.uuid4().hex}{ext}"

        upload_dir = os.path.join(settings.MEDIA_ROOT, 'project_images')
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)

        with open(filepath, 'wb') as f:
            for chunk in file.chunks():
                f.write(chunk)

        image_url = request.build_absolute_uri(f"{settings.MEDIA_URL}project_images/{filename}")
        return Response({'url': image_url}, status=status.HTTP_201_CREATED)


class IsAuthorOrStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        if request.user and request.user.is_staff:
            return True

        author = getattr(obj, 'author', None)
        if author is not None and hasattr(author, 'user_id'):
            return author.user_id == request.user.id

        return False


class IsStaffOrPublicCreateOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsStaffOrPublicReadCreate(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'POST'):
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


DEPARTMENT_GROUP_ALIASES = {
    'church_clerk': {'churchclerk', 'churchclerkdepartment', 'churchclerkteam', 'clerk', 'churchclerkministry'},
    'sabbath_school': {'sabbathschool', 'sabbathschooldepartment', 'sabbathschoolteam'},
    'evangelistic': {'evangelistic', 'evangelisticdepartment', 'evangelism', 'evangelismdepartment'},
    # ── New 4-department model ──────────────────────────────────────────
    'communication': {'communication', 'communicationdepartment', 'comms', 'commsdept', 'media', 'mediadepartment'},
    'deaconery': {'deaconery', 'deaconerydepartment', 'deacon', 'deacons', 'deaconsdepartment'},
    'church_leaders': {'churchleaders', 'churchleadersdepartment', 'leaders', 'leadership', 'churchleadership', 'pastoralteam'},
}

SECTION_GROUP_ALIASES = {
    'account_registration': {'accessaccountregistration', 'accountregistration'},
    'announcements': {'accessannouncements', 'announcements'},
    'bible_studies': {'accessbiblestudies', 'biblestudies'},
    'sabbath_programme': {'accesssabbathprogramme', 'sabbathprogramme'},
    'community_outreach': {'accesscommunityoutreach', 'communityoutreach'},
    'go_back_to_school': {'accessgobacktoschool', 'gobacktoschool', 'backtoschool'},
    'prayers': {'accessprayers', 'prayers'},
    'donations': {'accessdonations', 'donations'},
    'events': {'accessevents', 'events'},
    'sermons': {'accesssermons', 'sermons'},
    'testimonies': {'accesstestimonies', 'testimonies'},
    'audit': {'accessaudit', 'accessaudittrail', 'auditrail', 'adminaudit'},
    'projects': {'accessprojects', 'projects'},
    'gallery': {'accessgallery', 'gallery'},
    'lessons': {'accesslessons', 'lessons', 'lessonvideos'},
    'staff': {'accessstaff', 'staff', 'staffdirectory'},
    'forums': {'accessforums', 'forums', 'forum'},
    'hymns': {'accesshymns', 'hymns', 'hymnbooks'},
    'blog': {'accessblog', 'blog', 'blogposts'},
}

SECTION_GROUP_NAMES = {
    'account_registration': 'Access Account Registration',
    'announcements': 'Access Announcements',
    'bible_studies': 'Access Bible Studies',
    'sabbath_programme': 'Access Sabbath Programme',
    'community_outreach': 'Access Community Outreach',
    'go_back_to_school': 'Access Go Back To School',
    'prayers': 'Access Prayers',
    'donations': 'Access Donations',
    'events': 'Access Events',
    'sermons': 'Access Sermons',
    'testimonies': 'Access Testimonies',
    'audit': 'Access Audit Trail',
    'projects': 'Access Projects',
    'gallery': 'Access Gallery',
    'lessons': 'Access Lesson Videos',
    'staff': 'Access Staff Directory',
    'forums': 'Access Forums',
    'hymns': 'Access Hymns',
    'blog': 'Access Blog Posts',
}

SECTION_TO_ADMIN_TAB = {
    'account_registration': 'admin-accounts',
    'announcements': 'admin-announcements',
    'blog': 'admin-blog',
    'bible_studies': 'admin-studies',
    'sabbath_programme': 'admin-sabbath-programme',
    'community_outreach': 'admin-community-outreach',
    'go_back_to_school': 'admin-go-back-to-school',
    'prayers': 'admin-prayers',
    'donations': 'admin-donations',
    'events': 'admin-events',
    'sermons': 'admin-sermons',
    'testimonies': 'admin-testimonies',
    'audit': 'admin-audit',
    'projects': 'admin-projects',
    'gallery': 'admin-gallery',
    'lessons': 'admin-lessons',
    'staff': 'admin-staff',
    'forums': 'admin-forums',
    'hymns': 'admin-hymns',
}

ALL_ADMIN_TABS = [
    'admin-stats',
    'admin-accounts',
    'admin-studies',
    'admin-prayers',
    'admin-donations',
    'admin-events',
    'admin-sermons',
    'admin-testimonies',
    'admin-announcements',
    'admin-blog',
    'admin-staff',
    'admin-forums',
    'admin-hymns',
    'admin-community-outreach',
    'admin-go-back-to-school',
    'admin-audit',
    'admin-projects',
    'admin-gallery',
    'admin-lessons',
    'admin-sabbath-programme',
]


def _canonical_group_name(value):
    return ''.join(ch for ch in str(value).lower() if ch.isalnum())


def _get_department_roles(user):
    if not user or not user.is_authenticated:
        return set()
    normalized = {_canonical_group_name(name) for name in user.groups.values_list('name', flat=True)}
    roles = set()
    for role, aliases in DEPARTMENT_GROUP_ALIASES.items():
        if normalized.intersection(aliases):
            roles.add(role)
    return roles


def _get_access_sections(user):
    if not user or not user.is_authenticated:
        return set()
    normalized = {_canonical_group_name(name) for name in user.groups.values_list('name', flat=True)}
    sections = set()
    for section, aliases in SECTION_GROUP_ALIASES.items():
        if normalized.intersection(aliases):
            sections.add(section)
    return sections


def _get_sabbath_scope(user):
    if not user or not user.is_authenticated:
        return 'none'
    normalized = {_canonical_group_name(name) for name in user.groups.values_list('name', flat=True)}
    if 'scopesabbathschoolonly' in normalized:
        return 'sabbath_school_only'
    return 'full'


def get_admin_access_profile(user):
    if not user or not user.is_authenticated or not user.is_staff:
        return {
            'department_roles': [],
            'admin_tabs': [],
            'sections': [],
            'sabbath_programme_scope': 'none',
            'is_full_access': False,
        }

    roles = _get_department_roles(user)
    section_access = _get_access_sections(user)
    if user.is_superuser:
        all_sections = list(SECTION_TO_ADMIN_TAB.keys())
        return {
            'department_roles': sorted(list(roles)),
            'admin_tabs': ALL_ADMIN_TABS,
            'sections': all_sections,
            'sabbath_programme_scope': 'full',
            'is_full_access': True,
        }

    # Non-super staff never receive account registration rights.
    section_access = {section for section in section_access if section != 'account_registration'}

    if not roles:
        if section_access:
            tabs = {'admin-stats'}
            for section in section_access:
                tab = SECTION_TO_ADMIN_TAB.get(section)
                if tab:
                    tabs.add(tab)
            return {
                'department_roles': sorted(list(roles)),
                'admin_tabs': [tab for tab in ALL_ADMIN_TABS if tab in tabs],
                'sections': sorted(list(section_access)),
                'sabbath_programme_scope': _get_sabbath_scope(user) if 'sabbath_programme' in section_access else 'none',
                'is_full_access': False,
            }
        return {
            'department_roles': sorted(list(roles)),
            'admin_tabs': ['admin-stats'],
            'sections': [],
            'sabbath_programme_scope': 'none',
            'is_full_access': False,
        }

    tabs = {'admin-stats'}
    sections = set(section_access)
    sabbath_scope = 'none'

    for section in sections:
        tab = SECTION_TO_ADMIN_TAB.get(section)
        if tab:
            tabs.add(tab)
    if 'sabbath_programme' in sections:
        sabbath_scope = _get_sabbath_scope(user)

    if 'church_clerk' in roles:
        tabs.update({'admin-studies', 'admin-announcements', 'admin-sabbath-programme', 'admin-events'})
        sections.update({'announcements', 'bible_studies', 'sabbath_programme', 'events'})
        sabbath_scope = 'full'

    if 'sabbath_school' in roles:
        tabs.update({'admin-studies', 'admin-sabbath-programme'})
        sections.update({'bible_studies', 'sabbath_programme'})
        if sabbath_scope != 'full':
            sabbath_scope = 'sabbath_school_only'

    if 'evangelistic' in roles:
        tabs.update({'admin-studies', 'admin-community-outreach', 'admin-go-back-to-school',
                     'admin-prayers', 'admin-forums'})
        sections.update({'bible_studies', 'community_outreach', 'go_back_to_school', 'prayers', 'forums'})

    if 'communication' in roles:
        tabs.update({'admin-blog', 'admin-announcements', 'admin-gallery', 'admin-lessons',
                     'admin-testimonies', 'admin-sermons'})
        sections.update({'blog', 'announcements', 'gallery', 'lessons', 'testimonies', 'sermons'})

    if 'deaconery' in roles:
        tabs.update({'admin-events', 'admin-donations', 'admin-staff', 'admin-projects'})
        sections.update({'events', 'donations', 'staff', 'projects'})

    if 'church_leaders' in roles:
        # Church leaders get full section access (minus account_registration — reserved for superuser)
        all_non_registration = {s for s in SECTION_TO_ADMIN_TAB.keys() if s != 'account_registration'}
        sections.update(all_non_registration)
        for s in all_non_registration:
            tab = SECTION_TO_ADMIN_TAB.get(s)
            if tab:
                tabs.add(tab)
        sabbath_scope = 'full'

    return {
        'department_roles': sorted(list(roles)),
        'admin_tabs': [tab for tab in ALL_ADMIN_TABS if tab in tabs],
        'sections': sorted(list(sections)),
        'sabbath_programme_scope': sabbath_scope,
        'is_full_access': False,
    }


def user_can_manage_section(user, section):
    profile = get_admin_access_profile(user)
    return bool(profile['is_full_access'] or section in profile['sections'])


def _department_role_to_group_name(role):
    mapping = {
        'church_clerk': 'Church Clerk',
        'sabbath_school': 'Sabbath School',
        'evangelistic': 'Evangelistic',
        'communication': 'Communication',
        'deaconery': 'Deaconery',
        'church_leaders': 'Church Leaders',
    }
    return mapping.get(role)


class IsStaffWithSectionOrReadOnly(BasePermission):
    required_section = ''

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff and user_can_manage_section(request.user, self.required_section))


class IsStaffWithSectionOrPublicCreateOnly(BasePermission):
    required_section = ''

    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff and user_can_manage_section(request.user, self.required_section))


class IsStaffWithSectionOrPublicReadCreate(BasePermission):
    required_section = ''

    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'POST'):
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff and user_can_manage_section(request.user, self.required_section))


class AdminAuditMixin:
    """Reusable hooks to capture create/update/delete activity for admin-managed resources."""

    def _resource_label(self, instance):
        for attr in ('title', 'name'):
            value = getattr(instance, attr, None)
            if value:
                return str(value)
        return str(instance)

    def _resource_snapshot(self, instance):
        model = instance.__class__
        snapshot = {}
        for field in model._meta.fields:
            if field.name in ('id', 'created_at', 'updated_at'):
                continue
            value = getattr(instance, field.name, None)
            if value is None:
                snapshot[field.name] = None
            else:
                snapshot[field.name] = str(value)
        return snapshot

    def _write_audit_log(self, action, instance, details=None):
        user = self.request.user if self.request.user.is_authenticated else None
        AdminAuditLog.objects.create(
            actor=user,
            action=action,
            resource_type=instance.__class__.__name__,
            resource_id=str(getattr(instance, 'id', '') or ''),
            resource_label=self._resource_label(instance),
            details=details or {},
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self._write_audit_log('create', instance, {'new': self._resource_snapshot(instance)})

    def perform_update(self, serializer):
        old_snapshot = self._resource_snapshot(serializer.instance)
        instance = serializer.save()
        new_snapshot = self._resource_snapshot(instance)

        changed_fields = {}
        for key in new_snapshot:
            if old_snapshot.get(key) != new_snapshot.get(key):
                changed_fields[key] = {'old': old_snapshot.get(key), 'new': new_snapshot.get(key)}

        self._write_audit_log('update', instance, {'changed_fields': changed_fields})

    def perform_destroy(self, instance):
        snapshot = self._resource_snapshot(instance)
        self._write_audit_log('delete', instance, {'old': snapshot})
        instance.delete()

class SermonViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    queryset = Sermon.objects.all().order_by('-date')
    serializer_class = SermonSerializer
    permission_classes = [IsStaffWithSectionOrReadOnly]

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrReadOnly):
                permission.required_section = 'sermons'
        return permissions

    def get_queryset(self):
        queryset = Sermon.objects.all().order_by('-date')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_published=True)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if query:
            sermons = self.queryset.filter(
                Q(title__icontains=query) | 
                Q(speaker__icontains=query) | 
                Q(passage__icontains=query) |
                Q(category__icontains=query)
            )
            serializer = self.get_serializer(sermons, many=True)
            return Response(serializer.data)
        return Response([])
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category = request.query_params.get('category', '')
        sermons = self.queryset.filter(category=category) if category else self.queryset
        serializer = self.get_serializer(sermons, many=True)
        return Response(serializer.data)

class EventViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('date')
    serializer_class = EventSerializer
    permission_classes = [IsStaffWithSectionOrReadOnly]

    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        if self.action == 'attendees_export':
            return [IsAuthenticated()]
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrReadOnly):
                permission.required_section = 'events'
        return permissions

    def get_queryset(self):
        queryset = Event.objects.all().order_by('date')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_published=True)
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        if not request.user.is_authenticated:
            return Response({'error': 'Must be logged in'}, status=status.HTTP_401_UNAUTHORIZED)

        member, _ = MemberProfile.objects.get_or_create(user=request.user)
        attendance_defaults = {
            'contact_name': str(request.data.get('name', '')).strip(),
            'contact_email': str(request.data.get('email', '')).strip(),
            'contact_phone': str(request.data.get('phone', '')).strip(),
            'notes': str(request.data.get('notes', '')).strip(),
        }

        attendance = EventAttendance.objects.filter(event=event, member=member).first()
        created = False

        if attendance is None:
            confirmed_count = EventAttendance.objects.filter(event=event, is_waitlisted=False).count()
            has_capacity = event.capacity is None or confirmed_count < event.capacity

            if has_capacity:
                attendance = EventAttendance.objects.create(
                    event=event,
                    member=member,
                    is_waitlisted=False,
                    **attendance_defaults,
                )
                created = True
            elif event.waitlist_enabled:
                attendance = EventAttendance.objects.create(
                    event=event,
                    member=member,
                    is_waitlisted=True,
                    **attendance_defaults,
                )
                created = True
            else:
                return Response(
                    {'error': 'This event is full and waitlist is disabled.'},
                    status=status.HTTP_409_CONFLICT,
                )

        # If a member re-registers, refresh contact details from the latest submission.
        if not created:
            updated = False
            for field, value in attendance_defaults.items():
                if value and getattr(attendance, field) != value:
                    setattr(attendance, field, value)
                    updated = True
            if updated:
                attendance.save(update_fields=['contact_name', 'contact_email', 'contact_phone', 'notes'])

        serializer = EventAttendanceSerializer(attendance)
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        waitlist_position = None
        if attendance.is_waitlisted:
            waitlist_position = EventAttendance.objects.filter(
                event=event,
                is_waitlisted=True,
                registered_at__lte=attendance.registered_at,
            ).count()

        return Response(
            {
                **serializer.data,
                'already_registered': not created,
                'waitlisted': attendance.is_waitlisted,
                'waitlist_position': waitlist_position,
            },
            status=response_status,
        )

    @action(detail=False, methods=['get'])
    def attendees_export(self, request):
        if not request.user.is_staff or not user_can_manage_section(request.user, 'events'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        event_id = request.query_params.get('event_id')
        attendances = EventAttendance.objects.select_related('event', 'member__user').order_by('event__date', 'registered_at')
        if event_id:
            attendances = attendances.filter(event_id=event_id)

        response = HttpResponse(content_type='text/csv')
        suffix = timezone.now().strftime('%Y%m%d_%H%M')
        response['Content-Disposition'] = f'attachment; filename="event_attendees_{suffix}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'event_id',
            'event_title',
            'event_date',
            'event_location',
            'member_username',
            'member_email',
            'contact_name',
            'contact_email',
            'contact_phone',
            'rsvp_status',
            'attended',
            'registered_at',
            'notes',
        ])

        for item in attendances:
            user = item.member.user
            if item.attended:
                rsvp_status = 'attended'
            elif item.is_waitlisted:
                rsvp_status = 'waitlisted'
            else:
                rsvp_status = 'registered'

            writer.writerow([
                item.event_id,
                item.event.title,
                item.event.date.isoformat(),
                item.event.location,
                user.username,
                user.email,
                item.contact_name,
                item.contact_email,
                item.contact_phone,
                rsvp_status,
                'yes' if item.attended else 'no',
                item.registered_at.isoformat(),
                item.notes,
            ])

        return response

class PrayerRequestViewSet(viewsets.ModelViewSet):
    queryset = PrayerRequest.objects.order_by('-created_at')
    serializer_class = PrayerRequestSerializer
    permission_classes = [IsStaffWithSectionOrPublicReadCreate]

    def get_permissions(self):
        if self.action == 'support':
            return [IsAuthenticated()]
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrPublicReadCreate):
                permission.required_section = 'prayers'
        return permissions
    
    @action(detail=True, methods=['post'])
    def support(self, request, pk=None):
        prayer = self.get_object()
        if not request.user.is_authenticated:
            return Response({'error': 'Must be logged in'}, status=status.HTTP_401_UNAUTHORIZED)
        
        support, created = PrayerSupport.objects.get_or_create(
            prayer_request=prayer,
            user=request.user
        )
        return Response({'supporters': prayer.supporters.count()})

class BibleStudyViewSet(viewsets.ModelViewSet):
    queryset = BibleStudy.objects.all().order_by('-created_at')
    serializer_class = BibleStudySerializer
    permission_classes = [IsStaffWithSectionOrPublicCreateOnly]

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrPublicCreateOnly):
                permission.required_section = 'bible_studies'
        return permissions

class BibleStudyGroupViewSet(viewsets.ModelViewSet):
    queryset = BibleStudyGroup.objects.all().order_by('name')
    serializer_class = BibleStudyGroupSerializer

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        permission = IsStaffWithSectionOrReadOnly()
        permission.required_section = 'bible_studies'
        return [permission]

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        group = self.get_object()
        members = BibleStudy.objects.filter(group_name=group.name).order_by('name')
        from .serializers import BibleStudySerializer
        return Response(BibleStudySerializer(members, many=True).data)

    @action(detail=True, methods=['post'])
    def assign_member(self, request, pk=None):
        group = self.get_object()
        member_id = request.data.get('member_id')
        try:
            study = BibleStudy.objects.get(pk=member_id)
            study.group_name = group.name
            study.save(update_fields=['group_name'])
            return Response({'status': 'assigned'})
        except BibleStudy.DoesNotExist:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        member_id = request.data.get('member_id')
        try:
            study = BibleStudy.objects.get(pk=member_id, group_name=group.name)
            study.group_name = ''
            study.save(update_fields=['group_name'])
            return Response({'status': 'removed'})
        except BibleStudy.DoesNotExist:
            return Response({'error': 'Member not found in this group'}, status=status.HTTP_404_NOT_FOUND)

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by('-created_at')
    serializer_class = DonationSerializer
    permission_classes = [IsStaffWithSectionOrPublicCreateOnly]

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            if self.request.user.is_authenticated and self.request.user.is_staff:
                permission = IsStaffWithSectionOrReadOnly()
                permission.required_section = 'donations'
                return [permission]
            return [IsAuthenticated()]
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrPublicCreateOnly):
                permission.required_section = 'donations'
        return permissions

    def get_queryset(self):
        queryset = Donation.objects.all().order_by('-created_at')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        if self.request.user.is_authenticated:
            # Donation model currently has no user FK; limit to empty list for non-staff read until ownership field is added.
            return queryset
        return Donation.objects.none()

class ProjectViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [IsStaffWithSectionOrReadOnly]

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrReadOnly):
                permission.required_section = 'projects'
        return permissions

    def get_queryset(self):
        queryset = Project.objects.all().order_by('-created_at')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_published=True)

    def _project_snapshot(self, project):
        return {
            'title': project.title,
            'category': project.category,
            'desc': project.desc,
            'goal_amount': str(project.goal_amount),
            'raised_amount': str(project.raised_amount),
            'image_url': project.image_url,
            'status': project.status,
            'is_published': project.is_published,
        }

    def perform_create(self, serializer):
        project = serializer.save()
        ProjectUpdateLog.objects.create(
            project=project,
            project_title=project.title,
            action='create',
            changed_fields={'new': self._project_snapshot(project)},
            updated_by=self.request.user if self.request.user.is_authenticated else None,
        )
        self._write_audit_log('create', project, {'new': self._project_snapshot(project)})

    def perform_update(self, serializer):
        old_snapshot = self._project_snapshot(serializer.instance)
        project = serializer.save()
        new_snapshot = self._project_snapshot(project)

        changed_fields = {}
        for key in new_snapshot:
            if old_snapshot.get(key) != new_snapshot.get(key):
                changed_fields[key] = {'old': old_snapshot.get(key), 'new': new_snapshot.get(key)}

        if changed_fields:
            ProjectUpdateLog.objects.create(
                project=project,
                project_title=project.title,
                action='update',
                changed_fields=changed_fields,
                updated_by=self.request.user if self.request.user.is_authenticated else None,
            )

        self._write_audit_log('update', project, {'changed_fields': changed_fields})

    def perform_destroy(self, instance):
        snapshot = self._project_snapshot(instance)
        ProjectUpdateLog.objects.create(
            project=None,
            project_title=instance.title,
            action='delete',
            changed_fields={'old': snapshot},
            updated_by=self.request.user if self.request.user.is_authenticated else None,
        )
        self._write_audit_log('delete', instance, {'old': snapshot})
        instance.delete()

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        project = self.get_object()
        logs = ProjectUpdateLog.objects.filter(project=project).order_by('-created_at')
        serializer = ProjectUpdateLogSerializer(logs, many=True)
        return Response(serializer.data)

class LessonVideoViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    queryset = LessonVideo.objects.all().order_by('week')
    serializer_class = LessonVideoSerializer
    permission_classes = [IsStaffWithSectionOrReadOnly]

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrReadOnly):
                permission.required_section = 'lessons'
        return permissions


# ============== NEW VIEWSETS ==============

class MemberProfileViewSet(viewsets.ModelViewSet):
    queryset = MemberProfile.objects.all().order_by('-joined_date', '-id')
    serializer_class = MemberProfileSerializer

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsStaffOrReadOnly()]

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return MemberProfile.objects.all().order_by('-joined_date', '-id')
        if self.request.user.is_authenticated:
            return MemberProfile.objects.filter(user=self.request.user).order_by('-joined_date', '-id')
        return MemberProfile.objects.none()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            profile = request.user.member_profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except MemberProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def my_event_registrations(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        profile, _ = MemberProfile.objects.get_or_create(user=request.user)
        attendances = EventAttendance.objects.filter(member=profile).select_related('event').order_by('event__date', '-registered_at')
        today = timezone.localdate()

        payload = []
        for item in attendances:
            if item.attended:
                rsvp_status = 'attended'
            elif item.is_waitlisted:
                rsvp_status = 'waitlisted'
            elif item.event.date < today:
                rsvp_status = 'completed'
            else:
                rsvp_status = 'registered'

            payload.append({
                'id': item.id,
                'event_id': item.event_id,
                'event_title': item.event.title,
                'event_date': item.event.date,
                'event_location': item.event.location,
                'registered_at': item.registered_at,
                'attended': item.attended,
                'is_waitlisted': item.is_waitlisted,
                'rsvp_status': rsvp_status,
            })

        return Response(payload)

class BlogPostViewSet(viewsets.ModelViewSet):
    serializer_class = BlogPostSerializer

    def _apply_publication_rules(self, queryset):
        now = timezone.now()
        return queryset.filter(
            is_published=True,
        ).filter(
            Q(scheduled_publish__isnull=True) | Q(scheduled_publish__lte=now)
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )

    def get_queryset(self):
        queryset = BlogPost.objects.all().order_by('-created_at')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return self._apply_publication_rules(queryset)

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        if self.action == 'view' and self.request.method == 'POST':
            return [AllowAny()]
        permission = IsStaffWithSectionOrReadOnly()
        permission.required_section = 'announcements'
        return [permission]

    def perform_create(self, serializer):
        title = serializer.validated_data.get('title', '')
        base_slug = slugify(serializer.validated_data.get('slug') or title) or 'announcement'
        slug = base_slug
        suffix = 1
        while BlogPost.objects.filter(slug=slug).exists():
            suffix += 1
            slug = f"{base_slug}-{suffix}"

        serializer.save(
            author=self.request.user if self.request.user.is_authenticated else None,
            slug=slug,
        )

    def perform_update(self, serializer):
        instance = serializer.instance
        title = serializer.validated_data.get('title', instance.title)
        incoming_slug = serializer.validated_data.get('slug') or instance.slug or slugify(title) or 'announcement'
        slug = incoming_slug
        suffix = 1
        while BlogPost.objects.exclude(pk=instance.pk).filter(slug=slug).exists():
            suffix += 1
            slug = f"{incoming_slug}-{suffix}"

        serializer.save(slug=slug)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        posts = self.get_queryset()[:5]
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category = request.query_params.get('category', '')
        include_expired = request.query_params.get('include_expired', '').lower() in ('1', 'true', 'yes')
        audience = request.query_params.get('audience', '')
        mission_tag = request.query_params.get('mission_tag', '')
        queryset = self.get_queryset()
        posts = queryset.filter(category=category) if category else queryset

        if (not request.user.is_authenticated or not request.user.is_staff) and include_expired:
            include_expired = False

        if category == 'announcement' and not include_expired:
            posts = self._apply_publication_rules(posts)

        if audience:
            posts = posts.filter(audience=audience)

        if mission_tag:
            posts = posts.filter(mission_tag=mission_tag)

        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def weekly_digest(self, request):
        now = timezone.now()
        week_end = now + timezone.timedelta(days=7)
        queryset = self.get_queryset().filter(category='announcement')

        if not (request.user.is_authenticated and request.user.is_staff):
            queryset = self._apply_publication_rules(queryset)

        audience = request.query_params.get('audience', '')
        if audience:
            queryset = queryset.filter(audience=audience)

        upcoming = queryset.filter(
            Q(scheduled_publish__isnull=True) | Q(scheduled_publish__lte=week_end)
        ).order_by('priority', '-created_at')[:20]

        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        post = self.get_object()
        post.views += 1
        post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)

class TestimonyViewSet(viewsets.ModelViewSet):
    queryset = Testimony.objects.filter(is_approved=True).order_by('-created_at')
    serializer_class = TestimonySerializer

    def get_queryset(self):
        queryset = Testimony.objects.all().order_by('-created_at')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_approved=True)

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAuthorOrStaffOrReadOnly()]

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise ValidationError({'error': 'Authentication required'})
        try:
            profile = self.request.user.member_profile
        except MemberProfile.DoesNotExist:
            raise ValidationError({'error': 'Member profile not found'})
        serializer.save(author=profile, is_approved=False)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        testimonies = self.get_queryset().filter(is_featured=True).order_by('-created_at')
        serializer = self.get_serializer(testimonies, many=True)
        return Response(serializer.data)

class ForumCategoryViewSet(viewsets.ModelViewSet):
    queryset = ForumCategory.objects.all()
    serializer_class = ForumCategorySerializer
    permission_classes = [IsStaffOrReadOnly]

class ForumThreadViewSet(viewsets.ModelViewSet):
    queryset = ForumThread.objects.filter(closed=False).order_by('-pinned', '-updated_at')
    serializer_class = ForumThreadSerializer
    permission_classes = [IsAuthorOrStaffOrReadOnly]

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise ValidationError({'error': 'Authentication required'})
        profile, _ = MemberProfile.objects.get_or_create(user=self.request.user)
        serializer.save(author=profile)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_id = request.query_params.get('category_id')
        if category_id:
            threads = self.queryset.filter(category_id=category_id)
        else:
            threads = self.queryset
        serializer = self.get_serializer(threads, many=True)
        return Response(serializer.data)

class ForumPostViewSet(viewsets.ModelViewSet):
    queryset = ForumPost.objects.all().order_by('created_at')
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthorOrStaffOrReadOnly]

    def perform_create(self, serializer):
        if not self.request.user.is_authenticated:
            raise ValidationError({'error': 'Authentication required'})
        profile, _ = MemberProfile.objects.get_or_create(user=self.request.user)
        serializer.save(author=profile)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        post.likes += 1
        post.save()
        serializer = self.get_serializer(post)
        return Response(serializer.data)

class StaffMemberViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.all().order_by('order')
    serializer_class = StaffMemberSerializer
    permission_classes = [IsStaffOrReadOnly]
    
    @action(detail=False, methods=['get'])
    def by_department(self, request):
        department = request.query_params.get('department')
        if department:
            staff = self.queryset.filter(department=department)
        else:
            staff = self.queryset
        serializer = self.get_serializer(staff, many=True)
        return Response(serializer.data)


class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AdminAuditLog.objects.all().order_by('-created_at')
    serializer_class = AdminAuditLogSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        if not user_can_manage_section(request.user, 'audit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        if not user_can_manage_section(request.user, 'audit'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return super().retrieve(request, *args, **kwargs)

    def get_queryset(self):
        queryset = AdminAuditLog.objects.all().order_by('-created_at')

        action = self.request.query_params.get('action', '').strip().lower()
        if action in ('create', 'update', 'delete'):
            queryset = queryset.filter(action=action)

        resource_type = self.request.query_params.get('resource_type', '').strip()
        if resource_type:
            queryset = queryset.filter(resource_type__iexact=resource_type)

        actor_username = self.request.query_params.get('actor', '').strip()
        if actor_username:
            queryset = queryset.filter(actor__username__icontains=actor_username)

        since = self.request.query_params.get('since', '').strip()
        if since:
            try:
                since_dt = timezone.datetime.fromisoformat(since)
                if timezone.is_naive(since_dt):
                    since_dt = timezone.make_aware(since_dt, timezone.get_current_timezone())
                queryset = queryset.filter(created_at__gte=since_dt)
            except ValueError:
                pass

        return queryset

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Notification.objects.filter(user=self.request.user).order_by('-created_at')
        return Notification.objects.none()
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        notifications = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Payment.objects.filter(user=self.request.user)
        return Payment.objects.none()
    
    @action(detail=False, methods=['post'])
    def create_payment(self, request):
        # Placeholder for payment processing
        # This will integrate with Stripe/PayPal/Mobile Money
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            payment = serializer.save(user=request.user, status='pending')
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get analytics dashboard data"""
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({
            'total_members': MemberProfile.objects.count(),
            'total_donations': float(Donation.objects.aggregate(Sum('amount'))['amount__sum'] or 0),
            'events_this_month': Event.objects.filter(date__month=timezone.now().month).count(),
            'active_prayers': PrayerRequest.objects.count(),
            'blog_views': BlogPost.objects.aggregate(Sum('views'))['views__sum'] or 0,
        })


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is None:
            bootstrap_admin_user_if_needed(username, password)
            user = authenticate(username=username, password=password)
        if user is not None:
            token = Token.objects.filter(user=user).first()
            if token is None:
                try:
                    token, _ = Token.objects.get_or_create(user=user)
                except DatabaseError:
                    return Response({
                        "success": False,
                        "error": "Authentication storage is not writable. Configure a persistent production database and run migrations."
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            admin_access = get_admin_access_profile(user)
            return Response({
                "success": True,
                "username": user.username,
                "email": user.email,
                "token": token.key,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "department_roles": admin_access['department_roles'],
                "admin_tabs": admin_access['admin_tabs'],
                "sabbath_programme_scope": admin_access['sabbath_programme_scope'],
            }, status=status.HTTP_200_OK)
        return Response({
            "success": False,
            "error": "Invalid username or password"
        }, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(username=username, email=email, password=password)
        MemberProfile.objects.create(user=user)
        token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'success': True,
            'username': user.username,
            'email': user.email,
            'token': token.key,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        }, status=status.HTTP_201_CREATED)


class AdminSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        admin_access = get_admin_access_profile(user)
        return Response({
            'authenticated': True,
            'is_staff': bool(user.is_staff),
            'username': user.username,
            'is_superuser': bool(user.is_superuser),
            'department_roles': admin_access['department_roles'],
            'admin_tabs': admin_access['admin_tabs'],
            'sabbath_programme_scope': admin_access['sabbath_programme_scope'],
        }, status=status.HTTP_200_OK)


class AdminUserManagementView(APIView):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _user_snapshot(user):
        access = get_admin_access_profile(user)
        return {
            'username': user.username,
            'email': user.email,
            'full_name': user.get_full_name(),
            'is_active': bool(user.is_active),
            'is_staff': bool(user.is_staff),
            'is_superuser': bool(user.is_superuser),
            'sections': access['sections'],
            'department_roles': access['department_roles'],
            'sabbath_programme_scope': access['sabbath_programme_scope'],
        }

    def _write_account_audit(self, action, target, details):
        actor = self.request.user if self.request.user.is_authenticated else None
        AdminAuditLog.objects.create(
            actor=actor,
            action=action,
            resource_type='StaffAccount',
            resource_id=str(target.id),
            resource_label=target.username,
            details=details,
        )

    @staticmethod
    def _allowed_sections():
        return {
            'announcements',
            'bible_studies',
            'sabbath_programme',
            'prayers',
            'donations',
            'events',
            'sermons',
            'testimonies',
            'audit',
            'projects',
            'gallery',
            'lessons',
            'staff',
            'forums',
            'hymns',
        }

    @staticmethod
    def _all_managed_group_names():
        names = set(SECTION_GROUP_NAMES.values())
        names.add('Scope Sabbath School Only')
        for role in ('church_clerk', 'sabbath_school', 'evangelistic'):
            role_name = _department_role_to_group_name(role)
            if role_name:
                names.add(role_name)
        return names

    def _serialize_staff_user(self, user):
        access = get_admin_access_profile(user)
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.get_full_name(),
            'is_active': bool(user.is_active),
            'is_superuser': user.is_superuser,
            'department_roles': access['department_roles'],
            'sections': access['sections'],
            'sabbath_programme_scope': access['sabbath_programme_scope'],
        }

    def _resolve_sections(self, requested_sections):
        if not isinstance(requested_sections, list):
            raise ValidationError({'error': 'access_sections must be a list.'})
        return [section for section in requested_sections if section in self._allowed_sections()]

    def _apply_access_groups(self, user, sections, sabbath_scope, department_role=''):
        managed_group_names = self._all_managed_group_names()
        for group in user.groups.filter(name__in=managed_group_names):
            user.groups.remove(group)

        for section in sections:
            group_name = SECTION_GROUP_NAMES.get(section)
            if not group_name:
                continue
            group, _ = Group.objects.get_or_create(name=group_name)
            user.groups.add(group)

        if department_role:
            role_group_name = _department_role_to_group_name(department_role)
            if role_group_name:
                role_group, _ = Group.objects.get_or_create(name=role_group_name)
                user.groups.add(role_group)

        if 'sabbath_programme' in sections and sabbath_scope == 'sabbath_school_only':
            scope_group, _ = Group.objects.get_or_create(name='Scope Sabbath School Only')
            user.groups.add(scope_group)

    def _ensure_access(self, request):
        if not request.user.is_authenticated or not request.user.is_staff:
            raise PermissionDenied('Permission denied')
        if not request.user.is_superuser:
            raise PermissionDenied('Only super admin can manage registration accounts.')

    def get(self, request):
        self._ensure_access(request)
        users = User.objects.filter(is_staff=True).order_by('username')[:200]
        payload = [self._serialize_staff_user(user) for user in users]
        return Response(payload, status=status.HTTP_200_OK)

    def post(self, request):
        self._ensure_access(request)

        username = str(request.data.get('username', '')).strip()
        email = str(request.data.get('email', '')).strip()
        password = str(request.data.get('password', '')).strip()
        department_role = str(request.data.get('department_role', '')).strip()
        requested_sections = request.data.get('access_sections', [])
        sabbath_scope = str(request.data.get('sabbath_programme_scope', 'full')).strip()
        full_name = str(request.data.get('full_name', '')).strip()

        if not username or not email or not password:
            return Response({'error': 'username, email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            sections = self._resolve_sections(requested_sections)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        if not sections and department_role:
            # Backward compatibility with old role-only payloads.
            if department_role == 'church_clerk':
                sections = ['announcements', 'bible_studies', 'sabbath_programme']
            elif department_role == 'sabbath_school':
                sections = ['bible_studies', 'sabbath_programme']
            elif department_role == 'evangelistic':
                sections = ['bible_studies']
        if not sections:
            return Response({'error': 'Select at least one access section.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        first_name = ''
        last_name = ''
        if full_name:
            parts = full_name.split(' ', 1)
            first_name = parts[0]
            last_name = parts[1] if len(parts) > 1 else ''

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=True,
        )

        self._apply_access_groups(user, sections, sabbath_scope, department_role)

        MemberProfile.objects.get_or_create(user=user)
        Token.objects.get_or_create(user=user)

        payload = self._serialize_staff_user(user)
        self._write_account_audit('create', user, {
            'after': self._user_snapshot(user),
            'metadata': {
                'operation': 'create_account',
            }
        })
        payload['success'] = True
        payload['department_role'] = department_role
        return Response(payload, status=status.HTTP_201_CREATED)

    def patch(self, request):
        self._ensure_access(request)

        user_id = request.data.get('id')
        if not user_id:
            return Response({'error': 'id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target = User.objects.get(id=int(user_id), is_staff=True)
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({'error': 'Staff account not found.'}, status=status.HTTP_404_NOT_FOUND)

        before_snapshot = self._user_snapshot(target)

        username = request.data.get('username')
        email = request.data.get('email')
        full_name = request.data.get('full_name')
        is_active = request.data.get('is_active')
        new_password = request.data.get('new_password')
        department_role = request.data.get('department_role')
        requested_sections = request.data.get('access_sections')
        sabbath_scope = request.data.get('sabbath_programme_scope')

        if username is not None:
            username = str(username).strip()
            if not username:
                return Response({'error': 'username cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.exclude(pk=target.pk).filter(username=username).exists():
                return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            target.username = username

        if email is not None:
            email = str(email).strip()
            if not email:
                return Response({'error': 'email cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.exclude(pk=target.pk).filter(email=email).exists():
                return Response({'error': 'Email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            target.email = email

        if full_name is not None:
            full_name = str(full_name).strip()
            if full_name:
                parts = full_name.split(' ', 1)
                target.first_name = parts[0]
                target.last_name = parts[1] if len(parts) > 1 else ''
            else:
                target.first_name = ''
                target.last_name = ''

        if is_active is not None:
            if not isinstance(is_active, bool):
                return Response({'error': 'is_active must be boolean.'}, status=status.HTTP_400_BAD_REQUEST)
            if target.pk == request.user.pk and not is_active:
                return Response({'error': 'You cannot freeze your own account.'}, status=status.HTTP_400_BAD_REQUEST)
            if target.is_superuser and not is_active:
                other_active_superusers = User.objects.filter(is_superuser=True, is_staff=True, is_active=True).exclude(pk=target.pk).count()
                if other_active_superusers == 0:
                    return Response({'error': 'You cannot freeze the last active superuser account.'}, status=status.HTTP_400_BAD_REQUEST)
            target.is_active = is_active

        if new_password is not None:
            new_password = str(new_password).strip()
            if len(new_password) < 8:
                return Response({'error': 'new_password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
            target.set_password(new_password)

        current_access = get_admin_access_profile(target)
        next_sections = current_access['sections']
        if requested_sections is not None:
            try:
                next_sections = self._resolve_sections(requested_sections)
            except ValidationError as exc:
                return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)
            if not next_sections:
                return Response({'error': 'Select at least one access section.'}, status=status.HTTP_400_BAD_REQUEST)

        next_scope = sabbath_scope if sabbath_scope in ('full', 'sabbath_school_only') else current_access['sabbath_programme_scope']
        if 'sabbath_programme' not in next_sections:
            next_scope = 'none'
        elif next_scope not in ('full', 'sabbath_school_only'):
            next_scope = 'full'

        next_role = None
        if department_role is not None:
            next_role = str(department_role).strip() or ''
        elif current_access['department_roles']:
            next_role = current_access['department_roles'][0]
        else:
            next_role = ''

        self._apply_access_groups(target, next_sections, next_scope, next_role)
        target.is_staff = True
        target.save()
        MemberProfile.objects.get_or_create(user=target)
        Token.objects.get_or_create(user=target)

        after_snapshot = self._user_snapshot(target)
        changed_fields = {}
        for field in after_snapshot:
            if before_snapshot.get(field) != after_snapshot.get(field):
                changed_fields[field] = {
                    'before': before_snapshot.get(field),
                    'after': after_snapshot.get(field),
                }
        if new_password is not None:
            changed_fields['password'] = {
                'before': 'REDACTED',
                'after': 'RESET',
            }

        self._write_account_audit('update', target, {
            'before': before_snapshot,
            'after': after_snapshot,
            'changed_fields': changed_fields,
            'metadata': {
                'operation': 'update_account',
                'password_reset': bool(new_password is not None),
            }
        })

        payload = self._serialize_staff_user(target)
        payload['success'] = True
        return Response(payload, status=status.HTTP_200_OK)


class HymnBookViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    queryset = HymnBook.objects.all().order_by('title')
    serializer_class = HymnBookSerializer
    permission_classes = [IsStaffOrReadOnly]
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured hymn books"""
        books = self.queryset.filter(is_featured=True)
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def hymns(self, request, pk=None):
        """Get all hymns for a specific hymn book"""
        book = self.get_object()
        hymns = book.hymns.all().order_by('number')
        serializer = HymnSerializer(hymns, many=True)
        return Response(serializer.data)


class HymnViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    queryset = Hymn.objects.all().order_by('hymn_book', 'number')
    serializer_class = HymnSerializer
    permission_classes = [IsStaffOrReadOnly]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search hymns by title, number, or theme"""
        query = request.query_params.get('q', '')
        book_id = request.query_params.get('book_id', '')
        
        hymns = self.queryset
        
        if book_id:
            hymns = hymns.filter(hymn_book_id=book_id)
        
        if query:
            hymns = hymns.filter(
                Q(title__icontains=query) |
                Q(author__icontains=query) |
                Q(theme__icontains=query) |
                Q(number__icontains=query)
            )
        
        serializer = self.get_serializer(hymns, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_number(self, request):
        """Get hymn by number within a book"""
        book_id = request.query_params.get('book_id', '')
        number = request.query_params.get('number', '')
        
        if book_id and number:
            try:
                hymn = self.queryset.get(hymn_book_id=book_id, number=int(number))
                serializer = self.get_serializer(hymn)
                return Response(serializer.data)
            except Hymn.DoesNotExist:
                return Response({'error': 'Hymn not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({'error': 'book_id and number required'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_theme(self, request):
        """Get hymns by theme"""
        theme = request.query_params.get('theme', '')
        hymns = self.queryset.filter(theme=theme) if theme else []
        serializer = self.get_serializer(hymns, many=True)
        return Response(serializer.data)


class SabbathProgrammeViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    serializer_class = SabbathProgrammeSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = SabbathProgramme.objects.all().order_by('service_date')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_published=True)

    def _ensure_sabbath_programme_access(self):
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            raise PermissionDenied('Permission denied')
        if not user_can_manage_section(self.request.user, 'sabbath_programme'):
            raise PermissionDenied('You do not have access to manage Sabbath programme data.')

    def _enforce_sabbath_school_only_scope(self, serializer):
        access = get_admin_access_profile(self.request.user)
        if access['sabbath_programme_scope'] != 'sabbath_school_only':
            return

        instance = serializer.instance
        if instance is None:
            raise PermissionDenied('Sabbath School department cannot create Sabbath programme entries.')

        incoming = serializer.validated_data
        if 'service_date' in incoming and incoming['service_date'] != instance.service_date:
            raise PermissionDenied('Sabbath School department can only edit Sabbath School fields.')
        if 'theme' in incoming and incoming['theme'] != instance.theme:
            raise PermissionDenied('Sabbath School department can only edit Sabbath School fields.')
        if 'is_published' in incoming and incoming['is_published'] != instance.is_published:
            raise PermissionDenied('Sabbath School department can only edit Sabbath School fields.')

        if 'content' in incoming:
            current_content = instance.content or {}
            next_content = incoming.get('content') or {}
            for key, value in next_content.items():
                if key == 'sabbathSchool':
                    continue
                if current_content.get(key) != value:
                    raise PermissionDenied('Sabbath School department can only edit Sabbath School fields.')

    def perform_create(self, serializer):
        self._ensure_sabbath_programme_access()
        access = get_admin_access_profile(self.request.user)
        if access['sabbath_programme_scope'] == 'sabbath_school_only':
            raise PermissionDenied('Sabbath School department cannot create Sabbath programme entries.')
        super().perform_create(serializer)

    def perform_update(self, serializer):
        self._ensure_sabbath_programme_access()
        self._enforce_sabbath_school_only_scope(serializer)
        super().perform_update(serializer)

    def perform_destroy(self, instance):
        self._ensure_sabbath_programme_access()
        access = get_admin_access_profile(self.request.user)
        if access['sabbath_programme_scope'] == 'sabbath_school_only':
            raise PermissionDenied('Sabbath School department cannot delete Sabbath programme entries.')
        super().perform_destroy(instance)


class CommunityOutreachPageViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    serializer_class = CommunityOutreachPageSerializer
    permission_classes = [IsStaffWithSectionOrReadOnly]

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrReadOnly):
                permission.required_section = 'community_outreach'
        return permissions

    def get_queryset(self):
        queryset = CommunityOutreachPage.objects.all().order_by('page_key')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_published=True)


class GalleryImageViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    serializer_class = GalleryImageSerializer
    permission_classes = [IsStaffWithSectionOrReadOnly]

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrReadOnly):
                permission.required_section = 'gallery'
        return permissions

    def get_queryset(self):
        queryset = GalleryImage.objects.all().order_by('-created_at')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_published=True)


class GoBackToSchoolPageViewSet(AdminAuditMixin, viewsets.ModelViewSet):
    serializer_class = GoBackToSchoolPageSerializer
    permission_classes = [IsStaffWithSectionOrReadOnly]

    def get_permissions(self):
        permissions = [permission() for permission in self.permission_classes]
        for permission in permissions:
            if isinstance(permission, IsStaffWithSectionOrReadOnly):
                permission.required_section = 'go_back_to_school'
        return permissions

    def get_queryset(self):
        queryset = GoBackToSchoolPage.objects.all().order_by('page_key')
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_published=True)


