# -*- coding: utf-8 -*-
# Generated by Django 3.2.9 on 2021-11-16 11:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0007_auto_20211104_1640"),
    ]

    operations = [
        migrations.AddField(
            model_name="claim",
            name="status",
            field=models.CharField(max_length=255, null=True),
        ),
    ]
