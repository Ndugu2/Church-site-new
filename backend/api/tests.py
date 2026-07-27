from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import AdminAuditLog, BlogPost, Donation, Event, EventAttendance, ForumCategory, ForumPost, ForumThread, MemberProfile


class PermissionHardeningTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='member1', password='Pass12345!')
		self.token = Token.objects.create(user=self.user)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

	def test_non_staff_cannot_create_sermon(self):
		res = self.client.post('/api/sermons/', {
			'title': 'Test Sermon',
			'speaker': 'Speaker',
			'date': '2026-07-21',
			'passage': 'John 3:16',
			'category': 'Sabbath Sermons',
		}, format='json')
		self.assertEqual(res.status_code, 403)

	def test_non_staff_cannot_create_event(self):
		res = self.client.post('/api/events/', {
			'title': 'Test Event',
			'date': '2026-07-22',
			'location': 'Main Hall',
			'desc': 'Event details',
		}, format='json')
		self.assertEqual(res.status_code, 403)

	def test_non_staff_cannot_create_forum_category(self):
		res = self.client.post('/api/forum-categories/', {
			'name': 'New Category',
			'description': 'Should be staff-only',
		}, format='json')
		self.assertEqual(res.status_code, 403)

	def test_non_staff_cannot_create_hymn_book(self):
		res = self.client.post('/api/hymn-books/', {
			'title': 'Managed Hymnal',
			'abbreviation': 'MH',
			'publisher': 'Church',
			'year': 2026,
			'description': 'Desc',
			'hymn_count': 1,
			'is_featured': False,
		}, format='json')
		self.assertEqual(res.status_code, 403)


class AuthJourneyTests(APITestCase):
	def test_register_then_login(self):
		register_res = self.client.post('/api/register/', {
			'username': 'new_member',
			'email': 'new@example.com',
			'password': 'Pass12345!'
		}, format='json')
		self.assertEqual(register_res.status_code, 201)
		self.assertTrue(register_res.data.get('success'))

		login_res = self.client.post('/api/login/', {
			'username': 'new_member',
			'password': 'Pass12345!'
		}, format='json')
		self.assertEqual(login_res.status_code, 200)
		self.assertTrue(login_res.data.get('token'))


class DonationJourneyTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='donor', password='Pass12345!')
		token = Token.objects.create(user=self.user)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

	def test_create_and_list_donation(self):
		create_res = self.client.post('/api/donations/', {
			'amount': '50000.00',
			'fund': 'Tithe',
			'method': 'Mobile Money'
		}, format='json')
		self.assertEqual(create_res.status_code, 201)

		list_res = self.client.get('/api/donations/')
		self.assertEqual(list_res.status_code, 200)
		results = list_res.data.get('results', list_res.data)
		self.assertTrue(len(results) >= 1)
		self.assertEqual(Donation.objects.count(), 1)


class CommunityJourneyTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(username='community_user', password='Pass12345!')
		self.member = MemberProfile.objects.create(user=self.user)
		token = Token.objects.create(user=self.user)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

		self.staff = User.objects.create_user(username='staff_user', password='Pass12345!', is_staff=True)
		self.staff_token = Token.objects.create(user=self.staff)
		self.category = ForumCategory.objects.create(name='Bible Study', description='Discuss scripture')
		self.event = Event.objects.create(
			title='Camp Meeting',
			date='2026-09-01',
			location='Main Hall',
			desc='Spiritual gathering',
			is_published=True,
		)

	def test_event_registration_persists(self):
		res = self.client.post(f'/api/events/{self.event.id}/register/')
		self.assertEqual(res.status_code, 200)
		self.assertEqual(EventAttendance.objects.count(), 1)

	def test_forum_thread_and_reply_persist(self):
		thread_res = self.client.post('/api/forum-threads/', {
			'category': self.category.id,
			'title': 'How was your Sabbath?',
			'content': 'Share highlights and prayer requests.'
		}, format='json')
		self.assertEqual(thread_res.status_code, 201)

		thread_id = thread_res.data['id']
		reply_res = self.client.post('/api/forum-posts/', {
			'thread': thread_id,
			'content': 'Grateful for the message and fellowship.'
		}, format='json')
		self.assertEqual(reply_res.status_code, 201)

		self.assertEqual(ForumThread.objects.count(), 1)
		self.assertEqual(ForumPost.objects.count(), 1)


