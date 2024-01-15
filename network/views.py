import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.core.paginator import Paginator
from django.db.models import Value
from django.db.models.functions import Concat
from datetime import datetime, timezone
import pytz

from .models import User, Post, Comment, Follower

# get all post on homepage
def index(request):
    posts = Post.objects.all().order_by("-time")[:5]
    return render(request, "network/index.html", {'posts': posts})


def login_view(request):
    # only allow unauthenticated user to login
    if request.user.is_authenticated:
        logout(request)

    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    # only allow unauthenticated user to login
    if request.user.is_authenticated:
        logout(request)
        return HttpResponseRedirect(reverse("register"))

    if request.method == "POST":
        # ensure proper username and email
        username = request.POST["username"]
        email = request.POST["email"]
        if " " in username or "/" in username:
            return render(request, "network/register.html", {
                "message": "Username must not contain space or special character / or empty space"
            })
        if username == 'following' or username == 'home':
            return render(request, "network/register.html", {
                "message": "Username can not be 'home' or 'following'"
            })
        if " " in email or "/" in email:
            return render(request, "network/register.html", {
                "message": "Email must not contain space or special character '/'."
            })

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username.lower(), email, password)
            user.save()

            follower = Follower.objects.create(user=user)
            follower.save()

        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return render(request, "network/config.html", {
            'welcome_message': 'Welcome ' + request.user.username + '. Edit your profile below',
            'message': 'Your names will appear on your posts instead of username',
            'username': request.user.username,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'email': request.user.email
        })
    else:
        return render(request, "network/register.html")

# add new post
@csrf_protect
@login_required
def new_post(request):
    # only allow POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # get required field
    data = json.loads(request.body)
    content = data["content"]
    if not content:
        return JsonResponse({"error": "Post content must not be empty."}, status=400)

    # create new post
    try:
        new_post = Post.objects.create(user=request.user, content=content)
        return JsonResponse({"message": "Post added successfully."}, status=201)
    except IntegrityError:
        return JsonResponse({"message": "Server can't add your post. Please try again later"}, status=503)

# get all post
@login_required
def new_post_detail(request):
    # only allow GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # get detail on the newly created post
    new_post = Post.objects.filter(user=request.user).order_by("-time")[:1]
    if new_post:
        latest_post = dict.fromkeys(
            ['username', 'first_name', 'last_name', 'id', 'content', 'time', 'like'])

        latest_post['user'] = new_post[0].user.username
        latest_post['first_name'] = new_post[0].user.first_name
        latest_post['last_name'] = new_post[0].user.last_name
        latest_post['id'] = new_post[0].id
        latest_post['content'] = new_post[0].content
        latest_post['time'] = utc_to_local(
            new_post[0].time).strftime("%b %d %Y, %I:%M:%S %p")
        latest_post['like'] = new_post[0].user_like.count()
        return JsonResponse({
            "post": latest_post,
        }, status=200)
    else:
        return JsonResponse({"message": "Server can't retrieve latest post"}, status=503)

# get user profile
def profile(request, username):
    # only allow GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # get all required fields
    try:
        current_profile = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    current_profile_follower = Follower.objects.get(user=current_profile)

    posts = Post.objects.filter(user=current_profile).order_by("-time")[:5]

    return render(request, "network/profile.html", {
        "username": username,
        "first_name": current_profile.first_name,
        "last_name": current_profile.last_name,
        "followers": current_profile.following.all().count(),
        "following": current_profile_follower.following.all().count(),
        "is_following": Follower.objects.get(user=request.user) in current_profile.following.all() if request.user.is_authenticated else False,
        "post_count": posts.count(),
        "posts": posts
    })


# allow users to follow each other
@csrf_protect
@login_required
def follow(request):
    # only allow PUT
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)

    # get required field
    data = json.loads(request.body)
    if data.get("following") is not None:
        current_profile = User.objects.get(username=data["following"])

    my_following_list = Follower.objects.get(user=request.user)

    # add or remove user from following list
    if my_following_list in current_profile.following.all():
        my_following_list.following.remove(current_profile)
        my_following_list.save()
    else:
        my_following_list.following.add(current_profile)
        my_following_list.save()

    return HttpResponse(status=204)

# allow users to get following status without reloading page
@login_required
def follow_status(request, following_profile):
    # only allow GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    current_profile = User.objects.get(username=following_profile)
    current_profile_follower = Follower.objects.get(user=current_profile)

    return JsonResponse({
        "username": following_profile,
        "first_name": current_profile.first_name,
        "last_name": current_profile.last_name,
        "followers": current_profile.following.all().count(),
        "following": current_profile_follower.following.all().count(),
        "is_following": Follower.objects.get(user=request.user) in current_profile.following.all()
    }, status=200)


