from django.contrib.auth.models import Group, User
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import AdminAuditLog, BibleStudy, BlogPost, Donation, Event, EventAttendance, ForumCategory, ForumPost, ForumThread, MemberProfile


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
			category='Worship',
			capacity=1,
			waitlist_enabled=True,
			desc='Spiritual gathering',
			is_published=True,
		)

	def test_event_registration_persists(self):
		res = self.client.post(f'/api/events/{self.event.id}/register/', {
			'name': 'Community User',
			'email': 'community@example.com',
			'phone': '+256700111222',
			'notes': 'Will come with a friend.',
		}, format='json')
		self.assertEqual(res.status_code, 201)
		self.assertEqual(EventAttendance.objects.count(), 1)
		attendance = EventAttendance.objects.get()
		self.assertEqual(attendance.contact_name, 'Community User')
		self.assertEqual(attendance.contact_email, 'community@example.com')
		self.assertEqual(attendance.contact_phone, '+256700111222')
		self.assertEqual(attendance.notes, 'Will come with a friend.')

	def test_event_registration_repeat_returns_existing_record(self):
		first_res = self.client.post(f'/api/events/{self.event.id}/register/', {
			'name': 'Community User',
			'email': 'community@example.com',
			'phone': '+256700111222',
			'notes': 'Initial note',
		}, format='json')
		self.assertEqual(first_res.status_code, 201)

		second_res = self.client.post(f'/api/events/{self.event.id}/register/', {
			'name': 'Community User Updated',
			'email': 'community+new@example.com',
			'phone': '+256701999000',
			'notes': 'Updated note',
		}, format='json')
		self.assertEqual(second_res.status_code, 200)
		self.assertTrue(second_res.data.get('already_registered'))
		self.assertEqual(EventAttendance.objects.count(), 1)

		attendance = EventAttendance.objects.get()
		self.assertEqual(attendance.contact_name, 'Community User Updated')
		self.assertEqual(attendance.contact_email, 'community+new@example.com')
		self.assertEqual(attendance.contact_phone, '+256701999000')
		self.assertEqual(attendance.notes, 'Updated note')

	def test_event_registration_uses_waitlist_when_capacity_reached(self):
		first_res = self.client.post(f'/api/events/{self.event.id}/register/', {
			'name': 'First Member',
			'email': 'first@example.com',
			'phone': '+256700000001',
			'notes': '',
		}, format='json')
		self.assertEqual(first_res.status_code, 201)
		self.assertFalse(first_res.data.get('waitlisted'))

		second_user = User.objects.create_user(username='second_member', password='Pass12345!')
		MemberProfile.objects.create(user=second_user)
		second_token = Token.objects.create(user=second_user)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {second_token.key}')

		second_res = self.client.post(f'/api/events/{self.event.id}/register/', {
			'name': 'Second Member',
			'email': 'second@example.com',
			'phone': '+256700000002',
			'notes': '',
		}, format='json')
		self.assertEqual(second_res.status_code, 201)
		self.assertTrue(second_res.data.get('waitlisted'))
		self.assertEqual(second_res.data.get('waitlist_position'), 1)

	def test_member_event_registrations_endpoint_returns_rsvp_status(self):
		self.client.post(f'/api/events/{self.event.id}/register/', {
			'name': 'Community User',
			'email': 'community@example.com',
			'phone': '+256700111222',
			'notes': 'See you there',
		}, format='json')

		res = self.client.get('/api/members/my_event_registrations/')
		self.assertEqual(res.status_code, 200)
		self.assertEqual(len(res.data), 1)
		self.assertEqual(res.data[0]['event_id'], self.event.id)
		self.assertIn(res.data[0]['rsvp_status'], ['registered', 'completed'])

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

	def test_forum_posting_creates_member_profile_if_missing(self):
		user_without_profile = User.objects.create_user(username='community_no_profile', password='Pass12345!')
		token = Token.objects.create(user=user_without_profile)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

		thread_res = self.client.post('/api/forum-threads/', {
			'category': self.category.id,
			'title': 'Profile auto-create check',
			'content': 'Testing forum posting without a pre-existing member profile.'
		}, format='json')
		self.assertEqual(thread_res.status_code, 201)
		self.assertTrue(MemberProfile.objects.filter(user=user_without_profile).exists())


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

	def test_public_can_increment_blog_view_counter(self):
		post = BlogPost.objects.create(
			title='Public View Test',
			slug='public-view-test',
			content='Testing public view increments.',
			category='news',
			is_published=True,
			views=0,
		)

		res = self.client.post(f'/api/blog/{post.id}/view/')
		self.assertEqual(res.status_code, 200)
		post.refresh_from_db()
		self.assertEqual(post.views, 1)


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

	def test_staff_can_assign_bible_study_group(self):
		study = BibleStudy.objects.create(
			name='Jane Doe',
			email='jane@example.com',
			phone='+256711111111',
			country='Uganda',
			course='Daniel Study',
		)
		staff = User.objects.create_user(username='study_admin', password='Pass12345!', is_staff=True, is_superuser=True)
		staff_token = Token.objects.create(user=staff)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {staff_token.key}')

		patch_res = self.client.patch(f'/api/bible-studies/{study.id}/', {
			'group_name': 'Tuesday Evening Group',
		}, format='json')
		self.assertEqual(patch_res.status_code, 200)

		study.refresh_from_db()
		self.assertEqual(study.group_name, 'Tuesday Evening Group')

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
		sermon_group, _ = Group.objects.get_or_create(name='Access Sermons')
		audit_group, _ = Group.objects.get_or_create(name='Access Audit Trail')
		self.staff.groups.add(sermon_group)
		self.staff.groups.add(audit_group)
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

	def test_admin_session_includes_testimonies_tab_when_group_assigned(self):
		testimony_staff = User.objects.create_user(username='testimony_staff', password='Pass12345!', is_staff=True)
		testimony_token = Token.objects.create(user=testimony_staff)
		testimony_group, _ = Group.objects.get_or_create(name='Access Testimonies')
		testimony_staff.groups.add(testimony_group)

		self.client.credentials(HTTP_AUTHORIZATION=f'Token {testimony_token.key}')
		res = self.client.get('/api/admin/session/')
		self.assertEqual(res.status_code, 200)
		self.assertTrue(res.data.get('is_staff'))
		self.assertIn('admin-testimonies', res.data.get('admin_tabs', []))

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


