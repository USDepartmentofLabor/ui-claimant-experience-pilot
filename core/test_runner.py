# -*- coding: utf-8 -*-
# custom test runner mostly just to set the os.environ to let our code
# know that they are executing within tests

from django.test.runner import DiscoverRunner
import os

os.environ["RUNNING_TESTS"] = "true"


class MyTestRunner(DiscoverRunner):
    pass
