from django.test import TestCase
from django.urls import reverse
from .models import Todo
from datetime import date




class TodoModelTests(TestCase):
    def test_create_todo(self):
        t = Todo.objects.create(title='Test', description='Desc', due_date=date.today())
        self.assertEqual(Todo.objects.count(), 1)
        self.assertFalse(t.resolved)




class TodoViewsTests(TestCase):
    def setUp(self):
        self.todo = Todo.objects.create(title='VTest', description='View test')

    def test_home_status_code(self):
        resp = self.client.get(reverse('home'))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, 'VTest')

    def test_create_view(self):
        resp = self.client.post(reverse('todo_create'), {'title': 'New', 'description': 'x'})
        self.assertEqual(resp.status_code, 302)  # redirect
        self.assertEqual(Todo.objects.filter(title='New').count(), 1)

    def test_edit_view(self):
        resp = self.client.post(reverse('todo_edit', args=[self.todo.pk]), {'title': 'Edited', 'description': 'y'})
        self.assertEqual(resp.status_code, 302)
        self.todo.refresh_from_db()
        self.assertEqual(self.todo.title, 'Edited')

    def test_toggle_resolved(self):
        resp = self.client.get(reverse('todo_toggle', args=[self.todo.pk]))
        self.assertEqual(resp.status_code, 302)
        self.todo.refresh_from_db()
        self.assertTrue(self.todo.resolved)

    def test_delete(self):
        resp = self.client.post(reverse('todo_delete', args=[self.todo.pk]))
        self.assertEqual(resp.status_code, 302)
        self.assertEqual(Todo.objects.count(), 0)