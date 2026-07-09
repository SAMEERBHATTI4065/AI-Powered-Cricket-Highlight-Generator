from rest_framework.authtoken.models import Token
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser

class TokenAuthMiddleware(MiddlewareMixin):
    def process_request(self, request):
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                # Retrieve the token and select the related user
                token = Token.objects.select_related('user').get(key=token_key)
                request.user = token.user
            except Token.DoesNotExist:
                request.user = AnonymousUser()
