from django.contrib import admin
from .models import User, Role, Permission, UserRole, RolePermission

admin.site.register(User)
admin.site.register(Role)
admin.site.register(Permission)
admin.site.register(UserRole)
admin.site.register(RolePermission)