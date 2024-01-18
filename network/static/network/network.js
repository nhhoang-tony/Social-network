document.addEventListener('DOMContentLoaded', function () {
  // add new post
  $('#new_post').on('submit', function (event) {
    event.preventDefault();
    new_post();
  });

  // search users
  $('#search_button').on('click', function () {
    query = document.getElementById('query').value;
    window.location.href = `/search/${query}`;
  });

  document.querySelector('#query').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      query = document.getElementById('query').value;
      window.location.href = `/search/${query}`;
    }
  });

  // follow users
  $('#follow').on('click', function () {
    follow();
  });

  // like post
  $('#all_posts').on('click', '.like_icon', function (event) {
    like_post(this);
  });

  // edit post
  $('#all_posts').on('click', '.edit', function () {
    edit_post(this);
  });
  $('#all_posts').on('mouseover', '.edit', function () {
    $(this).css('color', '#e97856');
  });
  $('#all_posts').on('mouseout', '.edit', function () {
    $(this).css('color', 'initial');
  });

  // delete post
  $('#all_posts').on('click', '.delete', function () {
    delete_post(this);
  });
  $('#all_posts').on('mouseover', '.delete', function () {
    $(this).css('color', '#e97856');
  });
  $('#all_posts').on('mouseout', '.delete', function () {
    $(this).css('color', 'initial');
  });

  // like post modal
  $('#all_posts').on('click', '.post_like', function () {
    get_users_like(this);
  });
  $('#all_posts').on('mouseover', '.post_like', function () {
    $(this).css('color', '#e97856');
  });
  $('#all_posts').on('mouseout', '.post_like', function () {
    $(this).css('color', 'initial');
  });

  // follower modal
  $('#profile_followers').on('click', function () {
    get_followers();
  });

  $('#profile_followers').on('mouseover', function () {
    $(this).css('color', '#e97856');
  });

  $('#profile_followers').on('mouseout', function () {
    $(this).css('color', 'initial');
  });

  // following modal
  $('#profile_following').on('click', function () {
    get_following();
  });

  $('#profile_following').on('mouseover', function () {
    $(this).css('color', '#e97856');
  });

  $('#profile_following').on('mouseout', function () {
    $(this).css('color', 'initial');
  });

  // close modal
  $('.close').on('click', function () {
    $('#modal').css('display', 'none');
  });

  $('#modal').click(function (ev) {
    if (ev.target != this) return;
    $('#modal').css('display', 'none');
  });
});

// allow user to add new post
function new_post() {
  // get all required fields
  let content = document.querySelector('#post_content').value;
  if (content == '') {
    alert('Post must not be empty');
    return;
  }

  // make API calls to add new post
  fetch(`/new_post`, {
    method: 'POST',
    mode: 'same-origin',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
    body: JSON.stringify({
      content: content,
    }),
  })
    .then((response) =>
      response.json().then((data) => ({
        status: response.status,
        body: data,
      }))
    )
    .then((result) => {
      // animation if add new post successfully
      if (result.status == 201) {
        console.log(result.body);
        new_post_detail();
      } else {
        console.log(result.body);
      }
    });
}

// get all detail on the newly created post
function new_post_detail() {
  // make API calls to get info on newly created post
  fetch('/new_post_detail', {
    method: 'GET',
  })
    .then((response) =>
      response.json().then((data) => ({
        status: response.status,
        body: data,
      }))
    )
    .then((result) => {
      console.log(result.status);
      console.log(result.body);
      new_post_animation(result.body.post);
    });
}

