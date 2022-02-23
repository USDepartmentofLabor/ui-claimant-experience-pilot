# -*- coding: utf-8 -*-
# Generated by Django 3.2.12 on 2022-02-17 13:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0014_alter_claim_swa_xid"),
    ]

    operations = [
        migrations.AddField(
            model_name="swa",
            name="featureset",
            field=models.IntegerField(
                choices=[
                    (1, "Claim And Identity"),
                    (2, "Identity Only"),
                    (3, "Claim Only"),
                ],
                default=1,
            ),
        ),
    ]
