# -*- coding: utf-8 -*-


class XSSProtectionHeader(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response.headers.setdefault("X-XSS-Protection", "1; mode=block")
        return response
