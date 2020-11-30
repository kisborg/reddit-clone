/* eslint-disable no-bitwise */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable prefer-template */
/* eslint-disable no-use-before-define */
/* eslint-disable eqeqeq */
/* eslint-disable no-undef */

const xhr = new XMLHttpRequest();

const backend = 'http://localhost:3000';

const login = document.getElementById('log');

login.addEventListener('click', (event) => {
  event.preventDefault();
  let username = document.getElementById('username').value;
  if (username === '') {
    username = uuidGenerator();
  }
  localStorage.username = username;
  xhr.open('POST', backend + '/login');
  xhr.onreadystatechange = handleReadyStateChanged;
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('username', localStorage.username);
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.send();

  function handleReadyStateChanged() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      window.location = '/home';
    }
  }
});

function uuidGenerator() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0;
    let v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
