from django.contrib import admin
from .models import SchoolClass, TimetableEntry, ArchiveLog

admin.site.register(SchoolClass)
admin.site.register(TimetableEntry)
admin.site.register(ArchiveLog)