// create animation for newly created post
function new_post_animation(post) {
  // create all elements for the new post
  const each_post = document.createElement('div');
  each_post.setAttribute('class', 'post_form');
  each_post.setAttribute('id', `${post.id}_form`);

  const username = document.createElement('h5');
  const bold = document.createElement('strong');
  const username_link = document.createElement('a');
  username_link.setAttribute('href', `profile/${post['user']}`);
  if (post['first_name'] == '' && post['last_name'] == '') {
    username_link.innerHTML =
      post['user'].charAt(0).toUpperCase() + post['user'].slice(1);
  } else {
    username_link.innerHTML =
      post['first_name'].charAt(0).toUpperCase() +
      post['first_name'].slice(1) +
      ' ' +
      post['last_name'].charAt(0).toUpperCase() +
      post['last_name'].slice(1);
  }
  bold.append(username_link);
  1;
  username.append(bold);

  const edit_option = document.createElement('div');
  edit_option.setAttribute('class', 'post_details');
  edit_link = document.createElement('span');
  edit_link.setAttribute('id', `${post['id']}_edit`);
  edit_link.setAttribute('class', 'edit');
  edit_link.innerHTML = 'Edit';
  delete_link = document.createElement('span');
  delete_link.setAttribute('id', `${post['id']}_delete`);
  delete_link.setAttribute('class', 'delete');
  delete_link.innerHTML = 'Delete';
  edit_option.append(edit_link);
  edit_option.append(delete_link);

  const content = document.createElement('div');
  content.setAttribute('class', 'post_details');
  content.setAttribute('id', `${post['id']}_content`);
  content.setAttribute('style', 'font-size: 18px;');
  content.innerHTML = post['content'];

  const time = document.createElement('div');
  time.setAttribute('class', 'post_time_comment');
  time.innerHTML = post['time'];

  const like = document.createElement('div');
  like.setAttribute('class', 'post_details');

  const like_image = document.createElement('img');
  like_image.setAttribute('width', '15px');
  like_image.setAttribute('height', '15px');
  like_image.setAttribute('id', `${post['id']}_image`);
  like_image.setAttribute('class', 'like_icon');
  like_image.setAttribute('src', '/static/network/empty_heart.jpg');

  const like_count = document.createElement('span');
  like_count.setAttribute('class', 'post_like');
  like_count.setAttribute('id', `${post['id']}_like_count`);
  like_count.innerHTML = `Liked by: <strong>${post['like']}</strong>`;
  like.append(like_image);
  like.append(like_count);

  each_post.append(username);
  each_post.append(edit_option);
  each_post.append(content);
  each_post.append(time);
  each_post.append(like);

  // animation when post deleted
  post_form = document.querySelector('.add_new_post');
  all_posts = document.getElementById('all_posts');

  post_form.style.animationPlayState = 'running';
  post_form.addEventListener('animationend', () => {
    // add new post and clear out text field
    all_posts.insertBefore(each_post, all_posts.firstChild);
    document.getElementById('post_content').value = '';

    // reset animation
    post_form.style.animationPlayState = 'paused';
    post_form.classList.remove('add_new_post');
    void post_form.offsetWidth;
    post_form.classList.add('add_new_post');
  });
}

// API call to update following status
function follow() {
  // get all required fields
  let following = document
    .querySelector('#profile_username')
    .innerHTML.toLowerCase();

  // make API calls to add new post
  fetch('/follow', {
    method: 'PUT',
    mode: 'same-origin',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
    body: JSON.stringify({
      following: following,
    }),
  })
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      follow_status();
    });
}

// API call to get following status after following wihtout reloading page
function follow_status() {
  // get all required fields
  let following = document
    .querySelector('#profile_username')
    .innerHTML.toLowerCase();

  // make API calls to get status update
  fetch(`/follow_status/${following}`, {
    method: 'GET',
  })
    .then((response) => response.json())
    .then((result) => {
      document.querySelector('#follow').innerHTML = result['is_following']
        ? 'Unfollow'
        : 'Follow';
      if (result['first_name'] != '' || result['last_name'] != '') {
        document.querySelector('#follow-message').innerHTML = result[
          'is_following'
        ]
          ? `You are following ${
              result['first_name'].charAt(0).toUpperCase() +
              result['first_name'].slice(1)
            } 
            ${
              result['last_name'].charAt(0).toUpperCase() +
              result['last_name'].slice(1)
            }`
          : `You are not following ${
              result['first_name'].charAt(0).toUpperCase() +
              result['first_name'].slice(1)
            } 
            ${
              result['last_name'].charAt(0).toUpperCase() +
              result['last_name'].slice(1)
            }`;
      } else {
        document.querySelector('#follow-message').innerHTML = result[
          'is_following'
        ]
          ? `You are following ${
              result['username'].charAt(0).toUpperCase() +
              result['username'].slice(1)
            }`
          : `You are not following ${
              result['username'].charAt(0).toUpperCase() +
              result['username'].slice(1)
            }`;
      }
      document.querySelector(
        '#profile_followers'
      ).innerHTML = `${result['followers']} followers`;
      document.querySelector(
        '#profile_following'
      ).innerHTML = `${result['following']} following`;
    });
}