class AnnouncementBackendCompatibilityTests(APITestCase):
	def setUp(self):
		self.staff = User.objects.create_user(username='staff_announce', password='Pass12345!', is_staff=True)
		self.staff_token = Token.objects.create(user=self.staff)

		self.member = User.objects.create_user(username='member_announce', password='Pass12345!')
		self.member_token = Token.objects.create(user=self.member)

	def test_public_announcements_hide_expired_and_future(self):
		now = timezone.now()

		BlogPost.objects.create(
			title='Active Notice',
			slug='active-notice',
			content='Visible now',
			category='announcement',
			is_published=True,
			scheduled_publish=now - timezone.timedelta(hours=1),
			expires_at=now + timezone.timedelta(days=2),
		)
		BlogPost.objects.create(
			title='Future Notice',
			slug='future-notice',
			content='Not yet visible',
			category='announcement',
			is_published=True,
			scheduled_publish=now + timezone.timedelta(days=1),
		)
		BlogPost.objects.create(
			title='Expired Notice',
			slug='expired-notice',
			content='Should be hidden',
			category='announcement',
			is_published=True,
			expires_at=now - timezone.timedelta(minutes=1),
		)

		res = self.client.get('/api/blog/by_category/?category=announcement')
		self.assertEqual(res.status_code, 200)
		results = res.data if isinstance(res.data, list) else res.data.get('results', [])
		titles = [item['title'] for item in results]

		self.assertIn('Active Notice', titles)
		self.assertNotIn('Future Notice', titles)
		self.assertNotIn('Expired Notice', titles)

	def test_staff_can_request_include_expired_announcements(self):
		now = timezone.now()
		expired = BlogPost.objects.create(
			title='Expired Staff Notice',
			slug='expired-staff-notice',
			content='Visible for staff include_expired query',
			category='announcement',
			is_published=True,
			expires_at=now - timezone.timedelta(days=1),
		)

		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
		res = self.client.get('/api/blog/by_category/?category=announcement&include_expired=true')
		self.assertEqual(res.status_code, 200)
		results = res.data if isinstance(res.data, list) else res.data.get('results', [])
		ids = [item['id'] for item in results]
		self.assertIn(expired.id, ids)


class AccessSeparationTests(APITestCase):
	def setUp(self):
		self.member = User.objects.create_user(username='member_access', password='Pass12345!')
		self.member_profile = MemberProfile.objects.create(user=self.member)
		self.member_token = Token.objects.create(user=self.member)

		self.staff = User.objects.create_user(username='staff_access', password='Pass12345!', is_staff=True)
		self.staff_profile = MemberProfile.objects.create(user=self.staff)
		self.staff_token = Token.objects.create(user=self.staff)

	def test_member_profile_list_is_scoped_to_current_user(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')
		res = self.client.get('/api/members/')
		self.assertEqual(res.status_code, 200)
		results = res.data.get('results', res.data)
		self.assertEqual(len(results), 1)
		self.assertEqual(results[0]['user']['username'], 'member_access')

	def test_public_can_create_but_not_list_bible_study(self):
		create_res = self.client.post('/api/bible-studies/', {
			'name': 'John Doe',
			'email': 'john@example.com',
			'phone': '+256700000000',
			'country': 'Uganda',
			'course': 'Sanctuary Doctrine'
		}, format='json')
		self.assertEqual(create_res.status_code, 201)

		list_res = self.client.get('/api/bible-studies/')
		self.assertEqual(list_res.status_code, 401)

	def test_public_can_create_but_not_list_donations(self):
		create_res = self.client.post('/api/donations/', {
			'amount': '10000.00',
			'fund': 'Tithe',
			'method': 'Mobile Money'
		}, format='json')
		self.assertEqual(create_res.status_code, 201)

		list_res = self.client.get('/api/donations/')
		self.assertEqual(list_res.status_code, 401)

	def test_prayer_support_requires_authentication(self):
		prayer = self.client.post('/api/prayers/', {
			'name': 'Anonymous',
			'content': 'Please pray for my family.',
			'confidential': False,
		}, format='json')
		self.assertEqual(prayer.status_code, 201)

		support_res = self.client.post(f"/api/prayers/{prayer.data['id']}/support/")
		self.assertEqual(support_res.status_code, 401)


class AdminSessionAndAuditTests(APITestCase):
	def setUp(self):
		self.staff = User.objects.create_user(username='staff_audit', password='Pass12345!', is_staff=True)
		self.staff_token = Token.objects.create(user=self.staff)
		self.member = User.objects.create_user(username='member_audit', password='Pass12345!')
		self.member_token = Token.objects.create(user=self.member)

	def test_admin_session_endpoint_requires_auth(self):
		res = self.client.get('/api/admin/session/')
		self.assertEqual(res.status_code, 401)

	def test_admin_session_endpoint_reports_staff_flags(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
		res = self.client.get('/api/admin/session/')
		self.assertEqual(res.status_code, 200)
		self.assertTrue(res.data.get('authenticated'))
		self.assertTrue(res.data.get('is_staff'))

	def test_staff_write_creates_admin_audit_log(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
		create_res = self.client.post('/api/sermons/', {
			'title': 'Audit Sermon',
			'speaker': 'Pastor Example',
			'date': '2026-07-21',
			'passage': 'Psalm 23',
			'category': 'Sabbath Sermons',
		}, format='json')
		self.assertEqual(create_res.status_code, 201)
		self.assertEqual(AdminAuditLog.objects.count(), 1)
		entry = AdminAuditLog.objects.first()
		self.assertEqual(entry.action, 'create')
		self.assertEqual(entry.resource_type, 'Sermon')

	def test_audit_log_endpoint_is_staff_only(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')
		res = self.client.get('/api/admin-audit-logs/')
		self.assertEqual(res.status_code, 403)

	def test_audit_log_endpoint_supports_action_filter_for_staff(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.staff_token.key}')
		self.client.post('/api/sermons/', {
			'title': 'Create Log Seed',
			'speaker': 'Pastor Filter',
			'date': '2026-07-22',
			'passage': 'John 1',
			'category': 'Sabbath Sermons',
		}, format='json')

		res = self.client.get('/api/admin-audit-logs/?action=create')
		self.assertEqual(res.status_code, 200)
		results = res.data.get('results', res.data)
		self.assertTrue(len(results) >= 1)
		self.assertTrue(all(item['action'] == 'create' for item in results))
