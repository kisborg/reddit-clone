/* eslint-disable no-alert */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-template */
/* eslint-disable no-use-before-define */
/* eslint-disable eqeqeq */

/* eslint-disable no-undef */
const xhr = new XMLHttpRequest();

const backend = 'http://localhost:3000';
const frontend = 'http://localhost:8080';
const postContainer = document.getElementById('post-list');

console.log(localStorage.username);

const checkIfUUID = (id) => {
  const uuidRegEx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegEx.test(id);
};

const handleAJAXRequest = (method, endpoint, readyStateFunc) => {
  xhr.onreadystatechange = readyStateFunc;
  xhr.open(method, endpoint);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('username', localStorage.username);
  xhr.send();
};

// load posts on pageload
handleAJAXRequest('GET', backend + '/posts', onLoadReadyStateChanged);

function onLoadReadyStateChanged() {
  if (xhr.readyState == XMLHttpRequest.DONE) {
    createPostList(JSON.parse(xhr.response));
  }
}

function onVoteReadyStateChanged() {
  if (xhr.readyState == XMLHttpRequest.DONE) {
    const post = JSON.parse(xhr.response);
    document.getElementById(post.id).children[0].children[1].innerText = post.score;
  }
}

function onDeleteReadyStateChanged() {
  if (xhr.readyState == XMLHttpRequest.DONE) {
    if (xhr.status === 400) {
      alert('you do not have permission to delete this post');
      xhr.abort();
    } else {
      const postList = { posts: JSON.parse(xhr.response) };
      document.getElementById('post-list').innerHTML = '';
      createPostList(postList);
    }
  }
}

function createPostList(postsData) {
  const postsTemplate = document.getElementById('posts-template').innerHTML;
  const compiledTemplate = Handlebars.compile(postsTemplate);
  const postList = compiledTemplate(postsData);
  const postsConntainer = document.getElementById('post-list');
  postsConntainer.innerHTML = postList;
}

Handlebars.registerHelper('countDateCreated', (timestamp) => {
  const dateCreated = new Date(timestamp * 1000);
  const currentDate = new Date();

  const minutes = currentDate.getMinutes() - dateCreated.getMinutes();
  const hours = currentDate.getHours() - dateCreated.getHours();
  const days = currentDate.getDate() - dateCreated.getDate();
  const months = currentDate.getMonth() - dateCreated.getMonth();

  if (months > 0) {
    return 'Modified over a month ago';
  }

  if (days > 0) {
    return `Modified ${days} days ago.`;
  }

  if (hours > 0) {
    return `Modified ${hours} hour(s) ago.`;
  }

  return `Modified ${minutes} minutes ago.`;
});

Handlebars.registerHelper('deleteRights', (post) => {
  if (post.owner === 'anonymous' || post.owner.toLowerCase() === localStorage.username.toLowerCase()) {
    return true;
  }
  return false;
});

Handlebars.registerHelper('modifyRights', (post) => {
  if (post.owner.toLowerCase() === localStorage.username.toLowerCase()) {
    return true;
  }
  return false;
});

Handlebars.registerHelper('ifUpvote', (post) => {
  if (post.vote === 1) {
    return true;
  }
  return false;
});

Handlebars.registerHelper('ifDownvote', (post) => {
  if (post.vote === -1) {
    return true;
  }
  return false;
});

postContainer.addEventListener('click', (event) => {
  const postId = event.target.dataset.id;

  if (event.target.className === 'upvote' || event.target.className === 'downvote') {
    voteHandler(event, postId);
  }
  if (event.target.className === 'delete') {
    event.preventDefault();
    deleteHandler(postId);
  }
});

const voteHandler = (event, postId) => {
  if (checkIfUUID(localStorage.username)) {
    alert('You need to sign in to vote');
    return null;
  }
  const downArrow = event.target.parentElement.children[2];
  const upArrow = event.target.parentElement.children[0];
  if (event.target.className === 'upvote') {
    if (event.target.src === frontend + '/images/upvote.png') {
      event.target.src = frontend + '/images/upvoted.png';
    } else {
      event.target.src = frontend + '/images/upvote.png';
    }
    downArrow.src = frontend + '/images/downvote.png';
    sendVoteRequest(postId, 'upvote');
  }
  if (event.target.className === 'downvote') {
    if (event.target.src === frontend + '/images/downvote.png') {
      event.target.src = frontend + '/images/downvoted.png';
    } else {
      event.target.src = frontend + '/images/downvote.png';
    }
    upArrow.src = frontend + '/images/upvote.png';
    sendVoteRequest(postId, 'downvote');
  }
};

const sendVoteRequest = (postId, voteOption) => {
  const endpoint = backend + `/posts/${postId}/${voteOption}`;
  handleAJAXRequest('PUT', endpoint, onVoteReadyStateChanged);
};

const deleteHandler = (id) => {
  handleAJAXRequest('DELETE', backend + `/posts/${id}`, onDeleteReadyStateChanged);
};