# allow users to get posts from following list
@login_required
def following_post(request):
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # get all posts from following
    following_list = Follower.objects.get(user=request.user)
    posts = Post.objects.filter(
        user__in=following_list.following.all()).order_by("-time")[:5]

    return render(request, "network/following.html", {
        "posts": posts
    })

# allow users to like post
@csrf_protect
@login_required
def like_post(request):
    # only allow PUT
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)

    # get required field
    data = json.loads(request.body)
    if data.get("post_id") is not None:  # id of image is post.id_image
        post_id = data.get("post_id").split("_")
        post = Post.objects.get(id=post_id[0])

    # add or remove user from like list
    if post:
        if request.user in post.user_like.all():
            post.like -= 1
            post.user_like.remove(request.user)
            post.save()
        else:
            post.like += 1
            post.user_like.add(request.user)
            post.save()
        return HttpResponse(status=204)
    else:
        return JsonResponse({"message": "Post do not exist"}, status=404)


@login_required
def like_count(request, post_id):
    # only allow GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    postid = post_id.split("_")  # id of image is post.id_image
    post = Post.objects.get(id=postid[0])

    return JsonResponse({
        "likes": post.like
    }, status=200)

# allow users to change post
@csrf_protect
@login_required
def change_post(request):
    # only allow PUT
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required."}, status=400)

    # get required field
    data = json.loads(request.body)
    if data.get("new_content") is not None:
        new_content = data["new_content"]
    if data.get("post_id") is not None:
        postid = data["post_id"].split("_")  # id of content is post.id_content
        post = Post.objects.filter(id=postid[0])

    # check for fake request
    if request.user != post[0].user:
        return JsonResponse({"message": "Nice try"}, status=403)

    # update new content
    if post:
        post.update(content=new_content)
        return HttpResponse(status=204)
    else:
        return JsonResponse({"message": "Post do not exist"}, status=404)

# get the new post after change
@login_required
def change_post_view(request, post_id):
    # only allow GET
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    postid = post_id.split("_")  # id of content is post.id_content
    post = Post.objects.get(id=postid[0])

    return JsonResponse({
        "content": post.content
    }, status=200)

# allow users to delete post
@csrf_protect
@login_required
def delete_post(request, post_id):
    # only allow DELETE
    if request.method != "DELETE":
        return JsonResponse({"error": "DELETE request required."}, status=400)

    # get required field
    postid = post_id.split("_")  # id of content is post.id_content
    post = Post.objects.filter(id=postid[0])

    # check for fake request
    if post:
        if request.user != post[0].user:
            return JsonResponse({"message": "Nice try"}, status=403)

        # update new content
        post.delete()
        return JsonResponse({"message": "Post deleted successfully."}, status=201)
    else:
        return JsonResponse({"message": "Post do not exist"}, status=404)

# allow users to search for other users
@csrf_protect
def search(request, q=''):
    # get search value
    query = q
    displaySearchQuery = query.replace('%20', ' ')

    no_space = User.objects.annotate(
        search_name=Concat('first_name', 'last_name'))
    space = User.objects.annotate(search_name=Concat(
        'first_name', Value(' '), 'last_name'))

    # trim search query
    names = query.split()
    # founded users holder
    users = []

    for name in names:
        # search for user based on username and combined first_name + last_name
        username = User.objects.filter(username__icontains=name).all()
        first_last = no_space.filter(search_name__icontains=name).all()
        first_last_space = space.filter(search_name__icontains=name).all()

        for i in username:
            if i not in users:
                users.append(i)
        for i in first_last:
            if i not in users:
                users.append(i)
        for i in first_last_space:
            if i not in users:
                users.append(i)


    # get latest post from each user
    users_posts = [dict.fromkeys(
        ['username', 'first_name', 'last_name', 'latest_post', 'time']) for x in range(len(users))]
    count = 0

    for user in users:
        # if user has posts
        try:
            post = Post.objects.filter(user=user).latest('time')

            users_posts[count]['username'] = user.username
            users_posts[count]['first_name'] = user.first_name
            users_posts[count]['last_name'] = user.last_name
            users_posts[count]['latest_post'] = post.content
            users_posts[count]['time'] = utc_to_local(
                post.time).strftime("%b %d %Y, %I:%M:%S %p")
        # if user has no posts
        except Post.DoesNotExist:
            users_posts[count]['username'] = user.username
            users_posts[count]['first_name'] = user.first_name
            users_posts[count]['last_name'] = user.last_name
            if user.first_name == '' and user.last_name == '':
                users_posts[count]['latest_post'] = user.username + \
                    ' has no post'
            else:
                users_posts[count]['latest_post'] = user.first_name.capitalize(
                ) + ' ' + user.last_name.capitalize() + ' has no post'
            users_posts[count]['time'] = 'N/A'
        count += 1

    # paginator
    paginator = Paginator(users_posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, "network/search.html", {
        'users': page_obj,
        'displaySearchQuery': displaySearchQuery
    })


