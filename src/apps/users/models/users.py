from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Meta:
        db_table = 'users'
        
    username = models.CharField(max_length=255, unique=False,)
    # passwordはAbstractUser(AbstractBaseUser)より継承のため省略
    # emailはblank=False, unique=Trueにするため修正
    email = models.EmailField(blank=False, unique=True,)
    # is_staff, is_activeはAbstractUserより継承のため省略
    created_at = models.DateTimeField(auto_now_add=True,)
    updated_at = models.DateTimeField(auto_now=True,)

    USERNAME_FIELD = 'email' # このテーブルのレコードを一意に識別
    REQUIRED_FIELDS = ['username'] # スーパーユーザー作成時に入力する

    def __str__(self) -> str:
        return self.email