// API call to update like counts
function like_post(like_icon) {
  // change like icon
  if (like_icon.getAttribute('src') == '/static/network/empty_heart.jpg') {
    like_icon.setAttribute('src', '/static/network/heart.jpg');
  } else {
    like_icon.setAttribute('src', '/static/network/empty_heart.jpg');
  }

  // get post id
  // unlogged in user can temporarily change like icon but cannot update like count
  if (document.getElementById('username').innerHTML != '') {
    let post_id = like_icon.getAttribute('id'); // {post.id_image}

    // make API calls to like post
    fetch('/like_post', {
      method: 'PUT',
      mode: 'same-origin',
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: JSON.stringify({
        post_id: post_id,
      }),
    })
      .then((response) => response.text())
      .then((result) => {
        console.log(result);
        like_count(post_id);
      });
  }
}

// API call to get like counts without reloading page
function like_count(post_id) {
  // make API calls to get status update
  fetch(`/like_count/${post_id}`, {
    method: 'GET',
  })
    .then((response) => response.json())
    .then((result) => {
      id = post_id.split('_'); // {post.id_image}
      document.getElementById(
        `${id[0]}_like_count`
      ).innerHTML = `Liked by: <strong>${result['likes']}</strong>`;
    });
}

let postContent = {
  id: -1,
  content: '',
};
// API call to edit post
function edit_post(edit) {
  // remove listener
  edit.removeEventListener('click', () => edit_post(edit));

  // get post id
  let post_id = edit.getAttribute('id'); // {post.id_edit}
  let current_content = document.getElementById(
    `${post_id.split('_')[0]}_content`
  );
  if (postContent.id === -1) {
    postContent.id = post_id;
    postContent.content = current_content.innerHTML;
  }

  // change post content to text area
  form = document.createElement('form');
  form.setAttribute('id', 'new_post_form');
  textarea = document.createElement('textarea');
  textarea.setAttribute('class', 'form-control');
  textarea.setAttribute('id', 'new_content');
  textarea.setAttribute('placeholder', postContent.content);
  textarea.setAttribute('required', `""`);
  textarea.focus();
  textarea.innerHTML = postContent.content;
  input = document.createElement('input');
  input.setAttribute('type', 'submit');
  input.setAttribute('class', 'submit_button');
  input.setAttribute('style', 'margin-top: 10px');
  input.setAttribute('value', 'Change');
  form.append(textarea);
  form.append(input);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    change_post(post_id);
  });

  current_content.innerHTML = '';
  current_content.append(form);
}

// API call to change post
function change_post(post_id) {
  // get all required field
  let new_content = document.getElementById('new_content').value;

  // make API calls to change
  fetch('/change_post', {
    method: 'PUT',
    mode: 'same-origin',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
    body: JSON.stringify({
      post_id: post_id,
      new_content: new_content,
    }),
  })
    .then((response) => response.text())
    .then((result) => {
      console.log(result);
      change_post_view(post_id);
    });

  postContent.id = -1;
  postContent.content = '';
}

// API call to get post content without reloading page
function change_post_view(post_id) {
  // make API calls to get status update
  fetch(`/change_post_view/${post_id}`, {
    method: 'GET',
  })
    .then((response) => response.json())
    .then((result) => {
      // {post.id_image}
      document.getElementById(`${post_id.split('_')[0]}_content`).innerHTML =
        result['content'];
    });
}