# get followers
def get_followers(request, username):
    # GET method required
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # Search for users following
    current_profile = User.objects.get(username=username)
    followers = current_profile.following.all()

    # get latest post from each followers
    users_posts = [dict.fromkeys(['username', 'latest_post', 'time'])
                   for x in range(len(followers))]
    count = 0

    for follower in followers:
        # if user has posts
        try:
            post = Post.objects.filter(user=follower.user).latest('time')
            users_posts[count]['username'] = follower.user.username
            users_posts[count]['first_name'] = follower.user.first_name
            users_posts[count]['last_name'] = follower.user.last_name
            users_posts[count]['latest_post'] = post.content
            users_posts[count]['time'] = utc_to_local(
                post.time).strftime("%b %d %Y, %I:%M:%S %p")
        # if user has no posts
        except Post.DoesNotExist:
            users_posts[count]['username'] = follower.user.username
            users_posts[count]['first_name'] = follower.user.first_name
            users_posts[count]['last_name'] = follower.user.last_name
            if follower.user.first_name == '' and follower.user.last_name == '':
                users_posts[count]['latest_post'] = follower.user.username + \
                    ' has no post'
            else:
                users_posts[count]['latest_post'] = follower.user.first_name.capitalize(
                ) + ' ' + follower.user.last_name.capitalize() + ' has no post'

            users_posts[count]['time'] = 'N/A'
        count += 1

    return JsonResponse({
        "followers": users_posts,
    }, status=200)


# get following
def get_following(request, username):
    # GET method required
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # Search for users following
    current_profile = User.objects.get(username=username)
    current_profile_follower = Follower.objects.get(user=current_profile)
    followings = current_profile_follower.following.all()

    # get latest post from each followers
    users_posts = [dict.fromkeys(['username', 'latest_post', 'time'])
                   for x in range(len(followings))]
    count = 0

    for following in followings:
        # if user has posts
        try:
            post = Post.objects.filter(user=following).latest('time')
            users_posts[count]['username'] = following.username
            users_posts[count]['first_name'] = following.first_name
            users_posts[count]['last_name'] = following.last_name
            users_posts[count]['latest_post'] = post.content
            users_posts[count]['time'] = utc_to_local(
                post.time).strftime("%b %d %Y, %I:%M:%S %p")
        # if user has no posts
        except Post.DoesNotExist:
            users_posts[count]['username'] = following.username
            users_posts[count]['first_name'] = following.first_name
            users_posts[count]['last_name'] = following.last_name
            if following.first_name == '' and following.last_name == '':
                users_posts[count]['latest_post'] = following.username + \
                    ' has no post'
            else:
                users_posts[count]['latest_post'] = following.first_name.capitalize(
                ) + ' ' + following.last_name.capitalize() + ' has no post'

            users_posts[count]['time'] = 'N/A'
        count += 1

    return JsonResponse({
        "following": users_posts,
    }, status=200)

# get users like
def get_users_like(request, post_id):
    # GET method required
    if request.method != "GET":
        return JsonResponse({"error": "GET request required."}, status=400)

    # get all user who like post
    post = Post.objects.get(id=post_id.split("_")[0])
    users = post.user_like.all()

    # get latest post from each followers
    users_posts = [dict() for x in range(len(users))]
    count = 0

    for user in users:
        # if user has posts
        try:
            post = Post.objects.filter(user=user).latest('time')
            users_posts[count]['username'] = user.username
            users_posts[count]['first_name'] = user.first_name
            users_posts[count]['last_name'] = user.last_name
            users_posts[count]['latest_post'] = post.content
            users_posts[count]['time'] = utc_to_local(
                post.time).strftime("%b %d %Y, %I:%M:%S %p")
        # if user has no posts
        except Post.DoesNotExist:
            users_posts[count]['username'] = user.username
            users_posts[count]['first_name'] = user.first_name
            users_posts[count]['last_name'] = user.last_name
            if user.first_name == '' and user.last_name == '':
                users_posts[count]['latest_post'] = user.username + \
                    ' has no post'
            else:
                users_posts[count]['latest_post'] = user.first_name.capitalize(
                ) + ' ' + user.last_name.capitalize() + ' has no post'
            users_posts[count]['time'] = 'N/A'
        count += 1

    return JsonResponse({
        "users": users_posts
    }, status=200)

