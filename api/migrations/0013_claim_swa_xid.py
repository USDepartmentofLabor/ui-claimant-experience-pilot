# -*- coding: utf-8 -*-
# Generated by Django 3.2.12 on 2022-02-15 22:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_auto_20220210_1947"),
    ]

    operations = [
        migrations.AddField(
            model_name="claim",
            name="swa_xid",
            field=models.CharField(max_length=255, null=True),
        ),
    ]