// API call to delete post
function delete_post(delete_the_post) {
  // get all required field
  let post_id = delete_the_post.getAttribute('id'); // post.id_delete
  let post_form = document.getElementById(`${post_id.split('_')[0]}_form`);

  // make API calls to change
  fetch(`/delete_post/${post_id}`, {
    method: 'DELETE',
    mode: 'same-origin',
    headers: {
      'X-CSRFToken': getCookie('csrftoken'),
    },
    body: JSON.stringify({
      post_id: post_id,
    }),
  })
    .then((response) =>
      response.json().then((data) => ({
        status: response.status,
        body: data,
      }))
    )
    .then((result) => {
      // animation when post deleted successfully
      if (result.status == 201) {
        post_form.style.animationPlayState = 'running';
        post_form.addEventListener('animationend', () => {
          post_form.remove();
        });
        console.log(result.body);
      } else {
        console.log(result.body);
      }
    });
}

// API call to get user's followers list
function get_followers() {
  username = document
    .getElementById('profile_username')
    .innerHTML.toLowerCase();
  fetch(`/get_followers/${username}`, {
    method: 'GET',
  })
    .then((response) =>
      response.json().then((data) => ({
        status: response.status,
        body: data,
      }))
    )
    .then((result) => {
      console.log(result.status);
      generate_follow_list(result.body.followers, 'follower');
    });
}

// API call to get user's following list
function get_following() {
  username = document
    .getElementById('profile_username')
    .innerHTML.toLowerCase();
  fetch(`/get_following/${username}`, {
    method: 'GET',
  })
    .then((response) =>
      response.json().then((data) => ({
        status: response.status,
        body: data,
      }))
    )
    .then((result) => {
      console.log(result.status);
      console.log(result.body.following);
      generate_follow_list(result.body.following, 'following');
    });
}

// API call to get all users who like a page
function get_users_like(like_count) {
  post_id = like_count.getAttribute('id');
  fetch(`/get_users_like/${post_id}`, {
    method: 'GET',
  })
    .then((response) =>
      response.json().then((data) => ({
        status: response.status,
        body: data,
      }))
    )
    .then((result) => {
      console.log(result.status);
      console.log(result.body);
      generate_follow_list(result.body.users, 'users_like');
    });
}

// create modal view for followers list
function generate_follow_list(users, string) {
  if (string == 'follower') {
    profile_username = document.getElementById(
      'profile_display_name'
    ).innerHTML;
    document.getElementById(
      'users_modal_message'
    ).textContent = `${profile_username}'s followers`;
  } else if (string == 'following') {
    profile_username = document.getElementById(
      'profile_display_name'
    ).innerHTML;
    document.getElementById(
      'users_modal_message'
    ).textContent = `${profile_username} following`;
  } else if (string == 'users_like') {
    document.getElementById(
      'users_modal_message'
    ).textContent = `People who like this post`;
  }

  users_modal_content = document.getElementById('users_modal_content');
  users_modal_content.textContent = '';
  // iterate through each followers
  if (users.length > 0) {
    for (let i = 0; i < users.length; i++) {
      post_form = document.createElement('div');
      post_form.setAttribute('class', 'post_form');

      username = document.createElement('div');
      username.setAttribute('class', 'post_username');
      username_link = document.createElement('a');
      username_link.setAttribute('href', `${users[i].username}`);
      if (users[i].first_name == '' && users[i].last_name == '') {
        username_link.innerHTML =
          users[i].username.charAt(0).toUpperCase() +
          users[i].username.slice(1);
      } else {
        username_link.innerHTML =
          users[i].first_name.charAt(0).toUpperCase() +
          users[i].first_name.slice(1) +
          ' ' +
          users[i].last_name.charAt(0).toUpperCase() +
          users[i].last_name.slice(1);
      }
      username.append(username_link);

      post_details = document.createElement('div');
      post_details.setAttribute('class', 'post_details');
      strong = document.createElement('strong');
      strong.innerHTML = 'Latest post: ';
      span_post_details = document.createElement('span');
      if (users[i].time == 'N/A') {
        span_post_details.setAttribute('style', 'font-style:italic');
      }
      span_post_details.innerHTML = users[i].latest_post;
      post_details.append(strong);
      post_details.append(span_post_details);

      post_time = document.createElement('div');
      post_time.setAttribute('class', 'post_time_comment');
      span_post_time = document.createElement('span');
      if (users[i].time == 'N/A') {
        span_post_time.setAttribute('style', 'font-style:italic');
      }
      span_post_time.innerHTML = users[i].time;
      post_time.append(span_post_time);

      post_form.append(username);
      post_form.append(post_details);
      post_form.append(post_time);

      users_modal_content.append(post_form);
    }
  } else {
    post_form = document.createElement('div');
    post_form.setAttribute('class', 'post_form');

    no_users = document.createElement('div');
    no_users.setAttribute('class', 'post_username');
    if (string == 'follower') {
      profile_username = document.getElementById('profile_username').innerHTML;
      no_users.innerHTML = `${profile_username} has no follower`;
    } else if (string == 'following') {
      profile_username = document.getElementById('profile_username').innerHTML;
      no_users.innerHTML = `${profile_username} follows no one`;
    } else if (string == 'users_like') {
      no_users.innerHTML = 'No one has like this post yet';
    }

    post_form.append(no_users);
    users_modal_content.append(post_form);
  }
  document.getElementById('modal').style.display = 'block';
}

