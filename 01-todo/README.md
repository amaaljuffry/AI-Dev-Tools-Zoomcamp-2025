# Django TODO

A simple TODO application built with Django.

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv .venv
   ```

2. **Activate the virtual environment:**
   - On Windows:
     ```bash
     .venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (optional, for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

7. **Open in browser:**
   - App: http://127.0.0.1:8000/
   - Admin: http://127.0.0.1:8000/admin/

## Run Tests

```bash
python manage.py test
```

## Features

- Create, read, update, and delete TODOs
- Mark TODOs as resolved/unresolved
- Set due dates for TODOs
- Admin panel for managing TODOs