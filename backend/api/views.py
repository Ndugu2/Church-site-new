from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.db.models import Q, Sum
from django.utils import timezone
from django.utils.text import slugify
from .models import (
    Sermon, Event, PrayerRequest, BibleStudy, Donation, Project, LessonVideo,
    MemberProfile, BlogPost, Testimony, ForumCategory, ForumThread, ForumPost,
    StaffMember, PageView, EngagementMetric, Payment, Notification, 
    EventAttendance, PrayerSupport, HymnBook, Hymn, SabbathProgramme, ProjectUpdateLog,
    AdminAuditLog
)
from .serializers import (
    SermonSerializer, EventSerializer, PrayerRequestSerializer, BibleStudySerializer,
    DonationSerializer, ProjectSerializer, LessonVideoSerializer, MemberProfileSerializer,
    BlogPostSerializer, TestimonySerializer, ForumCategorySerializer, ForumThreadSerializer,
    ForumPostSerializer, StaffMemberSerializer, PageViewSerializer, EngagementMetricSerializer,
    PaymentSerializer, NotificationSerializer, EventAttendanceSerializer, PrayerSupportSerializer,
    UserSerializer, HymnBookSerializer, HymnSerializer, SabbathProgrammeSerializer, ProjectUpdateLogSerializer,
    AdminAuditLogSerializer
)


class IsStaffOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


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
    permission_classes = [IsStaffOrReadOnly]

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
    permission_classes = [IsStaffOrReadOnly]

    def get_permissions(self):
        if self.action == 'register':
            return [AllowAny()]
        return [permission() for permission in self.permission_classes]

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
        
        try:
            member = request.user.member_profile
            attendance, created = EventAttendance.objects.get_or_create(
                event=event,
                member=member
            )
            serializer = EventAttendanceSerializer(attendance)
            return Response(serializer.data)
        except MemberProfile.DoesNotExist:
            return Response({'error': 'Member profile not found'}, status=status.HTTP_400_BAD_REQUEST)

class PrayerRequestViewSet(viewsets.ModelViewSet):
    queryset = PrayerRequest.objects.order_by('-created_at')
    serializer_class = PrayerRequestSerializer
    permission_classes = [IsStaffOrPublicReadCreate]

    def get_permissions(self):
        if self.action == 'support':
            return [IsAuthenticated()]
        return [permission() for permission in self.permission_classes]
    
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
    permission_classes = [IsStaffOrPublicCreateOnly]

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by('-created_at')
    serializer_class = DonationSerializer
    permission_classes = [IsStaffOrPublicCreateOnly]

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [permission() for permission in self.permission_classes]

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
    permission_classes = [IsStaffOrReadOnly]

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
    permission_classes = [IsStaffOrReadOnly]


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
        return [IsStaffOrReadOnly()]

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
        try:
            profile = self.request.user.member_profile
        except MemberProfile.DoesNotExist:
            raise ValidationError({'error': 'Member profile not found'})
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
        try:
            profile = self.request.user.member_profile
        except MemberProfile.DoesNotExist:
            raise ValidationError({'error': 'Member profile not found'})
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
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        if not request.user.is_staff:
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
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                "success": True,
                "username": user.username,
                "email": user.email,
                "token": token.key,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
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
        return Response({
            'authenticated': True,
            'is_staff': bool(user.is_staff),
            'username': user.username,
            'is_superuser': bool(user.is_superuser),
        }, status=status.HTTP_200_OK)


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
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return queryset.filter(is_published=True)
        return queryset