// infinite scrolling
// check if scroll to bottom of page and check if all posts are fetched
var timer;
end_of_page = false;
// if page is not scrollable, auto fetch more posts
window.onload = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    if (end_of_page == false) {
      const pleaseWait = document.querySelector('.please_wait');
      if (pleaseWait !== null) {
        pleaseWait.style.display = 'block';
      }

      if (window.location.pathname == '/') {
        get_next_post('home');
      } else if (window.location.pathname == '/following_post') {
        get_next_post('following');
      } else if (window.location.pathname.indexOf('/profile') != -1) {
        get_next_post(window.location.pathname.split('/')[2]);
      }
    }
    return false;
  }
};
window.onscroll = () => {
  clearTimeout(timer);
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    if (end_of_page == false) {
      document.querySelector('.please_wait').style.display = 'block';
    }
  }
  timer = setTimeout(function () {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      if (end_of_page == false) {
        if (window.location.pathname == '/') {
          get_next_post('home');
        } else if (window.location.pathname == '/following_post') {
          get_next_post('following');
        } else if (window.location.pathname.indexOf('/profile') != -1) {
          get_next_post(window.location.pathname.split('/')[2]);
        }
      }
      return false;
    }
  }, 1000);
};

// API call to fetch 5 more posts
function get_next_post(pathname) {
  // get the current post count in page
  post_count = document.getElementById('all_posts').childElementCount;

  // API call to get the next 5 posts
  fetch(`/infinite_scroll/${pathname}/${post_count}`, {
    method: 'GET',
  })
    .then((response) => response.text())
    .then((result) => {
      // if there is more post, call function to print out
      if (JSON.parse(result).body.length > 0) {
        infinite_scroll(
          JSON.parse(result).body,
          JSON.parse(result).total_post_count,
          pathname
        );
      }

      // if there are less than 5 posts in current path
      if (JSON.parse(result).total_post_count <= 5) {
        // mark end of page
        end_of_page = true;
        document.querySelector('.please_wait').style.display = 'block';
        login = document.getElementById('username');

        // display message accordingly
        if (typeof login != 'undefined' && login != null) {
          // if user is on their own profile page
          if (login.innerHTML.toLowerCase() == pathname) {
            document.querySelector('.please_wait').innerHTML =
              'Your followers are waiting for more posts';
          } else {
            document.querySelector(
              '.please_wait'
            ).innerHTML = `Stay tuned for more posts`;
          }
        } else {
          document.querySelector(
            '.please_wait'
          ).innerHTML = `Stay tuned for more posts`;
        }
      }
    })
    .catch((error) => console.log('error', error));
  // make API call with parameters and use promises to get response
}

