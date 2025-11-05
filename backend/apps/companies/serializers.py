from .models import Company
from rest_framework import serializers 

class CompanySerializer(serializers.ModelSerializer):
    company_size_display = serializers.CharField(
        source='get_company_size_display', 
        read_only=True
    )
    
    logo = serializers.ImageField(required=False, allow_null=True)
    headquarters_city_name = serializers.SerializerMethodField(read_only=True)    
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'email', 'phone_number', 'website_url', 
            'description', 'logo', 'year_founded', 'company_size',
            'company_size_display', 'headquarters_address', 
            'headquarters_city','headquarters_city_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_headquarters_city_name(self, obj):
        return obj.headquarters_city.name if obj.headquarters_city else None