# allow users to change names and email
@csrf_protect
@login_required
def config(request, username):
    # if reach route via POST as by submitting a form
    if request.method == "POST":
        # get required field
        first_name = request.POST["first_name"]
        last_name = request.POST["last_name"]
        email = request.POST["email"]

        if " " in email or "/" in email:
            return render(request, "network/config.html", {
                "message": "Email must not contain space or special character '/'."
            })

        # update user details
        user = User.objects.filter(username=request.user.username)
        user.update(first_name=first_name)
        user.update(last_name=last_name)
        user.update(email=email)

        # return
        if request.user.username != username:
            return JsonResponse({"error": "Nice try. Your own info is now modified and this action is will be punished."}, status=400)
        else:
            return HttpResponseRedirect(reverse("index"))

    # if reach route via GET
    elif request.method == "GET":
        # check for forged attempt
        if request.user.username != username:
            return JsonResponse({"error": "Nice try. This action is logged."}, status=400)

        else:
            return render(request, "network/config.html", {
                'welcome_message': 'Edit your profile',
                'message': 'Your names will appear on your posts instead of your username',
                'username': request.user.username,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'email': request.user.email
            })

    # else return
    else:
        return JsonResponse({"error": "GET or POST request required."}, status=400)

# get the next 5 posts
def infinite_scroll(request, pathname, page_count):
    # get posts from homepage
    if pathname == 'home':
        posts = Post.objects.all().order_by(
            '-time')[page_count: page_count + 5]

        latest_post = [dict.fromkeys(
            ['username', 'first_name', 'last_name', 'id', 'content', 'time', 'like']) for x in range(len(posts))]
        count = 0
        for post in posts:
            latest_post[count]['user'] = post.user.username
            latest_post[count]['first_name'] = post.user.first_name
            latest_post[count]['last_name'] = post.user.last_name
            latest_post[count]['id'] = post.id
            latest_post[count]['content'] = post.content
            latest_post[count]['time'] = utc_to_local(
                post.time).strftime("%b %d %Y, %I:%M:%S %p")
            latest_post[count]['like'] = post.user_like.count()

            count += 1

        return JsonResponse({
            "body": latest_post,
            "total_post_count": Post.objects.count()
        }, status=201)

    # get posts from following lists
    elif pathname == 'following':
        following_list = Follower.objects.get(user=request.user)
        posts = Post.objects.filter(user__in=following_list.following.all()).order_by(
            "-time")[page_count: page_count + 5]

        latest_post = [dict.fromkeys(
            ['username', 'first_name', 'last_name', 'id', 'content', 'time', 'like']) for x in range(len(posts))]
        count = 0
        for post in posts:
            latest_post[count]['user'] = post.user.username
            latest_post[count]['first_name'] = post.user.first_name
            latest_post[count]['last_name'] = post.user.last_name
            latest_post[count]['id'] = post.id
            latest_post[count]['content'] = post.content
            latest_post[count]['time'] = utc_to_local(
                post.time).strftime("%b %d %Y, %I:%M:%S %p")
            latest_post[count]['like'] = post.user_like.count()

            count += 1

        return JsonResponse({
            "body": latest_post,
            "total_post_count": Post.objects.filter(user__in=following_list.following.all()).count()
        }, status=201)

    # get posts from profile page
    else:
        # get posts from profile
        current_profile = User.objects.get(username=pathname)
        posts = Post.objects.filter(user=current_profile).order_by(
            "-time")[page_count: page_count + 5]

        latest_post = [dict.fromkeys(
            ['username', 'first_name', 'last_name', 'id', 'content', 'time', 'like']) for x in range(len(posts))]
        count = 0
        for post in posts:
            latest_post[count]['user'] = post.user.username
            latest_post[count]['first_name'] = post.user.first_name
            latest_post[count]['last_name'] = post.user.last_name
            latest_post[count]['id'] = post.id
            latest_post[count]['content'] = post.content
            latest_post[count]['time'] = utc_to_local(
                post.time).strftime("%b %d %Y, %I:%M:%S %p")
            latest_post[count]['like'] = post.user_like.count()

            count += 1

        return JsonResponse({
            "body": latest_post,
            "total_post_count": Post.objects.filter(user=current_profile).order_by("-time").count()
        }, status=201)

# convert timezone
def utc_to_local(utc_dt):
    tz = pytz.timezone('Australia/Sydney')
    return utc_dt.replace(tzinfo=timezone.utc).astimezone(tz=tz)