// print out post
function infinite_scroll(post, total_post_count, pathname) {
  all_posts = document.getElementById('all_posts');
  for (let i = 0; i < post.length; i++) {
    const each_post = document.createElement('div');
    each_post.setAttribute('class', 'post_form');
    each_post.setAttribute('id', `${post[i].id}_form`);

    const username = document.createElement('h5');
    const bold = document.createElement('strong');
    const username_link = document.createElement('a');
    username_link.setAttribute('href', `profile/${post[i]['user']}`);
    if (post[i]['first_name'] == '' && post[i]['last_name'] == '') {
      username_link.innerHTML =
        post[i]['user'].charAt(0).toUpperCase() + post[i]['user'].slice(1);
    } else {
      username_link.innerHTML =
        post[i]['first_name'].charAt(0).toUpperCase() +
        post[i]['first_name'].slice(1) +
        ' ' +
        post[i]['last_name'].charAt(0).toUpperCase() +
        post[i]['last_name'].slice(1);
    }
    bold.append(username_link);
    1;
    username.append(bold);

    const content = document.createElement('div');
    content.setAttribute('class', 'post_details');
    content.setAttribute('id', `${post[i]['id']}_content`);
    content.setAttribute('style', 'font-size: 18px;');
    content.innerHTML = post[i]['content'];

    const time = document.createElement('div');
    time.setAttribute('class', 'post_time_comment');
    time.innerHTML = post[i]['time'];

    const like = document.createElement('div');
    like.setAttribute('class', 'post_details');

    const like_image = document.createElement('img');
    like_image.setAttribute('width', '15px');
    like_image.setAttribute('height', '15px');
    like_image.setAttribute('id', `${post[i]['id']}_image`);
    like_image.setAttribute('class', 'like_icon');
    like_image.setAttribute('src', '/static/network/empty_heart.jpg');

    const like_count = document.createElement('span');
    like_count.setAttribute('class', 'post_like');
    like_count.setAttribute('id', `${post[i]['id']}_like_count`);
    like_count.innerHTML = `Liked by: <strong>${post[i]['like']}</strong>`;
    like.append(like_image);
    like.append(like_count);

    each_post.append(username);
    login = document.getElementById('username');
    if (typeof login != 'undefined' && login != null) {
      if (login.innerHTML.toLowerCase() == post[i]['user']) {
        const edit_option = document.createElement('div');
        edit_option.setAttribute('class', 'post_details');
        edit_link = document.createElement('span');
        edit_link.setAttribute('id', `${post[i]['id']}_edit`);
        edit_link.setAttribute('class', 'edit');
        edit_link.innerHTML = 'Edit';
        delete_link = document.createElement('span');
        delete_link.setAttribute('id', `${post[i]['id']}_delete`);
        delete_link.setAttribute('class', 'delete');
        delete_link.innerHTML = 'Delete';
        edit_option.append(edit_link);
        edit_option.append(delete_link);

        each_post.append(edit_option);
      }
    }
    each_post.append(content);
    each_post.append(time);
    each_post.append(like);
    all_posts.append(each_post);

    // check if fetch all posts
    if (
      document.getElementById('all_posts').childElementCount == total_post_count
    ) {
      // mark end of page
      end_of_page = true;

      // display message accordingly
      if (pathname == 'home') {
        document.querySelector('.please_wait').style.display = 'block';
        document.querySelector('.please_wait').innerHTML =
          'Stay tuned for more posts';
      } else if (pathname == 'following') {
        document.querySelector('.please_wait').style.display = 'block';
        document.querySelector('.please_wait').innerHTML =
          'Stay tuned or follow more people to see more posts';
      } else {
        document.querySelector('.please_wait').style.display = 'block';
        login = document.getElementById('username');
        if (typeof login != 'undefined' && login != null) {
          if (login.innerHTML.toLowerCase() == pathname) {
            document.querySelector('.please_wait').innerHTML =
              'Your followers are waiting for more posts';
          } else {
            document.querySelector(
              '.please_wait'
            ).innerHTML = `Stay tuned for more posts`;
          }
        } else {
          document.querySelector(
            '.please_wait'
          ).innerHTML = `Stay tuned for more posts`;
        }
      }
    } else {
      document.querySelector('.please_wait').style.display = 'none';
    }
  }
}

// get csrf_token
function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) == name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
