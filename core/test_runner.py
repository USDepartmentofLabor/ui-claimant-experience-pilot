# -*- coding: utf-8 -*-
from django.test.runner import DiscoverRunner
from django.db import connections
import os

# import pprint


class MyTestRunner(DiscoverRunner):
    def setup_databases(self, **kwargs):
        # At WCMS, no tables should exist but schema should. Double-check.
        # NOTE this assumes we have a single db config for "default" -- see core/settings.py
        if os.environ.get("DB_SCHEMA") and os.environ.get("WCMS_TEST_ENV"):
            connection = connections["default"]
            config = (connection, connection.settings_dict["TEST"]["NAME"], True)
            self.__drop_all_tables([config])

        return super().setup_databases(**kwargs)

    def teardown_databases(self, old_config, **kwargs):
        # if we are running at WCMS, never drop schema, but do drop all tables
        if os.environ.get("DB_SCHEMA") and os.environ.get("WCMS_TEST_ENV"):
            self.__drop_all_tables(old_config)

        return super().teardown_databases(old_config, **kwargs)

    def __drop_all_tables(self, old_config):
        for connection, old_name, destroy in old_config:
            if destroy:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT table_name FROM information_schema.tables WHERE table_schema = %s",
                        [old_name],
                    )
                    table_names = []
                    for row in cursor.fetchall():
                        table_names.append(row[0])
                    # print("table_names: {}".format(pprint.pformat(table_names)))
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
                    for tbl in table_names:
                        cursor.execute("DROP TABLE IF EXISTS {}".format(tbl))
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        return True
