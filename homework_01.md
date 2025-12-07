# **Homework Answers**

### **Question 1: Install Django**

**Command suggested by AI:**

```
pip install django
```

---

### **Question 2: Project and App**

To include your newly created app in the project, you must edit:

**Answer:**
`settings.py`

---

### **Question 3: Django Models**

Typical TODO models (what you would implement):

```python
from django.db import models

class Todo(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
```

After creating models, the required next step is:

**Answer:**
`Run migrations`

---

### **Question 4: TODO Logic**

In Django, application logic (CRUD for TODO) goes into:

**Answer:**
`views.py`

---

### **Question 5: Templates**

To register where templates live, you edit:

**Answer:**
`TEMPLATES['DIRS']` in project's `settings.py`

---

### **Question 6: Tests**

To run tests in Django, the correct command is:

**Answer:**
`python manage.py test`

---
