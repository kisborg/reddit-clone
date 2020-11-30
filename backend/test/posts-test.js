/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-const */
/* eslint-disable eqeqeq */
/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
/* eslint-disable quotes */
/* eslint-disable no-undef */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-var-requires */
const chai = require('chai');
const request = require('supertest');
const conn = require('../databaseConn');
const app = require('../server');

const expect = chai.expect;

const uuidGenerator = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = Math.random() * 16 | 0;
    let v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const post = {
  title: "This is a test",
  url: "www.something.com",
};

const anonymousPost = {
  title: "Anonymous Post",
  url: "www.anonymous.com",
};

const anonymousUser = uuidGenerator();

before(() => {
  conn.query("TRUNCATE users");
  conn.query("TRUNCATE posts");
  conn.query("TRUNCATE votes");
  conn.query("INSERT INTO users (username) VALUES ('kisborg')");
  conn.query("INSERT INTO users (username) VALUES (?)", [anonymousUser]);
});

describe('testing posts endpoint GET method', () => {
  it('should return an empty post list', (done) => {
    request(app)
      .get('/posts')
      .set('Accept', 'application/json')
      .set('username', 'kisborg')
      .end((err, res) => {
        expect(res.body.posts).to.be.an('array');
        expect(res.body.posts).to.be.empty;
        done();
      });
  });
});

describe('testing posts endpoint POST method', () => {
  it('should accept the post and return it in an object', (done) => {
    request(app)
      .post('/posts')
      .set('Accept', 'application/json')
      .set('username', 'kisborg')
      .set('Content-Type', 'application/json')
      .send(post)
      .end((err, res) => {
        expect(res.body).to.have.keys(['id', 'title', 'url', 'timestamp', 'score', 'owner', 'vote']);
        expect(res.body.title).to.equal("This is a test");
        expect(res.body.url).to.equal('www.something.com');
        done();
      });
  });
});

describe('testing posts GET method', () => {
  it('should return a single post', (done) => {
    request(app)
      .get('/posts')
      .set('Accept', 'application/json')
      .set('username', 'kisborg')
      .end((err, res) => {
        expect(res.body.posts).to.be.an('array');
        expect(res.body.posts.length).to.equal(1);
        expect(res.body.posts[0]).to.have.keys(['id', 'title', 'url', 'timestamp', 'score', 'owner', 'vote']);
        expect(res.body.posts[0].title).to.equal("This is a test");
        expect(res.body.posts[0].url).to.equal('www.something.com');
        done();
      });
  });
});

describe('testing post upvote', () => {
  it('should return post as object with updated score and vote', (done) => {
    request(app)
      .put('/posts/1/upvote')
      .set('Accept', 'application/json')
      .set('username', 'kisborg')
      .end((err, res) => {
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.keys(['id', 'title', 'url', 'timestamp', 'score', 'owner', 'vote']);
        expect(res.body.title).to.equal("This is a test");
        expect(res.body.url).to.equal('www.something.com');
        expect(res.body.vote).to.equal(1);
        expect(res.body.score).to.equal(1);
        done();
      });
  });
});

describe('testing post downvote', () => {
  it('should return post as object with updated score and vote', (done) => {
    request(app)
      .put('/posts/1/downvote')
      .set('Accept', 'application/json')
      .set('username', 'kisborg')
      .end((err, res) => {
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.keys(['id', 'title', 'url', 'timestamp', 'score', 'owner', 'vote']);
        expect(res.body.title).to.equal("This is a test");
        expect(res.body.url).to.equal('www.something.com');
        expect(res.body.vote).to.equal(-1);
        expect(res.body.score).to.equal(-1);
        done();
      });
  });
});

describe('testing post voting when not signed in', () => {
  it('should return error status code 403', (done) => {
    request(app)
      .put('/posts/1/downvote')
      .set('Accept', 'application/json')
      .set('username', uuidGenerator())
      .end((err, res) => {
        expect(res.status).to.equal(403);
        done();
      });
  });
});

describe('testing anonymous post', () => {
  it('should accept the post and return it in an object, where owner is anonymous', (done) => {
    request(app)
      .post('/posts')
      .set('Accept', 'application/json')
      .set('username', anonymousUser)
      .set('Content-Type', 'application/json')
      .send(anonymousPost)
      .end((err, res) => {
        expect(res.body).to.have.keys(['id', 'title', 'url', 'timestamp', 'score', 'owner', 'vote']);
        expect(res.body.title).to.equal("Anonymous Post");
        expect(res.body.url).to.equal('www.anonymous.com');
        expect(res.body.owner).to.equal('anonymous');
        done();
      });
  });
});

describe('testing posts GET method with two posts', () => {
  it('should return a single post', (done) => {
    request(app)
      .get('/posts')
      .set('Accept', 'application/json')
      .set('username', 'kisborg')
      .end((err, res) => {
        expect(res.body.posts).to.be.an('array');
        expect(res.body.posts.length).to.equal(2);
        expect(res.body.posts[0]).to.have.keys(['id', 'title', 'url', 'timestamp', 'score', 'owner', 'vote']);
        expect(res.body.posts[0].title).to.equal("This is a test");
        expect(res.body.posts[0].url).to.equal('www.something.com');
        expect(res.body.posts[1].title).to.equal("Anonymous Post");
        expect(res.body.posts[1].url).to.equal('www.anonymous.com');
        done();
      });
  });
});

describe('testing posts DELETE method with', () => {
  it('should delete post at id', (done) => {
    request(app)
      .delete('/posts/1')
      .set('Accept', 'application/json')
      .set('username', 'kisborg')
      .end((err, res) => {
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.equal(1);
        expect(res.body[0]).to.have.keys(['id', 'title', 'url', 'timestamp', 'score', 'owner', 'vote']);
        expect(res.body[0].title).to.equal("Anonymous Post");
        expect(res.body[0].url).to.equal('www.anonymous.com');
        done();
      });
  });
});