class AdminAccountManagementTests(APITestCase):
	def setUp(self):
		self.member = User.objects.create_user(username='member_accounts', password='Pass12345!')
		self.member_token = Token.objects.create(user=self.member)

		self.clerk = User.objects.create_user(username='clerk_admin', password='Pass12345!', is_staff=True)
		self.clerk_token = Token.objects.create(user=self.clerk)
		clerk_group, _ = Group.objects.get_or_create(name='Church Clerk')
		self.clerk.groups.add(clerk_group)

		self.super_admin = User.objects.create_superuser(username='super_admin', email='super@church.org', password='Pass12345!')
		self.super_admin_token = Token.objects.create(user=self.super_admin)

		self.sabbath_staff = User.objects.create_user(username='ss_admin', password='Pass12345!', is_staff=True)
		self.sabbath_token = Token.objects.create(user=self.sabbath_staff)
		ss_group, _ = Group.objects.get_or_create(name='Sabbath School')
		self.sabbath_staff.groups.add(ss_group)

	def test_non_staff_cannot_access_admin_user_management(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.member_token.key}')
		res = self.client.get('/api/admin/users/')
		self.assertEqual(res.status_code, 403)

	def test_staff_non_superuser_cannot_access_admin_user_management(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.clerk_token.key}')
		res = self.client.get('/api/admin/users/')
		self.assertEqual(res.status_code, 403)

	def test_sabbath_school_staff_cannot_create_accounts(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.sabbath_token.key}')
		res = self.client.post('/api/admin/users/', {
			'username': 'blocked_user',
			'email': 'blocked@example.com',
			'password': 'Pass12345!',
			'access_sections': ['bible_studies'],
		}, format='json')
		self.assertEqual(res.status_code, 403)

	def test_super_admin_can_create_account_and_assign_sections(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
		res = self.client.post('/api/admin/users/', {
			'username': 'evangelistic_staff',
			'email': 'evangelistic@example.com',
			'password': 'Pass12345!',
			'access_sections': ['bible_studies', 'sabbath_programme', 'testimonies'],
			'sabbath_programme_scope': 'sabbath_school_only',
			'full_name': 'Eva Ngelist',
		}, format='json')
		self.assertEqual(res.status_code, 201)
		created = User.objects.get(username='evangelistic_staff')
		self.assertTrue(created.is_staff)
		self.assertTrue(created.groups.filter(name='Access Bible Studies').exists())
		self.assertTrue(created.groups.filter(name='Access Sabbath Programme').exists())
		self.assertTrue(created.groups.filter(name='Access Testimonies').exists())
		self.assertTrue(created.groups.filter(name='Scope Sabbath School Only').exists())
		entry = AdminAuditLog.objects.filter(resource_type='StaffAccount', resource_label='evangelistic_staff', action='create').first()
		self.assertIsNotNone(entry)
		self.assertEqual(entry.details.get('metadata', {}).get('operation'), 'create_account')

	def test_super_admin_can_edit_account_rights_and_freeze(self):
		staff = User.objects.create_user(username='editable_staff', email='editable@church.org', password='Pass12345!', is_staff=True)
		Group.objects.get_or_create(name='Access Bible Studies')[0].user_set.add(staff)

		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
		res = self.client.patch('/api/admin/users/', {
			'id': staff.id,
			'full_name': 'Editable Staff',
			'username': 'editable_staff_updated',
			'email': 'updated@church.org',
			'access_sections': ['announcements', 'projects'],
			'is_active': False,
		}, format='json')
		self.assertEqual(res.status_code, 200)

		staff.refresh_from_db()
		self.assertEqual(staff.username, 'editable_staff_updated')
		self.assertEqual(staff.email, 'updated@church.org')
		self.assertFalse(staff.is_active)
		self.assertTrue(staff.groups.filter(name='Access Announcements').exists())
		self.assertTrue(staff.groups.filter(name='Access Projects').exists())
		self.assertFalse(staff.groups.filter(name='Access Bible Studies').exists())
		entry = AdminAuditLog.objects.filter(resource_type='StaffAccount', resource_id=str(staff.id), action='update').first()
		self.assertIsNotNone(entry)
		self.assertEqual(entry.details.get('metadata', {}).get('operation'), 'update_account')
		self.assertIn('is_active', entry.details.get('changed_fields', {}))

	def test_cannot_freeze_last_active_superuser(self):
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
		res = self.client.patch('/api/admin/users/', {
			'id': self.super_admin.id,
			'is_active': False,
		}, format='json')
		self.assertEqual(res.status_code, 400)
		error_text = str(res.data.get('error', '')).lower()
		self.assertTrue('last active superuser' in error_text or 'freeze your own account' in error_text)
		self.super_admin.refresh_from_db()
		self.assertTrue(self.super_admin.is_active)

	def test_super_admin_can_reset_staff_password(self):
		staff = User.objects.create_user(username='reset_target', email='reset@church.org', password='OldPass123!', is_staff=True)

		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.super_admin_token.key}')
		res = self.client.patch('/api/admin/users/', {
			'id': staff.id,
			'new_password': 'NewPass123!'
		}, format='json')
		self.assertEqual(res.status_code, 200)

		login_res = self.client.post('/api/login/', {
			'username': 'reset_target',
			'password': 'NewPass123!'
		}, format='json')
		self.assertEqual(login_res.status_code, 200)

	def test_non_superuser_cannot_patch_account(self):
		staff = User.objects.create_user(username='patch_target', email='patch@church.org', password='Pass12345!', is_staff=True)
		self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.clerk_token.key}')
		res = self.client.patch('/api/admin/users/', {
			'id': staff.id,
			'is_active': False,
		}, format='json')
		self.assertEqual(res.status_code, 403)
