from django.contrib.auth.models import AbstractUser
from django.db import models
from datetime import datetime, timezone
import pytz

# class user represents all users on sites
class User(AbstractUser):
    pass

# class follower represents users who follow each other
class Follower(models.Model):
    # add follower function 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="follower")
    following = models.ManyToManyField(User, blank=True, related_name="following")

    def __str__(self):
        return f"{self.user} is following {self.following.all()}"

# class post represents all posts made by all users
class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_owner")
    content = models.CharField(max_length=1024)
    like = models.IntegerField(default=0)
    user_like = models.ManyToManyField(User, blank=True, related_name="user_like")
    time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} posts {self.content} on {self.time}"

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "content": self.content,
            "like": self.like,
            "user_like": [user.username for user in self.user_like.all()],
            "time": utc_to_local(self.time).strftime("%b %d %Y, %I:%M:%S %p"),
        }

# class comment represent comments made on posts
class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="user_comment")
    content = models.CharField(max_length=1024)
    time = models.DateTimeField(auto_now_add=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="post_comment")

    def __str__(self):
        return f"{self.user} comments {self.content} on {self.post} at {self.time}"

# convert timezone
def utc_to_local(utc_dt):
    tz = pytz.timezone('Australia/Sydney')
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=tz)







    
