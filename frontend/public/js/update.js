/* eslint-disable no-param-reassign */
/* eslint-disable prefer-template */
/* eslint-disable no-use-before-define */
/* eslint-disable eqeqeq */
/* eslint-disable no-undef */

const xhr = new XMLHttpRequest();

const backend = 'http://localhost:3000';
const frontend = 'http://localhost:8080';
const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const submit = document.getElementById('submit');

const onLoadReadyStateChanged = () => {
  if (xhr.readyState == XMLHttpRequest.DONE) {
    const { title, url } = JSON.parse(xhr.response)[0];
    const titleField = document.getElementById('title');
    const urlField = document.getElementById('url');

    titleField.value = title;
    urlField.value = url;
  }
};

xhr.onreadystatechange = onLoadReadyStateChanged;
xhr.open('GET', backend + `/posts/${id}`);
xhr.setRequestHeader('Accept', 'application/json');
xhr.setRequestHeader('username', localStorage.username);
xhr.send();

submit.addEventListener('click', (event) => {
  event.preventDefault();
  const postTitle = document.getElementById('title').value;
  const postUrl = document.getElementById('url').value;
  xhr.open('PUT', backend + `/posts/${id}`);
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
