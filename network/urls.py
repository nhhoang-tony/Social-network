
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"), # all posts page
    path("login", views.login_view, name="login"), # login page
    path("logout", views.logout_view, name="logout"), # logout page
    path("register", views.register, name="register"), # register page
    path("new_post", views.new_post, name="post"), # user add new post
    path("new_post_detail", views.new_post_detail, name="new_post_detail"), # load all post
    path("profile/<str:username>", views.profile, name="profile"), # profile page
    path("follow", views.follow, name="follow"), # allow users to follow each other
    path("follow_status/<str:following_profile>", views.follow_status, name="follow_status"), # get following status
    path("following_post", views.following_post, name="following_post"), # get posts from following users
    path("like_post", views.like_post, name="like_post"), # allow users to like post
    path("like_count/<str:post_id>", views.like_count, name="like_count"), # get like count for post
    path("change_post", views.change_post, name="change_post"), # allow user to change post
    path("change_post_view/<str:post_id>", views.change_post_view, name="change_post_view"), # get new page content after change
    path("delete_post/<str:post_id>", views.delete_post, name="delete"), # allow user to delete post
    path("search/<str:q>", views.search, name="search"), # allow user to search for another user
    path("search/", views.search, name="search"), # allow user to search for another user without query
    path("get_followers/<str:username>", views.get_followers, name="get_followers"), # get list of current profile's followers
    path("get_following/<str:username>", views.get_following, name="get_following"), # get list of current profile's followings
    path("get_users_like/<str:post_id>", views.get_users_like, name="get_users_like"), # get list of users who like post
    path("profile/config/<str:username>", views.config, name="config"), # allow user to change names and email
    path("infinite_scroll/<str:pathname>/<int:page_count>", views.infinite_scroll, name="infinite_scroll") # allow infinite scroll
]
