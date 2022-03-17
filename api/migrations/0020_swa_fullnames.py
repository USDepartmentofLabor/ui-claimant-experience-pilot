# -*- coding: utf-8 -*-

from django.db import migrations


def add_default_fullnames(apps, schema_editor):
    SWA = apps.get_model("api", "SWA")
    AR = SWA.objects.get(code="AR")
    AR.fullname = "Arkansas Division of Workforce Services"
    AR.save()
    NJ = SWA.objects.get(code="NJ")
    NJ.fullname = "New Jersey Department of Labor & Workforce Development"
    NJ.save()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0019_swa_fullname"),
    ]

    operations = [
        migrations.RunPython(add_default_fullnames),
    ]
