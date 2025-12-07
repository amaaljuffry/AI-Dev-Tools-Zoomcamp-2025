from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from .models import Todo
from .forms import TodoForm




def home(request):
    todos = Todo.objects.all()
    return render(request, 'todo/home.html', {'todos': todos})




def todo_create(request):
    if request.method == 'POST':
        form = TodoForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = TodoForm()
    return render(request, 'todo/todo_form.html', {'form': form, 'action': 'Create'})




def todo_edit(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    if request.method == 'POST':
        form = TodoForm(request.POST, instance=todo)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = TodoForm(instance=todo)
    return render(request, 'todo/todo_form.html', {'form': form, 'action': 'Edit'})




def todo_delete(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    if request.method == 'POST':
        todo.delete()
        return redirect('home')
    return render(request, 'todo/todo_form.html', {'form': None, 'action': 'Delete', 'todo': todo})




def todo_toggle_resolved(request, pk):
    todo = get_object_or_404(Todo, pk=pk)
    todo.resolved = not todo.resolved
    todo.save()
    return redirect('home')