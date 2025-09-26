from django.contrib import admin
from .models import Country, State, City, Degree, Program

admin.site.register(Country)
admin.site.register(State)
admin.site.register(City)
admin.site.register(Degree)
admin.site.register(Program)