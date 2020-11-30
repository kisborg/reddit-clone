/* eslint-disable no-param-reassign */
/* eslint-disable quotes */
/* eslint-disable consistent-return */
/* eslint-disable no-use-before-define */
/* eslint-disable no-useless-return */
/* eslint-disable @typescript-eslint/no-var-requires */
const express = require('express');
const conn = require('./databaseConn');

const router = express.Router();

// function to check if user is anonyomous
const checkIfUUID = (id) => {
  const uuidRegEx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegEx.test(id);
};

// list all posts on homepage
router.get('/posts', (req, res) => {
  if (req.accepts('application/json') === false) {
    res.sendStatus(406);
    return null;
  }
  const { username } = req.headers;
  const sql = `SELECT posts.id, title, url, UNIX_TIMESTAMP(last_modified) AS timestamp, score, poster.username AS owner, ifnull(vote, 0) AS vote FROM posts 
               JOIN users poster ON poster.id = posts.post_owner
               LEFT JOIN (SELECT vote, post_id FROM votes 
                          JOIN users voter ON votes.user_id = voter.id 
                          WHERE voter.username = ?) votes2 ON posts.id = votes2.post_id;`;

  conn.query(sql, [username], (err, rows) => {
    if (err) {
      console.log(err.sqlMessage);
      res.sendStatus(500);
      return null;
    }

    const rowArray = JSON.parse(JSON.stringify(rows));

    rowArray.forEach((post) => {
      if (checkIfUUID(post.owner)) {
        post.owner = 'anonymous';
      }
    });
    res.set('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify({ posts: rowArray }));
  });
});

// select single post by id when user wants to modify post
router.get('/posts/:id', (req, res) => {
  if (req.accepts('application/json') === false) {
    res.sendStatus(406);
    return null;
  }

  const { id } = req.params;

  const sql = `SELECT title, url FROM posts WHERE id = ?;`;

  conn.query(sql, [id], (err, result) => {
    if (err) {
      console.log(err.sqlMessage);
      res.sendStatus(500);
      return null;
    }
    res.set('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify(result));
  });
});

// add new post
router.post('/posts', (req, res) => {
  if (req.accepts('application/json') === false) {
    res.sendStatus(406);
    return null;
  }
  if (!req.body.title || !req.body.url || req.body.title === '' || req.body.url === '') {
    res.status(406);
    res.json('missing title and/or url');
  } else {
    const post = Object.values(req.body);
    const { username } = req.headers;

    // INSERT INTO users
    const sqlSelectUserId = `SELECT id FROM users WHERE username = ?`;
    const sqlSelectNewPostId = `SELECT MAX(posts.id) FROM posts JOIN users ON users.id = posts.post_owner WHERE users.username = ?`;
    const sqlInsertPost = `INSERT INTO posts (title, url, post_owner) VALUES (?, ?, (${sqlSelectUserId}));`;

    conn.query(sqlInsertPost, [post[0], post[1], username], (insertPostErr, insertPostRes) => {
      if (insertPostErr) {
        console.log(insertPostErr.sqlMessage);
        res.sendStatus(500);
        return null;
      }
      const sqlInsertVoteQuery = `INSERT INTO votes (post_id, user_id, vote) VALUES (  
        (${sqlSelectNewPostId}), 
        (${sqlSelectUserId}), 0)`;

      conn.query(sqlInsertVoteQuery, [username, username], (inserVoteErr, inserVoteRes) => {
        if (inserVoteErr) {
          console.log(inserVoteErr.sqlMessage);
          res.sendStatus(500);
          return null;
        }
        const selectQuery = `SELECT posts.id, title, url, last_modified AS timestamp, score, username AS owner, vote FROM posts 
          LEFT JOIN users ON post_owner = users.id 
          JOIN votes ON posts.id = votes.post_id
          WHERE posts.id = (${sqlSelectNewPostId})`;

        conn.query(selectQuery, [username], (selectErr, selectRes) => {
          if (selectErr) {
            console.log(selectErr.sqlMessage);
            res.sendStatus(500);
            return null;
          }
          const newPost = selectRes[0];
          if (checkIfUUID(newPost.owner)) {
            newPost.owner = 'anonymous';
          }
          res.set('Content-Type', 'application/json');
          res.status(200);
          res.json(newPost);
        });
      });
    });
  }
});

// handle user votes on posts
router.put('/posts/:id/:vote', (req, res) => {
  if (req.accepts('application/json') === false) {
    res.sendStatus(406);
    return null;
  }

  const { id, vote } = req.params;
  const { username } = req.headers;

  if (checkIfUUID(username)) {
    res.sendStatus(403);
    return null;
  }

  let score = 0;

  if (vote === 'upvote') {
    score = 1;
  }
  if (vote === 'downvote') {
    score = -1;
  }

  const sqlSelectUserId = `SELECT id FROM users WHERE username = ?`;
  const sqlUpdateQuery = `INSERT INTO votes (post_id, user_id, vote) VALUES (?, (${sqlSelectUserId}), ${score}) ON DUPLICATE KEY UPDATE    
   vote = CASE WHEN vote = ${score} THEN 0 WHEN vote != ${score} THEN ${score} END, post_id = ?, user_id = (${sqlSelectUserId})`;

  conn.query(sqlUpdateQuery, [id, username, id, username], (updateErr, updateRes) => {
    if (updateErr) {
      console.log(updateErr.sqlMessage);
      res.sendStatus(500);
      return null;
    }

    const sqlScoreQuery = `
    UPDATE posts SET
    score = (SELECT totalvotes FROM (SELECT post_id, SUM(vote) AS totalvotes FROM votes GROUP BY post_id) AA
             WHERE post_id = ?)
    WHERE id = ?`;

    conn.query(sqlScoreQuery, [id, id], (scoreErr, scoreRes) => {
      if (scoreErr) {
        console.log(scoreErr.sqlMessage);
        res.sendStatus(500);
        return null;
      }

      const sqlResponseQuery = `SELECT posts.id, title, url, last_modified AS timestamp, score, poster.username AS owner, ifnull(vote, 0) AS vote FROM posts 
      JOIN users poster ON poster.id = posts.post_owner
      LEFT JOIN (SELECT vote, post_id FROM votes 
                 JOIN users voter ON votes.user_id = voter.id 
                 WHERE voter.username = ?) votes2 ON posts.id = votes2.post_id
      WHERE posts.id = ?;`;

      conn.query(sqlResponseQuery, [username, id], (responseErr, responseRes) => {
        if (responseErr) {
          console.log(responseErr.sqlMessage);
          res.sendStatus(500);
          return null;
        }
        const votePost = responseRes[0];
        if (checkIfUUID(votePost.owner)) {
          votePost.owner = 'anonymous';
        }
        res.set('Content-Type', 'application/json');
        res.status(200);
        res.json(votePost);
      });
    });
  });
});

router.delete('/posts/:id', (req, res) => {
  if (req.accepts('application/json') === false) {
    res.sendStatus(406);
    return;
  }
  const { id } = req.params;
  const { username } = req.headers;

  const selectQuery = `SELECT username FROM posts 
  JOIN users ON users.id = posts.post_owner
  WHERE posts.id = ?;`;
  conn.query(selectQuery, [id], (selectErr, selectRes) => {
    if (selectErr) {
      console.log(selectErr.sqlMessage);
      res.sendStatus(500);
      return null;
    }
    console.log(selectRes, username);
    if (username === selectRes[0].username || checkIfUUID(selectRes[0].username)) {
      const postDeleteQuery = `DELETE FROM posts WHERE id = ?`;
      conn.query(postDeleteQuery, [id], (postDelErr, postDelRes) => {
        if (postDelErr) {
          console.log(postDelErr.sqlMessage);
          res.sendStatus(500);
          return null;
        }
        const voteDeleteQuery = `DELETE FROM votes WHERE post_id = ?`;
        conn.query(voteDeleteQuery, [id], (voteDelErr, voteDelRes) => {
          if (voteDelErr) {
            console.log(voteDelErr.sqlMessage);
            res.sendStatus(500);
            return null;
          }
          const postListQuery = `SELECT posts.id, title, url, last_modified AS timestamp, score, poster.username AS owner, ifnull(vote, 0) AS vote FROM posts 
          JOIN users poster ON poster.id = posts.post_owner
          LEFT JOIN (SELECT vote, post_id FROM votes 
                     JOIN users voter ON votes.user_id = voter.id 
                     WHERE voter.username = ?) votes2 ON posts.id = votes2.post_id;`;

          conn.query(postListQuery, [username], (postListErr, postListRes) => {
            if (postListErr) {
              console.log(postListErr.sqlMessage);
              res.sendStatus(500);
              return null;
            }
            const rowArray = JSON.parse(JSON.stringify(postListRes));

            rowArray.forEach((post) => {
              if (checkIfUUID(post.owner)) {
                post.owner = 'anonymous';
              }
            });
            res.set('Content-Type', 'application/json');
            res.status(200);
            res.json(rowArray);
          });
        });
      });
    } else {
      res.set('Content-Type', 'application/json');
      res.status(400);
      res.json('You don\'t have the permission to delete this post');
    }
  });
});

router.put('/posts/:id', (req, res) => {
  if (req.accepts('application/json') === false) {
    res.sendStatus(406);
    return;
  }
  const { title, url } = req.body;
  const { username } = req.headers;
  const { id } = req.params;

  const userCheckQuery = `SELECT username FROM posts 
  JOIN users ON users.id = posts.post_owner
  WHERE posts.id = ?;`;

  conn.query(userCheckQuery, [id], (userCheckErr, userCheckRes) => {
    if (userCheckErr) {
      console.log(userCheckErr.sqlMessage);
      res.sendStatus(500);
      return null;
    }
    console.log(userCheckRes);
    if (username === userCheckRes[0].username) {
      const updateQuery = `UPDATE posts SET
      title = ?, url = ?, last_modified = CURRENT_TIMESTAMP
      WHERE posts.id = ?;`;
      const queryParams = [title, url, id];
      conn.query(updateQuery, queryParams, (updateErr, updateRes) => {
        if (updateErr) {
          console.log(updateErr.sqlMessage);
          res.sendStatus(500);
          return null;
        }
        const responseQuery = `SELECT posts.id, title, url, last_modified AS timestamp, score, poster.username AS owner, ifnull(vote, 0) AS vote FROM posts 
        JOIN users poster ON poster.id = posts.post_owner
        LEFT JOIN (SELECT vote, post_id FROM votes 
                   JOIN users voter ON votes.user_id = voter.id 
                   WHERE voter.username = ?) votes2 ON posts.id = votes2.post_id
        WHERE posts.id = ?`;
        const responseQueryParams = [username, id];
        conn.query(responseQuery, responseQueryParams, (responseErr, responseRes) => {
          if (responseErr) {
            console.log(responseErr.sqlMessage);
            res.sendStatus(500);
            return null;
          }
          res.set('Content-Type', 'application/json');
          res.status(200);
          res.json(responseRes);
        });
      });
    } else {
      res.set('Content-Type', 'application/json');
      res.status(400);
      res.json('You don\'t have the permission to modify this post');
    }
  });
});

module.exports = router;
