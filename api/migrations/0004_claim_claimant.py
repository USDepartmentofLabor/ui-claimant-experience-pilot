# -*- coding: utf-8 -*-
# Generated by Django 3.2.8 on 2021-10-26 19:40

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_auto_20211025_2313"),
    ]

    operations = [
        migrations.CreateModel(
            name="Claimant",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("idp_user_xid", models.CharField(max_length=255, unique=True)),
                (
                    "idp",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        to="api.identityprovider",
                    ),
                ),
            ],
            options={
                "db_table": "claimants",
            },
        ),
        migrations.CreateModel(
            name="Claim",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "uuid",
                    models.UUIDField(default=uuid.uuid4, unique=True),
                ),
                (
                    "claimant",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT, to="api.claimant"
                    ),
                ),
                (
                    "swa",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT, to="api.swa"
                    ),
                ),
            ],
            options={
                "db_table": "claims",
            },
        ),
    ]