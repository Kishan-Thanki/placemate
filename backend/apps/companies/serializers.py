from rest_framework import serializers
from .models import Company
from users.models import User
from django.db import transaction
from django.utils.crypto import get_random_string

class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'phone_number','secondary_email', 'alternate_phone']


class CompanyCreateSerializer(serializers.ModelSerializer):
    user = UserCreateSerializer()

    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        
        try:
            password = get_random_string(12) 
            # user = User.objects.create_user(**user_data)
            # # company = Company.objects.create(user=user, **validated_data)
            # return company
        except Exception as e:
            raise serializers.ValidationError({"user": str(e)})