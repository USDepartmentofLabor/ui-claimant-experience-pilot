# -*- coding: utf-8 -*-
# Generated by Django 3.2.12 on 2022-03-08 20:56

from django.db import migrations


def add_AR_claimant_url(apps, schema_editor):
    SWA = apps.get_model("api", "SWA")
    AR = SWA.objects.get(code="AR")
    AR.claimant_url = "https://www.dws.arkansas.gov/unemployment/"
    AR.save()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0017_auto_20220308_1403"),
    ]

    operations = [
        migrations.RunPython(add_AR_claimant_url),
    ]
