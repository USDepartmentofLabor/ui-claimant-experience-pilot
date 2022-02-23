# -*- coding: utf-8 -*-

from django.db import migrations


def add_default_featuresets(apps, schema_editor):
    SWA = apps.get_model("api", "SWA")
    AR = SWA.objects.get(code="AR")
    AR.featureset = 2
    AR.save()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0015_swa_featureset"),
    ]

    operations = [
        migrations.RunPython(add_default_featuresets),
    ]
