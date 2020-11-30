/* eslint-disable prefer-template */
/* eslint-disable no-use-before-define */
/* eslint-disable eqeqeq */

/* eslint-disable no-undef */
const xhr = new XMLHttpRequest();

const backend = 'http://localhost:3000';

const submit = document.getElementById('submit');

submit.addEventListener('click', (event) => {
  event.preventDefault();
  const postTitle = document.getElementById('title').value;
  const postUrl = document.getElementById('url').value;
  xhr.open('POST', backend + '/posts');
  xhr.onreadystatechange = handleReadyStateChanged;
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('username', localStorage.username);
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.send(JSON.stringify({ title: postTitle, url: postUrl }));

  function handleReadyStateChanged() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      window.location = '/home';
    }
  }
});
