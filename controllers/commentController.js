const Comment = require('../models/Comment');

exports.createComment = async (req, res) => {
  await Comment.create({
    board: req.params.boardId,
    content: req.body.content,
    author: req.user._id
  });
  res.redirect('/board/' + req.params.boardId);
};
